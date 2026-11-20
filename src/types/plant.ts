export type PlantHealth = 'Healthy' | 'Need Attention' | 'Unhealthy';

export type PlantIconId = 'sprout' | 'leaf' | 'flower' | 'tree' | 'fern' | 'succulent';

export interface PlantRecord {
  id: number;
  name: string;
  plant_type: string;
  watering_days: number;
  sunlight: string;
  health: PlantHealth;
  last_watered: string | null;
  image_url?: string | null;
  icon?: PlantIconId;
}

export type WateringStatus = 'overdue' | 'due_today' | 'upcoming' | 'missing';

export interface PlantScheduleInfo {
  plant: PlantRecord;
  status: WateringStatus;
  nextDate: string | null;
  daysLeft: number | null;
}

export type BackupTarget = 'azurite' | 'azure_cloud';

export interface BackupBlobRecord {
  id: string;
  target: BackupTarget;
  containerName: string;
  blobName: string;
  uploadedAt: string;
  plantCount: number;
  sizeBytes: number;
  snapshot: PlantRecord[];
}

export interface WateringEventRecord {
  id: string;
  plantId: number;
  date: string;
}

export type ActiveSection = 'collection' | 'schedule' | 'backups' | 'cli' | 'sources';
