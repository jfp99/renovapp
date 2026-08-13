export interface Blueprint {
  id: string;
  name: string;
  description: string;
  fileType: 'image' | 'pdf';
  /** IndexedDB media id — where the full-resolution file actually lives. */
  fileId?: string;
  /** Legacy inline base64. Kept optional so pre-migration projects still load. */
  fileData?: string;
  /** Small base64 preview, cheap enough to stay in localStorage. */
  thumbnailData: string;
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
