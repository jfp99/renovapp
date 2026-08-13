'use client';

import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Table2, LineChart as LineChartIcon } from 'lucide-react';
import type { ProjectionResult, SensitivityEntry } from '@/types/scenario';

/**
 * Palette: validated categorical slots (light mode).
 * Aqua sits below 3:1 on the light surface, so every chart using it ships a
 * table view — the relief rule, not an optional extra.
 */
const SERIES_1 = '#2a78d6'; // blue   — cash position
const SERIES_2 = '#eb6834'; // orange — unfavourable side
const SERIES_3 = '#1baf7a'; // aqua   — occupancy
const GRID = '#e7e5e4';
const AXIS_TEXT = '#52514e';

const peso = (v: number) => `₱${Math.round(v).toLocaleString('fr-FR')}`;
const compact = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M`;
  if (abs >= 1_000) return `${Math.round(v / 1000)} k`;
  return `${Math.round(v)}`;
};

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e7e5e4',
  fontSize: 13,
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
} as const;

interface Props {
  projection: ProjectionResult;
  sensitivity: SensitivityEntry[];
}

export const ProjectionCharts: React.FC<Props> = ({ projection, sensitivity }) => {
  const [showTable, setShowTable] = useState(false);

  const cashData = projection.months.map((m) => ({
    label: m.label,
    index: m.index,
    cumulative: Math.round(m.cumulativeCashFlow),
    occupancy: Math.round(m.occupancy * 100),
    net: Math.round(m.netCashFlow),
  }));

  // Only the first 24 months carry a readable seasonality story.
  const occupancyData = cashData.slice(0, 24);

  const tornadoData = sensitivity.map((entry) => ({
    label: entry.label,
    bas: Math.round(entry.lowNpv - projection.npv),
    haut: Math.round(entry.highNpv - projection.npv),
  }));

  return (
    <div className="space-y-6">
      {/* ── Cumulative cash position ── */}
      <div className="card p-6">
        <div className="mb-1 flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-ink">Trésorerie cumulée</h4>
            <p className="mt-0.5 text-xs text-ink-muted">
              Le croisement de la ligne zéro marque le retour sur investissement.
            </p>
          </div>
          <button
            onClick={() => setShowTable((v) => !v)}
            className="btn-secondary btn-sm shrink-0"
            title={showTable ? 'Voir le graphique' : 'Voir le tableau'}
          >
            {showTable ? <LineChartIcon size={14} /> : <Table2 size={14} />}
            {showTable ? 'Graphique' : 'Tableau'}
          </button>
        </div>

        {showTable ? (
          <div className="mt-4 max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="py-2 font-medium">Mois</th>
                  <th className="py-2 text-right font-medium">Occupation</th>
                  <th className="py-2 text-right font-medium">Net mensuel</th>
                  <th className="py-2 text-right font-medium">Cumulé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {cashData.map((row) => (
                  <tr key={row.index} className="text-ink-soft">
                    <td className="py-1.5">{row.label}</td>
                    <td className="py-1.5 text-right tabular-nums">{row.occupancy} %</td>
                    <td className="py-1.5 text-right tabular-nums">{peso(row.net)}</td>
                    <td
                      className={`py-1.5 text-right font-medium tabular-nums ${
                        row.cumulative >= 0 ? 'text-emerald-700' : 'text-ink'
                      }`}
                    >
                      {peso(row.cumulative)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashData} margin={{ top: 16, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES_1} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={SERIES_1} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: AXIS_TEXT }}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tickFormatter={compact}
                tick={{ fontSize: 11, fill: AXIS_TEXT }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [peso(value as number), 'Trésorerie cumulée']}
                labelFormatter={(label) => `Mois : ${label}`}
              />
              <ReferenceLine y={0} stroke={AXIS_TEXT} strokeWidth={1} />
              {projection.paybackMonth && (
                <ReferenceLine
                  x={cashData[projection.paybackMonth - 1]?.label}
                  stroke={SERIES_3}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: 'Retour sur investissement',
                    position: 'insideTopRight',
                    fontSize: 11,
                    fill: AXIS_TEXT,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={SERIES_1}
                strokeWidth={2}
                fill="url(#cashFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Occupancy profile ── */}
        <div className="card p-6">
          <h4 className="text-sm font-semibold text-ink">Occupation mois par mois</h4>
          <p className="mt-0.5 mb-3 text-xs text-ink-muted">
            24 premiers mois — montée en charge puis saisonnalité.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={occupancyData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: AXIS_TEXT }}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v} %`}
                tick={{ fontSize: 11, fill: AXIS_TEXT }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`${value} %`, 'Occupation']}
                labelFormatter={(label) => `Mois : ${label}`}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
              <Bar dataKey="occupancy" fill={SERIES_3} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Tornado ── */}
        <div className="card p-6">
          <h4 className="text-sm font-semibold text-ink">Sensibilité (± 20 %)</h4>
          <p className="mt-0.5 mb-3 text-xs text-ink-muted">
            Effet sur la VAN. La barre la plus longue est le levier qui décide du projet.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={tornadoData}
              layout="vertical"
              margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
              barGap={2}
            >
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={compact}
                tick={{ fontSize: 11, fill: AXIS_TEXT }}
                tickLine={false}
                axisLine={{ stroke: GRID }}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: AXIS_TEXT }}
                tickLine={false}
                axisLine={false}
                width={128}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [peso(value as number), name === 'bas' ? '− 20 %' : '+ 20 %']}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (value === 'bas' ? '− 20 %' : '+ 20 %')}
              />
              <ReferenceLine x={0} stroke={AXIS_TEXT} strokeWidth={1} />
              <Bar dataKey="bas" fill={SERIES_2} radius={[4, 4, 4, 4]}>
                {tornadoData.map((_, i) => (
                  <Cell key={`low-${i}`} />
                ))}
              </Bar>
              <Bar dataKey="haut" fill={SERIES_1} radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
