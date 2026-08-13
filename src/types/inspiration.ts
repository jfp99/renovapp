export interface InspirationImage {
  id: string;
  /** IndexedDB media id — where the full-resolution image actually lives. */
  fileId?: string;
  /** Legacy inline base64. Kept optional so pre-migration projects still load. */
  fileData?: string;
  /** Small base64 preview, cheap enough to stay in localStorage. */
  thumbnailData: string;
  tags: string[];
  linkedRoomIds: string[];
  note: string;
  source?: string;
  createdAt: string;
}

export interface InspirationBoard {
  id: string;
  name: string;
  imageIds: string[];
}
