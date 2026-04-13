// frontend/src/pages/AdminPage.tsx
import React, { useState } from "react";
import "../styles/AdminPage.css";
import { NavBar } from "../components/NavBar";

interface User {
  id: string;
  username: string;
  email: string;
  role: "user" | "mediator" | "admin";
  joined: string;
  listings: number;
  status: "active" | "suspended";
}

const mockUsers: User[] = [
  { id: "1", username: "demo_user_1", email: "user1@email.com", role: "user", joined: "Jan 12", listings: 4, status: "active" },
  { id: "2", username: "TechSeller", email: "tech@email.com", role: "user", joined: "Feb 3", listings: 12, status: "active" },
  { id: "3", username: "JohnDoe", email: "john@email.com", role: "mediator", joined: "Jan 28", listings: 1, status: "active" },
  { id: "4", username: "BadActor", email: "bad@email.com", role: "user", joined: "Mar 1", listings: 0, status: "suspended" },
];

const mockLogs = [
  { id: "1", action: "User suspended", target: "BadActor", admin: "Admin", date: "Mar 2, 10:41 AM" },
  { id: "2", action: "Role changed to mediator", target: "JohnDoe", admin: "Admin", date: "Feb 28, 3:12 PM" },
  { id: "3", action: "Listing removed", target: "Listing #58", admin: "Admin", date: "Feb 27, 9:05 AM" },
  { id: "4", action: "Dispute escalated", target: "Dispute #4", admin: "System", date: "Feb 26, 6:30 PM" },
];

type Tab = "overview" | "users" | "logs";

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [roleModal, setRoleModal] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<User["role"]>("user");

  const stats = [
    { label: "Total Users", value: 124, icon: "👥", color: "blue" },
    { label: "Active Listings", value: 58, icon: "🏷️", color: "cyan" },
    { label: "Open Disputes", value: 7, icon: "⚖️", color: "gold" },
    { label: "Revenue", value: "$12,400", icon: "💰", color: "green" },
  ];

  const handleSuspend = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "suspended" : "active" }
          : u
      )
    );
  };

  const handleRoleChange = () => {
    if (!roleModal) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === roleModal.id ? { ...u, role: newRole } : u))
    );
    setRoleModal(null);
  };

  return (
    <div className="admin-page">
      <NavBar />

      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Platform overview and management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {(["overview", "users", "logs"] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? "admin-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="admin-content">

          {/* Stats grid */}
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className={`stat-card stat-card--${s.color}`}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="admin-section">
            <h2 className="section-heading">Quick Actions</h2>
            <div className="quick-actions">
              <button className="quick-action-btn" onClick={() => setActiveTab("users")}>
                <span className="qa-icon">👥</span>
                <span className="qa-label">Manage Users</span>
                <span className="qa-arrow">→</span>
              </button>
              <button className="quick-action-btn" onClick={() => setActiveTab("logs")}>
                <span className="qa-icon">📋</span>
                <span className="qa-label">View Audit Logs</span>
                <span className="qa-arrow">→</span>
              </button>
              <button className="quick-action-btn quick-action-btn--danger" onClick={() => alert("Danger zone")}>
                <span className="qa-icon">⚙️</span>
                <span className="qa-label">Platform Settings</span>
                <span className="qa-arrow">→</span>
              </button>
            </div>
          </div>

          {/* Recent users preview */}
          <div className="admin-section">
            <div className="section-header-row">
              <h2 className="section-heading">Recent Users</h2>
              <button className="section-link" onClick={() => setActiveTab("users")}>
                View all →
              </button>
            </div>
            <div className="user-table">
              <div className="user-table-header">
                <span>User</span>
                <span>Role</span>
                <span>Listings</span>
                <span>Status</span>
              </div>
              {users.slice(0, 3).map((u) => (
                <div key={u.id} className="user-row">
                  <div className="user-info">
                    <div className="user-avatar">{u.username[0].toUpperCase()}</div>
                    <div>
                      <div className="user-name">{u.username}</div>
                      <div className="user-email">{u.email}</div>
                    </div>
                  </div>
                  <span className={`role-badge role-badge--${u.role}`}>{u.role}</span>
                  <span className="user-listings">{u.listings}</span>
                  <span className={`status-dot-label ${u.status}`}>{u.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <div className="admin-content">
          <div className="admin-section">
            <h2 className="section-heading">All Users</h2>
            <div className="user-table">
              <div className="user-table-header">
                <span>User</span>
                <span>Role</span>
                <span>Joined</span>
                <span>Listings</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {users.map((u) => (
                <div key={u.id} className="user-row user-row--full">
                  <div className="user-info">
                    <div className="user-avatar">{u.username[0].toUpperCase()}</div>
                    <div>
                      <div className="user-name">{u.username}</div>
                      <div className="user-email">{u.email}</div>
                    </div>
                  </div>
                  <span className={`role-badge role-badge--${u.role}`}>{u.role}</span>
                  <span className="user-joined">{u.joined}</span>
                  <span className="user-listings">{u.listings}</span>
                  <span className={`status-dot-label ${u.status}`}>{u.status}</span>
                  <div className="user-actions">
                    <button
                      className="action-pill action-pill--blue"
                      onClick={() => { setRoleModal(u); setNewRole(u.role); }}
                    >
                      Role
                    </button>
                    <button
                      className={`action-pill ${u.status === "active" ? "action-pill--red" : "action-pill--green"}`}
                      onClick={() => handleSuspend(u.id)}
                    >
                      {u.status === "active" ? "Suspend" : "Restore"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {activeTab === "logs" && (
        <div className="admin-content">
          <div className="admin-section">
            <h2 className="section-heading">Audit Log</h2>
            <div className="log-list">
              {mockLogs.map((log) => (
                <div key={log.id} className="log-item">
                  <div className="log-dot" />
                  <div className="log-body">
                    <div className="log-action">{log.action}</div>
                    <div className="log-meta">
                      <span>Target: <strong>{log.target}</strong></span>
                      <span>By: <strong>{log.admin}</strong></span>
                      <span className="log-date">{log.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Role change modal */}
      {roleModal && (
        <div className="admin-overlay" onClick={() => setRoleModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Role — {roleModal.username}</h3>
              <button className="close-btn" onClick={() => setRoleModal(null)}>×</button>
            </div>
            <p className="modal-desc">
              Assign a new role to this user. Mediators can resolve disputes.
              Admins have full platform access.
            </p>
            <div className="role-options">
              {(["user", "mediator", "admin"] as User["role"][]).map((r) => (
                <label key={r} className={`role-option ${newRole === r ? "role-option--active" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={newRole === r}
                    onChange={() => setNewRole(r)}
                  />
                  <span className="role-option-name">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                  <span className="role-option-desc">
                    {r === "user" && "Standard marketplace user"}
                    {r === "mediator" && "Can review and resolve disputes"}
                    {r === "admin" && "Full platform access"}
                  </span>
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button className="confirm-cancel" onClick={() => setRoleModal(null)}>Cancel</button>
              <button className="confirm-submit" onClick={handleRoleChange}>Save Role</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};