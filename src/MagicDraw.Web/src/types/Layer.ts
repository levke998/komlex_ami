export interface Layer {
    id: string;
    name: string;
    isVisible: boolean;
    opacity: number;
    isLocked?: boolean;
    blendMode?: string;
    filter?: string;
    contentDataUrl?: string; // for save/load
}
