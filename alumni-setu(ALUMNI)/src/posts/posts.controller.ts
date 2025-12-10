// src/posts/posts.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private prisma: PrismaService,
  ) {}

  // ALWAYS RETURNS a valid user ID
  private async getUserId(): Promise<string> {
    let user = await this.prisma.user.findFirst({
      where: { email: 'mock@example.com' },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'mock@example.com',
          passwordHash: 'dummyhash',
          name: 'Test Alumni',
          domains: [],
          emailVerified: true,
        },
      });
    }

    return user.id;
  }

  @Get()
  async getFeed(
    @Req() req: any,
    @Query('domain') domain: string,
    @Query('hashtag') hashtag: string,
    @Query('skip') skip: string,
    @Query('take') take: string,
  ) {
    const userId = await this.getUserId();

    return this.postsService.getFeed(
      userId,
      domain || null,
      hashtag || null,
      Number(skip || 0),
      Number(take || 20),
    );
  }

  @Post()
  async createPost(@Req() req: any, @Body() body: any) {
    const userId = await this.getUserId();

    return this.postsService.createPost({
      userId,
      title: body.title,
      content: body.content,
      domain: body.domain || null,
      hashtags: body.hashtags || [],
      imageUrls: body.imageUrls || [],
    });
  }

  @Post('like')
  async likePost(@Body() body: any) {
    const userId = await this.getUserId();
    return this.postsService.likePost(userId, body.postId);
  }

  @Post('comment')
  async commentOnPost(@Body() body: any) {
    const userId = await this.getUserId();
    return this.postsService.commentOnPost(userId, body.postId, body.text);
  }

  @Get('comments')
  async getComments(@Query('postId') postId: string) {
    return this.postsService.getPostComments(postId);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (_, file, cb) => {
          const random = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, random + extname(file.originalname));
        },
      }),
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/${file.filename}` };
  }
}
