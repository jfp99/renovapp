export interface InspirationImage {
  id: string;
  fileData: string; // base64 data URL
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
