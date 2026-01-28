import { useRef, useState, forwardRef, useImperativeHandle, useLayoutEffect } from 'react';
import type { Layer } from '../../types/Layer';
import type { ToolType } from '../../types/Tool';
import { LayerRenderer } from './LayerRenderer';

export interface CanvasStackProps {
    width?: number;
    height?: number;
    layers: Layer[];
    activeLayerId: string;
    strokeColor: string;
    strokeWidth: number;
    tool: ToolType;
    onCommit?: () => void; // called when a stroke/shape is finished
}

export interface CanvasStackHandle {
    addImage: (dataUrl: string) => void;
    setLayerImage: (layerId: string, dataUrl: string) => void;
    exportState: () => CanvasSerializedLayer[];
    importState: (state: CanvasSerializedLayer[]) => void;
    snapshot: () => void;
}

export type CanvasSerializedLayer = {
    layerId: string;
    dataUrl: string;
};

export const CanvasStack = forwardRef<CanvasStackHandle, CanvasStackProps>(({
    width = 800,
    height = 600,
    layers,
    activeLayerId,
    strokeColor,
    strokeWidth,
    tool,
    onCommit
}, ref) => {
    // Refs to store actual canvas elements for each layer
    const layerRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
    const interactionLayerRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 }); // For shapes

    // Scale for High DPI
    const dpr = window.devicePixelRatio || 1;
    const physicalWidth = width * dpr;
    const physicalHeight = height * dpr;

    // Helper to get active context
    const getActiveContext = () => {
        const canvas = layerRefs.current.get(activeLayerId);
        if (!canvas) return null;
        return canvas.getContext('2d');
    };

    const getInteractionContext = () => {
        return interactionLayerRef.current?.getContext('2d');
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { offsetX, offsetY } = getCoordinates(e.nativeEvent);
        const x = offsetX * dpr;
        const y = offsetY * dpr;

        // Prevent draw on locked layer
        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (activeLayer?.isLocked) return;

        setStartPos({ x, y });
        setIsDrawing(true);

        if (tool === 'pencil' || tool === 'eraser' || tool === 'brush') {
            const ctx = getActiveContext();
            if (!ctx) return;

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = strokeWidth;

            if (tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.shadowBlur = 0;
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = strokeColor;

                if (tool === 'brush') {
                    // Soft Brush Effect
                    ctx.shadowBlur = strokeWidth * 0.5; // Soft edges
                    ctx.shadowColor = strokeColor;
                    // Slightly thinner actual line key to letting shadow do work
                    ctx.lineWidth = strokeWidth * 0.8;
                } else {
                    // Pencil / Hard Line
                    ctx.shadowBlur = 0;
                    ctx.lineWidth = strokeWidth;
                }
            }

            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;

        const { offsetX, offsetY } = getCoordinates(e.nativeEvent);
        const currentX = offsetX * dpr;
        const currentY = offsetY * dpr;

        if (tool === 'pencil' || tool === 'eraser' || tool === 'brush') {
            const ctx = getActiveContext();
            if (!ctx) return;
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
        } else {
            // Shape Preview on Interaction Layer
            const ctx = getInteractionContext();
            if (!ctx) return;

            // Clear previous preview
            ctx.clearRect(0, 0, physicalWidth, physicalHeight);

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = 'round'; // Match style
            ctx.setLineDash([]); // Ensure solid line

            ctx.beginPath();
            if (tool === 'rectangle') {
                ctx.rect(startPos.x, startPos.y, currentX - startPos.x, currentY - startPos.y);
            } else if (tool === 'circle') {
                const radius = Math.sqrt(Math.pow(currentX - startPos.x, 2) + Math.pow(currentY - startPos.y, 2));
                ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
            }
            ctx.stroke();
        }
    };

    const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;

        if (tool === 'pencil' || tool === 'eraser' || tool === 'brush') {
            const ctx = getActiveContext();
            if (ctx) {
                ctx.closePath();
                ctx.globalCompositeOperation = 'source-over'; // Reset
            }
        } else {
            // Commit Shape to Active Layer
            const ctx = getActiveContext();
            const previewCtx = getInteractionContext();

            if (ctx && previewCtx) {
                const { offsetX, offsetY } = getCoordinates(e.nativeEvent);
                const currentX = offsetX * dpr;
                const currentY = offsetY * dpr;

                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.lineCap = 'round';
                ctx.globalCompositeOperation = 'source-over';

                ctx.beginPath();
                if (tool === 'rectangle') {
                    ctx.rect(startPos.x, startPos.y, currentX - startPos.x, currentY - startPos.y);
                } else if (tool === 'circle') {
                    const radius = Math.sqrt(Math.pow(currentX - startPos.x, 2) + Math.pow(currentY - startPos.y, 2));
                    ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
                }
                ctx.stroke();

                // Clear preview
                previewCtx.clearRect(0, 0, physicalWidth, physicalHeight);
            }
        }
        setIsDrawing(false);
        onCommit?.();
    };

    const getCoordinates = (event: MouseEvent | TouchEvent) => {
        if (event instanceof MouseEvent) {
            return { offsetX: event.offsetX, offsetY: event.offsetY };
        }
        if (event instanceof TouchEvent && interactionLayerRef.current) {
            const rect = interactionLayerRef.current.getBoundingClientRect();
            // For touchstart/touchmove, use touches[0]. For touchend, use changedTouches[0].
            const touch = event.touches[0] || event.changedTouches[0];

            return {
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            };
        }
        return { offsetX: 0, offsetY: 0 };
    };

    // Snapshot Store
    const snapshotRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

    // Restore snapshots on resize
    useLayoutEffect(() => {
        if (snapshotRef.current.size > 0) {
            snapshotRef.current.forEach((snapshot, layerId) => {
                const canvas = layerRefs.current.get(layerId);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(snapshot, 0, 0);
                    }
                }
            });
        }
    }, [width, height]); // Run when dimensions change

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        snapshot: () => {
            snapshotRef.current.clear();
            layerRefs.current.forEach((canvas, layerId) => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                    tempCtx.drawImage(canvas, 0, 0);
                    snapshotRef.current.set(layerId, tempCanvas);
                }
            });
        },
        addImage: (dataUrl: string) => {
            const ctx = getActiveContext();
            if (!ctx) return;

            const img = new Image();
            img.onload = () => {
                // Center image
                const aspect = img.width / img.height;
                let drawWidth = physicalWidth * 0.8;
                let drawHeight = drawWidth / aspect;

                if (drawHeight > physicalHeight * 0.8) {
                    drawHeight = physicalHeight * 0.8;
                    drawWidth = drawHeight * aspect;
                }

                const x = (physicalWidth - drawWidth) / 2;
                const y = (physicalHeight - drawHeight) / 2;

                ctx.drawImage(img, x, y, drawWidth, drawHeight);
            };
            img.src = dataUrl;
        },
        setLayerImage: (layerId: string, dataUrl: string) => {
            const canvas = layerRefs.current.get(layerId);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Fill entire canvas
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = dataUrl;
        },
        exportState: () => {
            const result: CanvasSerializedLayer[] = [];
            layerRefs.current.forEach((canvas, layerId) => {
                result.push({
                    layerId,
                    dataUrl: canvas.toDataURL()
                });
            });
            return result;
        },
        importState: (state: CanvasSerializedLayer[]) => {
            state.forEach(item => {
                const canvas = layerRefs.current.get(item.layerId);
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
                img.src = item.dataUrl;
            });
        }
    }));

    return (
        <div
            className="relative bg-white overflow-hidden cursor-crosshair select-none"
            style={{ width: `${width}px`, height: `${height}px`, isolation: "isolate" }}
        >
            {/* Render Bottom-Up */}
            {layers.map((layer, index) => (
                <LayerRenderer
                    key={layer.id}
                    ref={(el) => {
                        if (el) layerRefs.current.set(layer.id, el);
                        else layerRefs.current.delete(layer.id);
                    }}
                    width={physicalWidth}
                    height={physicalHeight}
                    isVisible={layer.isVisible}
                    opacity={layer.opacity}
                    blendMode={layer.blendMode}
                    filter={layer.filter}
                    zIndex={index}
                />
            ))}

            {/* Interaction Layer (Top) */}
            <canvas
                ref={interactionLayerRef}
                width={physicalWidth}
                height={physicalHeight}
                className="absolute top-0 left-0 touch-none z-30"
                style={{
                    width: `${width}px`,
                    height: `${height}px`
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>
    );
});
