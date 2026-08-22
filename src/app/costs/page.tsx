'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Plus, TrendingUp } from 'lucide-react';
import { useCostStore } from '@/stores/costStore';
import { CostForm } from '@/components/costs/CostForm';
import { CostTable } from '@/components/costs/CostTable';
import { BudgetOverview } from '@/components/costs/BudgetOverview';
import { ROICalculator } from '@/components/costs/ROICalculator';
import { ROIProjection } from '@/components/costs/ROIProjection';
import { ExportButton } from '@/components/costs/ExportButton';
import { CategoryEditor } from '@/components/costs/CategoryEditor';
import { CostEntry } from '@/types/cost';
import { IS_READONLY } from '@/lib/readonly';

type TabType = 'expenses' | 'budget' | 'roi' | 'projection';

export default function CostsPage() {
  const { entries } = useCostStore();
  const materializeRecurrences = useCostStore((s) => s.materializeRecurrences);
  const [generated, setGenerated] = useState(0);

  // Recurring charges (rent, internet, salary) shouldn't need re-typing every
  // month. Instalments are created as 'planned' — never marked paid for you.
  useEffect(() => {
    const count = materializeRecurrences();
    if (count > 0) {
      setGenerated(count);
      const timer = window.setTimeout(() => setGenerated(0), 8000);
      return () => window.clearTimeout(timer);
    }
  }, [materializeRecurrences]);
  const [activeTab, setActiveTab] = useState<TabType>('expenses');
  const [isCostFormOpen, setIsCostFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CostEntry | undefined>();

  const handleEditEntry = (entry: CostEntry) => {
    setEditingEntry(entry);
    setIsCostFormOpen(true);
  };

  const handleCloseCostForm = () => {
    setIsCostFormOpen(false);
    setEditingEntry(undefined);
  };

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'expenses', label: 'Dépenses', icon: null },
    { id: 'budget', label: 'Budget', icon: null },
    { id: 'roi', label: 'ROI', icon: <TrendingUp size={18} /> },
    { id: 'projection', label: 'Projection', icon: <LineChart size={18} /> },
  ];

  return (
    <main className="min-h-screen">
      <div className="bg-mesh border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Finances du projet</p>
          <h1 className="mt-1 text-3xl font-bold text-ink tracking-tight">Coûts &amp; rentabilité</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Suivez vos dépenses en pesos (₱) et estimez le retour sur investissement de votre location.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {/* Tabs */}
        {/* -mx-4 px-4 : la barre defile sous les bords de la carte au lieu
            d'etre coupee ; snap pour qu'un onglet ne reste pas a moitie visible. */}
        <div className="mb-7 -mx-4 flex snap-x snap-mandatory gap-1 overflow-x-auto border-b border-[var(--border)] px-4 [scrollbar-width:none] [&::-webkit-scrollbar]{display:none} md:mx-0 md:overflow-visible md:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px flex flex-none snap-start items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors md:px-5 ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-ink-muted hover:text-ink-soft'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card p-4 md:p-6">
          {/* Dépenses Tab */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  Toutes les dépenses
                </h2>
                <div className="flex gap-2 sm:gap-3">
                  <ExportButton />
                  {!IS_READONLY && (
                    <button onClick={() => setIsCostFormOpen(true)} className="btn-primary btn-sm">
                      <Plus size={16} />
                      Ajouter une dépense
                    </button>
                  )}
                </div>
              </div>

              {generated > 0 && (
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
                  {generated} échéance{generated > 1 ? 's' : ''} récurrente
                  {generated > 1 ? 's' : ''} ajoutée{generated > 1 ? 's' : ''} en statut
                  &laquo;&nbsp;prévu&nbsp;&raquo;. Passez-les en &laquo;&nbsp;payé&nbsp;&raquo; une
                  fois réglées.
                </div>
              )}

              {entries.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="mb-4 text-ink-muted">Aucune dépense enregistrée</p>
                  {!IS_READONLY && (
                    <button onClick={() => setIsCostFormOpen(true)} className="btn-primary">
                      <Plus size={16} /> Ajouter la première dépense
                    </button>
                  )}
                </div>
              ) : (
                <CostTable
                  entries={entries}
                  onEdit={handleEditEntry}
                />
              )}
            </div>
          )}

          {/* Budget Tab */}
          {activeTab === 'budget' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-lg font-semibold text-ink mb-5">
                    Aperçu du Budget
                  </h2>
                  <BudgetOverview />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink mb-5">
                    Gestion des Catégories
                  </h2>
                  <CategoryEditor />
                </div>
              </div>
            </div>
          )}

          {/* Projection Tab */}
          {activeTab === 'projection' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-ink">Projection sur plusieurs années</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Trésorerie mois par mois, saisonnalité, montée en charge et sensibilité.
                </p>
              </div>
              <ROIProjection />
            </div>
          )}

          {/* ROI Tab */}
          {activeTab === 'roi' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-ink">
                Analyse du retour sur investissement
              </h2>
              <ROICalculator />
            </div>
          )}
        </div>
      </div>

      {/* Cost Form Modal */}
      <CostForm
        isOpen={isCostFormOpen}
        onClose={handleCloseCostForm}
        editingEntry={editingEntry}
      />
    </main>
  );
}
