export interface Blueprint {
  id: string;
  name: string;
  description: string;
  fileType: 'image' | 'pdf';
  fileData: string; // base64 data URL
  thumbnailData: string; // base64 thumbnail
  tags: string[];
  linkedRoomIds: string[];
  annotations: Annotation[];
  createdAt: string;
}

export interface Annotation {
  id: string;
  type: 'text' | 'arrow' | 'rectangle';
  x: number;
  y: number;
  content: string;
  color: string;
  endX?: number;
  endY?: number;
  width?: number;
  height?: number;
}
