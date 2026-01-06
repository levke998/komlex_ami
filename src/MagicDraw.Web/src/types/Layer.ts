export interface Layer {
    id: string;
    name: string;
    isVisible: boolean;
    opacity: number;
    // Future: blendMode, isLocked, etc.
}
