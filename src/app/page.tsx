'use client';

import { usePlanStore } from '@/stores/planStore';
import { useFurnitureStore } from '@/stores/furnitureStore';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { useCostStore } from '@/stores/costStore';
import { BarChart3, Home, Sofa, FileText, DollarSign, TrendingUp } from 'lucide-react';

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{Icon}</div>
      </div>
    </div>
  );
}

function RoomProgressItem({
  name,
  completion,
}: {
  name: string;
  completion: number;
}) {
  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-slate-300';
  };

  const getStatusLabel = (percentage: number) => {
    if (percentage === 100) return 'Complète';
    if (percentage >= 75) return 'Presque fini';
    if (percentage >= 50) return 'En cours';
    return 'Non commencé';
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-700">{name}</p>
        <span className="text-xs font-semibold text-slate-600">
          {completion}% - {getStatusLabel(completion)}
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getStatusColor(completion)}`}
          style={{ width: `${completion}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { rooms } = usePlanStore();
  const { placements } = useFurnitureStore();
  const { blueprints } = useBlueprintStore();
  const { entries, roiConfig } = useCostStore();

  const roomsCount = rooms?.length ?? 0;
  const placementsCount = placements?.length ?? 0;
  const blueprintsCount = blueprints?.length ?? 0;

  // Calculate budget information
  const totalCostEntries = entries ?? [];
  const totalSpent = totalCostEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const totalBudget = roiConfig?.totalRenovationBudget ?? 0;

  // Calculate months to recover (ROI)
  const monthlyRentPerBed = roiConfig?.monthlyRentPerBed ?? 0;
  const numberOfBeds = roiConfig?.numberOfBeds ?? 0;
  const occupancyRate = roiConfig?.occupancyRate ?? 1;
  const monthlyNetIncome = (monthlyRentPerBed * numberOfBeds * occupancyRate) - (roiConfig?.monthlyExpenses ?? 0);
  const monthsToRecover = totalBudget && monthlyNetIncome ? Math.ceil(totalBudget / monthlyNetIncome) : 0;

  // Calculate room completion percentages
  const roomCompletionData = (rooms ?? []).map((room) => {
    const roomPlacements = placementsCount > 0 ? Math.min(placementsCount, 100) : 0;
    const completion = Math.floor((roomPlacements / Math.max(roomsCount, 1)) * 100);
    return {
      name: room.name || 'Unnamed Room',
      completion: Math.min(completion, 100),
    };
  });

  const budgetPercentage = totalBudget > 0 ? Math.floor((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Vue d'ensemble de votre projet de rénovation</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Pièces créées"
          value={roomsCount}
          icon={<Home className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
        />
        <SummaryCard
          title="Meubles placés"
          value={placementsCount}
          icon={<Sofa className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
        />
        <SummaryCard
          title="Blueprints"
          value={blueprintsCount}
          icon={<FileText className="w-6 h-6 text-orange-600" />}
          color="bg-orange-100"
        />
        <SummaryCard
          title="Budget utilisé"
          value={`$${totalSpent.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
      </div>

      {/* ROI and Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ROI Estimate */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Estimation ROI</h2>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 mb-1">Budget total</p>
              <p className="text-2xl font-bold text-slate-900">
                ${totalBudget.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Revenu mensuel net</p>
              <p className="text-2xl font-bold text-slate-900">
                ${monthlyNetIncome.toLocaleString()}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Mois pour récupérer l'investissement</p>
              <p className="text-3xl font-bold text-blue-600">
                {monthsToRecover} mois
              </p>
            </div>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Progression Budget</h2>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Dépensé</span>
                <span className="text-sm font-bold text-slate-900">
                  {budgetPercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-600 text-xs mb-1">Montant dépensé</p>
                <p className="font-bold text-slate-900">
                  ${totalSpent.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-600 text-xs mb-1">Restant</p>
                <p className="font-bold text-slate-900">
                  ${Math.max(0, totalBudget - totalSpent).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Status */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Status Projet</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Pièces</span>
              <span className="font-bold text-slate-900">{roomsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Meubles</span>
              <span className="font-bold text-slate-900">{placementsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Plans</span>
              <span className="font-bold text-slate-900">{blueprintsCount}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-sm text-slate-600">Dépenses</span>
              <span className="font-bold text-slate-900">
                ${totalSpent.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Room Progress Overview */}
      {roomCompletionData.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Progression des Pièces</h2>
          <div className="space-y-4">
            {roomCompletionData.map((room, index) => (
              <RoomProgressItem
                key={index}
                name={room.name}
                completion={room.completion}
              />
            ))}
          </div>
        </div>
      )}

      {roomCompletionData.length === 0 && (
        <div className="card p-12 text-center">
          <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Commencez par créer des pièces dans l'onglet Plans</p>
        </div>
      )}
    </div>
  );
}
