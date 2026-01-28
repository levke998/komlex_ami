export type RewritePromptResponse = {
  prompt: string;
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

async function safeDetail(res: Response): Promise<string | undefined> {
  try {
    const data = await res.json();
    return data?.detail || data?.title;
  } catch {
    return undefined;
  }
}
