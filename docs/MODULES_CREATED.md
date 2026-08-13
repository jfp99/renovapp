# Blueprint Vault & Inspiration Board Modules

This document outlines the complete module implementations for the Next.js renovation app.

## Overview

Two complete feature modules have been created:

1. **Blueprint Vault** - Upload, manage, and annotate floor plans and design blueprints
2. **Inspiration Board** - Collect and organize inspiration images for renovation projects

All components use TypeScript/React with 'use client' directive for client-side functionality.

---

## Files Created

### Blueprint Vault Module

#### App Pages
- **`/src/app/blueprints/page.tsx`** (160 lines)
  - Main page with grid view and detail view modes
  - Upload area using BlueprintUpload component
  - Filter interface: by tags and by linked rooms
  - Grid display showing all blueprints
  - Detail modal when blueprint is selected

#### Components
- **`/src/components/blueprints/BlueprintUpload.tsx`** (75 lines)
  - React Dropzone integration for drag-and-drop file upload
  - Accepts image files (JPG, PNG, GIF, WebP)
  - Converts files to base64 and generates thumbnails
  - Stores blueprints in useBlueprintStore
  - Color-coded UI for drag states

- **`/src/components/blueprints/BlueprintGrid.tsx`** (68 lines)
  - 3-column grid layout
  - Card displays: thumbnail, name, date, tag badges
  - Hover effects and zoom on image
  - Click handler to open detail view
  - Empty state message

- **`/src/components/blueprints/BlueprintDetail.tsx`** (281 lines)
  - Full-screen modal overlay
  - Image viewer with zoom controls (0.5x to 2.5x)
  - Editable fields: name, description
  - Tag management: add with Enter key, remove with X button
  - Multi-select room linking (from usePlanStore)
  - Annotations display list
  - Delete confirmation
  - Save/Cancel buttons

### Inspiration Board Module

#### App Pages
- **`/src/app/inspiration/page.tsx`** (163 lines)
  - Main page with upload area
  - Filter interface: by tags and by linked rooms
  - Masonry-style grid display (CSS columns)
  - Image detail modal when image is selected
  - Results counter showing filtered vs total images

#### Components
- **`/src/components/inspiration/ImageUpload.tsx`** (72 lines)
  - React Dropzone for drag-and-drop
  - Same file acceptance as blueprints
  - Base64 conversion and thumbnail generation
  - Stores images in useInspirationStore
  - Purple-themed UI for distinction

- **`/src/components/inspiration/InspirationGrid.tsx`** (80 lines)
  - CSS columns-3 masonry layout with gap-4
  - Image hover overlay with:
    - Tag badges (first 3)
    - Linked room badges
    - Brightness reduction on hover
  - Click handler to open detail modal
  - Empty state message

- **`/src/components/inspiration/ImageDetailModal.tsx`** (222 lines)
  - Full-screen modal overlay
  - Large image display
  - Editable fields:
    - Note (textarea)
    - Tags (with Enter to add, × to remove)
    - Source URL (input field)
    - Linked rooms (multi-select checkboxes)
  - Delete confirmation
  - Save/Cancel buttons
  - Purple-themed button colors

### Utility Functions

- **`/src/lib/imageUtils.ts`** (65 lines)
  - `generateThumbnail(file)`: Creates max 300px wide thumbnail via canvas
  - `fileToBase64(file)`: Converts file to base64 data URL
  - `getFileExtension(filename)`: Extracts file extension
  - `getBaseFilename(filename)`: Gets filename without extension

---

## Features

### Blueprint Vault Features

- **Upload Management**
  - Drag-and-drop file upload
  - Image format support (JPG, PNG, GIF, WebP)
  - Automatic thumbnail generation
  - Default name from filename

- **Viewing & Organization**
  - Grid view (3 columns)
  - Detail view with full image
  - Zoom controls (0.5x - 2.5x)
  - Tag display and management
  - Room linking for context

- **Filtering**
  - Filter by tags (multi-select)
  - Filter by linked room (single select)
  - Clear filters button
  - Results counter

- **Editing**
  - Edit name and description
  - Manage tags (add/remove)
  - Link/unlink rooms
  - View annotations (read-only)
  - Delete with confirmation

### Inspiration Board Features

- **Upload Management**
  - Drag-and-drop file upload
  - Same format support as blueprints
  - Automatic thumbnail generation

