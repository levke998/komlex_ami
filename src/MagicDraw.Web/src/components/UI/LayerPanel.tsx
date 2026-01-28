import React from 'react';
import type { Layer } from '../../types/Layer';

interface LayerPanelProps {
    layers: Layer[];
    activeLayerId: string;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
    onSelectLayer: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onChangeOpacity: (id: string, opacity: number) => void;
    onToggleLock?: (id: string) => void;
    onRenameLayer?: (id: string, newName: string) => void;
    onReorderLayers?: (fromIndex: number, toIndex: number) => void;
    darkMode?: boolean;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
    layers,
    activeLayerId,
    onAddLayer,
    onDeleteLayer,
    onSelectLayer,
    onToggleVisibility,
    onChangeOpacity,
    onToggleLock,
    onRenameLayer,
    onReorderLayers,
    darkMode = false
}) => {
    // Edit Name State
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editName, setEditName] = React.useState('');

    // D&D State
    const [draggedLayerId, setDraggedLayerId] = React.useState<string | null>(null);

    const theme = {
        bg: darkMode ? 'bg-[#1e212b]' : 'bg-white',
        headerBg: darkMode ? 'bg-[#2b2d3e]' : 'bg-slate-50',
        border: darkMode ? 'border-slate-700' : 'border-slate-200',
        text: darkMode ? 'text-slate-200' : 'text-slate-700',
        textMuted: darkMode ? 'text-slate-400' : 'text-slate-400',
        itemBg: darkMode ? 'bg-[#2f3245]' : 'bg-white',
        itemHover: darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50',
        activeBg: darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50',
        activeBorder: darkMode ? 'border-indigo-500/50' : 'border-indigo-200',
        activeText: darkMode ? 'text-indigo-300' : 'text-indigo-900',
    };

    const handleStartRename = (id: string, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
    };

    const handleFinishRename = () => {
        if (editingId && onRenameLayer) {
            onRenameLayer(editingId, editName);
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleFinishRename();
        if (e.key === 'Escape') setEditingId(null);
    };

    // Note: layers is usually passed in rendering order (0=bottom, N=top). 
    // The panel displays them top-to-bottom (N..0).
    const reversedLayers = [...layers].reverse();

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedLayerId(id);
        e.dataTransfer.effectAllowed = 'move';
        // Hack to make ghost image visible
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedLayerId(null);
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedLayerId || draggedLayerId === targetId || !onReorderLayers) return;

        // Find original indices in the `layers` array (not the reversed display array)
        // logic: we are dropping 'draggedId' onto 'targetId'.
        // UX expectation: dropped item takes the position of target item? Or creates a gap?
        // Simple list reorder:
        const oldIndex = layers.findIndex(l => l.id === draggedLayerId);
        const newIndex = layers.findIndex(l => l.id === targetId);

        onReorderLayers(oldIndex, newIndex);
    };

    return (
        <div className={`flex flex-col h-full ${theme.bg}`}>
            <div className={`p-4 border-b ${theme.border} flex justify-between items-center ${theme.headerBg}`}>
                <h2 className={`font-semibold ${theme.text}`}>Layers</h2>
                <button
                    onClick={onAddLayer}
                    className="px-2 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    title="Add Layer"
                >
                    + New
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {reversedLayers.map((layer) => (
                    <div
                        key={layer.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, layer.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, layer.id)}
                        onClick={() => onSelectLayer(layer.id)}
                        className={`
                            group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border
                            ${activeLayerId === layer.id
                                ? `${theme.activeBg} ${theme.activeBorder} shadow-sm`
                                : `${theme.itemBg} border-transparent ${theme.itemHover} ${theme.border}`}
                            ${draggedLayerId === layer.id ? 'opacity-50 dashed border-2 border-slate-500' : ''}
                        `}
                    >
                        {/* Drag Handle */}
                        <span className="text-slate-500 cursor-grab active:cursor-grabbing text-xs">⋮⋮</span>

                        {/* Visibility Toggle */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleVisibility(layer.id);
                            }}
                            className={`
                                w-6 h-6 rounded flex items-center justify-center text-xs
                                ${layer.isVisible ? theme.text : 'text-slate-600'}
                            `}
                        >
                            {layer.isVisible ? '👁️' : '🚫'}
                        </button>

                        {/* Lock Toggle */}
                        {onToggleLock && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleLock(layer.id);
                                }}
                                className="w-6 h-6 rounded flex items-center justify-center text-xs text-slate-500 hover:text-slate-200"
                                title="Lock/Unlock layer"
                            >
                                {layer.isLocked ? '🔒' : '🔓'}
                            </button>
                        )}

                        {/* Layer Info */}
                        <div className="flex-1 min-w-0" onDoubleClick={() => handleStartRename(layer.id, layer.name)}>
                            {editingId === layer.id ? (
                                <input
                                    autoFocus
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onBlur={handleFinishRename}
                                    onKeyDown={handleKeyDown}
                                    className="w-full bg-slate-800 text-white text-xs px-1 py-0.5 rounded border border-indigo-500 outline-none"
                                />
                            ) : (
                                <>
                                    <div className={`font-medium text-sm truncate ${activeLayerId === layer.id ? theme.activeText : theme.text} select-none`}>
                                        {layer.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={layer.opacity}
                                            onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                        <span className={`text-[10px] ${theme.textMuted}`}>
                                            {Math.round(layer.opacity * 100)}%
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Delete Action */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLayer(layer.id);
                            }}
                            className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Delete Layer"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>

            <div className={`p-3 ${theme.headerBg} text-xs text-center ${theme.textMuted} border-t ${theme.border}`}>
                {layers.length} Layers
            </div>
        </div>
    );
};
