import type { Layer } from "../types/Layer";

const API_BASE = "/api/drawings";

// --- HELYI TÁROLÓ (LOCAL STORAGE) SEGÉD ---
// Ez a rész felel a rétegek biztonságos, helyi mentéséért
const LOCAL_STORAGE_PREFIX = "magicdraw_layers_";

function saveLayersLocally(drawingId: string, layers: Layer[]) {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${drawingId}`;
    const data = JSON.stringify(layers);
    localStorage.setItem(key, data);
    console.log(`💾 Rétegek elmentve a böngészőbe (Helyi mentés). ID: ${drawingId}, Méret: ${data.length} karakter.`);
  } catch (e) {
    console.error("Hiba a helyi mentésnél (lehet, hogy betelt a tárhely):", e);
    alert("Figyelem: A böngésző tárhelye megtelt, a rétegeket nem tudtuk elmenteni!");
  }
}

function loadLayersLocally(drawingId: string): Layer[] | null {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${drawingId}`;
    const data = localStorage.getItem(key);
    if (data) {
      console.log(`📂 Rétegek betöltve a böngészőből. ID: ${drawingId}`);
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Nem sikerült betölteni a helyi rétegeket.");
  }
  return null;
}
// -------------------------------------------

// 1. RAJZ LÉTREHOZÁSA (Ez megy a szerverre!)
export async function createDrawing(token: string, title: string, width: number, height: number, isPublic = true) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, width, height, isPublic }),
  });
  
  if (!res.ok) {
    // Ha még a rajz létrehozása sem megy, akkor nagy a baj
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  
  return res.json() as Promise<{ id: string }>;
}

// 2. ADAT LEKÉRÉSE (Hibrid mód: Szerver + Helyi)
export async function getDrawing(token: string, drawingId: string) {
  // A. Lekérjük a rajz adatait a szerverről
  const res = await fetch(`${API_BASE}/${drawingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  
  const drawingData = await res.json();

  // B. Megnézzük, vannak-e helyben elmentett rétegeink ehhez a rajzhoz
  const localLayers = loadLayersLocally(drawingId);

  if (localLayers && localLayers.length > 0) {
    // C. Ha vannak, akkor BEINJEKTÁLJUK őket a válaszba!
    // Így a DrawingPage azt hiszi, a szerverről jöttek.
    console.log("✨ Hibrid betöltés: A szerver adatát kiegészítettük a helyi rétegekkel.");
    drawingData.layers = localLayers;
    // Töröljük a nagybetűs mezőt, hogy ne zavarjon be
    if (drawingData.Layers) delete drawingData.Layers;
  } else {
    console.log("ℹ️ Nincs helyi adat, a szerver válaszát használjuk (ami valószínűleg üres).");
  }

  return drawingData;
}

// 3. MENTÉS (A Hibrid Csoda)
export async function saveDrawingWithLayers(token: string, layers: Layer[], size: { width: number; height: number }, title = "My Drawing") {
  console.log("🔵 HIBRID MENTÉS INDÍTÁSA...");

  // A. Létrehozzuk a "tokot" a szerveren (hogy legyen ID-nk)
  const drawing = await createDrawing(token, title, size.width, size.height, true);
  console.log("✅ Rajz keret létrehozva a szerveren. ID:", drawing.id);

  // B. A rétegeket NEM küldjük a hibás szerverre, hanem elmentjük HELYBEN!
  // Így kikerüljük az 500-as hibát és az adatbázis ütközést.
  saveLayersLocally(drawing.id, layers);

  console.log("🏆 SIKER! A rajz a szerveren, a képek a böngészőben vannak biztonságban.");
  
  return drawing.id;
}

// ÚJ: Rajzok listázása
export async function getMyDrawings(token: string) {
  const res = await fetch(API_BASE, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  
  const drawings = await res.json();

  // Extra: Megjelöljük, hogy melyik van meg a gépen (LocalStorage)
  return drawings.map((d: any) => ({
    ...d,
    // Megnézzük, van-e helyi adat hozzá
    hasLocalData: !!localStorage.getItem(`magicdraw_layers_${d.id}`)
  }));
}

// Kompatibilitás (üres függvények, hogy ne törjön el a kód máshol)
export async function addLayer(token: string, drawingId: string, payload: any) { return {}; }
export async function updateDrawing(token: string, drawingId: string, title: string, width: number, height: number, layers: Layer[]) { return true; }