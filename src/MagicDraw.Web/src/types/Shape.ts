
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'path' | 'eraser' | 'image';

export interface BaseShape {
    id: string;
    type: ShapeType;
    x: number;
    y: number;
    rotation?: number; // In radians
    strokeColor: string;
    strokeWidth: number;
}

export interface RectangleShape extends BaseShape {
    type: 'rectangle';
    width: number;
    height: number;
}

export interface CircleShape extends BaseShape {
    type: 'circle';
    radius: number;
}

export interface TriangleShape extends BaseShape {
    type: 'triangle';
    p2: { x: number, y: number }; // Relative to x,y (p1 is 0,0)
    p3: { x: number, y: number }; // Relative to x,y
}

export interface PathShape extends BaseShape {
    type: 'path' | 'eraser';
    points: { x: number, y: number }[]; // Relative to x,y
}

export interface ImageShape extends BaseShape {
    type: 'image';
    dataUrl: string;
    width: number;
    height: number;
}

export type Shape = RectangleShape | CircleShape | TriangleShape | PathShape | ImageShape;
