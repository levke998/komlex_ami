export type RewritePromptResponse = {
  prompt: string;
};

export type AutoCaptionResponse = {
  title: string;
  description: string;
};

export async function rewritePrompt(prompt: string, style: string, token?: string): Promise<string> {
  const res = await fetch("/api/ai/rewrite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt, style }),
  });

  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail || `Rewrite failed (${res.status})`);
  }

  const data = (await res.json()) as RewritePromptResponse;
  return data.prompt;
}

export async function generateCaption(
  payload: {
    prompt?: string;
    notes?: string;
    layerCount?: number;
    hasGlow?: boolean;
    style?: string;
  },
  token?: string
): Promise<AutoCaptionResponse> {
  const res = await fetch("/api/ai/caption", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail || `Caption failed (${res.status})`);
  }

  return (await res.json()) as AutoCaptionResponse;
}

async function safeDetail(res: Response): Promise<string | undefined> {
  try {
    const data = await res.json();
    return data?.detail || data?.title;
  } catch {
    return undefined;
  }
}
