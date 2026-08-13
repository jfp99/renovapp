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
        <p className="text-ink-faint">Aucun blueprint pour le moment. Importez-en un pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {blueprints.map((blueprint) => (
        <button
          key={blueprint.id}
          onClick={() => onSelectBlueprint(blueprint)}
          className="group text-left"
        >
          <div className="relative mb-3 aspect-square overflow-hidden rounded-xl border border-[var(--border)] bg-slate-100 transition-all group-hover:border-brand-300 group-hover:shadow-card-hover">
            <img
              src={blueprint.thumbnailData}
              alt={blueprint.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-ink/0 transition-all group-hover:bg-ink/10" />
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink transition-colors group-hover:text-brand-600">
            {blueprint.name}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
            <Calendar className="h-3 w-3" />
            {new Date(blueprint.createdAt).toLocaleDateString('fr-FR')}
          </div>
          {blueprint.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {blueprint.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
              {blueprint.tags.length > 2 && (
                <span className="px-1.5 py-0.5 text-xs text-ink-faint">+{blueprint.tags.length - 2}</span>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
