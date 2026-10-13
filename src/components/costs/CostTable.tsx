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
import Link from 'next/link';
import { Edit, HardHat, Paperclip, Repeat, Trash2 } from 'lucide-react';
import { IS_READONLY } from '@/lib/readonly';
import { CostEntry, CostStatus } from '@/types/cost';
import { useCostStore } from '@/stores/costStore';
import { toPHP, formatPHP, formatMoney } from '@/lib/format';

interface CostTableProps {
  entries: CostEntry[];
  onEdit: (entry: CostEntry) => void;
}

const StatusBadges: Record<CostStatus, { cls: string; label: string }> = {
  planned: { cls: 'bg-accent-50 text-accent-700', label: 'Prévu' },
  paid: { cls: 'bg-pine-50 text-pine-600', label: 'Payé' },
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
            {entry.workTaskId && (
              <span title="Vient du suivi de chantier" className="text-accent-600">
                <HardHat size={13} />
              </span>
            )}
            {entry.receiptFileId && (
              <span title="Reçu joint" className="text-pine-500">
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
      cell: (info) => {
        const entry = info.row.original;
        // Owned by a Chantier task: editing it here would be overwritten the
        // next time the task is saved, so send the user to the task instead.
        if (entry.workTaskId) {
          return (
            <Link
              href={`/chantier?tache=${entry.workTaskId}`}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-1 text-xs font-medium text-accent-700 hover:bg-accent-50"
              title="Cette dépense se modifie depuis l'onglet Chantier"
            >
              <HardHat size={14} /> Chantier
            </Link>
          );
        }
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(entry)}
              className="p-1 text-blue-500 hover:bg-blue-50 rounded"
              title="Modifier"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => {
                const children = entry.recurrence && entry.recurrence !== 'none' && !entry.recurrenceParentId;
                const message = children
                  ? `Supprimer « ${entry.description} » et toutes ses échéances ?`
                  : `Supprimer « ${entry.description} » ?`;
                if (window.confirm(message)) removeEntry(entry.id);
              }}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
              title="Supprimer"
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      },
    }),
  ].filter((column) => !(IS_READONLY && column.id === 'actions'));

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

      {/* Phone: cards. The table hid the amount and status off-screen to the
          right, so on a phone the one figure that matters needed a sideways
          scroll nobody thinks of doing. */}
      <ul className="space-y-2 md:hidden">
        {table.getRowModel().rows.map((row) => {
          const entry = row.original;
          const php = toPHP(entry.amount, entry.currency, entry.exchangeRate);
          const badge = StatusBadges[entry.status];
          const actions = row.getVisibleCells().find((c) => c.column.id === 'actions');
          return (
            <li key={row.id} className="rounded-xl border border-[var(--border)] bg-white p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    <span className="truncate">{entry.description}</span>
                    {entry.workTaskId && <HardHat size={13} className="flex-none text-accent-600" />}
                    {entry.recurrenceParentId || (entry.recurrence && entry.recurrence !== 'none') ? (
                      <Repeat size={12} className="flex-none text-ink-faint" />
                    ) : null}
                    {entry.receiptFileId && <Paperclip size={12} className="flex-none text-pine-500" />}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                    <span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: getCategoryColor(entry.categoryId) }} />
                    {getCategoryName(entry.categoryId)} · {new Date(entry.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex-none text-right">
                  <p className="font-semibold tabular-nums text-ink">{formatPHP(php, { decimals: 0 })}</p>
                  <span className={`badge mt-1 ${badge.cls}`}>{badge.label}</span>
                </div>
              </div>
              {actions && (
                <div className="mt-2 flex justify-end border-t border-[var(--border)] pt-2">
                  {flexRender(actions.column.columnDef.cell, actions.getContext())}
                </div>
              )}
            </li>
          );
        })}
        {filteredEntries.length === 0 && (
          <li className="py-6 text-center text-sm text-ink-faint">Aucune dépense pour ce filtre.</li>
        )}
      </ul>

      {/* Table */}
      <div className="hidden overflow-x-auto rounded-xl border border-[var(--border)] md:block">
        <table className="w-full">
          <thead className="border-b border-[var(--border)] bg-[var(--bg-app)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted hover:bg-[var(--bg-app)]"
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
              <tr key={row.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-app)]/60">
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-4 text-sm">
        <span className="text-ink-muted">{filteredEntries.length} dépense(s) affichée(s)</span>
        <span className="font-semibold text-ink">
          Total (hors annulées) : <span className="text-brand-600">{formatPHP(totalPHP)}</span>
        </span>
      </div>
    </div>
  );
};
