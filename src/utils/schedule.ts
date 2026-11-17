import { PlantRecord, PlantScheduleInfo } from '../types/plant';

/**
 * Formats a Date as YYYY-MM-DD in local time, matching Python's date.today().isoformat().
 */
export function getLocalIsoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function offsetIsoDate(daysOffset: number, baseDate: Date = new Date()): string {
  const copy = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  copy.setDate(copy.getDate() + daysOffset);
  return getLocalIsoDate(copy);
}

/**
 * Parses a YYYY-MM-DD string safely into a local midnight Date.
 */
function parseIsoDateLocal(isoString: string): Date | null {
  const trimmed = isoString.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

/**
 * Exact port of watering.py's check_schedule() logic.
 */
export function evaluatePlantSchedule(
  plant: PlantRecord,
  todayIso: string = getLocalIsoDate()
): PlantScheduleInfo {
  if (!plant.last_watered || !plant.watering_days || plant.watering_days <= 0) {
    return {
      plant,
      status: 'missing',
      nextDate: null,
      daysLeft: null,
    };
  }

  const lastDate = parseIsoDateLocal(plant.last_watered);
  const todayDate = parseIsoDateLocal(todayIso);
  if (!lastDate || !todayDate) {
    return {
      plant,
      status: 'missing',
      nextDate: null,
      daysLeft: null,
    };
  }

  const nextDateObj = new Date(
    lastDate.getFullYear(),
    lastDate.getMonth(),
    lastDate.getDate() + Number(plant.watering_days)
  );
  const nextDate = getLocalIsoDate(nextDateObj);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.round((nextDateObj.getTime() - todayDate.getTime()) / msPerDay);

  if (daysLeft < 0) {
    return { plant, status: 'overdue', nextDate, daysLeft };
  }
  if (daysLeft === 0) {
    return { plant, status: 'due_today', nextDate, daysLeft };
  }
  return { plant, status: 'upcoming', nextDate, daysLeft };
}
