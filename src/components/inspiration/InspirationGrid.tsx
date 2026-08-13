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
        <p className="text-ink-faint">Aucune image d&apos;inspiration. Importez-en pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="columns-2 gap-4 space-y-4 sm:columns-3 lg:columns-4">
      {images.map((image) => {
        const linkedRooms = rooms.filter((r) => image.linkedRoomIds.includes(r.id));

        return (
          <button
            key={image.id}
            onClick={() => onSelectImage(image)}
            className="block w-full break-inside-avoid"
          >
            <div className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-slate-100 transition-all hover:shadow-card-hover">
              <img
                src={image.thumbnailData}
                alt="Inspiration"
                className="h-auto w-full transition-all duration-300 group-hover:brightness-75"
              />

              <div className="absolute inset-0 flex items-end bg-ink/0 p-3 opacity-0 transition-all group-hover:bg-ink/30 group-hover:opacity-100">
                <div className="w-full">
                  {image.tags.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {image.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-block rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-ink">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {linkedRooms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {linkedRooms.slice(0, 2).map((room) => (
                        <span key={room.id} className="inline-block rounded bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
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
