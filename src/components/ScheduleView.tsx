import React, { useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, Clock, Droplets } from 'lucide-react';
import { PlantRecord, WateringStatus } from '../types/plant';
import { evaluatePlantSchedule, getLocalIsoDate } from '../utils/schedule';
import { PlantThumbnail } from './PlantThumbnail';

interface ScheduleViewProps {
  plants: PlantRecord[];
  onWaterPlant: (id: number) => void;
  onWaterAllDue: () => void;
}

type ScheduleFilter = 'all' | WateringStatus;

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  plants,
  onWaterPlant,
  onWaterAllDue,
}) => {
  const [filter, setFilter] = useState<ScheduleFilter>('all');
  const todayIso = getLocalIsoDate();

  const evaluated = useMemo(() => {
    const priorityOrder: Record<WateringStatus, number> = {
      overdue: 0,
      due_today: 1,
      missing: 2,
      upcoming: 3,
    };

    return plants
      .map((p) => evaluatePlantSchedule(p, todayIso))
      .sort((a, b) => {
        const diff = priorityOrder[a.status] - priorityOrder[b.status];
        if (diff !== 0) return diff;
        if (a.daysLeft !== null && b.daysLeft !== null) {
          return a.daysLeft - b.daysLeft;
        }
        return a.plant.id - b.plant.id;
      });
  }, [plants, todayIso]);

  const counts = useMemo(() => {
    return evaluated.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { overdue: 0, due_today: 0, upcoming: 0, missing: 0 }
    );
  }, [evaluated]);

  const filtered = useMemo(() => {
    if (filter === 'all') return evaluated;
    return evaluated.filter((item) => item.status === filter);
  }, [evaluated, filter]);

  const dueCount = counts.overdue + counts.due_today;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            Watering reminders
          </h2>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            Schedule calculated from <span className="font-mono text-xs">last_watered + watering_days</span> for{' '}
            <span className="font-mono text-xs tabular-nums text-[var(--text-primary)]">{todayIso}</span>.
          </p>
        </div>

        {dueCount > 0 && (
          <button
            type="button"
            onClick={onWaterAllDue}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
          >
            <Droplets className="h-3.5 w-3.5" />
            Water all due ({dueCount})
          </button>
        )}
      </div>

      {/* Filter segmented bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] p-1"
          role="tablist"
          aria-label="Filter watering schedule"
        >
          {(
            [
              { key: 'all', label: `All (${evaluated.length})` },
              { key: 'overdue', label: `Overdue (${counts.overdue})` },
              { key: 'due_today', label: `Water Today (${counts.due_today})` },
              { key: 'upcoming', label: `Upcoming (${counts.upcoming})` },
              { key: 'missing', label: `Missing Info (${counts.missing})` },
            ] as { key: ScheduleFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={filter === tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filter === tab.key
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule list */}
      <div className="divide-y divide-[var(--border-default)] overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]">
        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No plants in this schedule view
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Select another filter or add plants to track their watering cadence.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const { plant, status, nextDate, daysLeft } = item;

            const statusBlock =
              status === 'overdue' ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--status-danger)]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Overdue ({Math.abs(daysLeft ?? 0)} days)</span>
                </div>
              ) : status === 'due_today' ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--status-warning)]">
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  <span>Water today</span>
                </div>
              ) : status === 'upcoming' ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--status-healthy)]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{daysLeft} days remaining</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Watering information missing</span>
                </div>
              );

            return (
              <div
                key={plant.id}
                className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-[var(--bg-subtle)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <PlantThumbnail
                    name={plant.name}
                    imageUrl={plant.image_url}
                    icon={plant.icon}
                    size="sm"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono text-xs tabular-nums text-[var(--text-faint)]">
                        #{String(plant.id).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {plant.name}
                      </span>
                      <span className="text-[var(--text-faint)]" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {plant.plant_type}
                      </span>
                      <span className="text-[var(--text-faint)]" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                        Every {plant.watering_days}d
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                      <span>
                        Last watered:{' '}
                        <span className="font-mono tabular-nums text-[var(--text-primary)]">
                          {plant.last_watered ?? 'Never'}
                        </span>
                      </span>
                      <span>
                        Next watering:{' '}
                        <span className="font-mono tabular-nums text-[var(--text-primary)]">
                          {nextDate ?? 'Pending first watering'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  {statusBlock}
                  <button
                    type="button"
                    onClick={() => onWaterPlant(plant.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      status === 'overdue' || status === 'due_today'
                        ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]'
                        : 'border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                    }`}
                  >
                    <Droplets className="h-3.5 w-3.5" />
                    Water now
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
