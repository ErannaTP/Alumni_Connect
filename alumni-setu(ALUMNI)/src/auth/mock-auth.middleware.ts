import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class MockAuthMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // Temporary hardcoded user (alumnus)
    req.user = {
      id: "mock-alumni-id-123",
      email: "alumni@example.com",
      name: "Mock Alumni User",
      domains: ["CSE"],
      role: "alumni"
    };
    next();
  }
}
