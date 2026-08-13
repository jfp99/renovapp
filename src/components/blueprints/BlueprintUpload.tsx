'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Cloud, Upload } from 'lucide-react';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { generateThumbnail, fileToBase64, getBaseFilename } from '@/lib/imageUtils';

export default function BlueprintUpload() {
  const addBlueprint = useBlueprintStore((state) => state.addBlueprint);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          const fileData = await fileToBase64(file);
          const thumbnailData = await generateThumbnail(file);
          const baseName = getBaseFilename(file.name);

          addBlueprint({
            name: baseName,
            description: '',
            fileType: 'image',
            fileData,
            thumbnailData,
            tags: [],
            linkedRoomIds: [],
            annotations: [],
            createdAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to upload blueprint:', error);
        }
      }
    },
    [addBlueprint]
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
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDragActive ? 'bg-brand-100' : 'bg-slate-100'}`}>
          {isDragActive ? <Cloud className="h-6 w-6 text-brand-600" /> : <Upload className="h-6 w-6 text-ink-faint" />}
        </div>
        <div>
          <p className="font-semibold text-ink">
            {isDragActive ? 'Déposez vos blueprints ici' : 'Glissez vos blueprints ici, ou cliquez pour parcourir'}
          </p>
          <p className="mt-0.5 text-sm text-ink-faint">Formats acceptés : JPG, PNG, GIF, WebP</p>
        </div>
      </div>
    </div>
  );
}
