export type AdminUserListItem = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
  isBanned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  warningCount: number;
  lastWarningAt: string | null;
};

export type AdminDrawingListItem = {
  id: string;
  title: string;
  width: number;
  height: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  username: string;
  email: string;
};

export type AdminAuditLogItem = {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  message: string | null;
  createdAt: string;
};

export type AdminBanRequest = {
  reason?: string;
};

export type AdminWarnRequest = {
  message: string;
};

const API_BASE = "/api/admin";

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json();
}

async function handleNoContent(res: Response): Promise<void> {
  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail || `Request failed (${res.status})`);
  }
}

export async function getAdminUsers(token: string): Promise<AdminUserListItem[]> {
  const res = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(res);
}

export async function banUser(token: string, id: string, request: AdminBanRequest): Promise<AdminUserListItem> {
  const res = await fetch(`${API_BASE}/users/${id}/ban`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(request),
  });
  return handleJson(res);
}

export async function unbanUser(token: string, id: string): Promise<AdminUserListItem> {
  const res = await fetch(`${API_BASE}/users/${id}/unban`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(res);
}

export async function warnUser(token: string, id: string, request: AdminWarnRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/users/${id}/warn`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(request),
  });
  return handleNoContent(res);
}

export async function deleteUser(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleNoContent(res);
}

export async function getAdminDrawings(token: string): Promise<AdminDrawingListItem[]> {
  const res = await fetch(`${API_BASE}/drawings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(res);
}

export async function getAdminLogs(token: string): Promise<AdminAuditLogItem[]> {
  const res = await fetch(`${API_BASE}/logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(res);
}

export async function getAdminDrawing(token: string, id: string) {
  const res = await fetch(`${API_BASE}/drawings/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(res);
}

export async function deleteDrawing(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/drawings/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleNoContent(res);
}

async function safeDetail(res: Response): Promise<string | undefined> {
  try {
    const data = await res.json();
    return (data && (data.detail || data.title)) as string | undefined;
  } catch {
    return undefined;
  }
}
