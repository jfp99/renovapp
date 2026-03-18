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
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {isDragActive ? (
          <Cloud className="w-10 h-10 text-blue-500" />
        ) : (
          <Upload className="w-10 h-10 text-gray-400" />
        )}
        <div>
          <p className="text-lg font-medium text-gray-900">
            {isDragActive
              ? 'Drop blueprints here'
              : 'Drag blueprints here or click to select'}
          </p>
          <p className="text-sm text-gray-500">
            Supports JPG, PNG, GIF, WebP
          </p>
        </div>
      </div>
    </div>
  );
}
