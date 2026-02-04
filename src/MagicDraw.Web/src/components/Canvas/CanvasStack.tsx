import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import type { Layer } from '../../types/Layer';
import type { ToolType } from '../../types/Tool';
import type { Shape } from '../../types/Shape';
import { LayerRenderer } from './LayerRenderer';
import { isPointInShape } from '../../utils/geometry';

export interface CanvasStackProps {
    width?: number;
    height?: number;
    layers: Layer[]; // Now contains shapes
    activeLayerId: string;
    strokeColor: string;
    strokeWidth: number;
    tool: ToolType;
    onCommit?: () => void; // called when a stroke/shape is finished/modified
}

export interface CanvasStackHandle {
    addImage: (dataUrl: string) => void;
    setLayerImage: (layerId: string, dataUrl: string) => void;
    exportState: () => CanvasSerializedLayer[];
    // importState: (state: CanvasSerializedLayer[]) => void; // Deprecate or adapt? 
    snapshot: () => void;
}

export type CanvasSerializedLayer = {
    layerId: string;
    dataUrl: string;
};

export const CanvasStack = forwardRef<CanvasStackHandle, CanvasStackProps>(({
    width = 800,
    height = 600,
    layers, // NOTE: Changes to layers prop needs to trigger re-render
    activeLayerId,
    strokeColor,
    strokeWidth,
    tool,
    onCommit
}, ref) => {
    // Refs
    const layerRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
    const interactionLayerRef = useRef<HTMLCanvasElement>(null);

    // Interaction State
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Scale
    const dpr = window.devicePixelRatio || 1;
    const physicalWidth = width * dpr;
    const physicalHeight = height * dpr;

    // Helper: Render a single layer
    const renderLayer = (layer: Layer) => {
        const canvas = layerRefs.current.get(layer.id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Content Image (Legacy/Background)
        if (layer.contentDataUrl) {
            const img = new Image();
            img.src = layer.contentDataUrl;
            // Note: This is async and might flicker if not cached. 
            // Ideally we should cache these images. For now, rely on browser cache.
            // A better way is to convert contentDataUrl to an ImageShape on load.
            // But let's try to draw it if it's there.
            // ACTUALLY: re-creating Image every frame is bad. 
            // We should rely on 'shapes' for everything. 
            // If 'contentDataUrl' is present but no 'ImageShape', we might have a migration issue.
            // For this refactor, let's assume 'contentDataUrl' is strictly for save/load or legacy.
        }

        // Draw Shapes
        if (layer.shapes) {
            layer.shapes.forEach(shape => drawShape(ctx, shape));
        }

        // Draw Selection Halo (if selected shape is on this layer)
        // Only draw halo if we are in 'move' tool
        if (selectedShapeId && tool === 'move') {
            const selectedShape = layer.shapes?.find(s => s.id === selectedShapeId);
            if (selectedShape) {
                drawSelectionHalo(ctx, selectedShape);
            }
        }
    };

    const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = shape.strokeWidth; // Set width for all shapes (including eraser)

        if (shape.type === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.shadowBlur = 0;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = shape.strokeColor;
            // ctx.lineWidth = shape.strokeWidth; // Moved up
            ctx.shadowBlur = 0; // Default

            // Special handling for Brush if we want soft edges?
            // For vector, maybe property 'isSoft'?
        }

        ctx.beginPath();
        if (shape.type === 'rectangle') {
            ctx.rect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === 'circle') {
            ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
        } else if (shape.type === 'triangle') {
            ctx.moveTo(shape.x, shape.y);
            ctx.lineTo(shape.x + shape.p2.x, shape.y + shape.p2.y);
            ctx.lineTo(shape.x + shape.p3.x, shape.y + shape.p3.y);
            ctx.closePath();
        } else if (shape.type === 'path' || shape.type === 'eraser') {
            if (shape.points.length > 0) {
                ctx.moveTo(shape.x + shape.points[0].x, shape.y + shape.points[0].y);
                for (let i = 1; i < shape.points.length; i++) {
                    ctx.lineTo(shape.x + shape.points[i].x, shape.y + shape.points[i].y);
                }
            }
        } else if (shape.type === 'image') {
            // Need to handle image loading logic. 
            // For now, assume cached or efficient browser handling? 
            // In a real app we'd need an image cache map.
            // Let's implement a naive version that might flicker or be slow, 
            // OR use a global image cache outside the render loop?
            // "draw" is called often. 
            // We can use a custom property on the shape object to store the HTMLImageElement after first load.
            const imgShape = shape as any;
            if (!imgShape._img) {
                imgShape._img = new Image();
                imgShape._img.src = shape.dataUrl;
            }
            if (imgShape._img.complete) {
                ctx.drawImage(imgShape._img, shape.x, shape.y, shape.width, shape.height);
            }
        }

        if (shape.type !== 'image') {
            ctx.stroke();
        }

        ctx.globalCompositeOperation = 'source-over'; // Reset
    };

    const drawSelectionHalo = (ctx: CanvasRenderingContext2D, shape: Shape) => {
        ctx.save();
        ctx.strokeStyle = '#3b82f6'; // Blue
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        // Draw bounding box approximation
        let x = shape.x, y = shape.y, w = 0, h = 0;

        switch (shape.type) {
            case 'rectangle': w = shape.width; h = shape.height; break;
            case 'circle': x = shape.x - shape.radius; y = shape.y - shape.radius; w = shape.radius * 2; h = shape.radius * 2; break;
            case 'image': w = shape.width; h = shape.height; break;
            case 'triangle':
                // Approx bbox
                const xs = [0, shape.p2.x, shape.p3.x].map(n => n + shape.x);
                const ys = [0, shape.p2.y, shape.p3.y].map(n => n + shape.y);
                x = Math.min(...xs); y = Math.min(...ys);
                w = Math.max(...xs) - x; h = Math.max(...ys) - y;
                break;
            case 'path':
            case 'eraser':
                // Expensive to calc bbox for path every frame, but ok for now
                if (shape.points.length > 0) {
                    const xs = shape.points.map(p => p.x + shape.x);
                    const ys = shape.points.map(p => p.y + shape.y);
                    x = Math.min(...xs); y = Math.min(...ys);
                    w = Math.max(...xs) - x; h = Math.max(...ys) - y;
                }
                break;
        }

        ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
        ctx.restore();
    }

    // Effect: Re-render all layers when 'layers' prop changes
    useEffect(() => {
        layers.forEach(renderLayer);
    }, [layers, selectedShapeId, tool]); // Re-render if selection or tool changes (to show/hide halo)

    // Effect: Reset selection when tool changes
    useEffect(() => {
        if (tool !== 'move') {
            setSelectedShapeId(null);
            setCurrentShape(null); // Safety clear
        }
    }, [tool]);

    const getCoordinates = (event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        let clientX, clientY;
        if ('touches' in event) {
            const touch = event.touches[0] || event.changedTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = (event as MouseEvent).clientX;
            clientY = (event as MouseEvent).clientY;
        }

        if (interactionLayerRef.current) {
            const rect = interactionLayerRef.current.getBoundingClientRect();
            return {
                x: (clientX - rect.left) * dpr,
                y: (clientY - rect.top) * dpr
            };
        }
        return { x: 0, y: 0 };
    };

    // Interaction Handlers
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoordinates(e.nativeEvent);
        const activeLayer = layers.find(l => l.id === activeLayerId);

        if (!activeLayer || activeLayer.isLocked) return;

        setStartPos({ x, y });
        setIsDrawing(true);

        if (tool === 'move') {
            // Hit Test (Reverse order to select top-most)
            // Only check active layer for simplicity? Or checking all layers?
            // "Move" usually moves things on active layer.
            const hitShape = [...activeLayer.shapes].reverse().find(s => isPointInShape(x, y, s));

            if (hitShape) {
                setSelectedShapeId(hitShape.id);
                setDragOffset({ x: x - hitShape.x, y: y - hitShape.y });
                // We need to re-render to show selection halo
                renderLayer(activeLayer);
            } else {
                setSelectedShapeId(null);
                renderLayer(activeLayer);
            }
        } else {
            // Start creating a new shape
            const newId = crypto.randomUUID();
            let newShape: Shape | null = null;

            if (tool === 'pencil' || tool === 'brush') {
                newShape = {
                    id: newId, type: 'path', x: 0, y: 0,
                    strokeColor, strokeWidth, points: [{ x, y }]
                };
            } else if (tool === 'eraser') {
                newShape = {
                    id: newId, type: 'eraser', x: 0, y: 0,
                    strokeColor: '#000000', strokeWidth: strokeWidth * 2, points: [{ x, y }]
                };
            } else if (tool === 'rectangle') {
                newShape = { id: newId, type: 'rectangle', x, y, width: 0, height: 0, strokeColor, strokeWidth };
            } else if (tool === 'circle') {
                newShape = { id: newId, type: 'circle', x, y, radius: 0, strokeColor, strokeWidth };
            } else if (tool === 'triangle') {
                newShape = {
                    id: newId, type: 'triangle', x, y,
                    strokeColor, strokeWidth, p2: { x: 0, y: 0 }, p3: { x: 0, y: 0 }
                };
            }
            setCurrentShape(newShape);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(e.nativeEvent);
        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (!activeLayer) return;

        if (tool === 'move' && selectedShapeId) {
            // Mutate the shape in the layer directly? 
            // NO, props are immutable. We must update state in Parent.
            // BUT, calling parent 'setLayers' on every mouse move is expensive (Re-React-Render).
            // OPTIMIZATION: Mutate a local copy or ref, then commit on mouse up?
            // Or mutate the object (since objects are ref types) and force a canvas re-render.
            // Javascript objects in the array are references. 
            // If we modify `activeLayer.shapes.find(...)`, we modify the object in place.
            // This doesn't trigger React re-render (good), but we MUST manually call `renderLayer`.

            const shape = activeLayer.shapes.find(s => s.id === selectedShapeId);
            if (shape) {
                shape.x = x - dragOffset.x;
                shape.y = y - dragOffset.y;
                renderLayer(activeLayer);
            }
        } else if (currentShape) {
            // Update current shape geometry
            const updated = { ...currentShape };

            if (updated.type === 'path' || updated.type === 'eraser') {
                updated.points.push({ x, y });
            } else if (updated.type === 'rectangle') {
                updated.width = x - startPos.x;
                updated.height = y - startPos.y;
            } else if (updated.type === 'circle') {
                updated.radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
            } else if (updated.type === 'triangle') {
                // Isosceles-ish triangle preview
                // p1 is startPos (top/center). We drag base.
                // Or standard drag: startPos is p1.
                updated.p2 = { x: (x - startPos.x) / 2, y: y - startPos.y }; // logic from previous impl?
                // Wait, previous logic: "ctx.moveTo(startPos.x + (currentX - startPos.x) / 2, startPos.y);"
                // That logic meant startPos and currentX defined the BASE? 

                // Let's implement: Click (Top), Drag to (Bottom Right)
                // Shape X,Y is Top Point.
                // P2 is Bottom Left relative. P3 is Bottom Right relative.
                const dx = x - startPos.x;
                const dy = y - startPos.y;
                updated.p2 = { x: dx - (dx / 2), y: dy }; // Bottom 'Left' (shifted)
                updated.p3 = { x: dx, y: dy }; // Bottom Right

                // Actually, let's simplify:
                // Point 1: startPos.
                // Point 2: (startPos.x, currentY)
                // Point 3: (currentX, currentY)
                // This makes a Right Triangle.

                // User wants standard triangle.
                // Let's stick to: StartPos = Top Vertex.
                // Drag = Height/Width.
                updated.p2 = { x: -(x - startPos.x), y: y - startPos.y }; // Symmetric?
                updated.p3 = { x: x - startPos.x, y: y - startPos.y };
            }

            setCurrentShape(updated);

            // Render "Phantom" shape on Interaction Layer
            const ctx = interactionLayerRef.current?.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, physicalWidth, physicalHeight);
                drawShape(ctx, updated);
            }
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        setCurrentShape(null);

        // Clear interaction layer
        const ctx = interactionLayerRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, physicalWidth, physicalHeight);

        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (!activeLayer) return;

        if (tool === 'move') {
            // We modified the shape in-place during drag.
            // Now we must Notify Parent to persist this change (and trigger React update)
            // We can just call onCommit();
            onCommit?.();
        } else if (currentShape) {
            // Add new shape to layer
            // Again, mutating the array in place then calling onCommit?
            // "layers" prop is likely immutable from Parent's perspective (state).
            // We should ideally pass the NEW shape up to parent.
            // BUT: onCommit is void. 
            // AND: We can't modify props.

            // HACK/PATTERN: We modify the 'shapes' array strictly because it's a reference type
            // and then tell Parent to "update" its state with this modified array.
            // This relies on `layers` structure being mutable deep down.
            // Better: activeLayer.shapes.push(currentShape); onCommit();

            activeLayer.shapes.push(currentShape);
            renderLayer(activeLayer); // Draw it permanently on the layer canvas
            onCommit?.();
        }
    };

    // Imperative Handle
    useImperativeHandle(ref, () => ({
        snapshot: () => {
            // No-op or save logical state? 
            // State is in 'shapes', so we don't need pixel snapshotting!
            // Vector is awesome.
        },
        addImage: (dataUrl: string) => {
            const activeLayer = layers.find(l => l.id === activeLayerId);
            if (!activeLayer) return;

            const img = new Image();
            img.onload = () => {
                const shape: Shape = {
                    id: crypto.randomUUID(),
                    type: 'image',
                    x: (physicalWidth - img.width) / 2, // Center roughly? Or scale?
                    y: (physicalHeight - img.height) / 2,
                    width: img.width, // Limit max size?
                    height: img.height,
                    dataUrl: dataUrl,
                    strokeColor: '',
                    strokeWidth: 0
                };

                // Scale down if huge
                if (shape.width > physicalWidth * 0.8) {
                    const scale = (physicalWidth * 0.8) / shape.width;
                    shape.width *= scale;
                    shape.height *= scale;
                    shape.x = (physicalWidth - shape.width) / 2;
                    shape.y = (physicalHeight - shape.height) / 2;
                }

                activeLayer.shapes.push(shape);
                renderLayer(activeLayer);
                onCommit?.();
            };
            img.src = dataUrl;
        },
        setLayerImage: (layerId: string, dataUrl: string) => {
            // For Load: convert to Image Shape
            const layer = layers.find(l => l.id === layerId);
            if (!layer) return;

            // Clear existing shapes? Or just append?
            // "setLayerImage" implies replacing content.
            layer.shapes = []; // Clear

            const img = new Image();
            img.onload = () => {
                const shape: Shape = {
                    id: crypto.randomUUID(), type: 'image',
                    x: 0, y: 0, width: physicalWidth, height: physicalHeight, // Stretch?
                    dataUrl: dataUrl, strokeColor: '', strokeWidth: 0
                };
                // Try to keep aspect ratio if possible, but old logic "filled canvas".
                // Let's stick to fill for background compatibility.
                layer.shapes.push(shape);
                renderLayer(layer);
                // onCommit?
            };
            img.src = dataUrl;
        },
        exportState: () => {
            // Rasterize to DataURLs for saving (Backwards compat with backend)
            // Iterate layers, return canvas.toDataURL()
            const result: CanvasSerializedLayer[] = [];
            layerRefs.current.forEach((canvas, layerId) => {
                result.push({
                    layerId,
                    dataUrl: canvas.toDataURL()
                });
            });
            return result;
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
                        if (el) {
                            layerRefs.current.set(layer.id, el);
                            // Initial render of this layer
                            renderLayer(layer);
                        } else {
                            layerRefs.current.delete(layer.id);
                        }
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
