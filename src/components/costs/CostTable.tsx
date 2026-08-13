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
import { Edit, Paperclip, Repeat, Trash2 } from 'lucide-react';
import { CostEntry, CostStatus } from '@/types/cost';
import { useCostStore } from '@/stores/costStore';
import { toPHP, formatPHP, formatMoney } from '@/lib/format';

interface CostTableProps {
  entries: CostEntry[];
  onEdit: (entry: CostEntry) => void;
}

const StatusBadges: Record<CostStatus, { cls: string; label: string }> = {
  planned: { cls: 'bg-amber-50 text-amber-700', label: 'Prévu' },
  paid: { cls: 'bg-emerald-50 text-emerald-700', label: 'Payé' },
  cancelled: { cls: 'bg-rose-50 text-rose-700', label: 'Annulé' },
};

const columnHelper = createColumnHelper<CostEntry>();

export const CostTable: React.FC<CostTableProps> = ({ entries, onEdit }) => {
  const { categories, removeEntry } = useCostStore();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Inconnue';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.color || '#999';
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
      cell: (info) => {
        const entry = info.row.original;
        const isTemplate = Boolean(
          entry.recurrence && entry.recurrence !== 'none' && !entry.recurrenceParentId
        );
        return (
          <div className="flex items-center gap-1.5">
            <span>{info.getValue()}</span>
            {isTemplate && (
              <span title="Dépense récurrente" className="text-brand-600">
                <Repeat size={13} />
              </span>
            )}
            {entry.recurrenceParentId && (
              <span title="Échéance générée automatiquement" className="text-ink-faint">
                <Repeat size={12} />
              </span>
            )}
            {entry.receiptFileId && (
              <span title="Reçu joint" className="text-emerald-600">
                <Paperclip size={12} />
              </span>
            )}
          </div>
        );
      },
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
        const { amount, currency, exchangeRate } = info.row.original;
        const php = toPHP(amount, currency, exchangeRate);
        return (
          <div className="font-medium text-ink">
            {formatPHP(php, { decimals: 0 })}
            {currency !== 'PHP' && (
              <span className="ml-1 text-xs font-normal text-ink-faint">({formatMoney(amount, currency, 2)})</span>
            )}
          </div>
        );
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
        return <span className={`badge ${badge.cls}`}>{badge.label}</span>;
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

  const totalPHP = filteredEntries
    .filter((e) => e.status !== 'cancelled')
    .reduce((sum, e) => sum + toPHP(e.amount, e.currency, e.exchangeRate), 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input w-auto py-2">
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto py-2">
          <option value="">Tous les statuts</option>
          <option value="planned">Prévu</option>
          <option value="paid">Payé</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full">
          <thead className="border-b border-[var(--border)] bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted hover:bg-slate-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <span className="text-[10px]">{header.column.getIsSorted() === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--border)] last:border-0 hover:bg-slate-50/60">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-3.5 text-sm text-ink-soft">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm">
        <span className="text-ink-muted">{filteredEntries.length} dépense(s) affichée(s)</span>
        <span className="font-semibold text-ink">
          Total (hors annulées) : <span className="text-brand-600">{formatPHP(totalPHP)}</span>
        </span>
      </div>
    </div>
  );
};
