import { useEffect, useMemo, useState } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { AuthUser, clearSession, loadSession, saveSession } from './auth';
import { AddPlantModal } from './components/AddPlantModal';
import { BackupView } from './components/BackupView';
import { CliSimulatorView } from './components/CliSimulatorView';
import { CollectionView } from './components/CollectionView';
import { FrontPage } from './components/FrontPage';
import { LoginPage } from './components/LoginPage';
import { OverviewView } from './components/OverviewView';
import { ScheduleView } from './components/ScheduleView';
import { SourceFilesView } from './components/SourceFilesView';
import { ThemeToggle } from './components/ThemeToggle';
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

type Page = 'front' | 'second';

const PAGE_TABS: { id: Page; label: string }[] = [
  { id: 'front', label: 'Front Page' },
  { id: 'second', label: 'Second Page' },
];

const SECTIONS: { id: ActiveSection; label: string }[] = [
  { id: 'overview', label: 'Today' },
  { id: 'collection', label: 'Plant Collection' },
  { id: 'schedule', label: 'Watering Schedule' },
  { id: 'backups', label: 'Azure Backups' },
  { id: 'cli', label: 'CLI Simulator' },
  { id: 'sources', label: 'Project Files' },
];

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

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => loadSession());

  const handleLogin = (next: AuthUser) => {
    saveSession(next);
    setUser(next);
  };

  const handleSignOut = () => {
    clearSession();
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Workspace user={user} onSignOut={handleSignOut} />;
}

function UserMenu({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-emerald-100 text-xs font-bold text-emerald-800 transition-colors hover:border-emerald-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25"
      >
        {initialsOf(user.name)}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-black/20">
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-slate-200" />
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Workspace({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const [plants, setPlants] = useState<PlantRecord[]>(() => loadInitialPlants());
  const [nextId, setNextId] = useState<number>(() => loadInitialNextId(plants));
  const [backups, setBackups] = useState<BackupBlobRecord[]>(() => loadInitialBackups());

  const [page, setPage] = useState<Page>('front');
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const openSecondPage = (section?: ActiveSection) => {
    if (section) setActiveSection(section);
    setPage('second');
    window.scrollTo({ top: 0 });
  };

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

  const sectionTitle = SECTIONS.find((s) => s.id === activeSection)?.label ?? '';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pt-3 sm:px-6 sm:py-0 lg:px-8">
          <button
            type="button"
            onClick={() => setPage('front')}
            className="font-display text-xl font-bold tracking-tight text-slate-900 sm:py-5"
          >
            Plant Care Tracker
          </button>

          <nav
            aria-label="Pages"
            className="order-3 flex w-full justify-center gap-2 sm:order-none sm:w-auto"
          >
            {PAGE_TABS.map((tab) => {
              const isActive = page === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setPage(tab.id)}
                  className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:py-[1.55rem] ${
                    isActive
                      ? 'border-emerald-500 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5 sm:py-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              Add plant
            </button>
            <UserMenu user={user} onSignOut={onSignOut} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {page === 'front' && (
          <FrontPage
            userName={user.name}
            plants={plants}
            onAddPlant={() => setIsAddModalOpen(true)}
            onWaterPlant={handleWaterPlant}
            onOpenSecondPage={openSecondPage}
          />
        )}

        {page === 'second' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                Your workspace
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {sectionTitle}
              </h1>
            </div>

            <div
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
              role="tablist"
              aria-label="Workspace sections"
            >
              {SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveSection(section.id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {section.label}
                    {section.id === 'schedule' && dueCount > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
                          isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {dueCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeSection === 'overview' && (
              <OverviewView
                userName={user.name}
                plants={plants}
                onWaterPlant={handleWaterPlant}
                onWaterAllDue={handleWaterAllDue}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onNavigate={setActiveSection}
              />
            )}

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
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 px-4 py-5 text-center font-mono text-[11px] text-slate-500">
        plants.db · {plants.length} records
      </footer>

      <AddPlantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddPlant}
      />
    </div>
  );
}
