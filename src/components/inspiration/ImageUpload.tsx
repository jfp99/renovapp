'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Cloud, Upload } from 'lucide-react';
import { useInspirationStore } from '@/stores/inspirationStore';
import { generateThumbnail } from '@/lib/imageUtils';
import { putMediaBlob } from '@/lib/mediaDb';

export default function ImageUpload() {
  const addImage = useInspirationStore((state) => state.addImage);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          // Full-resolution file goes to IndexedDB; only the thumbnail is kept inline.
          const fileId = await putMediaBlob(file, file.name);
          const thumbnailData = await generateThumbnail(file);

          addImage({
            fileId,
            thumbnailData,
            tags: [],
            linkedRoomIds: [],
            note: '',
            source: undefined,
            createdAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }
    },
    [addImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-9 text-center transition-all ${
        isDragActive
          ? 'border-brand-500 bg-brand-50'
          : 'border-[var(--border-strong)] bg-white hover:border-brand-300 hover:bg-brand-50/30'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDragActive ? 'bg-brand-100' : 'bg-[var(--bg-app)]'}`}>
          {isDragActive ? <Cloud className="h-6 w-6 text-brand-600" /> : <Upload className="h-6 w-6 text-ink-faint" />}
        </div>
        <div>
          <p className="font-semibold text-ink">
            {isDragActive ? 'Déposez vos images ici' : 'Glissez vos images ici, ou cliquez pour parcourir'}
          </p>
          <p className="mt-0.5 text-sm text-ink-faint">Formats acceptés : JPG, PNG, GIF, WebP</p>
        </div>
      </div>
    </div>
  );
}
