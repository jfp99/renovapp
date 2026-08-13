'use client';

import { useRef, useState } from 'react';
import { Download, Upload, Check } from 'lucide-react';
import { downloadProjectExport, importProjectExport } from '@/lib/projectData';

export default function ProjectActions() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      await downloadProjectExport();
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch (error) {
      console.error('[RenovApp] Export impossible :', error);
      alert("La sauvegarde a échoué. Consultez la console pour le détail.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setBusy(true);
      const err = await importProjectExport(reader.result as string);
      setBusy(false);
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
      <button onClick={handleExport} disabled={busy} className="btn-primary btn-sm disabled:opacity-60">
        {done ? <Check size={15} /> : <Download size={15} />}
        {busy ? 'Sauvegarde…' : done ? 'Sauvegardé' : 'Sauvegarder'}
      </button>
    </div>
  );
}
