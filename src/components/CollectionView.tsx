import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Download,
  Droplets,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sprout,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PlantHealth, PlantRecord, WateringEventRecord } from '../types/plant';
import { ImportedPlantInput, parsePlantsCsv } from '../utils/csv';
import { evaluatePlantSchedule, getLocalIsoDate, offsetIsoDate } from '../utils/schedule';
import { PlantThumbnail } from './PlantThumbnail';

interface CollectionViewProps {
  plants: PlantRecord[];
  wateringEvents: WateringEventRecord[];
  onWaterPlant: (id: number) => void;
  onUpdateHealth: (id: number, health: PlantHealth) => void;
  onEditPlant: (plant: PlantRecord) => void;
  onDeletePlant: (id: number) => void;
  onOpenAddModal: () => void;
  onResetSampleData: () => void;
  onClearAll: () => void;
  onImportPlants: (imported: ImportedPlantInput[]) => number;
}

type HealthFilter = 'all' | PlantHealth;

type SortOption =
  | 'default'
  | 'name_asc'
  | 'name_desc'
  | 'health'
  | 'last_watered_newest'
  | 'last_watered_oldest';

const HEALTH_SORT_ORDER: Record<PlantHealth, number> = {
  Unhealthy: 0,
  'Need Attention': 1,
  Healthy: 2,
};

