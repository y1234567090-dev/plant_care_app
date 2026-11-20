import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CloudUpload,
  Droplets,
  FileCode2,
  Leaf,
  Moon,
  Plus,
  RotateCcw,
  Sprout,
  Sun,
  Terminal,
} from 'lucide-react';
import { AddPlantModal, PlantFormPayload } from './components/AddPlantModal';
import { BackupView } from './components/BackupView';
import { CliSimulatorView } from './components/CliSimulatorView';
import { CollectionView } from './components/CollectionView';
import { PlantThumbnail } from './components/PlantThumbnail';
import { ScheduleView } from './components/ScheduleView';
import { SourceFilesView } from './components/SourceFilesView';
import { createSeedPlants, createSeedWateringEvents } from './data/seedPlants';
import {
  ActiveSection,
  BackupBlobRecord,
  BackupTarget,
  PlantHealth,
  PlantIconId,
  PlantRecord,
  WateringEventRecord,
} from './types/plant';
import { ImportedPlantInput } from './utils/csv';
import { evaluatePlantSchedule, getLocalIsoDate } from './utils/schedule';

const PLANTS_STORAGE_KEY = 'plant_care_tracker_plants_v1';
const NEXT_ID_STORAGE_KEY = 'plant_care_tracker_next_id_v1';
const BACKUPS_STORAGE_KEY = 'plant_care_tracker_backups_v1';
const THEME_STORAGE_KEY = 'plant_care_tracker_theme_v1';
const WATERING_EVENTS_STORAGE_KEY = 'plant_care_tracker_watering_events_v1';

type PageView = 'front' | 'back';
type ThemeMode = 'light' | 'dark';

const SECOND_PAGE_TABS: { id: ActiveSection; label: string; icon: typeof Sprout }[] = [
  { id: 'collection', label: 'Plants', icon: Sprout },
  { id: 'schedule', label: 'Watering schedule', icon: CalendarClock },
  { id: 'backups', label: 'Azure backups', icon: CloudUpload },
  { id: 'cli', label: 'CLI terminal', icon: Terminal },
  { id: 'sources', label: 'Python files', icon: FileCode2 },
];

function loadInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Fallback to light
  }
  return 'light';
}

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

function getInitialPage(): PageView {
  if (typeof window !== 'undefined' && window.location.hash === '#second-page') {
    return 'back';
  }
  return 'front';
}

