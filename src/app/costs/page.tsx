'use client';

import React, { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { useCostStore } from '@/stores/costStore';
import { CostForm } from '@/components/costs/CostForm';
import { CostTable } from '@/components/costs/CostTable';
import { BudgetOverview } from '@/components/costs/BudgetOverview';
import { ROICalculator } from '@/components/costs/ROICalculator';
import { ExportButton } from '@/components/costs/ExportButton';
import { CategoryEditor } from '@/components/costs/CategoryEditor';
import { CostEntry } from '@/types/cost';

type TabType = 'expenses' | 'budget' | 'roi';

export default function CostsPage() {
  const { entries } = useCostStore();
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
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Suivi des Coûts & ROI
          </h1>
          <p className="text-gray-600">
            Gérez vos dépenses de rénovation et calculez votre retour sur
            investissement
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Dépenses Tab */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Toutes les dépenses
                </h2>
                <div className="flex gap-4">
                  <ExportButton />
                  <button
                    onClick={() => setIsCostFormOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    <Plus size={18} />
                    Ajouter une dépense
                  </button>
                </div>
              </div>

              {entries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-4">
                    Aucune dépense enregistrée
                  </p>
                  <button
                    onClick={() => setIsCostFormOpen(true)}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Ajouter la première dépense
                  </button>
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Aperçu du Budget
                  </h2>
                  <BudgetOverview />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Gestion des Catégories
                  </h2>
                  <CategoryEditor />
                </div>
              </div>
            </div>
          )}

          {/* ROI Tab */}
          {activeTab === 'roi' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Analyse du Retour sur Investissement
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
