export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;  
  avatar: string;
  role: "user" | "mediator" | "admin";
  isBanned: boolean;
  createdAt?: string;
  updatedAt?: string;
  totalSales?: number;
  rating?: number;
};