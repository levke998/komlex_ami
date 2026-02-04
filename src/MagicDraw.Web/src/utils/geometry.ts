
import type { Shape } from '../types/Shape';

export const isPointInShape = (x: number, y: number, shape: Shape): boolean => {
    switch (shape.type) {
        case 'rectangle':
            return x >= shape.x && x <= shape.x + shape.width &&
                y >= shape.y && y <= shape.y + shape.height;

        case 'circle':
            const dx = x - shape.x;
            const dy = y - shape.y;
            return Math.sqrt(dx * dx + dy * dy) <= shape.radius;

        case 'triangle':
            // Barycentric coordinate system approach or simple area validation
            // const p1 = { x: shape.x, y: shape.y }; // Unused
            // Wait, triangle shape def says p2, p3 are relative to x,y.
            // But implementation in CanvasStack uses a bounding box drag to define it.
            // Let's assume standard definitions:
            // x,y is usually top-left of bounding box or the first point.
            // Let's stick to the definition: "p2: {x,y}, p3: {x,y} relative to shape.x, shape.y"

            // Absolute points
            const ax = shape.x;
            const ay = shape.y;
            const bx = shape.x + shape.p2.x;
            const by = shape.y + shape.p2.y;
            const cx = shape.x + shape.p3.x;
            const cy = shape.y + shape.p3.y;

            // Compute area of the triangle
            const areaOrig = Math.abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay));

            // Compute area of 3 sub-triangles formed with point P(x,y)
            const area1 = Math.abs((ax - x) * (by - y) - (bx - x) * (ay - y));
            const area2 = Math.abs((bx - x) * (cy - y) - (cx - x) * (by - y));
            const area3 = Math.abs((cx - x) * (ay - y) - (ax - x) * (cy - y));

            // Check if sum of areas equals original area (with small epsilon for float errors)
            return Math.abs(area1 + area2 + area3 - areaOrig) < 0.1;

        case 'path':
        case 'eraser':
            // Hit test for line strokes. Check if point is close to any segment.
            // Points are relative to shape.x, shape.y

            // Optimization: Bounding box check first
            // (We should store bounding box on the shape to avoid recomputing, but for now iterate)

            // Check proximity to any segment
            const threshold = (shape.strokeWidth / 2) + 5; // Hit tolerance

            const px = x - shape.x;
            const py = y - shape.y;

            if (shape.points.length < 2) return false;

            for (let i = 0; i < shape.points.length - 1; i++) {
                const start = shape.points[i];
                const end = shape.points[i + 1];
                if (distanceToSegment(px, py, start.x, start.y, end.x, end.y) <= threshold) {
                    return true;
                }
            }
            return false;

        default:
            return false;
    }
};

const distanceToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) // in case of 0 length line
        param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }
    else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
};
