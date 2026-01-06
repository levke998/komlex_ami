import React, { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
    width?: number;
    height?: number;
    strokeColor?: string;
    strokeWidth?: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    width = 800,
    height = 600,
    strokeColor = '#000000',
    strokeWidth = 3
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.lineCap = 'round';
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            contextRef.current = ctx;
        }
    }, [width, height]);

    // Update Context when props change
    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = strokeColor;
            contextRef.current.lineWidth = strokeWidth;
        }
    }, [strokeColor, strokeWidth]);

    const startDrawing = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        if (contextRef.current) {
            contextRef.current.beginPath();
            contextRef.current.moveTo(offsetX, offsetY);
            setIsDrawing(true);
        }
    };

    const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !contextRef.current) return;
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const stopDrawing = () => {
        if (contextRef.current) {
            contextRef.current.closePath();
        }
        setIsDrawing(false);
    };

    const getCoordinates = (event: MouseEvent | TouchEvent) => {
        // Simple Mouse Event
        if (event instanceof MouseEvent) {
            return { offsetX: event.offsetX, offsetY: event.offsetY };
        }
        // Touch Event requires calculation relative to rect
        if (event instanceof TouchEvent && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const touch = event.touches[0];
            return {
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            };
        }
        return { offsetX: 0, offsetY: 0 };
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="border border-base-300 shadow-lg rounded-lg bg-white cursor-crosshair touch-none"
        />
    );
};
