// backend/src/models/adminLog.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAdminLog extends Document {
  action: string;
  target: string;
  admin: string;
  date: string;
  createdAt: Date;
}

const AdminLogSchema = new Schema<IAdminLog>(
  {
    action: { type: String, required: true },
    target: { type: String, required: true },
    admin:  { type: String, required: true },
    date:   { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAdminLog>("AdminLog", AdminLogSchema);