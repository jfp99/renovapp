'use client';

import React, { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Trash2, Edit } from 'lucide-react';
import { CostEntry, CostStatus } from '@/types/cost';
import { useCostStore } from '@/stores/costStore';

interface CostTableProps {
  entries: CostEntry[];
  onEdit: (entry: CostEntry) => void;
}

const CurrencySymbols: Record<string, string> = {
  PHP: '₱',
  EUR: '€',
  USD: '$',
};

const StatusBadges: Record<CostStatus, { bg: string; text: string; label: string }> = {
  planned: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Prévu' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Payé' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulé' },
};

const columnHelper = createColumnHelper<CostEntry>();

export const CostTable: React.FC<CostTableProps> = ({ entries, onEdit }) => {
  const { categories, removeEntry } = useCostStore();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.color || '#999';
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${CurrencySymbols[currency] || currency} ${amount.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const columns = [
    columnHelper.accessor('date', {
      header: 'Date',
      cell: (info) => {
        const date = new Date(info.getValue());
        return date.toLocaleDateString('fr-FR');
      },
      sortingFn: 'datetime',
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('categoryId', {
      header: 'Catégorie',
      cell: (info) => {
        const categoryId = info.getValue();
        const color = getCategoryColor(categoryId);
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{getCategoryName(categoryId)}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('amount', {
      header: 'Montant',
      cell: (info) => {
        const amount = info.row.original.amount;
        const currency = info.row.original.currency;
        return formatAmount(amount, currency);
      },
      sortingFn: (rowA, rowB) => {
        const amountA = rowA.original.amount;
        const amountB = rowB.original.amount;
        return amountA < amountB ? -1 : amountA > amountB ? 1 : 0;
      },
    }),
    columnHelper.accessor('status', {
      header: 'Statut',
      cell: (info) => {
        const status = info.getValue() as CostStatus;
        const badge = StatusBadges[status];
        return (
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}
          >
            {badge.label}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(info.row.original)}
            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
            title="Modifier"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => removeEntry(info.row.original.id)}
            className="p-1 text-red-500 hover:bg-red-50 rounded"
            title="Supprimer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    }),
  ];

  // Apply filters
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (categoryFilter && entry.categoryId !== categoryFilter) return false;
      if (statusFilter && entry.status !== statusFilter) return false;
      return true;
    });
  }, [entries, categoryFilter, statusFilter]);

  const table = useReactTable({
    data: filteredEntries,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="planned">Prévu</option>
          <option value="paid">Payé</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        <span className="text-xs">
                          {header.column.getIsSorted() === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex justify-end pt-4 border-t">
        <div className="text-lg font-semibold text-gray-700">
          Total: <span className="text-blue-600">{filteredEntries.length} entrées</span>
        </div>
      </div>
    </div>
  );
};
