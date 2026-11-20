import React, { useMemo } from 'react';
import { ArrowRight, Check, Droplets, Plus, Sprout, Sun } from 'lucide-react';
import { ActiveSection, PlantHealth, PlantRecord, PlantScheduleInfo } from '../types/plant';
import { evaluatePlantSchedule, getLocalIsoDate } from '../utils/schedule';
import { PlantIllustration } from './PlantIllustration';

interface FrontPageProps {
  userName: string;
  plants: PlantRecord[];
  onAddPlant: () => void;
  onWaterPlant: (id: number) => boolean;
  onOpenSecondPage: (section?: ActiveSection) => void;
}

const HEALTH_CHIP: Record<PlantHealth, string> = {
  Healthy: 'bg-emerald-100 text-emerald-800',
  'Need Attention': 'bg-amber-100 text-amber-700',
  Unhealthy: 'bg-rose-100 text-rose-700',
};

function waterLabel(info: PlantScheduleInfo): { text: string; className: string } {
  switch (info.status) {
    case 'overdue': {
      const days = Math.abs(info.daysLeft ?? 0);
      return {
        text: `${days} day${days === 1 ? '' : 's'} overdue`,
        className: 'bg-rose-100 text-rose-700',
      };
    }
    case 'due_today':
      return { text: 'Water today', className: 'bg-sky-100 text-sky-700' };
    case 'upcoming':
      return {
        text: info.daysLeft === 1 ? 'Water tomorrow' : `Water in ${info.daysLeft} days`,
        className: 'bg-slate-100 text-slate-600',
      };
    default:
      return { text: 'Not watered yet', className: 'bg-amber-100 text-amber-700' };
  }
}

export const FrontPage: React.FC<FrontPageProps> = ({
  userName,
  plants,
  onAddPlant,
  onWaterPlant,
  onOpenSecondPage,
}) => {
  const todayIso = getLocalIsoDate();

  const schedule = useMemo(
    () => plants.map((plant) => evaluatePlantSchedule(plant, todayIso)),
    [plants, todayIso]
  );
  const due = schedule.filter((s) => s.status === 'overdue' || s.status === 'due_today');
  const healthyCount = plants.filter((p) => p.health === 'Healthy').length;
  const firstName = userName.trim().split(/\s+/)[0] || 'there';

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="pt-4 sm:pt-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
          <Sprout className="h-4 w-4" />
          Your indoor garden
        </p>
        <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 text-balance sm:text-6xl lg:text-7xl">
          Plant Care Tracker
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-500">
          Know who's thirsty, keep an eye on health, and never forget a watering again.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onAddPlant}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
          >
            <Plus className="h-4 w-4" />
            Add plant
          </button>
          <button
            type="button"
            onClick={() => onOpenSecondPage('overview')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25"
          >
            Open Second Page
            <ArrowRight className="h-4 w-4 text-emerald-500" />
          </button>
        </div>
      </section>

      {/* Illustration + today at a glance */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="overflow-hidden rounded-3xl border border-slate-200 lg:col-span-3">
          <PlantIllustration className="block h-full w-full" />
        </div>

        <div className="flex min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Today at a glance
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
            {due.length === 0
              ? `All watered, ${firstName}`
              : `${due.length} ${due.length === 1 ? 'plant needs' : 'plants need'} water`}
          </h2>

          <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Plants', value: plants.length },
              { label: 'Healthy', value: healthyCount },
              { label: 'Due now', value: due.length },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-100 px-2 py-3">
                <dd className="font-display text-2xl font-bold tabular-nums text-slate-900">
                  {item.value}
                </dd>
                <dt className="mt-0.5 text-xs text-slate-500">{item.label}</dt>
              </div>
            ))}
          </dl>

          {due.length === 0 ? (
            <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-900">Nothing to water right now</p>
              <p className="mt-1 text-xs text-slate-500">Your plants are happy for today.</p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-200">
              {due.slice(0, 4).map((info) => {
                const label = waterLabel(info);
                return (
                  <li key={info.plant.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{info.plant.name}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${label.className}`}
                      >
                        {label.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onWaterPlant(info.plant.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      <Droplets className="h-3.5 w-3.5" />
                      Water
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={() => onOpenSecondPage('overview')}
            className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Open your workspace
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Collection preview */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
              Your collection
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">
              Meet your plants
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenSecondPage('collection')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Manage all plants
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {plants.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 px-6 py-14 text-center">
            <p className="font-display text-xl font-semibold text-slate-900">No plants yet</p>
            <p className="mt-1 text-sm text-slate-500">Add your first plant to start tracking.</p>
            <button
              type="button"
              onClick={onAddPlant}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add plant
            </button>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schedule.slice(0, 6).map((info) => {
              const label = waterLabel(info);
              return (
                <li
                  key={info.plant.id}
                  className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-semibold text-slate-900">
                        {info.plant.name}
                      </h3>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{info.plant.plant_type}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${HEALTH_CHIP[info.plant.health]}`}
                    >
                      {info.plant.health}
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Sun className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span className="truncate">{info.plant.sunlight}</span>
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0">every {info.plant.watering_days} days</span>
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${label.className}`}
                    >
                      {label.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => onWaterPlant(info.plant.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-500 hover:text-emerald-700"
                    >
                      <Droplets className="h-3.5 w-3.5" />
                      Water
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
