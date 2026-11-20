import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { PlantHealth, PlantIconId, PlantRecord } from '../types/plant';
import { getLocalIsoDate } from '../utils/schedule';
import { PREDEFINED_PLANT_ICONS, PlantThumbnail } from './PlantThumbnail';

export interface PlantFormPayload {
  name: string;
  plant_type: string;
  watering_days: number;
  sunlight: string;
  health: PlantHealth;
  last_watered: string | null;
  image_url: string | null;
  icon: PlantIconId;
}

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: PlantFormPayload) => number;
  plantToEdit?: PlantRecord | null;
  onEdit?: (id: number, payload: PlantFormPayload) => void;
}

type ThumbnailMode = 'icon' | 'image_url';

function isValidLocalImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('data:image/')
  );
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  plantToEdit = null,
  onEdit,
}) => {
  const isEditMode = Boolean(plantToEdit);

  const [name, setName] = useState('');
  const [plantType, setPlantType] = useState('');
  const [wateringDays, setWateringDays] = useState('7');
  const [sunlight, setSunlight] = useState('Bright Indirect');
  const [health, setHealth] = useState<PlantHealth>('Healthy');
  const [wateredToday, setWateredToday] = useState(true);
  const [lastWateredDate, setLastWateredDate] = useState('');
  const [thumbnailMode, setThumbnailMode] = useState<ThumbnailMode>('icon');
  const [selectedIcon, setSelectedIcon] = useState<PlantIconId>('sprout');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (plantToEdit) {
      setName(plantToEdit.name);
      setPlantType(plantToEdit.plant_type);
      setWateringDays(String(plantToEdit.watering_days));
      setSunlight(plantToEdit.sunlight);
      setHealth(plantToEdit.health);
      setLastWateredDate(plantToEdit.last_watered ?? '');
      setWateredToday(Boolean(plantToEdit.last_watered));
      setThumbnailMode(plantToEdit.image_url ? 'image_url' : 'icon');
      setSelectedIcon(plantToEdit.icon ?? 'sprout');
      setImageUrl(plantToEdit.image_url ?? '');
      setError(null);
    } else {
      setName('');
      setPlantType('');
      setWateringDays('7');
      setSunlight('Bright Indirect');
      setHealth('Healthy');
      setWateredToday(true);
      setLastWateredDate('');
      setThumbnailMode('icon');
      setSelectedIcon('sprout');
      setImageUrl('');
      setError(null);
    }
  }, [isOpen, plantToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Plant name is required.');
      return;
    }

    const parsedDays = Number(wateringDays);
    if (!Number.isInteger(parsedDays) || parsedDays <= 0) {
      setError('Watering interval must be a whole number greater than zero.');
      return;
    }

    let resolvedImageUrl: string | null = null;
    if (thumbnailMode === 'image_url') {
      const trimmedUrl = imageUrl.trim();
      if (!trimmedUrl) {
        setError('Please enter a local image URL or switch to an icon thumbnail.');
        return;
      }
      if (!isValidLocalImageUrl(trimmedUrl)) {
        setError('Use a local path starting with "/" or "./", or a data:image/ URL.');
        return;
      }
      resolvedImageUrl = trimmedUrl;
    }

    const resolvedLastWatered = isEditMode
      ? lastWateredDate.trim() || null
      : wateredToday
      ? getLocalIsoDate()
      : null;

    const payload: PlantFormPayload = {
      name: trimmedName,
      plant_type: plantType.trim() || 'Houseplant',
      watering_days: parsedDays,
      sunlight: sunlight.trim() || 'Indirect Light',
      health,
      last_watered: resolvedLastWatered,
      image_url: resolvedImageUrl,
      icon: selectedIcon,
    };

    if (isEditMode && plantToEdit && onEdit) {
      onEdit(plantToEdit.id, payload);
    } else {
      onAdd(payload);
    }

    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plant-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
          <div className="flex items-baseline gap-2">
            <h2 id="plant-modal-title" className="font-display text-lg font-semibold text-[var(--text-primary)]">
              {isEditMode ? 'Edit plant' : 'Add new plant'}
            </h2>
            {isEditMode && plantToEdit && (
              <span className="font-mono text-xs tabular-nums text-[var(--text-faint)]">
                #{String(plantToEdit.id).padStart(2, '0')}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="plant-name" className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Plant name
            </label>
            <input
              id="plant-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monstera Deliciosa"
              autoFocus
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
            />
          </div>

          {/* Visual Thumbnail Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-primary)]">Plant thumbnail</span>
              <div
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] p-0.5"
                role="tablist"
                aria-label="Thumbnail source"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={thumbnailMode === 'icon'}
                  onClick={() => setThumbnailMode('icon')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    thumbnailMode === 'icon'
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Icon
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={thumbnailMode === 'image_url'}
                  onClick={() => setThumbnailMode('image_url')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    thumbnailMode === 'image_url'
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Local image URL
                </button>
              </div>
            </div>

            {thumbnailMode === 'icon' ? (
              <div className="grid grid-cols-3 gap-2">
                {PREDEFINED_PLANT_ICONS.map(({ id, label, Icon }) => {
                  const isSelected = selectedIcon === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedIcon(id)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                        isSelected
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/12 text-[var(--text-primary)]'
                          : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? 'text-[var(--status-healthy)]' : 'text-[var(--text-faint)]'
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
                <div className="flex items-center gap-3">
                  <PlantThumbnail
                    name={name.trim() || 'Plant preview'}
                    imageUrl={imageUrl}
                    icon={selectedIcon}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="local-image-url" className="sr-only">
                      Local image URL
                    </label>
                    <input
                      id="local-image-url"
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="/src/assets/images/..."
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                  <span>Path starting with / or ./ (falls back to icon on error)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrl('/src/assets/images/botanical_potted_plants_1794907375701.jpg')
                    }
                    className="inline-flex items-center gap-1 font-medium text-[var(--status-healthy)] hover:underline whitespace-nowrap shrink-0"
                  >
                    <ImageIcon className="h-3 w-3" />
                    Use sample
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="plant-type" className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Plant type
              </label>
              <input
                id="plant-type"
                type="text"
                value={plantType}
                onChange={(e) => setPlantType(e.target.value)}
                placeholder="e.g., Tropical Aroid"
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
              />
            </div>

            <div>
              <label htmlFor="watering-days" className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Watering interval (days)
              </label>
              <input
                id="watering-days"
                type="number"
                min={1}
                step={1}
                value={wateringDays}
                onChange={(e) => setWateringDays(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm tabular-nums text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sunlight" className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Sunlight requirement
              </label>
              <input
                id="sunlight"
                type="text"
                value={sunlight}
                onChange={(e) => setSunlight(e.target.value)}
                placeholder="e.g., Bright Indirect"
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
              />
            </div>

            <div>
              <label htmlFor="plant-health" className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                {isEditMode ? 'Health status' : 'Initial health'}
              </label>
              <select
                id="plant-health"
                value={health}
                onChange={(e) => setHealth(e.target.value as PlantHealth)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
              >
                <option value="Healthy">Healthy</option>
                <option value="Need Attention">Need Attention</option>
                <option value="Unhealthy">Unhealthy</option>
              </select>
            </div>
          </div>

          {isEditMode ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="last-watered-date" className="text-sm font-medium text-[var(--text-primary)]">
                  Last watered date
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setLastWateredDate(getLocalIsoDate())}
                    className="font-medium text-[var(--status-healthy)] hover:underline"
                  >
                    Today
                  </button>
                  {lastWateredDate && (
                    <>
                      <span className="text-[var(--text-faint)]" aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => setLastWateredDate('')}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>
              <input
                id="last-watered-date"
                type="date"
                value={lastWateredDate}
                onChange={(e) => setLastWateredDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm tabular-nums text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
              />
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={wateredToday}
                onChange={(e) => setWateredToday(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
              />
              <span>Mark as watered today ({getLocalIsoDate()})</span>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[var(--border-default)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0"
            >
              {isEditMode ? 'Save changes' : 'Save plant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
