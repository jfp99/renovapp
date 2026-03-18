'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { useCostStore } from '@/stores/costStore';
import { CostEntry } from '@/types/cost';

const CurrencySymbols: Record<string, string> = {
  PHP: '₱',
  EUR: '€',
  USD: '$',
};

export const ExportButton: React.FC = () => {
  const { entries, categories } = useCostStore();

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
  };

  const handleExport = () => {
    if (entries.length === 0) {
      alert('Aucune dépense à exporter');
      return;
    }

    // Prepare CSV headers
    const headers = [
      'Date',
      'Description',
      'Catégorie',
      'Montant',
      'Devise',
      'Fournisseur',
      'Statut',
      'Pièces liées',
    ];

    // Prepare CSV rows
    const rows = entries.map((entry: CostEntry) => [
      entry.date,
      entry.description,
      getCategoryName(entry.categoryId),
      entry.amount.toFixed(2),
      entry.currency,
      entry.vendor || '',
      getStatusLabel(entry.status),
      entry.linkedRoomIds.join(';'),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma or special chars
            const escaped = String(cell).replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('"')
              ? `"${escaped}"`
              : escaped;
          })
          .join(',')
      ),
    ].join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `renovapp-depenses-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      planned: 'Prévu',
      paid: 'Payé',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
    >
      <Download size={18} />
      Exporter (CSV)
    </button>
  );
};
