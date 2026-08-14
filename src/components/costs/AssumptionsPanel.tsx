'use client';

import React, { useState } from 'react';
import { Link2, PencilLine, RotateCcw } from 'lucide-react';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useCostStore } from '@/stores/costStore';
import { useBedCountFromPlan } from '@/lib/beds';
import { ACADEMIC_PH_PROFILE } from '@/lib/roiEngine';
import { AssumptionSlider } from './AssumptionSlider';
import type { Scenario } from '@/types/scenario';

const peso = (v: number) => `₱${Math.round(v).toLocaleString('fr-FR')}`;
const pct = (v: number) => `${(v * 100).toFixed(0)} %`;
const months = (v: number) => `${Math.round(v)} mois`;

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

interface Props {
  scenario: Scenario;
}

export const AssumptionsPanel: React.FC<Props> = ({ scenario }) => {
  const updateAssumptions = useScenarioStore((s) => s.updateAssumptions);
  const seedFromRoiConfig = useScenarioStore((s) => s.seedFromRoiConfig);
  const roiConfig = useCostStore((s) => s.roiConfig);
  const planBeds = useBedCountFromPlan();
  const [locked, setLocked] = useState<Record<string, boolean>>({});

  const a = scenario.assumptions;
  const set = updateAssumptions.bind(null, scenario.id);
  const toggleLock = (key: string) => setLocked((prev) => ({ ...prev, [key]: !prev[key] }));

  const effectiveBeds = a.bedCountSource === 'plan' ? planBeds : a.numberOfBeds;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Hypothèses</h3>
        <button
          onClick={() => seedFromRoiConfig(roiConfig, planBeds)}
          className="btn-secondary btn-sm"
          title="Recopier les valeurs saisies dans l'onglet ROI"
        >
          <RotateCcw size={13} /> Reprendre l&apos;onglet ROI
        </button>
      </div>

      {/* ── Capacity & revenue ── */}
      <section className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Capacité &amp; revenus
        </h4>

        <div>
          <label className="text-sm font-medium text-ink-soft">Nombre de lits</label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => set({ bedCountSource: 'plan', numberOfBeds: planBeds })}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                a.bedCountSource === 'plan'
                  ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                  : 'border-[var(--border)] text-ink-muted hover:bg-[var(--bg-app)]'
              }`}
            >
              <Link2 size={13} /> Depuis le plan ({planBeds})
            </button>
            <button
              type="button"
              onClick={() => set({ bedCountSource: 'manual' })}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                a.bedCountSource === 'manual'
                  ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                  : 'border-[var(--border)] text-ink-muted hover:bg-[var(--bg-app)]'
              }`}
            >
              <PencilLine size={13} /> Manuel
            </button>
            {a.bedCountSource === 'manual' && (
              <input
                type="number"
                min={0}
                value={a.numberOfBeds}
                onChange={(e) => set({ numberOfBeds: parseInt(e.target.value, 10) || 0 })}
                className="input w-24 py-1 text-sm"
              />
            )}
          </div>
          {a.bedCountSource === 'plan' && effectiveBeds !== a.numberOfBeds && (
            <button
              onClick={() => set({ numberOfBeds: planBeds })}
              className="mt-1.5 text-xs text-brand-600 underline"
            >
              Synchroniser le modèle sur le plan ({planBeds} lits)
            </button>
          )}
        </div>

        <AssumptionSlider
          label="Loyer par lit"
          hint="Montant mensuel facturé à chaque occupant."
          value={a.monthlyRentPerBed}
          min={0}
          max={15000}
          step={100}
          format={(v) => `${peso(v)}/mois`}
          onChange={(v) => set({ monthlyRentPerBed: v })}
          locked={locked.rent}
          onToggleLock={() => toggleLock('rent')}
        />

        <AssumptionSlider
          label="Revenus annexes"
          hint="Laverie, eau potable, parking moto…"
          value={a.otherMonthlyRevenue}
          min={0}
          max={30000}
          step={500}
          format={(v) => `${peso(v)}/mois`}
          onChange={(v) => set({ otherMonthlyRevenue: v })}
        />

        <AssumptionSlider
          label="Impayés"
          hint="Part du loyer jamais encaissée. Jamais zéro en pratique."
          value={a.badDebtRate}
          min={0}
          max={0.2}
          step={0.01}
          format={pct}
          onChange={(v) => set({ badDebtRate: v })}
        />
      </section>

      {/* ── Occupancy ── */}
      <section className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-600">Occupation</h4>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => set({ occupancy: { ...a.occupancy, mode: 'academic', monthly: [...ACADEMIC_PH_PROFILE] } })}
            className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              a.occupancy.mode === 'academic'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-[var(--border)] text-ink-muted hover:bg-[var(--bg-app)]'
            }`}
          >
            <span className="block font-medium">Année scolaire PH</span>
            <span className="block text-xs text-ink-faint">Creux en juin–juillet</span>
          </button>
          <button
            type="button"
            onClick={() => set({ occupancy: { ...a.occupancy, mode: 'flat' } })}
            className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              a.occupancy.mode === 'flat'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-[var(--border)] text-ink-muted hover:bg-[var(--bg-app)]'
            }`}
          >
            <span className="block font-medium">Taux constant</span>
            <span className="block text-xs text-ink-faint">Même taux toute l&apos;année</span>
          </button>
        </div>

        {a.occupancy.mode === 'flat' ? (
          <AssumptionSlider
            label="Taux d'occupation"
            value={a.occupancy.flatRate}
            min={0}
            max={1}
            step={0.01}
            format={pct}
            onChange={(v) => set({ occupancy: { ...a.occupancy, flatRate: v } })}
            locked={locked.occupancy}
            onToggleLock={() => toggleLock('occupancy')}
          />
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-ink-soft">Profil mensuel (modifiable)</p>
            <div className="grid grid-cols-4 gap-2">
              {a.occupancy.monthly.map((value, i) => (
                <div key={i}>
                  <label className="block text-center text-xs text-ink-faint">{MONTH_NAMES[i]}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={Math.round(value * 100)}
                    onChange={(e) => {
                      const next = [...a.occupancy.monthly];
                      next[i] = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)) / 100;
                      set({ occupancy: { ...a.occupancy, mode: 'custom', monthly: next } });
                    }}
                    className="input w-full px-1.5 py-1 text-center text-sm tabular-nums"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <AssumptionSlider
          label="Montée en charge"
          hint="Durée pour remplir le dortoir après l'ouverture."
          value={a.rampUpMonths}
          min={1}
          max={12}
          step={1}
          format={months}
          onChange={(v) => set({ rampUpMonths: v })}
        />

        <AssumptionSlider
          label="Occupation au démarrage"
          hint="Part des lits déjà loués le premier mois."
          value={a.rampUpStartRate}
          min={0}
          max={1}
          step={0.05}
          format={pct}
          onChange={(v) => set({ rampUpStartRate: v })}
        />
      </section>

      {/* ── Building ── */}
      <section className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-600">Bâtiment</h4>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => set({ propertyMode: 'lease' })}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
              a.propertyMode === 'lease'
                ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                : 'border-[var(--border)] text-ink-muted hover:bg-[var(--bg-app)]'
            }`}
          >
            Loué
          </button>
          <button
            type="button"
            onClick={() => set({ propertyMode: 'purchase' })}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
              a.propertyMode === 'purchase'
                ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                : 'border-[var(--border)] text-ink-muted hover:bg-[var(--bg-app)]'
            }`}
          >
            Acheté
          </button>
        </div>

        {a.propertyMode === 'lease' ? (
          <>
            <AssumptionSlider
              label="Loyer du bail principal"
              hint="Ce que vous versez au propriétaire. Une charge, pas un investissement."
              value={a.monthlyBaseRent}
              min={0}
              max={100000}
              step={1000}
              format={(v) => `${peso(v)}/mois`}
              onChange={(v) => set({ monthlyBaseRent: v })}
              locked={locked.baseRent}
              onToggleLock={() => toggleLock('baseRent')}
            />
            <AssumptionSlider
              label="Durée du bail"
              hint="Si le retour sur investissement dépasse cette durée, le projet n'est pas finançable."
              value={a.leaseTermMonths}
              min={6}
              max={180}
              step={6}
              format={(v) => `${Math.round(v)} mois (${(v / 12).toFixed(1)} ans)`}
              onChange={(v) => set({ leaseTermMonths: v })}
            />
          </>
        ) : (
          <AssumptionSlider
            label="Prix d'achat"
            value={a.propertyPurchasePrice}
            min={0}
            max={10000000}
            step={50000}
            format={peso}
            onChange={(v) => set({ propertyPurchasePrice: v })}
          />
        )}
      </section>

      {/* ── Costs ── */}
      <section className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-600">Charges</h4>

        <AssumptionSlider
          label="Électricité + eau par lit occupé"
          hint="Le poste qui décide de la marge d'un bed space aux Philippines."
          value={a.utilitiesPerOccupiedBed}
          min={0}
          max={3000}
          step={50}
          format={(v) => `${peso(v)}/mois`}
          onChange={(v) => set({ utilitiesPerOccupiedBed: v })}
          locked={locked.utilities}
          onToggleLock={() => toggleLock('utilities')}
        />

        <AssumptionSlider
          label="Charges fixes"
          hint="Internet, caretaker, ménage, consommables…"
          value={a.fixedMonthlyCosts}
          min={0}
          max={60000}
          step={500}
          format={(v) => `${peso(v)}/mois`}
          onChange={(v) => set({ fixedMonthlyCosts: v })}
        />

        <AssumptionSlider
          label="Provision de renouvellement"
          hint="Matelas, ventilateurs, peinture. Sans elle, le modèle est faux dès l'année 3."
          value={a.replacementReserveMonthly}
          min={0}
          max={20000}
          step={250}
          format={(v) => `${peso(v)}/mois`}
          onChange={(v) => set({ replacementReserveMonthly: v })}
        />

        <AssumptionSlider
          label="Maintenance annuelle"
          hint="En part de l'investissement."
          value={a.maintenanceRateOfCapex}
          min={0}
          max={0.15}
          step={0.005}
          format={(v) => `${(v * 100).toFixed(1)} %/an`}
          onChange={(v) => set({ maintenanceRateOfCapex: v })}
        />

        <AssumptionSlider
          label="Inflation des charges"
          value={a.costInflationRate}
          min={0}
          max={0.2}
          step={0.005}
          format={(v) => `${(v * 100).toFixed(1)} %/an`}
          onChange={(v) => set({ costInflationRate: v })}
        />

        <AssumptionSlider
          label="Indexation des loyers"
          hint="Appliquée aux loyers encaissés comme au bail principal."
          value={a.rentIndexationRate}
          min={0}
          max={0.2}
          step={0.005}
          format={(v) => `${(v * 100).toFixed(1)} %/an`}
          onChange={(v) => set({ rentIndexationRate: v })}
        />
      </section>

      {/* ── Investment & financial ── */}
      <section className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Investissement &amp; financier
        </h4>

        <AssumptionSlider
          label="Budget rénovation"
          value={a.renovationBudget}
          min={0}
          max={2000000}
          step={10000}
          format={peso}
          onChange={(v) => set({ renovationBudget: v })}
          locked={locked.renovation}
          onToggleLock={() => toggleLock('renovation')}
        />

        <AssumptionSlider
          label="Provision d'aléas"
          hint="La ligne que tout le monde oublie. 10 à 20 % est la fourchette usuelle."
          value={a.contingencyRate}
          min={0}
          max={0.4}
          step={0.01}
          format={pct}
          onChange={(v) => set({ contingencyRate: v })}
        />

        <AssumptionSlider
          label="Horizon d'analyse"
          value={a.horizonMonths}
          min={12}
          max={180}
          step={12}
          format={(v) => `${Math.round(v / 12)} ans`}
          onChange={(v) => set({ horizonMonths: v })}
        />

        <AssumptionSlider
          label="Taux d'actualisation"
          hint="Votre coût d'opportunité : ce que rapporterait cet argent ailleurs."
          value={a.discountRateAnnual}
          min={0}
          max={0.3}
          step={0.005}
          format={(v) => `${(v * 100).toFixed(1)} %/an`}
          onChange={(v) => set({ discountRateAnnual: v })}
        />

        <AssumptionSlider
          label="Taux d'imposition"
          hint="À valider avec un comptable local."
          value={a.taxRate}
          min={0}
          max={0.4}
          step={0.01}
          format={pct}
          onChange={(v) => set({ taxRate: v })}
        />

        <div>
          <label className="text-sm font-medium text-ink-soft">Mois de démarrage</label>
          <select
            value={a.startMonth}
            onChange={(e) => set({ startMonth: parseInt(e.target.value, 10) })}
            className="input mt-1.5"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-faint">
            Ouvrir juste avant la rentrée change tout le profil de trésorerie.
          </p>
        </div>
      </section>
    </div>
  );
};
