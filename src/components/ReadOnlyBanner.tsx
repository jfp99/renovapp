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
  if (!IS_READONLY) return null;

  return (
    <div className="border-b border-brand-600/20 bg-brand-50 px-4 py-2 text-center md:pl-[276px]">
      <p className="inline-flex items-center gap-2 text-[12.5px] leading-snug text-brand-800">
        <Eye className="h-4 w-4 flex-none" />
        <span>
          Copie de consultation — les chiffres sont ceux du projet, rien ne peut être modifié ici.
        </span>
      </p>
    </div>
  );
}
