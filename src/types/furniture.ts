export type FurnitureCategory = 'bed' | 'storage' | 'desk' | 'chair' | 'table' | 'bathroom' | 'kitchen';

export interface CatalogItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  defaultWidth: number; // cm
  defaultHeight: number; // cm (depth in top-down view)
  color: string;
}

export interface FurniturePlacement {
  id: string;
  roomId: string;
  catalogItemId: string;
  x: number; // position within room canvas
  y: number;
  rotation: number;
  width: number; // actual dimensions (may differ from default)
  height: number;
  customLabel?: string;
}
