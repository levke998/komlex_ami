import type { Layer } from "../types/Layer";

const API_BASE = "/api/drawings";

export async function createDrawing(token: string, title: string, width: number, height: number, isPublic = true) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, width, height, isPublic }),
  });
  if (!res.ok) throw new Error(await errorText(res));
  return res.json() as Promise<{ id: string }>;
}

export async function addLayer(token: string, drawingId: string, payload: any) {
  const res = await fetch(`${API_BASE}/${drawingId}/layers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await errorText(res));
  return res.json();
}

export async function getDrawing(token: string, drawingId: string) {
  const res = await fetch(`${API_BASE}/${drawingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await errorText(res));
  return res.json();
}

function layerToPayload(layer: Layer, orderIndex: number) {
  return {
    type: 1, // Image
    orderIndex,
    isVisible: layer.isVisible,
    isLocked: layer.isLocked ?? false,
    content: null,
    imageUrl: layer.contentDataUrl ?? null,
    configurationJson: JSON.stringify({
      opacity: layer.opacity,
      blendMode: layer.blendMode,
    }),
  };
}

export async function saveDrawingWithLayers(token: string, layers: Layer[], size: { width: number; height: number }, title = "My Drawing") {
  const drawing = await createDrawing(token, title, size.width, size.height, true);
  const tasks = layers.map((layer, idx) => addLayer(token, drawing.id, layerToPayload(layer, idx)));
  await Promise.all(tasks);
  return drawing.id;
}

async function errorText(res: Response) {
  try {
    const data = await res.json();
    return data.detail || data.title || res.statusText;
  } catch {
    return res.statusText;
  }
}
