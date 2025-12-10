// src/posts/posts.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async getFeed(
    userId: string | null,
    filterDomain: string | null,
    hashtag: string | null,
    skip = 0,
    take = 20,
  ) {
    let userDomains: string[] = [];

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { domains: true },
      });
      userDomains = user?.domains || [];
    }

    // HASHTAG MODE
    if (hashtag) {
      const posts = await this.prisma.post.findMany({
        where: { hashtags: { has: hashtag } },
        include: { user: true, comments: true, likes: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
      return this.format(posts, userId);
    }

    // DOMAIN FILTER MODE
    if (filterDomain) {
      const posts = await this.prisma.post.findMany({
        where: { domain: filterDomain },
        include: { user: true, comments: true, likes: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
      return this.format(posts, userId);
    }

    // SMART FEED ORDER (preferred domains first)
    const priority = await this.prisma.post.findMany({
      where: { domain: { in: userDomains } },
      include: { user: true, comments: true, likes: true },
      orderBy: { createdAt: 'desc' },
    });

    const secondary = await this.prisma.post.findMany({
      where: { domain: { notIn: userDomains } },
      include: { user: true, comments: true, likes: true },
      orderBy: { createdAt: 'desc' },
    });

    const all = [...priority, ...secondary]; // ✅ fixed
    const page = all.slice(skip, skip + take);

    return this.format(page, userId);
  }

  private format(posts: any[], userId: string | null) {
    return posts.map((post) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      userLiked: userId
        ? post.likes.some((l: any) => l.userId === userId)
        : false,
    }));
  }

  async createPost(data: {
    userId: string;
    title?: string;
    content: string;
    domain?: string;
    hashtags?: string[];
    imageUrls?: string[];
  }) {
    return this.prisma.post.create({
      data: {
        userId: data.userId,
        title: data.title || null,
        content: data.content,
        domain: data.domain || null,
        hashtags: data.hashtags || [],
        imageUrls: data.imageUrls || [],
      },
    });
  }

  async likePost(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
      const count = await this.prisma.like.count({ where: { postId } });
      return { liked: false, likesCount: count };
    }

    await this.prisma.like.create({ data: { userId, postId } });
    const count = await this.prisma.like.count({ where: { postId } });
    return { liked: true, likesCount: count };
  }

  async commentOnPost(userId: string, postId: string, text: string) {
    return this.prisma.comment.create({
      data: { userId, postId, text },
      include: { user: true },
    });
  }

  async getPostComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
