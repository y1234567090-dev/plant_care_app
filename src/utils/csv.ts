import { PlantHealth, PlantIconId } from '../types/plant';

export interface ImportedPlantInput {
  name: string;
  plant_type: string;
  watering_days: number;
  sunlight: string;
  health: PlantHealth;
  last_watered: string | null;
  image_url?: string | null;
  icon?: PlantIconId;
}

export interface CsvImportResult {
  plants: ImportedPlantInput[];
  skippedCount: number;
  error?: string;
}

function parseCsvRows(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (ch === '\r' && next === '\n') {
      currentRow.push(currentField.trim());
      if (currentRow.some((cell) => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      currentRow.push(currentField.trim());
      if (currentRow.some((cell) => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += ch;
    }
  }

  currentRow.push(currentField.trim());
  if (currentRow.some((cell) => cell !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

function normalizeHealth(raw?: string): PlantHealth {
  const normalized = (raw ?? '').trim().toLowerCase();
  if (normalized === 'need attention' || normalized === 'needs attention' || normalized === 'warning') {
    return 'Need Attention';
  }
  if (normalized === 'unhealthy' || normalized === 'critical' || normalized === 'poor') {
    return 'Unhealthy';
  }
  return 'Healthy';
}

function normalizeIsoDate(raw?: string): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'never' || trimmed.toLowerCase() === 'none') {
    return null;
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (!match) return null;
  const parsed = new Date(`${match[1]}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : match[1];
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

export function parsePlantsCsv(csvText: string): CsvImportResult {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return {
      plants: [],
      skippedCount: 0,
      error: 'CSV file must contain a header row and at least one plant row.',
    };
  }

  const headers = rows[0].map(normalizeHeader);

  const findIndex = (candidates: string[]): number =>
    headers.findIndex((h) => candidates.includes(h));

  const nameIdx = findIndex(['name', 'plant_name', 'plant']);
  if (nameIdx === -1) {
    return {
      plants: [],
      skippedCount: 0,
      error: 'Missing required "Name" column in CSV header.',
    };
  }

  const typeIdx = findIndex(['type', 'plant_type', 'species', 'category']);
  const sunlightIdx = findIndex(['sunlight', 'light', 'sunlight_requirement']);
  const intervalIdx = findIndex([
    'watering_interval_days_',
    'watering_interval_days',
    'watering_days',
    'watering_interval',
    'interval',
    'interval_days',
  ]);
  const healthIdx = findIndex(['health', 'health_status', 'status']);
  const lastWateredIdx = findIndex(['last_watered', 'last_watered_date', 'watered']);

  const plants: ImportedPlantInput[] = [];
  let skippedCount = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const name = (row[nameIdx] ?? '').trim();
    if (!name) {
      skippedCount += 1;
      continue;
    }

    const rawDays = intervalIdx !== -1 ? Number.parseInt(row[intervalIdx] ?? '', 10) : 7;
    const wateringDays = Number.isInteger(rawDays) && rawDays > 0 ? rawDays : 7;

    plants.push({
      name,
      plant_type: (typeIdx !== -1 ? row[typeIdx] : '')?.trim() || 'Houseplant',
      sunlight: (sunlightIdx !== -1 ? row[sunlightIdx] : '')?.trim() || 'Bright Indirect',
      watering_days: wateringDays,
      health: normalizeHealth(healthIdx !== -1 ? row[healthIdx] : undefined),
      last_watered: normalizeIsoDate(lastWateredIdx !== -1 ? row[lastWateredIdx] : undefined),
      icon: 'sprout',
      image_url: null,
    });
  }

  if (plants.length === 0) {
    return {
      plants: [],
      skippedCount,
      error: 'No valid plant rows found in the CSV file.',
    };
  }

  return { plants, skippedCount };
}
