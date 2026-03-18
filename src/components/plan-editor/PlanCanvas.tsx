'use client';

import dynamic from 'next/dynamic';

const PlanCanvasClient = dynamic(() => import('./PlanCanvasClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white rounded-lg shadow-inner border border-slate-200 flex items-center justify-center">
      <div className="text-slate-400 text-sm">Chargement du canvas...</div>
    </div>
  ),
});

export default function PlanCanvas() {
  return <PlanCanvasClient />;
}
