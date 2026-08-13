'use client';

import Link from 'next/link';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  Home,
  Sofa,
  FileImage,
  Camera,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  PencilRuler,
  Layers,
  Target,
} from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';
import { useFurnitureStore } from '@/stores/furnitureStore';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { useInspirationStore } from '@/stores/inspirationStore';
import { useCostStore } from '@/stores/costStore';
import { useHydrated } from '@/lib/useHydrated';
import { formatPHP, formatPct, formatMonths, areaM2 } from '@/lib/format';
import {
  computeRoomCompletion,
  ROOM_TYPE_LABELS,
  ROOM_ACCENT,
} from '@/lib/rooms';
import ProjectActions from '@/components/ProjectActions';

function StatCard({
  title,
  value,
  sub,
  icon,
  tint,
  href,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  tint: string;
  href: string;
}) {
  return (
    <Link href={href} className="card-hover p-5 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-muted">{title}</p>
          <p className="mt-1.5 text-3xl font-bold text-ink tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-xs text-ink-faint">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
        Ouvrir <ArrowUpRight size={13} />
      </div>
    </Link>
  );
}

function Milestone({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
        done ? 'text-emerald-600' : 'text-ink-faint'
      }`}
    >
      {done ? <CheckCircle2 size={13} /> : <Circle size={13} />}
      {label}
    </span>
  );
}

export default function Dashboard() {
  const hydrated = useHydrated();
  const { rooms, floors } = usePlanStore();
  const { placements } = useFurnitureStore();
  const { blueprints } = useBlueprintStore();
  const { images } = useInspirationStore();
  const cost = useCostStore();

  if (!hydrated) {
    return (
      <div className="p-8">
        <div className="skeleton h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
        <div className="skeleton h-80" />
      </div>
    );
  }

  // ── Real metrics ──
  const totalSpent = cost.getTotalPaid();
  const totalBudget = cost.getTotalBudget() || cost.roiConfig.totalRenovationBudget;
  const budgetPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const roiMetrics = cost.getRoiMetrics('actual');
  const monthlyNet = roiMetrics.netMonthlyIncome;
  const roiMonths = roiMetrics.paybackMonths ?? 0;
  const spentByCategory = cost.getSpentByCategory();

  const totalAreaM2 = rooms.reduce((s, r) => s + areaM2(r.width, r.height), 0);

  // Per-room completion using cross-module data
  const roomData = rooms.map((room) => {
    const fc = placements.filter((p) => p.roomId === room.id).length;
    const bc = blueprints.filter((b) => b.linkedRoomIds.includes(room.id)).length;
    const cc = cost.entries.filter(
      (e) => e.linkedRoomIds.includes(room.id) && e.status !== 'cancelled'
    ).length;
    return {
      room,
      furnitureCount: fc,
      completion: computeRoomCompletion(room, {
        furnitureCount: fc,
        blueprintCount: bc,
        costCount: cc,
      }),
    };
  });

  const avgCompletion =
    roomData.length > 0
      ? Math.round(roomData.reduce((s, r) => s + r.completion.percent, 0) / roomData.length)
      : 0;

  // Donut data
  const pieData = cost.categories
    .filter((c) => (spentByCategory[c.id] ?? 0) > 0)
    .map((c) => ({ name: c.name, value: Math.round(spentByCategory[c.id]), color: c.color }));

  const isEmpty = rooms.length === 0 && cost.entries.length === 0;

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <div className="bg-mesh border-b border-[var(--border)]">
        <div className="px-8 py-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Maison Philippines · Dortoirs étudiants
            </p>
            <h1 className="mt-1 text-3xl font-bold text-ink tracking-tight">Tableau de bord</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {rooms.length} pièce{rooms.length > 1 ? 's' : ''} ·{' '}
              {floors.length} étage{floors.length > 1 ? 's' : ''} ·{' '}
              {totalAreaM2.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m² planifiés
            </p>
          </div>
          <ProjectActions />
        </div>
      </div>

      <div className="p-8 space-y-8">
        {isEmpty && (
          <div className="card p-10 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <PencilRuler className="h-7 w-7 text-brand-600" />
            </div>
            <h2 className="text-lg font-semibold text-ink">Commencez votre projet</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Créez vos premières pièces dans l&apos;éditeur de plan, puis aménagez-les et suivez les coûts.
            </p>
            <Link href="/plans" className="btn-primary mt-5 inline-flex">
              <PencilRuler size={16} /> Ouvrir l&apos;éditeur de plan
            </Link>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Pièces planifiées"
            value={rooms.length}
            sub={`${totalAreaM2.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m² au total`}
            icon={<Home className="h-5 w-5 text-brand-600" />}
            tint="bg-brand-50"
            href="/plans"
          />
          <StatCard
            title="Meubles placés"
            value={placements.length}
            sub={`${blueprints.length} blueprint(s) · ${images.length} inspiration(s)`}
            icon={<Sofa className="h-5 w-5 text-accent-600" />}
            tint="bg-accent-50"
            href="/furniture"
          />
          <StatCard
            title="Budget dépensé"
            value={formatPHP(totalSpent, { compact: true })}
            sub={totalBudget > 0 ? `sur ${formatPHP(totalBudget, { compact: true })} (${formatPct(budgetPct)})` : 'Budget non défini'}
            icon={<Wallet className="h-5 w-5 text-emerald-600" />}
            tint="bg-emerald-50"
            href="/costs"
          />
          <StatCard
            title="Retour sur invest."
            value={roiMonths > 0 ? formatMonths(roiMonths) : '—'}
            sub={monthlyNet > 0 ? `${formatPHP(monthlyNet, { compact: true })}/mois net` : 'ROI à configurer'}
            icon={<TrendingUp className="h-5 w-5 text-brand-600" />}
            tint="bg-brand-50"
            href="/costs"
          />
        </div>

        {/* Mid row: budget + breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Budget progress */}
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-ink-faint" />
                <h2 className="font-semibold text-ink">Avancement du budget</h2>
              </div>
              <Link href="/costs" className="text-xs font-medium text-brand-600 hover:underline">
                Détails →
              </Link>
            </div>

            <div className="flex items-end justify-between mb-2">
              <p className="text-2xl font-bold text-ink">{formatPHP(totalSpent)}</p>
              <p className="text-sm text-ink-muted">
                {totalBudget > 0 ? `/ ${formatPHP(totalBudget)}` : 'budget non défini'}
              </p>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetPct > 100 ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-500 to-brand-600'
                }`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={budgetPct > 100 ? 'text-rose-600 font-medium' : 'text-ink-muted'}>
                {formatPct(budgetPct)} utilisé
              </span>
              <span className="text-ink-muted">
                Restant : {formatPHP(Math.max(0, totalBudget - totalSpent))}
              </span>
            </div>

            {/* secondary metrics */}
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-5">
              <div>
                <p className="text-xs text-ink-faint">Dépenses</p>
                <p className="mt-0.5 text-lg font-bold text-ink">{cost.entries.length}</p>
              </div>
              <div>
                <p className="text-xs text-ink-faint">Revenu net / mois</p>
                <p className="mt-0.5 text-lg font-bold text-ink">{formatPHP(Math.max(0, monthlyNet), { compact: true })}</p>
              </div>
              <div>
                <p className="text-xs text-ink-faint">Avancement moyen</p>
                <p className="mt-0.5 text-lg font-bold text-ink">{formatPct(avgCompletion)}</p>
              </div>
            </div>
          </div>

          {/* Spend breakdown donut */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-ink-faint" />
              <h2 className="font-semibold text-ink">Répartition des coûts</h2>
            </div>
            {pieData.length > 0 ? (
              <>
                <div className="relative h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        innerRadius={48}
                        outerRadius={70}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {pieData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[11px] text-ink-faint">Total</span>
                    <span className="text-sm font-bold text-ink">
                      {formatPHP(totalSpent, { compact: true })}
                    </span>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {pieData.slice(0, 5).map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-ink-muted">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-medium text-ink">{formatPHP(d.value, { compact: true })}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <Wallet className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-ink-faint">Aucune dépense enregistrée</p>
                <Link href="/costs" className="mt-2 text-xs font-medium text-brand-600 hover:underline">
                  Ajouter une dépense
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Per-room progress */}
        {roomData.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-ink">Avancement par pièce</h2>
              <span className="badge-muted">{roomData.length} pièces</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {roomData.map(({ room, completion }) => (
                <div key={room.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: ROOM_ACCENT[room.type] }}
                      />
                      {room.name}
                      <span className="text-xs font-normal text-ink-faint">
                        {ROOM_TYPE_LABELS[room.type]}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-ink-muted">
                      {formatPct(completion.percent)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${completion.percent}%`,
                        background:
                          completion.percent === 100
                            ? '#10b981'
                            : ROOM_ACCENT[room.type],
                      }}
                    />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    <Milestone done={completion.hasPlan && completion.hasOpening} label="Plan" />
                    <Milestone done={completion.hasFurniture} label="Meubles" />
                    <Milestone done={completion.hasBlueprint} label="Blueprint" />
                    <Milestone done={completion.hasCost} label="Coûts" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/plans', label: 'Dessiner un plan', icon: <PencilRuler className="h-4 w-4" /> },
            { href: '/furniture', label: 'Agencer les meubles', icon: <Sofa className="h-4 w-4" /> },
            { href: '/blueprints', label: 'Ajouter un blueprint', icon: <FileImage className="h-4 w-4" /> },
            { href: '/inspiration', label: 'Collecter des idées', icon: <Camera className="h-4 w-4" /> },
          ].map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="panel flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-ink-soft transition-all hover:border-brand-200 hover:bg-brand-50/40"
            >
              <span className="text-brand-600">{q.icon}</span>
              {q.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
