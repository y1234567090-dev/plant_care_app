import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PlantHealth } from '../types/plant';
import { getLocalIsoDate } from '../utils/schedule';

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: {
    name: string;
    plant_type: string;
    watering_days: number;
    sunlight: string;
    health: PlantHealth;
    last_watered: string | null;
  }) => number;
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [plantType, setPlantType] = useState('');
  const [wateringDays, setWateringDays] = useState('7');
  const [sunlight, setSunlight] = useState('Bright Indirect');
  const [health, setHealth] = useState<PlantHealth>('Healthy');
  const [wateredToday, setWateredToday] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    onAdd({
      name: trimmedName,
      plant_type: plantType.trim() || 'Houseplant',
      watering_days: parsedDays,
      sunlight: sunlight.trim() || 'Indirect Light',
      health,
      last_watered: wateredToday ? getLocalIsoDate() : null,
    });

    setName('');
    setPlantType('');
    setWateringDays('7');
    setSunlight('Bright Indirect');
    setHealth('Healthy');
    setWateredToday(true);
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-plant-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="add-plant-title" className="text-base font-semibold text-slate-900">
            Add New Plant
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="plant-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Plant Name
            </label>
            <input
              id="plant-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monstera Deliciosa"
              autoFocus
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="plant-type" className="mb-1.5 block text-sm font-medium text-slate-700">
                Plant Type
              </label>
              <input
                id="plant-type"
                type="text"
                value={plantType}
                onChange={(e) => setPlantType(e.target.value)}
                placeholder="e.g., Tropical Aroid"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
              />
            </div>

            <div>
              <label htmlFor="watering-days" className="mb-1.5 block text-sm font-medium text-slate-700">
                Watering Interval (days)
              </label>
              <input
                id="watering-days"
                type="number"
                min={1}
                step={1}
                value={wateringDays}
                onChange={(e) => setWateringDays(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sunlight" className="mb-1.5 block text-sm font-medium text-slate-700">
                Sunlight Requirement
              </label>
              <input
                id="sunlight"
                type="text"
                value={sunlight}
                onChange={(e) => setSunlight(e.target.value)}
                placeholder="e.g., Bright Indirect"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
              />
            </div>

            <div>
              <label htmlFor="plant-health" className="mb-1.5 block text-sm font-medium text-slate-700">
                Initial Health
              </label>
              <select
                id="plant-health"
                value={health}
                onChange={(e) => setHealth(e.target.value as PlantHealth)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
              >
                <option value="Healthy">Healthy</option>
                <option value="Need Attention">Need Attention</option>
                <option value="Unhealthy">Unhealthy</option>
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={wateredToday}
              onChange={(e) => setWateredToday(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            <span>Mark as watered today ({getLocalIsoDate()})</span>
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
            >
              Save Plant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