- **Viewing & Organization**
  - Masonry grid layout (CSS columns)
  - Hover overlays showing tags and rooms
  - Click to open detail modal

- **Filtering**
  - Filter by tags (multi-select)
  - Filter by linked room (single select)
  - Clear filters button
  - Results counter

- **Editing**
  - Add/edit notes (textarea)
  - Manage tags (add/remove)
  - Link/unlink rooms
  - Add source URL
  - Delete with confirmation

---

## Store Integration

### Blueprint Store (`@/stores/blueprintStore`)

```typescript
useBlueprintStore provides:
- blueprints: Blueprint[]
- addBlueprint(blueprint)
- updateBlueprint(id, updates)
- removeBlueprint(id)
- getBlueprintsByRoom(roomId)
```

### Inspiration Store (`@/stores/inspirationStore`)

```typescript
useInspirationStore provides:
- images: InspirationImage[]
- boards: InspirationBoard[]
- addImage(image)
- removeImage(id)
- updateImage(id, updates)
- addBoard(name)
- removeBoard(id)
- addImageToBoard(boardId, imageId)
```

### Plan Store (`@/stores/planStore`)

```typescript
usePlanStore provides:
- rooms: Room[]
- (other planning functionality)
```

---

## Type Definitions

### Blueprint
```typescript
{
  id: string
  name: string
  description: string
  fileType: 'image' | 'pdf'
  fileData: string (base64)
  thumbnailData: string (base64)
  tags: string[]
  linkedRoomIds: string[]
  annotations: Annotation[]
  createdAt: string
}
```

### Annotation
```typescript
{
  id: string
  type: 'text' | 'arrow' | 'rectangle'
  x: number
  y: number
  content: string
  color: string
  endX?: number
  endY?: number
  width?: number
  height?: number
}
```

### InspirationImage
```typescript
{
  id: string
  fileData: string (base64)
  thumbnailData: string (base64)
  tags: string[]
  linkedRoomIds: string[]
  note: string
  source?: string
  createdAt: string
}
```

---

## Styling

- **Tailwind CSS** for all styling
- **Lucide React** icons throughout:
  - Upload, Cloud (for upload areas)
  - Calendar, Tag (for metadata)
  - ZoomIn, ZoomOut (for blueprint zoom)
  - Trash2 (for delete)
  - Filter (for filters section)
  - X (for close/clear)

- **Color schemes**:
  - Blueprint: Blue accent colors
  - Inspiration: Purple accent colors
  - Neutral grays for backgrounds

---

## Usage

### Accessing Blueprint Vault
```
/blueprints
```

### Accessing Inspiration Board
```
/inspiration
```

Both pages are fully client-side rendered with `'use client'` directive.

---

## Key Implementation Details

### Thumbnail Generation
- Uses HTML5 Canvas API
- Resizes images to max 300px width
- Maintains aspect ratio
- Exports as JPEG 0.8 quality
- All async operations

### File Handling
- FileReader API for base64 conversion
- All files stored as base64 strings
- No external storage required
- Zustand persists to localStorage

### UI/UX
- Drag-and-drop visual feedback
- Modal overlays for detail views
- Keyboard support (Enter for tag input)
- Confirmation dialogs for destructive actions
- Empty state messages
- Loading states on images

### Form Management
- Simple controlled inputs
- Tag input with Enter key submission
- Multi-select checkboxes for rooms
- Textarea for notes and descriptions
- Trim input on submission

---

## Dependencies

All dependencies already included in `package.json`:

- `react` ^18.3.1
- `react-dom` ^18.3.1
- `next` ^14.2.21
- `zustand` (via existing stores)
- `react-dropzone` ^15.0.0
- `lucide-react` ^0.577.0
- `tailwindcss` ^3.4.17
- `typescript` ^5.9.3

No additional installations required.

---

## Best Practices Applied

1. ✓ All components marked with `'use client'`
2. ✓ Proper TypeScript types throughout
3. ✓ Error handling in async operations
4. ✓ Confirmation dialogs for deletions
5. ✓ Responsive grid layouts
6. ✓ Accessible form controls
7. ✓ Consistent color theming
8. ✓ Hover/focus states
9. ✓ Empty state messaging
10. ✓ Loading and transition states

---

## Future Enhancement Possibilities

- Annotation tools (currently read-only)
- Board management interface
- Bulk operations
- Image comparison tools
- Search functionality
- Export/share capabilities
- Version history
- Collaboration features

---

Created: March 18, 2026
