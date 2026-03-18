'use client';

import { InspirationImage } from '@/types/inspiration';
import { Room } from '@/types/plan';

interface InspirationGridProps {
  images: InspirationImage[];
  rooms: Room[];
  onSelectImage: (image: InspirationImage) => void;
}

export default function InspirationGrid({
  images,
  rooms,
  onSelectImage,
}: InspirationGridProps) {
  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No inspiration images yet. Upload some to get started!</p>
      </div>
    );
  }

  return (
    <div className="columns-3 gap-4 space-y-4">
      {images.map((image) => {
        const linkedRooms = rooms.filter((r) =>
          image.linkedRoomIds.includes(r.id)
        );

        return (
          <button
            key={image.id}
            onClick={() => onSelectImage(image)}
            className="break-inside-avoid w-full"
          >
            <div className="relative group overflow-hidden rounded-lg bg-gray-100 hover:shadow-lg transition-shadow">
              <img
                src={image.thumbnailData}
                alt="Inspiration"
                className="w-full h-auto group-hover:brightness-75 transition-all"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-end p-3 opacity-0 group-hover:opacity-100">
                <div className="w-full">
                  {image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {image.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {linkedRooms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {linkedRooms.slice(0, 2).map((room) => (
                        <span
                          key={room.id}
                          className="inline-block bg-indigo-600 text-white text-xs px-2 py-1 rounded"
                        >
                          {room.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
