import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CloudUpload,
  Droplets,
  FileCode2,
  Leaf,
  Menu,
  Plus,
  Sprout,
  Terminal,
  X,
} from 'lucide-react';
import { AddPlantModal } from './components/AddPlantModal';
import { BackupView } from './components/BackupView';
import { CliSimulatorView } from './components/CliSimulatorView';
import { CollectionView } from './components/CollectionView';
import { ScheduleView } from './components/ScheduleView';
import { SourceFilesView } from './components/SourceFilesView';
import { createSeedPlants } from './data/seedPlants';
import {
  ActiveSection,
  BackupBlobRecord,
  BackupTarget,
  PlantHealth,
  PlantRecord,
} from './types/plant';
import { evaluatePlantSchedule, getLocalIsoDate } from './utils/schedule';

const PLANTS_STORAGE_KEY = 'plant_care_tracker_plants_v1';
const NEXT_ID_STORAGE_KEY = 'plant_care_tracker_next_id_v1';
const BACKUPS_STORAGE_KEY = 'plant_care_tracker_backups_v1';

const NAV_ITEMS: { id: ActiveSection; label: string; icon: typeof Sprout }[] = [
  { id: 'collection', label: 'Plant Collection', icon: Sprout },
  { id: 'schedule', label: 'Watering Schedule', icon: CalendarClock },
  { id: 'backups', label: 'Azure Backups', icon: CloudUpload },
  { id: 'cli', label: 'CLI Simulator', icon: Terminal },
  { id: 'sources', label: 'Project Files', icon: FileCode2 },
];

const SECTION_TITLES: Record<ActiveSection, string> = {
  collection: 'Plant Collection',
  schedule: 'Watering Schedule',
  backups: 'Azure Backups',
  cli: 'CLI Simulator',
  sources: 'Project Files',
};

