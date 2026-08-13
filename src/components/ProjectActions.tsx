'use client';

import { useRef, useState } from 'react';
import { Download, Upload, Check } from 'lucide-react';
import { downloadProjectExport, importProjectExport } from '@/lib/projectData';

export default function ProjectActions() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [done, setDone] = useState(false);

  const handleExport = () => {
    downloadProjectExport();
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const err = importProjectExport(reader.result as string);
      if (err) {
        alert(err);
      } else {
        alert('Projet importé avec succès. La page va se recharger.');
        window.location.reload();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        onChange={handleImport}
        className="hidden"
      />
      <button onClick={() => fileRef.current?.click()} className="btn-secondary btn-sm">
        <Upload size={15} />
        Importer
      </button>
      <button onClick={handleExport} className="btn-primary btn-sm">
        {done ? <Check size={15} /> : <Download size={15} />}
        {done ? 'Sauvegardé' : 'Sauvegarder'}
      </button>
    </div>
  );
}
