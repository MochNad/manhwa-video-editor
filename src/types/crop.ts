export interface ImageData {
  id: string;
  src: string;
  name: string;
  file: File;
}

export interface CropCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessData {
  image: ImageData | null;
  cropCoordinates: CropCoordinates | null;
  currentIndex: number | null;
}

export interface OutputData {
  id: string;
  image: ImageData;
  cropCoordinates: CropCoordinates;
  outputName: string;
  processedAt: Date;
  croppedImageUrl?: string;
  croppedBlob?: Blob;
}