function loadInitialWateringEvents(): WateringEventRecord[] {
  try {
    const raw = localStorage.getItem(WATERING_EVENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback to seed events
  }
  return createSeedWateringEvents();
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadInitialTheme());
  const [plants, setPlants] = useState<PlantRecord[]>(() => loadInitialPlants());
  const [nextId, setNextId] = useState<number>(() => loadInitialNextId(plants));
  const [backups, setBackups] = useState<BackupBlobRecord[]>(() => loadInitialBackups());
  const [wateringEvents, setWateringEvents] = useState<WateringEventRecord[]>(() =>
    loadInitialWateringEvents()
  );

  const [currentPage, setCurrentPage] = useState<PageView>(() => getInitialPage());
  const [activeSection, setActiveSection] = useState<ActiveSection>('collection');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantRecord | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [emptyImgFailed, setEmptyImgFailed] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota errors
    }
  }, [theme]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(window.location.hash === '#second-page' ? 'back' : 'front');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: PageView, section?: ActiveSection) => {
    if (section) {
      setActiveSection(section);
    }
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      const targetHash = page === 'back' ? '#second-page' : '#front-page';
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  useEffect(() => {
    try {
      localStorage.setItem(WATERING_EVENTS_STORAGE_KEY, JSON.stringify(wateringEvents));
    } catch {
      // Ignore storage quota errors
    }
  }, [wateringEvents]);

  const scheduleSummary = useMemo(() => {
    const todayIso = getLocalIsoDate();
    let overdue = 0;
    let dueToday = 0;
    let healthy = 0;

    const evaluated = plants.map((plant) => {
      if (plant.health === 'Healthy') healthy += 1;
      const sched = evaluatePlantSchedule(plant, todayIso);
      if (sched.status === 'overdue') overdue += 1;
      if (sched.status === 'due_today') dueToday += 1;
      return sched;
    });

    const priority = evaluated
      .slice()
      .sort((a, b) => {
        const rank = { overdue: 0, due_today: 1, missing: 2, upcoming: 3 };
        const diff = rank[a.status] - rank[b.status];
        if (diff !== 0) return diff;
        return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
      })
      .slice(0, 4);

    return {
      total: plants.length,
      healthy,
      overdue,
      dueToday,
      dueTotal: overdue + dueToday,
      priority,
    };
  }, [plants]);

  const handleAddPlant = (payload: {
    name: string;
    plant_type: string;
    watering_days: number;
    sunlight: string;
    health: PlantHealth;
    last_watered: string | null;
    image_url?: string | null;
    icon?: PlantIconId;
  }): number => {
    const assignedId = nextId;
    const newRecord: PlantRecord = {
      id: assignedId,
      ...payload,
      image_url: payload.image_url ?? null,
      icon: payload.icon ?? 'sprout',
    };
    setPlants((prev) => [...prev, newRecord]);
    setNextId((prev) => prev + 1);
    if (newRecord.last_watered) {
      const wateredDate = newRecord.last_watered;
      setWateringEvents((prev) => [
        ...prev,
        { id: `ev-${assignedId}-${Date.now()}`, plantId: assignedId, date: wateredDate },
      ]);
    }
    return assignedId;
  };

  const handleImportPlants = (imported: ImportedPlantInput[]): number => {
    if (imported.length === 0) return 0;
    const startId = nextId;
    const newRecords: PlantRecord[] = imported.map((item, idx) => ({
      id: startId + idx,
      name: item.name,
      plant_type: item.plant_type,
      watering_days: item.watering_days,
      sunlight: item.sunlight,
      health: item.health,
      last_watered: item.last_watered,
      image_url: item.image_url ?? null,
      icon: item.icon ?? 'sprout',
    }));
    setPlants((prev) => [...prev, ...newRecords]);
    setNextId((prev) => prev + newRecords.length);

    const newEvents: WateringEventRecord[] = newRecords
      .filter((r) => Boolean(r.last_watered))
      .map((r) => ({
        id: `import-${r.id}-${Date.now()}`,
        plantId: r.id,
        date: r.last_watered as string,
      }));
    if (newEvents.length > 0) {
      setWateringEvents((prev) => [...prev, ...newEvents]);
    }
    return newRecords.length;
  };

  const handleWaterPlant = (id: number): boolean => {
    const exists = plants.some((p) => p.id === id);
    if (!exists) return false;
    const today = getLocalIsoDate();
    setPlants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, last_watered: today } : p))
    );
    setWateringEvents((prev) => [
      ...prev,
      { id: `water-${id}-${Date.now()}`, plantId: id, date: today },
    ]);
    return true;
  };

  const handleWaterAllDue = () => {
    const today = getLocalIsoDate();
    const wateredIds: number[] = [];
    setPlants((prev) =>
      prev.map((p) => {
        const sched = evaluatePlantSchedule(p, today);
        if (sched.status === 'overdue' || sched.status === 'due_today') {
          wateredIds.push(p.id);
          return { ...p, last_watered: today };
        }
        return p;
      })
    );
    if (wateredIds.length > 0) {
      const stamp = Date.now();
      setWateringEvents((prev) => [
        ...prev,
        ...wateredIds.map((pid, idx) => ({
          id: `batch-${pid}-${stamp}-${idx}`,
          plantId: pid,
          date: today,
        })),
      ]);
    }
  };

  const handleUpdateHealth = (id: number, health: PlantHealth): boolean => {
    const exists = plants.some((p) => p.id === id);
    if (!exists) return false;
    setPlants((prev) => prev.map((p) => (p.id === id ? { ...p, health } : p)));
    return true;
  };

  const handleEditPlant = (id: number, payload: PlantFormPayload) => {
    const existing = plants.find((p) => p.id === id);
    if (!existing) return;

    setPlants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...payload, id } : p))
    );

    if (payload.last_watered && payload.last_watered !== existing.last_watered) {
      const wateredDate = payload.last_watered;
      setWateringEvents((prev) => [
        ...prev,
        { id: `edit-${id}-${Date.now()}`, plantId: id, date: wateredDate },
      ]);
    }
  };

  const openAddModal = () => {
    setEditingPlant(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (plant: PlantRecord) => {
    setEditingPlant(plant);
    setIsAddModalOpen(true);
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
    setWateringEvents(createSeedWateringEvents());
  };

  const handleClearAll = () => {
    setPlants([]);
    setWateringEvents([]);
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
        const withoutOldAzurite = prev.filter(
          (b) => !(b.target === 'azurite' && b.blobName === 'plants.db')
        );
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

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-150">
      {/* Top Navigation Bar */}
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-canvas)]/90 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-6 px-5 py-3.5 sm:gap-8 sm:px-8">
          <button
            type="button"
            onClick={() => navigateTo('front')}
            className="font-display text-base font-semibold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0"
          >
            Plant Care Tracker
          </button>

          <nav className="flex items-center gap-6 text-sm font-medium" aria-label="Page navigation">
            <button
              type="button"
              onClick={() => navigateTo('front')}
              className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                currentPage === 'front'
                  ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Front Page
            </button>
            <button
              type="button"
              onClick={() => navigateTo('back')}
              className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                currentPage === 'back'
                  ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Second Page
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-pressed={theme === 'dark'}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] whitespace-nowrap shrink-0"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add plant
            </button>
          </div>
        </div>
      </header>

      {/* PAGE 1: FRONT PAGE */}
      {currentPage === 'front' ? (
        <main className="mx-auto max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
          {/* Editorial Hero */}
          <section className="grid grid-cols-1 items-center gap-8 pb-10 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-5 lg:col-span-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.06em] uppercase text-[var(--accent-terracotta)]">
                <Sprout className="h-3.5 w-3.5 shrink-0" />
                <span>Your indoor garden</span>
              </div>

              <h1 className="font-display text-[clamp(2.5rem,4.8vw,3.75rem)] font-semibold leading-[1.04] tracking-tight text-[var(--text-primary)] text-balance">
                Plant Care Tracker
              </h1>

              <p className="max-w-md text-base leading-relaxed text-[var(--text-secondary)]">
                Know who&apos;s thirsty, keep an eye on health, and never forget a watering again.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-primary)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Add plant
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('back', 'collection')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] whitespace-nowrap shrink-0"
                >
                  <span>Open Second Page</span>
                  <ArrowRight className="h-4 w-4 text-[var(--status-healthy)]" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              {heroImgFailed ? (
                <div className="flex aspect-[16/9] items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-muted)] p-8">
                  <div className="text-center text-[var(--text-secondary)]">
                    <Leaf className="mx-auto h-10 w-10 text-[var(--status-healthy)]" />
                    <p className="mt-2 font-display text-lg text-[var(--text-primary)]">
                      Indoor Botanical Collection
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden dark:rounded-2xl dark:border dark:border-[var(--border-default)] dark:bg-[#EBE4D6] dark:p-2">
                  <img
                    src="/src/assets/images/botanical_potted_plants_1794907375701.jpg"
                    alt="Botanical watercolor illustration of potted houseplants including monstera, pothos, fern, and snake plant"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full object-contain mix-blend-multiply"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Front Page Lower Summary / Empty Card */}
          {plants.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-12 text-center sm:py-14">
              {emptyImgFailed ? (
                <div className="mx-auto flex h-11 w-11 items-center justify-center text-[var(--status-healthy)]">
                  <Sprout className="h-8 w-8 stroke-[1.75]" />
                </div>
              ) : (
                <div className="mx-auto w-28 overflow-hidden sm:w-32 dark:rounded-2xl dark:border dark:border-[var(--border-default)] dark:bg-[#EBE4D6] dark:p-2">
                  <img
                    src="/src/assets/images/potted_succulent_lineart_1794921388203.jpg"
                    alt="Minimalist line-art illustration of a potted succulent"
                    referrerPolicy="no-referrer"
                    onError={() => setEmptyImgFailed(true)}
                    className="aspect-square w-full object-contain mix-blend-multiply"
                  />
                </div>
              )}
              <h2 className="mt-3 font-display text-xl font-semibold text-[var(--text-primary)]">
                No plants yet
              </h2>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-[var(--text-secondary)]">
                Add your first plant to start tracking its watering schedule.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Add plant
                </button>
                <button
                  type="button"
                  onClick={handleResetSampleData}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Load sample plants
                </button>
              </div>
            </section>
          ) : (
            <section className="space-y-6 rounded-3xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                    Garden Snapshot
                  </h2>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    Quick overview of your plants. Open the second page for the full table, schedule, backups, and CLI.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {scheduleSummary.dueTotal > 0 && (
                    <button
                      type="button"
                      onClick={handleWaterAllDue}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] whitespace-nowrap shrink-0"
                    >
                      <Droplets className="h-3.5 w-3.5 text-[var(--status-healthy)]" />
                      Water due ({scheduleSummary.dueTotal})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigateTo('back', 'collection')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
                  >
                    <span>Manage all plants</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 4-column summary strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3.5">
                  <p className="text-xs text-[var(--text-muted)]">Total plants</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                    {scheduleSummary.total}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3.5">
                  <p className="text-xs text-[var(--text-muted)]">Healthy</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--status-healthy)]">
                    {scheduleSummary.healthy}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3.5">
                  <p className="text-xs text-[var(--text-muted)]">Due today</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--status-warning)]">
                    {scheduleSummary.dueToday}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3.5">
                  <p className="text-xs text-[var(--text-muted)]">Overdue</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--status-danger)]">
                    {scheduleSummary.overdue}
                  </p>
                </div>
              </div>

              {/* Priority Care Preview */}
              <div className="divide-y divide-[var(--border-default)] overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]">
                {scheduleSummary.priority.map((item) => (
                  <div
                    key={item.plant.id}
                    className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <PlantThumbnail
                        name={item.plant.name}
                        imageUrl={item.plant.image_url}
                        icon={item.plant.icon}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-mono text-xs tabular-nums text-[var(--text-faint)]">
                            #{String(item.plant.id).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {item.plant.name}
                          </span>
                          <span className="text-[var(--text-faint)]" aria-hidden="true">·</span>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {item.plant.plant_type}
                          </span>
                          <span className="text-[var(--text-faint)]" aria-hidden="true">·</span>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {item.plant.sunlight}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      {item.status === 'overdue' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--status-danger)]">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          Overdue ({Math.abs(item.daysLeft ?? 0)}d)
                        </span>
                      ) : item.status === 'due_today' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--status-warning)]">
                          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                          Water today
                        </span>
                      ) : item.status === 'upcoming' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--status-healthy)]">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          In {item.daysLeft}d
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Not watered yet</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleWaterPlant(item.plant.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--status-healthy)] whitespace-nowrap shrink-0"
                      >
                        <Droplets className="h-3.5 w-3.5 text-[var(--status-healthy)]" />
                        Water
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct Links to Second Page Sections */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)] pt-4 text-xs text-[var(--text-secondary)]">
                <span>Explore all tools on the Second Page:</span>
                <div className="flex flex-wrap items-center gap-4">
                  {SECOND_PAGE_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => navigateTo('back', tab.id)}
                      className="font-medium text-[var(--status-healthy)] underline-offset-4 hover:underline whitespace-nowrap shrink-0"
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      ) : (
        /* PAGE 2: SECOND / BACK PAGE */
        <main className="mx-auto max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigateTo('front')}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-terracotta)] transition-colors hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Front Page
              </button>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                Tracker &amp; Tools
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Manage your plant database, check watering reminders, simulate Azure Blob backups, or run the CLI.
              </p>
            </div>

            {scheduleSummary.dueTotal > 0 && (
              <button
                type="button"
                onClick={handleWaterAllDue}
                className="inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] sm:self-auto whitespace-nowrap shrink-0"
              >
                <Droplets className="h-3.5 w-3.5 text-[var(--status-healthy)]" />
                Water due ({scheduleSummary.dueTotal})
              </button>
            )}
          </div>

          <section
            aria-label="Second Page Workspace"
            className="rounded-3xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-6"
          >
            {/* Workspace Navigation Bar */}
            <div className="mb-6 flex flex-col gap-3 border-b border-[var(--border-default)] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <nav
                className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] p-1"
                aria-label="Workspace views"
              >
                {SECOND_PAGE_TABS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isActive ? 'text-[var(--status-healthy)]' : 'text-[var(--text-faint)]'
                        }`}
                      />
                      <span>{item.label}</span>
                      {item.id === 'schedule' && scheduleSummary.dueTotal > 0 && (
                        <span className="font-mono text-[11px] tabular-nums text-[var(--status-warning)]">
                          ({scheduleSummary.dueTotal})
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className="font-mono">plants.db</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{plants.length} plants</span>
              </div>
            </div>

            {activeSection === 'collection' && (
              <CollectionView
                plants={plants}
                wateringEvents={wateringEvents}
                onWaterPlant={handleWaterPlant}
                onUpdateHealth={handleUpdateHealth}
                onEditPlant={openEditModal}
                onDeletePlant={handleDeletePlant}
                onOpenAddModal={openAddModal}
                onResetSampleData={handleResetSampleData}
                onClearAll={handleClearAll}
                onImportPlants={handleImportPlants}
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
          </section>
        </main>
      )}

      <AddPlantModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPlant(null);
        }}
        onAdd={handleAddPlant}
        plantToEdit={editingPlant}
        onEdit={handleEditPlant}
      />
    </div>
  );
}
