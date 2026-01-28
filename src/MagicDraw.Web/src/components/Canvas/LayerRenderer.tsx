import { forwardRef } from 'react';

interface LayerRendererProps {
    width: number;
    height: number;
    isVisible: boolean;
    opacity: number;
    blendMode?: string;
    filter?: string;
    zIndex: number;
}

export const LayerRenderer = forwardRef<HTMLCanvasElement, LayerRendererProps>(
    ({ width, height, isVisible, opacity, blendMode, filter, zIndex }, ref) => {
        // Handle High DPI scaling in a useEffect if needed, or assume parent handles logical/physical size.
        // For simplicity and consistency with previous DrawingCanvas, let's handle setting width/height attributes here.

        return (
            <canvas
                ref={ref}
                width={width}
                height={height}
                className="absolute top-0 left-0 touch-none"
                style={{
                    width: `${width / (window.devicePixelRatio || 1)}px`, // CSS pixels
                    height: `${height / (window.devicePixelRatio || 1)}px`,
                    visibility: isVisible ? 'visible' : 'hidden',
                    opacity: opacity,
                    mixBlendMode: blendMode ?? 'normal',
                    filter: filter ?? 'none',
                    zIndex: zIndex,
                    pointerEvents: 'none' // Important: input goes to interaction layer
                }}
            />
        );
    }
);
