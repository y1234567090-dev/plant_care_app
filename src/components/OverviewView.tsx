import React, { useMemo } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Check,
  Droplets,
  HeartPulse,
  Plus,
  Sprout,
} from 'lucide-react';
import { ActiveSection, PlantHealth, PlantRecord, PlantScheduleInfo } from '../types/plant';
import { evaluatePlantSchedule, getLocalIsoDate } from '../utils/schedule';

interface OverviewViewProps {
  userName: string;
  plants: PlantRecord[];
  onWaterPlant: (id: number) => boolean;
  onWaterAllDue: () => void;
  onOpenAddModal: () => void;
  onNavigate: (section: ActiveSection) => void;
}

const HEALTH_STYLES: Record<PlantHealth, { bar: string; dot: string; label: string }> = {
  Healthy: { bar: 'bg-emerald-500', dot: 'bg-emerald-500', label: 'Healthy' },
  'Need Attention': { bar: 'bg-amber-400', dot: 'bg-amber-400', label: 'Needs attention' },
  Unhealthy: { bar: 'bg-rose-500', dot: 'bg-rose-500', label: 'Unhealthy' },
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function dueLabel(info: PlantScheduleInfo): { text: string; className: string } {
  if (info.status === 'overdue' && info.daysLeft !== null) {
    const days = Math.abs(info.daysLeft);
    return {
      text: `${days} day${days === 1 ? '' : 's'} overdue`,
      className: 'bg-rose-100 text-rose-700',
    };
  }
  return { text: 'Water today', className: 'bg-sky-100 text-sky-700' };
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  userName,
  plants,
  onWaterPlant,
  onWaterAllDue,
  onOpenAddModal,
  onNavigate,
}) => {
  const todayIso = getLocalIsoDate();

  const { dueNow, upcoming, neverWatered } = useMemo(() => {
    const evaluated = plants.map((plant) => evaluatePlantSchedule(plant, todayIso));
    const due = evaluated
      .filter((s) => s.status === 'overdue' || s.status === 'due_today')
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
    const soon = evaluated
      .filter((s) => s.status === 'upcoming' && s.daysLeft !== null && s.daysLeft <= 7)
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
    const missing = evaluated.filter((s) => s.status === 'missing');
    return { dueNow: due, upcoming: soon, neverWatered: missing };
  }, [plants, todayIso]);

  const healthCounts = useMemo(() => {
    const counts: Record<PlantHealth, number> = { Healthy: 0, 'Need Attention': 0, Unhealthy: 0 };
    plants.forEach((p) => {
      if (p.health in counts) counts[p.health] += 1;
    });
    return counts;
  }, [plants]);

  const firstName = userName.trim().split(/\s+/)[0] || 'there';
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const needsCare = healthCounts['Need Attention'] + healthCounts.Unhealthy;

  const stats = [
    {
      label: 'Plants',
      value: plants.length,
      hint: 'in your collection',
      icon: Sprout,
      tone: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Need water',
      value: dueNow.length,
      hint: dueNow.length === 0 ? 'all caught up' : 'due or overdue',
      icon: Droplets,
      tone: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Coming up',
      value: upcoming.length,
      hint: 'in the next 7 days',
      icon: CalendarClock,
      tone: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'Need care',
      value: needsCare,
      hint: 'attention or unhealthy',
      icon: HeartPulse,
      tone: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-700 via-emerald-600 to-emerald-500 p-6 text-white sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100/85">
              {todayLabel}
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting()}, {firstName}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-emerald-50/90 sm:text-base">
              {dueNow.length === 0
                ? 'Every plant is watered for now. Enjoy the green.'
                : `${dueNow.length} ${dueNow.length === 1 ? 'plant needs' : 'plants need'} water today.`}
              {neverWatered.length > 0 &&
                ` ${neverWatered.length} ${neverWatered.length === 1 ? 'plant has' : 'plants have'} no watering date yet.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {dueNow.length > 0 && (
              <button
                type="button"
                onClick={onWaterAllDue}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition-colors hover:bg-emerald-50"
              >
                <Droplets className="h-4 w-4 text-sky-600" />
                Water all due ({dueNow.length})
              </button>
            )}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition-colors hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              Add plant
            </button>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Summary">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{stat.label}</span>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.tone}`}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-3 font-display text-3xl font-bold tabular-nums text-slate-900">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{stat.hint}</p>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Today's care */}
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Today's care</h3>
            <button
              type="button"
              onClick={() => onNavigate('schedule')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Full schedule
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {dueNow.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-900">You're all caught up</p>
              <p className="mt-1 text-xs text-slate-500">Nothing needs water right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {dueNow.map((info) => {
                const label = dueLabel(info);
                return (
                  <li
                    key={info.plant.id}
                    className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Sprout className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {info.plant.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {info.plant.plant_type} · {info.plant.sunlight}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${label.className}`}
                      >
                        {label.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => onWaterPlant(info.plant.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
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

        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Health breakdown */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Plant health</h3>
              <button
                type="button"
                onClick={() => onNavigate('collection')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {plants.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Add a plant to see its health here.</p>
            ) : (
              <>
                <div
                  className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100"
                  role="img"
                  aria-label={`Health: ${healthCounts.Healthy} healthy, ${healthCounts['Need Attention']} need attention, ${healthCounts.Unhealthy} unhealthy`}
                >
                  {(Object.keys(HEALTH_STYLES) as PlantHealth[]).map((key) =>
                    healthCounts[key] > 0 ? (
                      <div
                        key={key}
                        className={HEALTH_STYLES[key].bar}
                        style={{ width: `${(healthCounts[key] / plants.length) * 100}%` }}
                      />
                    ) : null
                  )}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {(Object.keys(HEALTH_STYLES) as PlantHealth[]).map((key) => (
                    <li key={key} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className={`h-2.5 w-2.5 rounded-full ${HEALTH_STYLES[key].dot}`} />
                        {HEALTH_STYLES[key].label}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-slate-900">
                        {healthCounts[key]}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Next 7 days */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">Next 7 days</h3>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No other plants need water this week.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {upcoming.map((info) => (
                  <li key={info.plant.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0 truncate text-sm text-slate-700">{info.plant.name}</span>
                    <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                      {info.daysLeft === 1 ? 'Tomorrow' : `In ${info.daysLeft} days`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
