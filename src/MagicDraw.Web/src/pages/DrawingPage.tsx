import React, { useCallback, useRef, useState } from "react";
import { CanvasStack } from "../components/Canvas/CanvasStack";
import type { CanvasStackHandle, CanvasStackProps } from "../components/Canvas/CanvasStack";
import { LayerPanel } from "../components/UI/LayerPanel";
import { ProfileModal } from "../components/UI/ProfileModal";
import type { Layer } from "../types/Layer";
import type { ToolType } from "../types/Tool";
import { useAuth } from "../context/AuthContext";
import { saveDrawingWithLayers, getDrawing } from "../services/drawings";
import { rewritePrompt, generateCaption } from "../services/ai";

export const DrawingPage: React.FC = () => {
  // Drawing State
  const [color, setColor] = useState("#22c55e");
  const [brushSize, setBrushSize] = useState(5);
  const [selectedTool, setSelectedTool] = useState<ToolType>("pencil");
  const { token, user, logout } = useAuth();

  // Layer State
  const [layers, setLayers] = useState<Layer[]>([
    { id: "layer-1", name: "Background", isVisible: true, opacity: 1, isLocked: false },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>("layer-1");

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  const stylePresets = [
    { id: "none", label: "None", hint: "No style", prompt: "" },
    { id: "sketch", label: "Sketch", hint: "Pencil / line art", prompt: "sketch style, pencil drawing, clean line art" },
    { id: "pixel", label: "Pixel", hint: "Retro 8-bit", prompt: "pixel art, 8-bit, low resolution, crisp pixels" },
    { id: "watercolor", label: "Watercolor", hint: "Soft wash", prompt: "watercolor painting, soft wash, paper texture" },
    { id: "neon", label: "Neon", hint: "Glow / synth", prompt: "neon glow, synthwave, vibrant lighting, dark background" },
    { id: "comic", label: "Comic", hint: "Ink + bold", prompt: "comic style, bold outlines, flat colors" },
  ];
  const [selectedStyleId, setSelectedStyleId] = useState<string>("none");
  const rewritePresets = [
    { id: "professional", label: "Professional", hint: "Clear and detailed" },
    { id: "playful", label: "Playful", hint: "Creative and light" },
    { id: "cinematic", label: "Cinematic", hint: "Film-like mood" },
    { id: "random", label: "Random", hint: "Surprising twist" },
    { id: "minimal", label: "Minimal", hint: "Short and concise" },
  ];
  const [selectedRewriteId, setSelectedRewriteId] = useState<string>("professional");

  // Color Presets
  const colorPresets = [
    { color: "#ef4444", title: "Red" },
    { color: "#1e3a8a", title: "Dark Blue" },
    { color: "#3b82f6", title: "Light Blue" },
    { color: "#facc15", title: "Yellow" },
  ];

  const overlayPresets = [
    {
      id: "neon-fog",
      label: "Neon Fog",
      hint: "Vibrant haze",
      prompt: "neon fog, glowing mist, volumetric light, soft gradients",
      blendMode: "screen",
      filterBoost: "saturate(1.35) brightness(1.15)",
    },
    {
      id: "soft-glow",
      label: "Soft Glow",
      hint: "Gentle light",
      prompt: "soft glow, diffuse bloom, dreamy haze, subtle gradients",
      blendMode: "screen",
      filterBoost: "saturate(1.2) brightness(1.05)",
    },
    {
      id: "shadow-veil",
      label: "Shadow Veil",
      hint: "Moody overlay",
      prompt: "dark mist, shadow veil, cinematic haze, low contrast",
      blendMode: "multiply",
      filterBoost: "saturate(0.9) brightness(0.9)",
    },
  ];
  const [selectedOverlayId, setSelectedOverlayId] = useState<string>("neon-fog");
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const [overlayBlur, setOverlayBlur] = useState(12);
  const [isGeneratingOverlay, setIsGeneratingOverlay] = useState(false);
  const [aiMode, setAiMode] = useState<"image" | "glow">("image");
  const [captionNotes, setCaptionNotes] = useState("");
  const [captionTitle, setCaptionTitle] = useState("");
  const [captionDescription, setCaptionDescription] = useState("");
  const [isCaptioning, setIsCaptioning] = useState(false);
  const [isCaptionOpen, setIsCaptionOpen] = useState(false);

  // History for Undo/Redo
  const [history, setHistory] = useState<Layer[][]>([]);
  const [redoStack, setRedoStack] = useState<Layer[][]>([]);
  const historyLimit = 20;

  // Canvas
  const canvasRef = useRef<CanvasStackHandle>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });

  const pushHistory = () => {
    setHistory((prev) => {
      const next = [...prev, structuredClone(layers)];
      if (next.length > historyLimit) next.shift();
      return next;
    });
    setRedoStack([]);
  };

  // Layer actions
  const handleAddLayer = () => {
    pushHistory();
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      isVisible: true,
      opacity: 1,
      isLocked: false,
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    pushHistory();
    const newLayers = layers.filter((l) => l.id !== id);
    setLayers(newLayers);
    if (activeLayerId === id) {
      setActiveLayerId(newLayers[newLayers.length - 1].id);
    }
  };

  const handleToggleVisibility = (id: string) => {
    pushHistory();
    setLayers(layers.map((l) => (l.id === id ? { ...l, isVisible: !l.isVisible } : l)));
  };

  const handleToggleLock = (id: string) => {
    pushHistory();
    setLayers(layers.map((l) => (l.id === id ? { ...l, isLocked: !l.isLocked } : l)));
  };

  const handleChangeOpacity = (id: string, opacity: number) => {
    pushHistory();
    setLayers(layers.map((l) => (l.id === id ? { ...l, opacity } : l)));
  };

  const handleRenameLayer = (id: string, newName: string) => {
    pushHistory();
    setLayers(layers.map((l) => (l.id === id ? { ...l, name: newName } : l)));
  };

  const handleReorderLayers = (fromIndex: number, toIndex: number) => {
    pushHistory();
    const newLayers = [...layers];
    const [movedLayer] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, movedLayer);
    setLayers(newLayers);
  };

  // Undo/Redo
  const restoreLayerImages = (layerList: Layer[]) => {
    setTimeout(() => {
      layerList.forEach((l) => {
        if (l.contentDataUrl && canvasRef.current) {
          canvasRef.current.setLayerImage(l.id, l.contentDataUrl);
        }
      });
    }, 0);
  };

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setRedoStack((rs) => [...rs, structuredClone(layers)]);
    setLayers(prev);
    restoreLayerImages(prev);
  }, [history, layers]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setHistory((h) => [...h, structuredClone(layers)]);
    setLayers(next);
    restoreLayerImages(next);
  }, [redoStack, layers]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        tag === "input" || tag === "textarea" || (target && (target as HTMLElement).isContentEditable);
      if (isEditable) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      if (!isCtrl) return;

      const key = e.key.toLowerCase();
      if (key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (key === "z") {
        e.preventDefault();
        handleUndo();
      } else if (key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo, handleRedo]);

  // Commit drawing to layer content
  const handleCommitDraw = () => {
    if (!canvasRef.current) return;
    const state = canvasRef.current.exportState();
    const merged = layers.map((l) => {
      const img = state.find((s) => s.layerId === l.id);
      return { ...l, contentDataUrl: img?.dataUrl ?? l.contentDataUrl };
    });
    setLayers(merged);
    pushHistory();
  };

  // Save/Load
  const handleSave = async () => {
    if (!token) {
      alert("Please sign in to save.");
      return;
    }
    const state = canvasRef.current?.exportState() ?? [];
    const merged = layers.map((l) => {
      const img = state.find((s) => s.layerId === l.id);
      return { ...l, contentDataUrl: img?.dataUrl ?? l.contentDataUrl };
    });
    try {
      const id = await saveDrawingWithLayers(token, merged, canvasSize, "My Drawing");
      alert(`Saved: ${id}`);
    } catch (e: any) {
      alert(e.message || "Save failed");
    }
  };

  const handleLoad = async () => {
    if (!token) {
      alert("Please sign in to load.");
      return;
    }
    const drawingId = window.prompt("Drawing ID to load:");
    if (!drawingId) return;
    try {
      const data = await getDrawing(token, drawingId);
      const loadedLayers: Layer[] = data.layers.map((l: any, idx: number) => {
        const cfg = l.configurationJson ? JSON.parse(l.configurationJson) : {};
        return {
          id: l.id,
          name: l.name ?? `Layer ${idx + 1}`,
          isVisible: l.isVisible,
          isLocked: l.isLocked,
          opacity: cfg.opacity ?? 1,
          blendMode: cfg.blendMode,
          filter: cfg.filter,
          contentDataUrl: l.imageUrl ?? undefined,
        };
      });
      setLayers(loadedLayers);
      setActiveLayerId(loadedLayers[loadedLayers.length - 1]?.id ?? "");
      restoreLayerImages(loadedLayers);
      setHistory([]);
      setRedoStack([]);
    } catch (e: any) {
      alert(e.message || "Load failed");
    }
  };

  // AI generate
  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const selectedStyle = stylePresets.find((s) => s.id === selectedStyleId);
      const finalPrompt =
        selectedStyle && selectedStyle.prompt
          ? `${selectedStyle.prompt}. ${prompt}`
          : prompt;

      const newLayerId = `layer-${Date.now()}`;
      const newLayer: Layer = {
        id: newLayerId,
        name: `AI: ${prompt.slice(0, 15)}...`,
        isVisible: true,
        opacity: 1,
        isLocked: false,
      };
      setLayers((prev) => [...prev, newLayer]);
      setActiveLayerId(newLayerId);

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errData = await response.json();
          throw new Error(errData.detail || `Server Error: ${response.status} ${response.statusText}`);
        } else {
          const text = await response.text();
          throw new Error(`Server Error: ${response.status} ${response.statusText} \n ${text.substring(0, 100)}`);
        }
      }

      const data = await response.json();

      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.addImage(data.image);
        }
        setIsGenerating(false);
        setIsAIModalOpen(false);
        setPrompt("");
      }, 100);
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message || "Unknown error occurred"}`);
      setIsGenerating(false);
    }
  };

  const handleGenerateOverlay = async () => {
    if (!prompt.trim()) return;
    setIsGeneratingOverlay(true);
    try {
      const selectedOverlay = overlayPresets.find((s) => s.id === selectedOverlayId);
      const overlayPromptParts = [
        prompt,
        selectedOverlay?.prompt,
        "dark background",
        "glowing highlights",
        "soft blur",
        "no text",
      ].filter(Boolean);
      const overlayPrompt = overlayPromptParts.join(". ");
      const blendMode = selectedOverlay?.blendMode ?? "screen";
      const filterBoost = selectedOverlay?.filterBoost ?? "saturate(1.2) brightness(1.05)";

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt: overlayPrompt }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errData = await response.json();
          throw new Error(errData.detail || `Server Error: ${response.status} ${response.statusText}`);
        } else {
          const text = await response.text();
          throw new Error(`Server Error: ${response.status} ${response.statusText} \n ${text.substring(0, 100)}`);
        }
      }

      const data = await response.json();
      const newLayerId = `layer-${Date.now()}`;
      const newLayer: Layer = {
        id: newLayerId,
        name: `Glow: ${prompt.slice(0, 18)}...`,
        isVisible: true,
        opacity: overlayOpacity,
        isLocked: true,
        blendMode: blendMode,
        filter: `blur(${overlayBlur}px) ${filterBoost}`,
      };

      pushHistory();
      setLayers((prev) => [...prev, newLayer]);
      setActiveLayerId(newLayerId);

      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.addImage(data.image);
        }
        setIsGeneratingOverlay(false);
        setIsAIModalOpen(false);
      }, 100);
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message || "Unknown error occurred"}`);
      setIsGeneratingOverlay(false);
    }
  };

  const handleRewrite = async () => {
    if (!prompt.trim()) return;
    setIsRewriting(true);
    try {
      const rewritten = await rewritePrompt(prompt, selectedRewriteId, token ?? undefined);
      setPrompt(rewritten);
    } catch (e: any) {
      alert(e.message || "Prompt rewrite failed");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleGenerateCaption = async () => {
    const trimmedPrompt = prompt.trim();
    const trimmedNotes = captionNotes.trim();
    if (!trimmedPrompt && !trimmedNotes) return;
    setIsCaptioning(true);
    try {
      const hasGlowLayer = layers.some((l) => (l.blendMode === "screen" || l.blendMode === "multiply") && l.filter?.includes("blur"));
      const result = await generateCaption(
        {
          prompt: trimmedPrompt || undefined,
          notes: trimmedNotes || undefined,
          layerCount: layers.length,
          hasGlow: hasGlowLayer,
          style: selectedStyleId,
        },
        token ?? undefined
      );
      setCaptionTitle(result.title);
      setCaptionDescription(result.description);
    } catch (e: any) {
      alert(e.message || "Caption generation failed");
    } finally {
      setIsCaptioning(false);
    }
  };

  const handleCopyCaption = async () => {
    const text = [captionTitle, captionDescription].filter(Boolean).join("\n");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      alert("Copy failed");
    }
  };

  const handleSizeChange = useCallback((size: { width: number; height: number }) => {
    setCanvasSize((prev) => (prev.width === size.width && prev.height === size.height ? prev : size));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#1e212b] text-slate-200 overflow-hidden font-sans">
      {/* TOP HEADER / TOOLBAR */}
      <header className="h-16 bg-[#2b2d3e] border-b border-slate-700 flex items-center justify-between px-6 shrink-0 z-20 shadow-md">
        {/* Logo & Left Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-lg tracking-wide hidden sm:block">Magic Draw</span>
          </div>
        </div>

        {/* Center Tools */}
        <div className="flex items-center gap-2 bg-[#1e212b] p-1.5 rounded-xl border border-slate-700/50">
          <ToolButton active={selectedTool === "pencil"} onClick={() => setSelectedTool("pencil")} icon="✏️" title="Pencil" />
          <ToolButton active={selectedTool === "brush"} onClick={() => setSelectedTool("brush")} icon="🖌️" title="Brush" />
          <ToolButton active={selectedTool === "eraser"} onClick={() => setSelectedTool("eraser")} icon="🧼" title="Eraser" />
          <div className="w-[1px] h-6 bg-slate-700 mx-1"></div>
          <ToolButton active={selectedTool === "rectangle"} onClick={() => setSelectedTool("rectangle")} icon="⬜" title="Rectangle" />
          <ToolButton active={selectedTool === "circle"} onClick={() => setSelectedTool("circle")} icon="⭕" title="Circle" />
          <ToolButton active={selectedTool === "triangle"} onClick={() => setSelectedTool("triangle")} icon="🔺" title="Triangle" />
          <div className="w-[1px] h-6 bg-slate-700 mx-1"></div>
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all hover:scale-105 bg-gradient-to-tr from-indigo-500/20 to-fuchsia-500/20 border border-indigo-500/30 hover:border-indigo-400 group"
            title="AI Generator"
          >
            <span className="text-lg group-hover:animate-pulse">✨</span>
          </button>
          <button
            onClick={handleUndo}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-700/70 border border-slate-600 disabled:opacity-40"
            disabled={history.length === 0}
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-700/70 border border-slate-600 disabled:opacity-40"
            disabled={redoStack.length === 0}
          >
            Redo
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          {/* Color & Size */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {colorPresets.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => setColor(preset.color)}
                  className={`w-6 h-6 rounded-full border border-slate-600 transition-transform hover:scale-110 ${color === preset.color ? "ring-2 ring-white" : ""
                    }`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.title}
                />
              ))}
              <div className="w-[1px] h-6 bg-slate-700 mx-2"></div>
              <div className="flex items-center gap-2 bg-[#1e212b] px-3 py-1.5 rounded-lg border border-slate-700/50">
                <div className="w-6 h-6 rounded-md border border-slate-500/50" style={{ backgroundColor: color }}></div>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-0 h-0 opacity-0 absolute" id="color-input" />
                <label htmlFor="color-input" className="text-xs font-medium cursor-pointer hover:text-white transition-colors">
                  {color}
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 w-40">
              <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap">Size</span>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${isSidebarOpen ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-[#1e212b] text-slate-400 hover:text-white border border-slate-700"
              }`}
            title="Toggle Layers"
          >
            <span>📑</span> Layers
          </button>

          <button onClick={handleSave} className="px-3 py-1.5 rounded-lg text-xs bg-emerald-600 text-white">
            Save
          </button>
          <button onClick={handleLoad} className="px-3 py-1.5 rounded-lg text-xs bg-slate-600 text-white">
            Load
          </button>
          <button
            onClick={() => setIsCaptionOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-700/70 border border-slate-600 text-slate-200 hover:text-white"
          >
            📝 Caption
          </button>

          {user && (
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 hover:bg-slate-700/50 p-1.5 rounded-lg transition-colors group"
                title="Edit Profile"
              >
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt={user.username} className="w-6 h-6 rounded-full object-cover border border-slate-600 group-hover:border-indigo-500" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-xs text-indigo-300">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-slate-300 group-hover:text-white">{user.username}</span>
              </button>
              <button onClick={logout} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 hover:bg-red-500/10 rounded" title="Logout">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 relative bg-[#181a25] overflow-hidden cursor-crosshair">
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          ></div>

          <div className="absolute inset-0">
            <AutoResizingCanvas
              ref={canvasRef}
              layers={layers}
              activeLayerId={activeLayerId}
              strokeColor={color}
              strokeWidth={brushSize}
              tool={selectedTool}
              onCommit={handleCommitDraw}
              onSizeChange={handleSizeChange}
            />
          </div>
        </main>

        {isSidebarOpen && (
          <aside className="w-80 bg-[#2b2d3e] border-l border-slate-700 shadow-xl z-10 flex flex-col shrink-0 transition-all">
            <div className="h-full bg-[#1e212b]">
              <LayerPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onAddLayer={handleAddLayer}
                onDeleteLayer={handleDeleteLayer}
                onSelectLayer={setActiveLayerId}
                onToggleVisibility={handleToggleVisibility}
                onToggleLock={handleToggleLock}
                onChangeOpacity={handleChangeOpacity}
                onRenameLayer={handleRenameLayer}
                onReorderLayers={handleReorderLayers}
                darkMode={true}
              />
            </div>
          </aside>
        )}

        {isAIModalOpen && (
          <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[92vw] max-w-[560px] max-h-[90vh] bg-[#2b2d3e] rounded-xl shadow-2xl border border-slate-700 overflow-hidden text-slate-200 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-[#2f3245]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h2 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">AI Generator</h2>
                </div>
                <button onClick={() => setIsAIModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-64px)]">
                <div className="bg-[#1e212b] border border-slate-700/60 rounded-xl p-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAiMode("image")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${aiMode === "image" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                      }`}
                  >
                    Image
                  </button>
                  <div className="px-2 text-slate-500 text-sm">→</div>
                  <button
                    type="button"
                    onClick={() => setAiMode("glow")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${aiMode === "glow" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                      }`}
                  >
                    Glow Overlay
                  </button>
                </div>

                {aiMode === "image" && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Style Preset</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {stylePresets.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedStyleId(s.id)}
                          className={`p-2 rounded-lg border text-left transition-all ${selectedStyleId === s.id
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                            : "bg-[#1e212b] border-slate-700 text-slate-400 hover:border-slate-500"
                            }`}
                          type="button"
                        >
                          <div className="text-xs font-semibold">{s.label}</div>
                          <div className="text-[10px] text-slate-500">{s.hint}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {aiMode === "glow" && (
                  <div className="p-4 bg-[#1e212b] rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Glow Overlay</label>
                      <span className="text-[10px] text-slate-500">Uses the prompt below</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {overlayPresets.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedOverlayId(s.id)}
                          className={`p-2 rounded-lg border text-left transition-all ${selectedOverlayId === s.id
                            ? "bg-emerald-600/15 border-emerald-500 text-emerald-200"
                            : "bg-[#141621] border-slate-700 text-slate-400 hover:border-slate-500"
                            }`}
                          type="button"
                        >
                          <div className="text-xs font-semibold">{s.label}</div>
                          <div className="text-[10px] text-slate-500">{s.hint}</div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase">
                          <span>Opacity</span>
                          <span>{Math.round(overlayOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="1"
                          step="0.05"
                          value={overlayOpacity}
                          onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase">
                          <span>Blur</span>
                          <span>{overlayBlur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="24"
                          step="1"
                          value={overlayBlur}
                          onChange={(e) => setOverlayBlur(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-32 bg-[#1e212b] border border-slate-600 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    placeholder="Describe what you want to generate..."
                  ></textarea>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Prompt Enhancer</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {rewritePresets.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedRewriteId(s.id)}
                        className={`p-2 rounded-lg border text-left transition-all ${selectedRewriteId === s.id
                          ? "bg-emerald-600/20 border-emerald-500 text-emerald-200"
                          : "bg-[#1e212b] border-slate-700 text-slate-400 hover:border-slate-500"
                          }`}
                        type="button"
                      >
                        <div className="text-xs font-semibold">{s.label}</div>
                        <div className="text-[10px] text-slate-500">{s.hint}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleRewrite}
                    disabled={isRewriting || !prompt.trim()}
                    className={`mt-3 w-full py-2 rounded-lg border border-emerald-500/40 text-white shadow-md shadow-emerald-500/10 ${isRewriting
                      ? "opacity-60 bg-emerald-600/60"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                      }`}
                  >
                    {isRewriting ? "Enhancing..." : "Improve Prompt"}
                  </button>
                </div>

                {aiMode === "image" ? (
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className={`w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transform transition-all ${isGenerating ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
                      }`}
                  >
                    {isGenerating ? (
                      <>
                        <span>⌛</span> Generating...
                      </>
                    ) : (
                      <>
                        <span>🚀</span> Generate Image
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateOverlay}
                    disabled={isGeneratingOverlay || !prompt.trim()}
                    className={`w-full py-3 rounded-lg border border-emerald-500/40 text-white shadow-md shadow-emerald-500/10 ${isGeneratingOverlay
                      ? "opacity-60 bg-emerald-600/60"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                      }`}
                  >
                    {isGeneratingOverlay ? "Generating overlay..." : "Generate Glow Overlay"}
                  </button>
                )}

                <div className="p-4 bg-[#1e212b] rounded-lg border border-slate-700/50">
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">Tips</h4>
                  <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                    <li>Be specific about the style (e.g. "Oil painting", "Pixel art").</li>
                    <li>Adding colors and lighting helps.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {isCaptionOpen && (
          <div className="absolute inset-0 z-[9998] flex justify-end">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setIsCaptionOpen(false)}
            ></div>
            <div className="relative h-full w-[92vw] max-w-sm bg-[#1e212b] border-l border-slate-700 shadow-2xl p-5 sm:p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <h3 className="font-semibold text-slate-200">Auto Caption</h3>
                </div>
                <button
                  onClick={() => setIsCaptionOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Generate a title and description for your drawing. Uses your prompt and optional notes.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500">Prompt Context (optional)</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-20 bg-[#141621] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    placeholder="What is the drawing about?"
                  ></textarea>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500">Notes (optional)</label>
                  <input
                    value={captionNotes}
                    onChange={(e) => setCaptionNotes(e.target.value)}
                    className="w-full bg-[#141621] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Mood, colors, key elements..."
                  />
                </div>

                <button
                  onClick={handleGenerateCaption}
                  disabled={isCaptioning || (!prompt.trim() && !captionNotes.trim())}
                  className={`w-full py-2 rounded-lg border border-emerald-500/40 text-white shadow-md shadow-emerald-500/10 ${isCaptioning
                    ? "opacity-60 bg-emerald-600/60"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                    }`}
                >
                  {isCaptioning ? "Generating caption..." : "Generate Title + Description"}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500">Result</label>
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    disabled={!captionTitle && !captionDescription}
                    className="text-[10px] uppercase tracking-wider text-slate-400 hover:text-white disabled:opacity-40"
                  >
                    Copy
                  </button>
                </div>

                <input
                  value={captionTitle}
                  onChange={(e) => setCaptionTitle(e.target.value)}
                  className="w-full bg-[#141621] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Title will appear here..."
                />
                <textarea
                  value={captionDescription}
                  onChange={(e) => setCaptionDescription(e.target.value)}
                  className="w-full h-24 bg-[#141621] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Description will appear here..."
                ></textarea>
              </div>
            </div>
          </div>
        )}
      </div>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

const ToolButton: React.FC<{ active: boolean; onClick: () => void; icon: string; title: string }> = ({ active, onClick, icon, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${active ? "bg-indigo-600 text-white shadow-lg scale-105" : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
      }`}
  >
    {icon}
  </button>
);

type AutoResizingCanvasProps = Omit<CanvasStackProps, "width" | "height"> & {
  onSizeChange: (size: { width: number; height: number }) => void;
};

const AutoResizingCanvas = React.forwardRef<CanvasStackHandle, AutoResizingCanvasProps>((props, ref) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const { onSizeChange, ...rest } = props;

  React.useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      setSize((prev) => {
        if (Math.abs(clientWidth - prev.width) > 2 || Math.abs(clientHeight - prev.height) > 2) {
          if (ref && "current" in ref && ref.current) {
            ref.current.snapshot();
          }
          return { width: clientWidth, height: clientHeight };
        }
        return prev;
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ref, onSizeChange]);

  React.useEffect(() => {
    onSizeChange(size);
  }, [size, onSizeChange]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-white">
      {size.width > 0 && size.height > 0 && <CanvasStack ref={ref} width={size.width} height={size.height} {...rest} />}
    </div>
  );
});
