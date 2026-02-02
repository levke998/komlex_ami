import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AdminAuditLogItem, AdminDrawingListItem, AdminUserListItem } from "../services/admin";
import {
  banUser,
  deleteDrawing,
  deleteUser,
  getAdminDrawings,
  getAdminLogs,
  getAdminUsers,
  unbanUser,
  warnUser,
} from "../services/admin";

type Tab = "users" | "drawings" | "logs";

export const AdminPage: React.FC = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [drawings, setDrawings] = useState<AdminDrawingListItem[]>([]);
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers(token);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const loadDrawings = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDrawings(token);
      setDrawings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drawings.");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminLogs(token);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "users") {
      void loadUsers();
    } else if (tab === "drawings") {
      void loadDrawings();
    } else {
      void loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  const userCount = useMemo(() => users.length, [users.length]);
  const drawingCount = useMemo(() => drawings.length, [drawings.length]);
  const logCount = useMemo(() => logs.length, [logs.length]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.isBanned ? "banned" : "active").includes(q) ||
        (u.isAdmin ? "admin" : "").includes(q)
      );
    });
  }, [users, userQuery]);

  const handleBan = async (user: AdminUserListItem) => {
    if (!token) return;
    const reason = window.prompt("Ban reason (optional):", user.banReason ?? "");
    if (reason === null) return;
    try {
      const updated = await banUser(token, user.id, { reason: reason || undefined });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ban user.");
    }
  };

  const handleUnban = async (user: AdminUserListItem) => {
    if (!token) return;
    try {
      const updated = await unbanUser(token, user.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unban user.");
    }
  };

  const handleWarn = async (user: AdminUserListItem) => {
    if (!token) return;
    const message = window.prompt("Warning message:");
    if (!message) return;
    try {
      await warnUser(token, user.id, { message });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to warn user.");
    }
  };

  const handleDeleteUser = async (user: AdminUserListItem) => {
    if (!token) return;
    if (!window.confirm(`Delete user ${user.username} (${user.email})? This cannot be undone.`)) return;
    try {
      await deleteUser(token, user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.");
    }
  };

  const handleDeleteDrawing = async (drawing: AdminDrawingListItem) => {
    if (!token) return;
    if (!window.confirm(`Delete drawing "${drawing.title}"? This cannot be undone.`)) return;
    try {
      await deleteDrawing(token, drawing.id);
      setDrawings((prev) => prev.filter((d) => d.id !== drawing.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete drawing.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Admin</h1>
            <p className="text-slate-400 text-sm">Moderation and user management</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded text-sm border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
              onClick={() => {
                logout();
                navigate("/auth", { replace: true });
              }}
            >
              Log out
            </button>
            <button
              className={`px-3 py-1.5 rounded text-sm border ${
                tab === "users" ? "bg-slate-800 border-slate-700" : "border-slate-800 text-slate-300"
              }`}
              onClick={() => setTab("users")}
            >
              Users ({userCount})
            </button>
            <button
              className={`px-3 py-1.5 rounded text-sm border ${
                tab === "drawings" ? "bg-slate-800 border-slate-700" : "border-slate-800 text-slate-300"
              }`}
              onClick={() => setTab("drawings")}
            >
              Drawings ({drawingCount})
            </button>
            <button
              className={`px-3 py-1.5 rounded text-sm border ${
                tab === "logs" ? "bg-slate-800 border-slate-700" : "border-slate-800 text-slate-300"
              }`}
              onClick={() => setTab("logs")}
            >
              Logs ({logCount})
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-800 bg-red-950/40 text-red-200 text-sm">
            {error}
          </div>
        )}

        {loading && <div className="text-slate-400 text-sm mb-4">Loading...</div>}

        {tab === "users" && (
          <>
            <div className="mb-3">
              <input
                className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
                placeholder="Search users (email, username, admin, banned)"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
            </div>
          <div className="overflow-x-auto rounded border border-slate-800 bg-slate-900/40">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Warnings</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/70 last:border-0">
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-slate-300">{u.email}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(u.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {u.warningCount}
                      {u.lastWarningAt && (
                        <div className="text-xs text-slate-500">
                          last: {new Date(u.lastWarningAt).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.isAdmin ? (
                        <span className="text-amber-300">Admin</span>
                      ) : u.isBanned ? (
                        <div className="text-red-300">
                          Banned
                          {u.bannedAt && (
                            <div className="text-xs text-slate-500">
                              {new Date(u.bannedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-emerald-300">Active</span>
                      )}
                      {u.banReason && (
                        <div className="text-xs text-slate-500">Reason: {u.banReason}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={u.isAdmin}
                          className={`px-2 py-1 text-xs rounded border border-slate-700 hover:bg-slate-800 ${
                            u.isAdmin ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          onClick={() => handleWarn(u)}
                        >
                          Warn
                        </button>
                        {u.isBanned ? (
                          <button
                            disabled={u.isAdmin}
                            className={`px-2 py-1 text-xs rounded border border-emerald-700 text-emerald-200 hover:bg-emerald-900/40 ${
                              u.isAdmin ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={() => handleUnban(u)}
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            disabled={u.isAdmin}
                            className={`px-2 py-1 text-xs rounded border border-red-700 text-red-200 hover:bg-red-900/40 ${
                              u.isAdmin ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={() => handleBan(u)}
                          >
                            Ban
                          </button>
                        )}
                        <button
                          disabled={u.isAdmin}
                          className={`px-2 py-1 text-xs rounded border border-red-800 text-red-300 hover:bg-red-900/60 ${
                            u.isAdmin ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          onClick={() => handleDeleteUser(u)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && !loading && (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={6}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}

        {tab === "drawings" && (
          <div className="overflow-x-auto rounded border border-slate-800 bg-slate-900/40">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drawings.map((d) => (
                  <tr key={d.id} className="border-b border-slate-800/70 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      <button
                        className="text-indigo-300 hover:text-indigo-200 underline decoration-indigo-500/40"
                        onClick={() => navigate(`/draw?adminDrawingId=${d.id}`)}
                      >
                        {d.title}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {d.username}
                      <div className="text-xs text-slate-500">{d.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {d.width}×{d.height}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{d.isPublic ? "Public" : "Private"}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(d.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="px-2 py-1 text-xs rounded border border-red-800 text-red-300 hover:bg-red-900/60"
                        onClick={() => handleDeleteDrawing(d)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {drawings.length === 0 && !loading && (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={6}>
                      No drawings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "logs" && (
          <div className="overflow-x-auto rounded border border-slate-800 bg-slate-900/40">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/70 last:border-0">
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{log.adminEmail}</td>
                    <td className="px-4 py-3 text-slate-200">{log.action}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {log.targetType}
                      {log.targetId && <div className="text-xs text-slate-500">{log.targetId}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{log.message || "-"}</td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={5}>
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
