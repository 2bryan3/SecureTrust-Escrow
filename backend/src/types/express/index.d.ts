// backend/src/types/index.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: any;
        firstName: string;
        lastName: string;
        username: string;
        email: string;
        role: "user" | "mediator" | "admin";
        isAdmin: boolean;
        isBanned: boolean;
        avatar: string;
      };
    }
  }
}

export {};