function loadInitialPlants(): PlantRecord[] {
  try {
    const raw = localStorage.getItem(PLANTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback to seed plants
  }
  return createSeedPlants();
}

function loadInitialNextId(initialPlants: PlantRecord[]): number {
  try {
    const raw = localStorage.getItem(NEXT_ID_STORAGE_KEY);
    if (raw) {
      const parsed = Number(raw);
      if (Number.isInteger(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // Fallback to max + 1
  }
  const maxId = initialPlants.reduce((max, p) => Math.max(max, p.id), 0);
  return maxId + 1;
}

function loadInitialBackups(): BackupBlobRecord[] {
  try {
    const raw = localStorage.getItem(BACKUPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Empty backups
  }
  return [];
}

export default function App() {
  const [plants, setPlants] = useState<PlantRecord[]>(() => loadInitialPlants());
  const [nextId, setNextId] = useState<number>(() => loadInitialNextId(plants));
  const [backups, setBackups] = useState<BackupBlobRecord[]>(() => loadInitialBackups());

  const [activeSection, setActiveSection] = useState<ActiveSection>('collection');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(PLANTS_STORAGE_KEY, JSON.stringify(plants));
      localStorage.setItem(NEXT_ID_STORAGE_KEY, String(nextId));
    } catch {
      // Ignore storage quota errors
    }
  }, [plants, nextId]);

  useEffect(() => {
    try {
      localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(backups));
    } catch {
      // Ignore storage quota errors
    }
  }, [backups]);

  const dueCount = useMemo(() => {
    const todayIso = getLocalIsoDate();
    return plants.filter((plant) => {
      const sched = evaluatePlantSchedule(plant, todayIso);
      return sched.status === 'overdue' || sched.status === 'due_today';
    }).length;
  }, [plants]);

  const handleAddPlant = (payload: {
    name: string;
    plant_type: string;
    watering_days: number;
    sunlight: string;
    health: PlantHealth;
    last_watered: string | null;
  }): number => {
    const assignedId = nextId;
    const newRecord: PlantRecord = {
      id: assignedId,
      ...payload,
    };
    setPlants((prev) => [...prev, newRecord]);
    setNextId((prev) => prev + 1);
    return assignedId;
  };

  const handleWaterPlant = (id: number): boolean => {
    let found = false;
    const today = getLocalIsoDate();
    setPlants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          found = true;
          return { ...p, last_watered: today };
        }
        return p;
      })
    );
    return plants.some((p) => p.id === id) || found;
  };

  const handleWaterAllDue = () => {
    const today = getLocalIsoDate();
    setPlants((prev) =>
      prev.map((p) => {
        const sched = evaluatePlantSchedule(p, today);
        if (sched.status === 'overdue' || sched.status === 'due_today') {
          return { ...p, last_watered: today };
        }
        return p;
      })
    );
  };

  const handleUpdateHealth = (id: number, health: PlantHealth): boolean => {
    const exists = plants.some((p) => p.id === id);
    if (!exists) return false;
    setPlants((prev) => prev.map((p) => (p.id === id ? { ...p, health } : p)));
    return true;
  };

  const handleDeletePlant = (id: number): string | null => {
    const target = plants.find((p) => p.id === id);
    if (!target) return null;
    setPlants((prev) => prev.filter((p) => p.id !== id));
    return target.name;
  };

  const handleResetSampleData = () => {
    const seeded = createSeedPlants();
    setPlants(seeded);
    setNextId(seeded.reduce((max, p) => Math.max(max, p.id), 0) + 1);
  };

  const handleCreateBackup = (target: BackupTarget): BackupBlobRecord => {
    const now = new Date();
    const utcCompact = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
    const blobName = target === 'azurite' ? 'plants.db' : `plants-${utcCompact}.db`;
    const serialized = JSON.stringify(plants);
    const record: BackupBlobRecord = {
      id: `${target}-${Date.now()}`,
      target,
      containerName: 'plant-care-backups',
      blobName,
      uploadedAt: now.toISOString().slice(0, 19).replace('T', ' ') + ' UTC',
      plantCount: plants.length,
      sizeBytes: 4096 + serialized.length,
      snapshot: plants.map((p) => ({ ...p })),
    };

    setBackups((prev) => {
      if (target === 'azurite') {
        // azure_backup.py uses overwrite=True on plants.db
        const withoutOldAzurite = prev.filter((b) => !(b.target === 'azurite' && b.blobName === 'plants.db'));
        return [record, ...withoutOldAzurite];
      }
      return [record, ...prev];
    });
    return record;
  };

  const handleRestoreBackup = (blob: BackupBlobRecord) => {
    const restored = blob.snapshot.map((p) => ({ ...p }));
    setPlants(restored);
    const maxId = restored.reduce((max, p) => Math.max(max, p.id), 0);
    setNextId((prev) => Math.max(prev, maxId + 1));
  };

  const handleDeleteBackup = (id: string) => {
    setBackups((prev) => prev.filter((b) => b.id !== id));
  };

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-white px-4 py-5">
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
            <Leaf className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Plant Care Tracker
          </span>
        </div>

        <nav className="space-y-1" aria-label="Workspace sections">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setIsMobileNavOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </span>
                {item.id === 'schedule' && dueCount > 0 && (
                  <span className="font-mono text-xs tabular-nums text-amber-700">
                    {dueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 px-2 pt-4 text-xs text-slate-500">
        <p className="font-medium text-slate-700">SQLite Schema Preview</p>
        <p className="mt-1 font-mono text-[11px] text-slate-500">
          plants.db · {plants.length} records
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-64 border-r border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Open navigation"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-slate-500 sm:inline whitespace-nowrap">
                Plant Care Tracker
              </span>
              <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="truncate font-display text-base font-semibold text-slate-900">
                {SECTION_TITLES[activeSection]}
              </h1>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {dueCount > 0 && (
              <button
                type="button"
                onClick={handleWaterAllDue}
                className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:inline-flex whitespace-nowrap shrink-0"
              >
                <Droplets className="h-3.5 w-3.5 text-emerald-600" />
                Water Due ({dueCount})
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Plant
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-[1200px] flex-1 p-4 sm:p-6 lg:p-8">
          {activeSection === 'collection' && (
            <CollectionView
              plants={plants}
              onWaterPlant={handleWaterPlant}
              onUpdateHealth={handleUpdateHealth}
              onDeletePlant={handleDeletePlant}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onResetSampleData={handleResetSampleData}
            />
          )}

          {activeSection === 'schedule' && (
            <ScheduleView
              plants={plants}
              onWaterPlant={handleWaterPlant}
              onWaterAllDue={handleWaterAllDue}
            />
          )}

          {activeSection === 'backups' && (
            <BackupView
              plants={plants}
              backups={backups}
              onCreateBackup={handleCreateBackup}
              onRestoreBackup={handleRestoreBackup}
              onDeleteBackup={handleDeleteBackup}
            />
          )}

          {activeSection === 'cli' && (
            <CliSimulatorView
              plants={plants}
              onAddPlant={handleAddPlant}
              onWaterPlant={handleWaterPlant}
              onDeletePlant={handleDeletePlant}
              onUpdateHealth={handleUpdateHealth}
            />
          )}

          {activeSection === 'sources' && <SourceFilesView />}
        </main>
      </div>

      <AddPlantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddPlant}
      />
    </div>
  );
}
