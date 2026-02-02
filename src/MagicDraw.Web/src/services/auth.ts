export type AuthUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
  isAdmin: boolean;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

const API_BASE = "/api/auth";

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail || `Register failed (${res.status})`);
  }

  return res.json();
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail || "Invalid credentials");
  }

  return res.json();
}

async function safeDetail(res: Response): Promise<string | undefined> {
  try {
    const data = await res.json();
    return (data && (data.detail || data.title)) as string | undefined;
  } catch {
    return undefined;
  }
}
