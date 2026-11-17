import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { PlantHealth, PlantRecord } from '../types/plant';
import { evaluatePlantSchedule } from '../utils/schedule';

interface CollectionViewProps {
  plants: PlantRecord[];
  onWaterPlant: (id: number) => void;
  onUpdateHealth: (id: number, health: PlantHealth) => void;
  onDeletePlant: (id: number) => void;
  onOpenAddModal: () => void;
  onResetSampleData: () => void;
}

type HealthFilter = 'all' | PlantHealth;

export const CollectionView: React.FC<CollectionViewProps> = ({
  plants,
  onWaterPlant,
  onUpdateHealth,
  onDeletePlant,
  onOpenAddModal,
  onResetSampleData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const scheduleMap = useMemo(() => {
    const map = new Map<number, ReturnType<typeof evaluatePlantSchedule>>();
    for (const plant of plants) {
      map.set(plant.id, evaluatePlantSchedule(plant));
    }
    return map;
  }, [plants]);

  const metrics = useMemo(() => {
    let overdue = 0;
    let dueToday = 0;
    let healthy = 0;
    for (const plant of plants) {
      if (plant.health === 'Healthy') healthy += 1;
      const sched = scheduleMap.get(plant.id);
      if (sched?.status === 'overdue') overdue += 1;
      if (sched?.status === 'due_today') dueToday += 1;
    }
    return {
      total: plants.length,
      overdue,
      dueToday,
      healthy,
    };
  }, [plants, scheduleMap]);

  const filteredPlants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return plants.filter((plant) => {
      if (healthFilter !== 'all' && plant.health !== healthFilter) {
        return false;
      }
      if (!q) return true;
      return (
        String(plant.id) === q ||
        plant.name.toLowerCase().includes(q) ||
        plant.plant_type.toLowerCase().includes(q) ||
        plant.sunlight.toLowerCase().includes(q)
      );
    });
  }, [plants, searchQuery, healthFilter]);

  const renderHealthState = (plant: PlantRecord) => {
    const icon =
      plant.health === 'Healthy' ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
      ) : plant.health === 'Need Attention' ? (
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
      );

    const textColor =
      plant.health === 'Healthy'
        ? 'text-emerald-700'
        : plant.health === 'Need Attention'
        ? 'text-amber-700'
        : 'text-red-700';

    return (
      <div className="flex items-center gap-1.5">
        {icon}
        <select
          aria-label={`Health status for ${plant.name}`}
          value={plant.health}
          onChange={(e) => onUpdateHealth(plant.id, e.target.value as PlantHealth)}
          className={`cursor-pointer bg-transparent text-xs font-medium ${textColor} focus:outline-none focus-visible:underline`}
        >
          <option value="Healthy" className="text-slate-900">
            Healthy
          </option>
          <option value="Need Attention" className="text-slate-900">
            Need Attention
          </option>
          <option value="Unhealthy" className="text-slate-900">
            Unhealthy
          </option>
        </select>
      </div>
    );
  };

  const renderWateringCell = (plant: PlantRecord) => {
    const sched = scheduleMap.get(plant.id);
    if (!sched) return null;

    if (sched.status === 'overdue') {
      return (
        <div className="text-xs">
          <span className="font-medium text-red-600">
            Overdue by {Math.abs(sched.daysLeft ?? 0)}d
          </span>
          <span className="text-slate-400"> · </span>
          <span className="font-mono tabular-nums text-slate-500">{sched.nextDate}</span>
        </div>
      );
    }
    if (sched.status === 'due_today') {
      return (
        <div className="text-xs">
          <span className="font-medium text-amber-700">Water today</span>
          <span className="text-slate-400"> · </span>
          <span className="font-mono tabular-nums text-slate-500">{sched.nextDate}</span>
        </div>
      );
    }
    if (sched.status === 'upcoming') {
      return (
        <div className="text-xs">
          <span className="text-slate-700">In {sched.daysLeft}d</span>
          <span className="text-slate-400"> · </span>
          <span className="font-mono tabular-nums text-slate-500">{sched.nextDate}</span>
        </div>
      );
    }
    return <span className="text-xs text-slate-400">Not watered yet</span>;
  };

  return (
    <div className="space-y-6">
      {/* 4-column summary metrics strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Total Plants</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {metrics.total}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Healthy Specimens</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-emerald-700">
            {metrics.healthy}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Due Today</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-amber-600">
            {metrics.dueToday}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Overdue Watering</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-red-600">
            {metrics.overdue}
          </p>
        </div>
      </div>

      {/* Filter & search toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, name, or type..."
              aria-label="Search plants"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>

          <div
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1"
            role="tablist"
            aria-label="Filter by health"
          >
            {(['all', 'Healthy', 'Need Attention', 'Unhealthy'] as HealthFilter[]).map((status) => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={healthFilter === status}
                onClick={() => setHealthFilter(status)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  healthFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onResetSampleData}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:self-auto whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Sample Data
        </button>
      </div>

      {/* Main collection table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {plants.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-base font-semibold text-slate-900">No plants in database</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Your local SQLite plants table is empty. Add your first plant or restore the sample collection.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add First Plant
              </button>
              <button
                type="button"
                onClick={onResetSampleData}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                Load Sample Plants
              </button>
            </div>
          </div>
        ) : filteredPlants.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">No matching plants</p>
            <p className="mt-1 text-xs text-slate-500">
              Try clearing your search query or switching the health filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 pl-5 pr-3">ID</th>
                  <th className="px-3 py-3">Plant</th>
                  <th className="px-3 py-3">Sunlight</th>
                  <th className="px-3 py-3 text-right">Interval</th>
                  <th className="px-3 py-3">Last Watered</th>
                  <th className="px-3 py-3">Next Due</th>
                  <th className="px-3 py-3">Health</th>
                  <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPlants.map((plant) => (
                  <tr key={plant.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="py-3 pl-5 pr-3 font-mono text-xs tabular-nums text-slate-500">
                      #{String(plant.id).padStart(2, '0')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{plant.name}</div>
                      <div className="text-xs text-slate-500">{plant.plant_type}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">{plant.sunlight}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-slate-700">
                      {plant.watering_days}d
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-slate-600">
                      {plant.last_watered ?? 'Never'}
                    </td>
                    <td className="px-3 py-3">{renderWateringCell(plant)}</td>
                    <td className="px-3 py-3">{renderHealthState(plant)}</td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onWaterPlant(plant.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 whitespace-nowrap shrink-0"
                        >
                          <Droplets className="h-3.5 w-3.5 text-emerald-600" />
                          Water
                        </button>
                        {confirmDeleteId === plant.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeletePlant(plant.id);
                                setConfirmDeleteId(null);
                              }}
                              className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 whitespace-nowrap shrink-0"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(plant.id)}
                            aria-label={`Delete ${plant.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
