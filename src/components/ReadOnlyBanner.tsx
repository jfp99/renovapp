'use client';

import { useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import { IS_READONLY } from '@/lib/readonly';

/**
 * Says out loud that this copy cannot be changed.
 *
 * Without it a reader assumes the missing buttons are a bug, or worse, types
 * into a field and believes it was recorded. Silence about a restriction is
 * how people lose trust in an app.
 */
export default function ReadOnlyBanner() {
  const ref = useRef<HTMLDivElement>(null);

  // Full-height screens (plan, furniture) subtract --banner-h; without it the
  // banner pushed the bottom of the plan ~40 px below the screen edge.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty('--banner-h', `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--banner-h');
    };
  }, []);

  if (!IS_READONLY) return null;

  return (
    <div ref={ref} className="border-b border-brand-600/20 bg-brand-50 px-4 py-2 text-center md:pl-[276px]">
      <p className="inline-flex items-center gap-2 text-[12.5px] leading-snug text-brand-800">
        <Eye className="h-4 w-4 flex-none" />
        <span>
          Copie de consultation — les chiffres sont ceux du projet, rien ne peut être modifié ici.
        </span>
      </p>
    </div>
  );
}
