// backend/src/controllers/admin.controller.ts
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { Listing } from "../models/listing.model";
import AdminLog from "../models/adminLog.model";

// ── GET /api/admin/stats ─────────────────────────────────────────────────────

export const getStats = async (_req: Request, res: Response) => {
  try {
    const [totalUsers, activeListings, openDisputes] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments({ isSold: false }),
      // If you have a Dispute model, swap this out:
      Promise.resolve(0),
    ]);

    res.json({ totalUsers, activeListings, openDisputes, totalRevenue: null });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// ── GET /api/admin/users ─────────────────────────────────────────────────────

export const getAdminUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select("firstName lastName email role createdAt status")
      .sort({ createdAt: -1 })
      .lean();

    const result = await Promise.all(
      users.map(async (u) => {
        const listingCount = await Listing.countDocuments({ userID: u._id.toString() });
        return {
          ...u,
          status: u.status ?? "active",
          listingCount,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("getAdminUsers error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// ── PATCH /api/admin/users/:id/status ───────────────────────────────────────

export const updateUserStatus = async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("firstName lastName email role status");

    if (!user) return res.status(404).json({ message: "User not found" });

    await logAction({
      action: `User ${status === "suspended" ? "suspended" : "restored"}`,
      target: `${user.firstName} ${user.lastName}`,
      adminId: (req as any).user._id,
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

// ── PATCH /api/admin/users/:id/role ─────────────────────────────────────────

export const updateUserRole = async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!["user", "mediator", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("firstName lastName email role status");

    if (!user) return res.status(404).json({ message: "User not found" });

    await logAction({
      action: `Role changed to ${role}`,
      target: `${user.firstName} ${user.lastName}`,
      adminId: (req as any).user._id,
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update role" });
  }
};

// ── GET /api/admin/logs ──────────────────────────────────────────────────────

export const getAdminLogs = async (_req: Request, res: Response) => {
  try {
    const logs = await AdminLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};

// ── Internal log helper ──────────────────────────────────────────────────────

async function logAction({
  action,
  target,
  adminId,
}: {
  action: string;
  target: string;
  adminId: string;
}) {
  try {
    const admin = await User.findById(adminId).select("firstName lastName").lean();
    await AdminLog.create({
      action,
      target,
      admin: admin ? `${admin.firstName} ${admin.lastName}` : "Admin",
      date: new Date().toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      }),
    });
  } catch {
    // Log failures should not break the main action
  }
}