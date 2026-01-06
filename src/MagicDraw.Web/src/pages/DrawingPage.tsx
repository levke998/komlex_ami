import React, { useState } from 'react';
import { CanvasStack } from '../components/Canvas/CanvasStack';
import type { CanvasStackHandle, CanvasStackProps } from '../components/Canvas/CanvasStack';
import { LayerPanel } from '../components/UI/LayerPanel';
import type { Layer } from '../types/Layer';
import type { ToolType } from '../types/Tool';

export const DrawingPage: React.FC = () => {
    // Drawing State
    const [color, setColor] = useState('#22c55e');
    const [brushSize, setBrushSize] = useState(5);
    const [selectedTool, setSelectedTool] = useState<ToolType>('pencil');

    // Layer State
    const [layers, setLayers] = useState<Layer[]>([
        { id: 'layer-1', name: 'Background', isVisible: true, opacity: 1 }
    ]);
    const [activeLayerId, setActiveLayerId] = useState<string>('layer-1');

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    // Layer Actions
    const handleAddLayer = () => {
        const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            name: `Layer ${layers.length + 1}`,
            isVisible: true,
            opacity: 1
        };
        setLayers([...layers, newLayer]);
        setActiveLayerId(newLayer.id);
    };

    const handleDeleteLayer = (id: string) => {
        if (layers.length <= 1) return;
        const newLayers = layers.filter(l => l.id !== id);
        setLayers(newLayers);
        if (activeLayerId === id) {
            setActiveLayerId(newLayers[newLayers.length - 1].id);
        }
    };

    const handleToggleVisibility = (id: string) => {
        setLayers(layers.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l));
    };

    const handleChangeOpacity = (id: string, opacity: number) => {
        setLayers(layers.map(l => l.id === id ? { ...l, opacity } : l));
    };

    const handleRenameLayer = (id: string, newName: string) => {
        setLayers(layers.map(l => l.id === id ? { ...l, name: newName } : l));
    };

    const handleReorderLayers = (fromIndex: number, toIndex: number) => {
        const newLayers = [...layers];
        const [movedLayer] = newLayers.splice(fromIndex, 1);
        newLayers.splice(toIndex, 0, movedLayer);
        setLayers(newLayers);
    };

    // AI Logic
    const canvasRef = React.useRef<any>(null); // Use refined type if possible
    const [isGenerating, setIsGenerating] = useState(false);
    const [prompt, setPrompt] = useState('');

    const handleGenerateImage = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        try {
            // 1. Create a specific layer for result
            const newLayerId = `layer-${Date.now()}`;
            const newLayer: Layer = {
                id: newLayerId,
                name: `AI: ${prompt.slice(0, 15)}...`,
                isVisible: true,
                opacity: 1
            };
            setLayers(prev => [...prev, newLayer]); // Logic to add to top? or bottom?
            // Actually, safest is to append (top)

            // Wait for state to settle so canvas exists? 
            // In React state updates are batched. Use flushSync or just wait a tick?
            // Or just add layer, set active, then draw.
            // Better: Add layer, set active.
            setActiveLayerId(newLayerId);


            // Revert to proxy path (requires app restart to load vite.config.ts)
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt })
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

            // 3. Draw
            // We need a slight delay to ensure the new layer canvas is mounted and ref'd
            setTimeout(() => {
                if (canvasRef.current) {
                    canvasRef.current.addImage(data.image);
                }
                setIsGenerating(false);
                setIsAIModalOpen(false);
                setPrompt('');
            }, 100);

        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message || "Unknown error occurred"}`);
            setIsGenerating(false);
        }
    };

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
                    <ToolButton
                        active={selectedTool === 'pencil'}
                        onClick={() => setSelectedTool('pencil')}
                        icon="✏️"
                        title="Pencil"
                    />
                    <ToolButton
                        active={selectedTool === 'brush'}
                        onClick={() => setSelectedTool('brush')}
                        icon="🖌️"
                        title="Brush"
                    />
                    <ToolButton
                        active={selectedTool === 'eraser'}
                        onClick={() => setSelectedTool('eraser')}
                        icon="🧼"
                        title="Eraser"
                    />
                    <div className="w-[1px] h-6 bg-slate-700 mx-1"></div>
                    <ToolButton
                        active={selectedTool === 'rectangle'}
                        onClick={() => setSelectedTool('rectangle')}
                        icon="⬜"
                        title="Rectangle"
                    />
                    <ToolButton
                        active={selectedTool === 'circle'}
                        onClick={() => setSelectedTool('circle')}
                        icon="⭕"
                        title="Circle"
                    />
                    <div className="w-[1px] h-6 bg-slate-700 mx-1"></div>
                    {/* AI Tool Button */}
                    <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all hover:scale-105 bg-gradient-to-tr from-indigo-500/20 to-fuchsia-500/20 border border-indigo-500/30 hover:border-indigo-400 group"
                        title="AI Generator"
                    >
                        <span className="text-lg group-hover:animate-pulse">✨</span>
                    </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    {/* Color & Size */}
                    <div className="flex items-center gap-4">
                        {/* Color Picker Compact */}
                        <div className="flex items-center gap-2 bg-[#1e212b] px-3 py-1.5 rounded-lg border border-slate-700/50">
                            <div
                                className="w-6 h-6 rounded-md border border-slate-500/50"
                                style={{ backgroundColor: color }}
                            ></div>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-0 h-0 opacity-0 absolute"
                                id="color-input"
                            />
                            <label htmlFor="color-input" className="text-xs font-medium cursor-pointer hover:text-white transition-colors">
                                {color}
                            </label>
                        </div>

                        {/* Size Slider */}
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

                    {/* Sidebar Toggle (Layers) */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`
                            px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all
                            ${isSidebarOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-[#1e212b] text-slate-400 hover:text-white border border-slate-700'}
                        `}
                        title="Toggle Layers"
                    >
                        <span>📑</span> Layers
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* CENTER CANVAS */}
                <main className="flex-1 relative bg-[#181a25] overflow-hidden cursor-crosshair">
                    {/* Dot Grid Background */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    ></div>

                    <div className="absolute inset-0">
                        <AutoResizingCanvas
                            ref={canvasRef}
                            layers={layers}
                            activeLayerId={activeLayerId}
                            strokeColor={color}
                            strokeWidth={brushSize}
                            tool={selectedTool}
                        />
                    </div>
                </main>

                {/* RIGHT SIDEBAR - LAYERS ONLY */}
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
                                onChangeOpacity={handleChangeOpacity}
                                onRenameLayer={handleRenameLayer}
                                onReorderLayers={handleReorderLayers}
                                darkMode={true}
                            />
                        </div>
                    </aside>
                )}

                {/* AI MODAL */}
                {isAIModalOpen && (
                    <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-[500px] bg-[#2b2d3e] rounded-xl shadow-2xl border border-slate-700 overflow-hidden text-slate-200 animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-[#2f3245]">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">✨</span>
                                    <h2 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">AI Generator</h2>
                                </div>
                                <button
                                    onClick={() => setIsAIModalOpen(false)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Prompt</label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="w-full h-32 bg-[#1e212b] border border-slate-600 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                        placeholder="Describe what you want to generate... e.g. 'A futuristic city with flying cars' or 'A cute geometric cat vector art'."
                                    ></textarea>
                                </div>

                                <button
                                    onClick={handleGenerateImage}
                                    disabled={isGenerating}
                                    className={`w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transform transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                                >
                                    {isGenerating ? (
                                        <><span>⌛</span> Generating...</>
                                    ) : (
                                        <><span>🚀</span> Generate Image</>
                                    )}
                                </button>

                                <div className="p-4 bg-[#1e212b] rounded-lg border border-slate-700/50">
                                    <h4 className="text-xs font-semibold text-slate-400 mb-2">Tips</h4>
                                    <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                                        <li>Be specific about style (e.g. "Oil painting", "Pixel art").</li>
                                        <li>Mention colors and lighting.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper Component for Auto-Resizing Canvas
// We define the type for the props explicitly to satisfy TypeScript when spreading 'rest'
type AutoResizingCanvasProps = Omit<CanvasStackProps, 'width' | 'height'>;

const AutoResizingCanvas = React.forwardRef<CanvasStackHandle, AutoResizingCanvasProps>((props, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [size, setSize] = React.useState({ width: 0, height: 0 });

    React.useEffect(() => {
        if (!containerRef.current) return;

        const updateSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                if (Math.abs(clientWidth - size.width) > 50 || Math.abs(clientHeight - size.height) > 50) {
                    // Snapshot before resize to prevent data loss
                    if (ref && 'current' in ref && ref.current) {
                        ref.current.snapshot();
                    }
                    setSize({ width: clientWidth, height: clientHeight });
                }
            }
        };

        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [size.width, size.height]);

    return (
        <div ref={containerRef} className="w-full h-full relative bg-white">
            {size.width > 0 && size.height > 0 && (
                <CanvasStack
                    ref={ref}
                    width={size.width}
                    height={size.height}
                    {...props}
                />
            )}
        </div>
    );
});

// Helper Component for Tools
const ToolButton: React.FC<{ active: boolean, onClick: () => void, icon: string, title: string }> = ({ active, onClick, icon, title }) => (
    <button
        onClick={onClick}
        title={title}
        className={`
            w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all
            ${active
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }
        `}
    >
        {icon}
    </button>
);
