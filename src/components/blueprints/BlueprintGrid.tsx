'use client';

import { Blueprint } from '@/types/blueprint';
import { Calendar, Tag } from 'lucide-react';

interface BlueprintGridProps {
  blueprints: Blueprint[];
  onSelectBlueprint: (blueprint: Blueprint) => void;
}

export default function BlueprintGrid({
  blueprints,
  onSelectBlueprint,
}: BlueprintGridProps) {
  if (blueprints.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No blueprints yet. Upload one to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {blueprints.map((blueprint) => (
        <button
          key={blueprint.id}
          onClick={() => onSelectBlueprint(blueprint)}
          className="text-left group"
        >
          <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square mb-3 border border-gray-200 hover:border-blue-400 transition-colors">
            <img
              src={blueprint.thumbnailData}
              alt={blueprint.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm group-hover:text-blue-600">
            {blueprint.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <Calendar className="w-3 h-3" />
            {new Date(blueprint.createdAt).toLocaleDateString()}
          </div>
          {blueprint.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {blueprint.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
              {blueprint.tags.length > 2 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{blueprint.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