export const CollectionView: React.FC<CollectionViewProps> = ({
  plants,
  wateringEvents,
  onWaterPlant,
  onUpdateHealth,
  onEditPlant,
  onDeletePlant,
  onOpenAddModal,
  onResetSampleData,
  onClearAll,
  onImportPlants,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const { chartData, averageWateringDays } = useMemo(() => {
    const data = plants.map((plant) => ({
      id: plant.id,
      name: plant.name,
      shortName: plant.name.length > 15 ? `${plant.name.slice(0, 14)}…` : plant.name,
      watering_days: plant.watering_days,
      health: plant.health,
      plant_type: plant.plant_type,
    }));
    const totalDays = plants.reduce((sum, p) => sum + Number(p.watering_days || 0), 0);
    const avg = plants.length > 0 ? (totalDays / plants.length).toFixed(1) : '0.0';
    return { chartData: data, averageWateringDays: avg };
  }, [plants]);

  const { frequencyData, totalLast30Days } = useMemo(() => {
    const countsByDate = new Map<string, number>();
    for (const ev of wateringEvents) {
      countsByDate.set(ev.date, (countsByDate.get(ev.date) ?? 0) + 1);
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days: { date: string; label: string; count: number }[] = [];
    let total = 0;

    for (let offset = -29; offset <= 0; offset += 1) {
      const iso = offsetIsoDate(offset);
      const count = countsByDate.get(iso) ?? 0;
      total += count;
      const monthIdx = Number(iso.slice(5, 7)) - 1;
      const dayNum = Number(iso.slice(8, 10));
      const label = `${monthNames[monthIdx] ?? ''} ${dayNum}`;
      days.push({ date: iso, label, count });
    }

    return { frequencyData: days, totalLast30Days: total };
  }, [wateringEvents]);

  const filteredPlants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = plants.filter((plant) => {
      if (healthFilter !== 'all' && plant.health !== healthFilter) {
        return false;
      }
      if (!q) return true;
      return (
        plant.name.toLowerCase().includes(q) ||
        plant.plant_type.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'default') {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name_asc') {
        const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        return cmp !== 0 ? cmp : a.id - b.id;
      }
      if (sortBy === 'name_desc') {
        const cmp = b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
        return cmp !== 0 ? cmp : a.id - b.id;
      }
      if (sortBy === 'health') {
        const cmp = HEALTH_SORT_ORDER[a.health] - HEALTH_SORT_ORDER[b.health];
        return cmp !== 0 ? cmp : a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      if (sortBy === 'last_watered_newest') {
        if (!a.last_watered && !b.last_watered) return a.id - b.id;
        if (!a.last_watered) return 1;
        if (!b.last_watered) return -1;
        const cmp = b.last_watered.localeCompare(a.last_watered);
        return cmp !== 0 ? cmp : a.id - b.id;
      }
      if (sortBy === 'last_watered_oldest') {
        if (!a.last_watered && !b.last_watered) return a.id - b.id;
        if (!a.last_watered) return -1;
        if (!b.last_watered) return 1;
        const cmp = a.last_watered.localeCompare(b.last_watered);
        return cmp !== 0 ? cmp : a.id - b.id;
      }
      return a.id - b.id;
    });
  }, [plants, searchQuery, healthFilter, sortBy]);

  const handleExportCsv = () => {
    if (filteredPlants.length === 0) return;

    const escapeCsvCell = (value: string | number | null | undefined): string => {
      const str = value === null || value === undefined ? '' : String(value);
      if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'ID',
      'Name',
      'Type',
      'Sunlight',
      'Watering Interval (Days)',
      'Health',
      'Last Watered',
      'Next Watering Due',
    ];

    const rows = filteredPlants.map((plant) => {
      const sched = scheduleMap.get(plant.id);
      return [
        plant.id,
        plant.name,
        plant.plant_type,
        plant.sunlight,
        plant.watering_days,
        plant.health,
        plant.last_watered ?? '',
        sched?.nextDate ?? '',
      ]
        .map(escapeCsvCell)
        .join(',');
    });

    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plants-${getLocalIsoDate()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const result = parsePlantsCsv(text);
      if (result.error) {
        setImportFeedback({ type: 'error', message: result.error });
        return;
      }
      const addedCount = onImportPlants(result.plants);
      const skippedNote =
        result.skippedCount > 0
          ? ` (${result.skippedCount} empty row${result.skippedCount === 1 ? '' : 's'} skipped)`
          : '';
      setImportFeedback({
        type: 'success',
        message: `Imported ${addedCount} plant${addedCount === 1 ? '' : 's'} from ${file.name}${skippedNote}.`,
      });
    } catch {
      setImportFeedback({
        type: 'error',
        message: 'Could not read the selected CSV file.',
      });
    }
  };

  const renderHealthState = (plant: PlantRecord) => {
    const icon =
      plant.health === 'Healthy' ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-healthy)] shrink-0" />
      ) : plant.health === 'Need Attention' ? (
        <AlertTriangle className="h-3.5 w-3.5 text-[var(--status-warning)] shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-[var(--status-danger)] shrink-0" />
      );

    const textColor =
      plant.health === 'Healthy'
        ? 'text-[var(--status-healthy)]'
        : plant.health === 'Need Attention'
        ? 'text-[var(--status-warning)]'
        : 'text-[var(--status-danger)]';

    return (
      <div className="flex items-center gap-1.5">
        {icon}
        <select
          aria-label={`Health status for ${plant.name}`}
          value={plant.health}
          onChange={(e) => onUpdateHealth(plant.id, e.target.value as PlantHealth)}
          className={`cursor-pointer bg-transparent text-xs font-medium ${textColor} focus:outline-none focus-visible:underline`}
        >
          <option value="Healthy" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
            Healthy
          </option>
          <option value="Need Attention" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
            Need Attention
          </option>
          <option value="Unhealthy" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
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
          <span className="font-medium text-[var(--status-danger)]">
            Overdue by {Math.abs(sched.daysLeft ?? 0)}d
          </span>
          <span className="text-[var(--text-faint)]"> · </span>
          <span className="font-mono tabular-nums text-[var(--text-muted)]">{sched.nextDate}</span>
        </div>
      );
    }
    if (sched.status === 'due_today') {
      return (
        <div className="text-xs">
          <span className="font-medium text-[var(--status-warning)]">Water today</span>
          <span className="text-[var(--text-faint)]"> · </span>
          <span className="font-mono tabular-nums text-[var(--text-muted)]">{sched.nextDate}</span>
        </div>
      );
    }
    if (sched.status === 'upcoming') {
      return (
        <div className="text-xs">
          <span className="text-[var(--text-primary)]">In {sched.daysLeft}d</span>
          <span className="text-[var(--text-faint)]"> · </span>
          <span className="font-mono tabular-nums text-[var(--text-muted)]">{sched.nextDate}</span>
        </div>
      );
    }
    return <span className="text-xs text-[var(--text-faint)]">Not watered yet</span>;
  };

  if (plants.length === 0) {
    return (
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Import plants from CSV file"
        />
        {importFeedback && (
          <div
            role="status"
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs ${
              importFeedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-200'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300'
            }`}
          >
            <span>{importFeedback.message}</span>
            <button
              type="button"
              onClick={() => setImportFeedback(null)}
              aria-label="Dismiss import message"
              className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-16 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center text-[var(--status-healthy)]">
            <Sprout className="h-8 w-8 stroke-[1.75]" />
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold text-[var(--text-primary)]">
            No plants yet
          </h2>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-[var(--text-secondary)]">
            Add your first plant to start tracking its watering schedule.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add plant
            </button>
            <button
              type="button"
              onClick={handleImportButtonClick}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] whitespace-nowrap shrink-0"
            >
              <Upload className="h-3.5 w-3.5 text-[var(--status-healthy)]" />
              Import CSV
            </button>
            <button
              type="button"
              onClick={onResetSampleData}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Load sample plants
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Import plants from CSV file"
      />

      {importFeedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs ${
            importFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300'
          }`}
        >
          <span>{importFeedback.message}</span>
          <button
            type="button"
            onClick={() => setImportFeedback(null)}
            aria-label="Dismiss import message"
            className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {/* Top real-time search bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && searchQuery) {
                setSearchQuery('');
              }
            }}
            placeholder="Search plants by name or plant type..."
            aria-label="Search plants by name or plant type"
            className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] py-2.5 pl-10 pr-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-faint)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {searchQuery.trim() && (
          <span className="font-mono text-xs tabular-nums text-[var(--text-muted)] whitespace-nowrap shrink-0">
            {filteredPlants.length} of {plants.length} matching
          </span>
        )}
      </div>

      {/* Compact metric summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3.5">
          <p className="text-xs text-[var(--text-muted)]">Total plants</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {metrics.total}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3.5">
          <p className="text-xs text-[var(--text-muted)]">Healthy</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--status-healthy)]">
            {metrics.healthy}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3.5">
          <p className="text-xs text-[var(--text-muted)]">Due today</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--status-warning)]">
            {metrics.dueToday}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3.5">
          <p className="text-xs text-[var(--text-muted)]">Overdue</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--status-danger)]">
            {metrics.overdue}
          </p>
        </div>
      </div>

      {/* Filter & actions toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">

          <div
            className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] p-1"
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
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <ArrowUpDown className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[var(--text-faint)]" />
            <select
              aria-label="Sort plants"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="cursor-pointer rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] py-1.5 pl-8 pr-7 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
            >
              <option value="default">Sort: Default (ID)</option>
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
              <option value="health">Health status</option>
              <option value="last_watered_oldest">Last watered (oldest first)</option>
              <option value="last_watered_newest">Last watered (newest first)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleImportButtonClick}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] whitespace-nowrap shrink-0"
          >
            <Upload className="h-3.5 w-3.5 text-[var(--status-healthy)]" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredPlants.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-[var(--status-healthy)]" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={onResetSampleData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset sample
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] whitespace-nowrap shrink-0"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Main collection table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]">
        {filteredPlants.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">No matching plants</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              No plants match {searchQuery.trim() ? `"${searchQuery.trim()}"` : 'the selected health filter'}.
            </p>
            {(searchQuery || healthFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setHealthFilter('all');
                }}
                className="mt-4 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-muted)]">
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
              <tbody className="divide-y divide-[var(--border-default)] text-sm">
                {filteredPlants.map((plant) => (
                  <tr key={plant.id} className="transition-colors hover:bg-[var(--bg-subtle)]">
                    <td className="py-3 pl-5 pr-3 font-mono text-xs tabular-nums text-[var(--text-faint)]">
                      #{String(plant.id).padStart(2, '0')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <PlantThumbnail
                          name={plant.name}
                          imageUrl={plant.image_url}
                          icon={plant.icon}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[var(--text-primary)]">{plant.name}</div>
                          <div className="truncate text-xs text-[var(--text-muted)]">{plant.plant_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-[var(--text-secondary)]">{plant.sunlight}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-[var(--text-primary)]">
                      {plant.watering_days}d
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                      {plant.last_watered ?? 'Never'}
                    </td>
                    <td className="px-3 py-3">{renderWateringCell(plant)}</td>
                    <td className="px-3 py-3">{renderHealthState(plant)}</td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onWaterPlant(plant.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--status-healthy)] whitespace-nowrap shrink-0"
                        >
                          <Droplets className="h-3.5 w-3.5 text-[var(--status-healthy)]" />
                          Water
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditPlant(plant)}
                          aria-label={`Edit ${plant.name}`}
                          title={`Edit ${plant.name}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-faint)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {confirmDeleteId === plant.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeletePlant(plant.id);
                                setConfirmDeleteId(null);
                              }}
                              className="rounded-md bg-[#B91C1C] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-800 whitespace-nowrap shrink-0"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] whitespace-nowrap shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(plant.id)}
                            aria-label={`Delete ${plant.name}`}
                            title={`Delete ${plant.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-faint)] transition-colors hover:bg-red-500/10 hover:text-[var(--status-danger)]"
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Watering Intervals Bar Chart */}
        <section
          aria-label="Watering intervals comparison"
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                Watering intervals by plant
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Required days between waterings across all {plants.length} plants.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#22543B] dark:bg-[#34D399]" aria-hidden="true" />
                  Healthy
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#D97706] dark:bg-[#FBBF24]" aria-hidden="true" />
                  Attention
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#B91C1C] dark:bg-[#F87171]" aria-hidden="true" />
                  Unhealthy
                </span>
              </div>
              <span className="text-[var(--text-faint)]" aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[var(--text-primary)]">
                Avg: {averageWateringDays}d
              </span>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 12, left: -14, bottom: 8 }}
              >
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border-default)' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit="d"
                />
                <Tooltip
                  cursor={{ fill: 'var(--bg-subtle)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload as {
                      name: string;
                      plant_type: string;
                      watering_days: number;
                      health: PlantHealth;
                    };
                    return (
                      <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-xs shadow-sm">
                        <p className="font-semibold text-[var(--text-primary)]">{item.name}</p>
                        <p className="text-[var(--text-muted)]">
                          {item.plant_type} · {item.health}
                        </p>
                        <p className="mt-1 font-mono font-medium tabular-nums text-[var(--status-healthy)]">
                          Every {item.watering_days} {item.watering_days === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="watering_days" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {chartData.map((entry) => {
                    const fill =
                      entry.health === 'Healthy'
                        ? 'var(--status-healthy)'
                        : entry.health === 'Need Attention'
                        ? 'var(--status-warning)'
                        : 'var(--status-danger)';
                    return <Cell key={`cell-${entry.id}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 30-Day Watering Frequency Line Chart */}
        <section
          aria-label="Watering frequency over the last 30 days"
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                Watering frequency (last 30 days)
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Daily watering actions logged across your indoor garden.
              </p>
            </div>

            <span className="font-mono text-xs tabular-nums text-[var(--text-primary)]">
              Total: {totalLast30Days} {totalLast30Days === 1 ? 'action' : 'actions'}
            </span>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={frequencyData}
                margin={{ top: 10, right: 12, left: -14, bottom: 8 }}
              >
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border-default)' }}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload as {
                      date: string;
                      count: number;
                    };
                    return (
                      <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-xs shadow-sm">
                        <p className="font-mono font-medium tabular-nums text-[var(--text-primary)]">
                          {item.date}
                        </p>
                        <p className="mt-0.5 font-mono tabular-nums text-[var(--status-healthy)]">
                          {item.count} {item.count === 1 ? 'watering action' : 'watering actions'}
                        </p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--status-healthy)"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: 'var(--status-healthy)', strokeWidth: 0 }}
                  activeDot={{ r: 4.5, fill: 'var(--status-healthy)', stroke: 'var(--bg-elevated)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
};
