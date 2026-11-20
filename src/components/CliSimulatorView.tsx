import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Terminal } from 'lucide-react';
import { PlantHealth, PlantIconId, PlantRecord } from '../types/plant';
import { evaluatePlantSchedule, getLocalIsoDate } from '../utils/schedule';

interface CliSimulatorViewProps {
  plants: PlantRecord[];
  onAddPlant: (payload: {
    name: string;
    plant_type: string;
    watering_days: number;
    sunlight: string;
    health: PlantHealth;
    last_watered: string | null;
    image_url?: string | null;
    icon?: PlantIconId;
  }) => number;
  onWaterPlant: (id: number) => boolean;
  onDeletePlant: (id: number) => string | null;
  onUpdateHealth: (id: number, health: PlantHealth) => boolean;
}

type CliStep =
  | { mode: 'menu' }
  | { mode: 'add_name' }
  | { mode: 'add_type'; name: string }
  | { mode: 'add_days'; name: string; plantType: string }
  | { mode: 'add_sunlight'; name: string; plantType: string; days: number }
  | { mode: 'water_id' }
  | { mode: 'delete_id' }
  | { mode: 'health_id' }
  | { mode: 'health_choice'; plantId: number }
  | { mode: 'search_id' }
  | { mode: 'exited' };

const MENU_BLOCK = [
  '',
  '================================',
  '       PLANT CARE TRACKER',
  '================================',
  '1. Add New Plant',
  '2. View All Plants',
  '3. Water a Plant',
  '4. Check Watering Schedule',
  '5. Delete Plant',
  '6. Update Plant Health',
  '7. Search Plant',
  '8. Exit',
];

export const CliSimulatorView: React.FC<CliSimulatorViewProps> = ({
  plants,
  onAddPlant,
  onWaterPlant,
  onDeletePlant,
  onUpdateHealth,
}) => {
  const [step, setStep] = useState<CliStep>({ mode: 'menu' });
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<string[]>([
    '$ python main.py',
    'Database ready: plants.db',
    ...MENU_BLOCK,
  ]);
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const getPromptLabel = (currentStep: CliStep): string => {
    switch (currentStep.mode) {
      case 'menu':
        return 'Enter your choice:';
      case 'add_name':
        return 'Enter plant name:';
      case 'add_type':
        return 'Enter plant type:';
      case 'add_days':
        return 'Watering interval (days):';
      case 'add_sunlight':
        return 'Enter sunlight requirement:';
      case 'water_id':
        return 'Enter plant ID:';
      case 'delete_id':
        return 'Enter Plant ID to delete:';
      case 'health_id':
        return 'Enter Plant ID:';
      case 'health_choice':
        return 'Enter your choice (1-3):';
      case 'search_id':
        return 'Enter Plant ID:';
      case 'exited':
        return 'Session ended (click Restart to run main.py again)';
    }
  };

  const appendLines = (lines: string[]) => {
    setHistory((prev) => [...prev, ...lines]);
  };

  const handleRestart = () => {
    setStep({ mode: 'menu' });
    setInputValue('');
    setHistory(['$ python main.py', 'Database ready: plants.db', ...MENU_BLOCK]);
  };

  const processInput = (raw: string) => {
    const value = raw.trim();
    const prompt = getPromptLabel(step);

    if (step.mode === 'exited') {
      return;
    }

    if (step.mode === 'menu') {
      const nextLogs: string[] = [`${prompt} ${value}`];

      if (value === '1') {
        nextLogs.push('', '--- Add New Plant ---');
        appendLines(nextLogs);
        setStep({ mode: 'add_name' });
        return;
      }

      if (value === '2') {
        nextLogs.push('', '--- Your Plants ---');
        if (plants.length === 0) {
          nextLogs.push('No plants found.');
        } else {
          for (const plant of plants) {
            nextLogs.push(
              '',
              '----------------------',
              `Plant ID: ${plant.id}`,
              `Name: ${plant.name}`,
              `Type: ${plant.plant_type}`,
              `Watering Days: ${plant.watering_days}`,
              `Sunlight: ${plant.sunlight}`,
              `Health: ${plant.health}`,
              `Last Watered: ${plant.last_watered ?? 'None'}`
            );
          }
        }
        nextLogs.push(...MENU_BLOCK);
        appendLines(nextLogs);
        return;
      }

      if (value === '3') {
        appendLines(nextLogs);
        setStep({ mode: 'water_id' });
        return;
      }

      if (value === '4') {
        if (plants.length === 0) {
          nextLogs.push('', 'No plants found! Add plants first.');
        } else {
          const todayIso = getLocalIsoDate();
          nextLogs.push('', '========== WATERING REMINDERS ==========');
          for (const plant of plants) {
            const sched = evaluatePlantSchedule(plant, todayIso);
            nextLogs.push('', `Plant: ${plant.name}`);
            if (sched.status === 'missing') {
              nextLogs.push('Watering information missing.');
            } else {
              nextLogs.push(`Last Watered: ${plant.last_watered}`);
              nextLogs.push(`Next Watering: ${sched.nextDate}`);
              if (sched.status === 'overdue') {
                nextLogs.push('Status: OVERDUE!');
                nextLogs.push(`Overdue by: ${Math.abs(sched.daysLeft ?? 0)} days`);
              } else if (sched.status === 'due_today') {
                nextLogs.push('Status: WATER TODAY!');
              } else {
                nextLogs.push('Status: Not due yet.');
                nextLogs.push(`Days remaining: ${sched.daysLeft}`);
              }
            }
          }
          nextLogs.push('', '========================================');
        }
        nextLogs.push(...MENU_BLOCK);
        appendLines(nextLogs);
        return;
      }

      if (value === '5') {
        nextLogs.push('', '--- Delete Plant ---');
        if (plants.length === 0) {
          nextLogs.push('No plants available to delete.', ...MENU_BLOCK);
          appendLines(nextLogs);
          return;
        }
        nextLogs.push('', 'Available Plants:');
        for (const p of plants) {
          nextLogs.push(`ID: ${p.id} | Name: ${p.name}`);
        }
        appendLines(nextLogs);
        setStep({ mode: 'delete_id' });
        return;
      }

      if (value === '6') {
        nextLogs.push('', '--- Update Plant Health ---');
        if (plants.length === 0) {
          nextLogs.push('No plants available.', ...MENU_BLOCK);
          appendLines(nextLogs);
          return;
        }
        nextLogs.push('', 'Available Plants:');
        for (const p of plants) {
          nextLogs.push(`ID: ${p.id} | Name: ${p.name}`);
        }
        appendLines(nextLogs);
        setStep({ mode: 'health_id' });
        return;
      }

      if (value === '7') {
        nextLogs.push('', '--- Search Plant ---');
        appendLines(nextLogs);
        setStep({ mode: 'search_id' });
        return;
      }

      if (value === '8') {
        nextLogs.push('Thank you for using Plant Care Tracker!');
        appendLines(nextLogs);
        setStep({ mode: 'exited' });
        return;
      }

      nextLogs.push('Invalid choice! Please try again.', ...MENU_BLOCK);
      appendLines(nextLogs);
      return;
    }

    if (step.mode === 'add_name') {
      appendLines([`${prompt} ${value}`]);
      setStep({ mode: 'add_type', name: value || 'Unnamed Plant' });
      return;
    }

    if (step.mode === 'add_type') {
      appendLines([`${prompt} ${value}`]);
      setStep({ mode: 'add_days', name: step.name, plantType: value || 'Houseplant' });
      return;
    }

    if (step.mode === 'add_days') {
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) {
        appendLines([`${prompt} ${value}`, 'Please enter a valid number.', ...MENU_BLOCK]);
        setStep({ mode: 'menu' });
        return;
      }
      if (parsed <= 0) {
        appendLines([`${prompt} ${value}`, 'Watering days must be greater than zero.', ...MENU_BLOCK]);
        setStep({ mode: 'menu' });
        return;
      }
      appendLines([`${prompt} ${value}`]);
      setStep({ mode: 'add_sunlight', name: step.name, plantType: step.plantType, days: parsed });
      return;
    }

    if (step.mode === 'add_sunlight') {
      const newId = onAddPlant({
        name: step.name,
        plant_type: step.plantType,
        watering_days: step.days,
        sunlight: value || 'Indirect Light',
        health: 'Healthy',
        last_watered: null,
      });
      appendLines([
        `${prompt} ${value}`,
        'Plant added successfully!',
        `Your Plant ID is: ${newId}`,
        ...MENU_BLOCK,
      ]);
      setStep({ mode: 'menu' });
      return;
    }

    if (step.mode === 'water_id') {
      const id = Number(value);
      const ok = Number.isInteger(id) && onWaterPlant(id);
      appendLines([
        `${prompt} ${value}`,
        ok ? 'Plant watered successfully!' : 'Plant ID not found.',
        ...MENU_BLOCK,
      ]);
      setStep({ mode: 'menu' });
      return;
    }

    if (step.mode === 'delete_id') {
      const id = Number(value);
      if (!Number.isInteger(id)) {
        appendLines([`${prompt} ${value}`, 'Please enter a valid Plant ID.', ...MENU_BLOCK]);
        setStep({ mode: 'menu' });
        return;
      }
      const deletedName = onDeletePlant(id);
      appendLines([
        `${prompt} ${value}`,
        deletedName ? `${deletedName} deleted successfully!` : 'Plant ID not found!',
        ...MENU_BLOCK,
      ]);
      setStep({ mode: 'menu' });
      return;
    }

    if (step.mode === 'health_id') {
      const id = Number(value);
      if (!Number.isInteger(id)) {
        appendLines([`${prompt} ${value}`, 'Please enter a valid Plant ID.', ...MENU_BLOCK]);
        setStep({ mode: 'menu' });
        return;
      }
      const found = plants.find((p) => p.id === id);
      if (!found) {
        appendLines([`${prompt} ${value}`, 'Plant ID not found!', ...MENU_BLOCK]);
        setStep({ mode: 'menu' });
        return;
      }
      appendLines([
        `${prompt} ${value}`,
        '',
        'Select Plant Health:',
        '1. Healthy',
        '2. Need Attention',
        '3. Unhealthy',
      ]);
      setStep({ mode: 'health_choice', plantId: id });
      return;
    }

    if (step.mode === 'health_choice') {
      const map: Record<string, PlantHealth> = {
        '1': 'Healthy',
        '2': 'Need Attention',
        '3': 'Unhealthy',
      };
      const nextHealth = map[value];
      if (!nextHealth) {
        appendLines([`${prompt} ${value}`, 'Invalid choice!', ...MENU_BLOCK]);
        setStep({ mode: 'menu' });
        return;
      }
      onUpdateHealth(step.plantId, nextHealth);
      appendLines([
        `${prompt} ${value}`,
        'Plant health updated successfully!',
        `New Health: ${nextHealth}`,
        ...MENU_BLOCK,
      ]);
      setStep({ mode: 'menu' });
      return;
    }

    if (step.mode === 'search_id') {
      const id = Number(value);
      if (!Number.isInteger(id)) {
        appendLines([`${prompt} ${value}`, 'Please enter a valid Plant ID.', ...MENU_BLOCK]);
        setStep({ mode: 'menu' });
        return;
      }
      const found = plants.find((p) => p.id === id);
      if (!found) {
        appendLines([`${prompt} ${value}`, 'Plant ID not found!', ...MENU_BLOCK]);
      } else {
        appendLines([
          `${prompt} ${value}`,
          '',
          'Plant Found!',
          `Plant ID: ${found.id}`,
          `Name: ${found.name}`,
          `Type: ${found.plant_type}`,
          `Watering Days: ${found.watering_days}`,
          `Sunlight: ${found.sunlight}`,
          `Health: ${found.health}`,
          `Last Watered: ${found.last_watered ?? 'None'}`,
          ...MENU_BLOCK,
        ]);
      }
      setStep({ mode: 'menu' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step.mode === 'exited') return;
    const current = inputValue;
    setInputValue('');
    processInput(current);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            Interactive CLI preview
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Executes <span className="font-mono">main.py</span> menu options 1–8 directly against the live plant database.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {step.mode === 'menu' && (
            <>
              <button
                type="button"
                onClick={() => processInput('2')}
                className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] whitespace-nowrap shrink-0"
              >
                2. View Plants
              </button>
              <button
                type="button"
                onClick={() => processInput('4')}
                className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] whitespace-nowrap shrink-0"
              >
                4. Check Schedule
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart CLI
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2C3B32] bg-[#17231C] text-[#E6ECE7]">
        <div className="flex items-center justify-between border-b border-[#26362C] px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-[#C5D1C8]">
            <Terminal className="h-3.5 w-3.5 text-[#7DD397]" />
            <span className="font-mono">python main.py</span>
          </div>
          <span className="font-mono text-xs tabular-nums text-[#8FA195]">
            {plants.length} rows in plants.db
          </span>
        </div>

        <div
          ref={outputRef}
          className="h-[400px] overflow-y-auto p-4 font-mono text-xs leading-relaxed text-[#DDE6DF]"
        >
          {history.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap break-words">
              {line.includes('OVERDUE!') ? (
                <span className="text-red-300">{line}</span>
              ) : line.includes('WATER TODAY!') ? (
                <span className="text-amber-200">{line}</span>
              ) : line.includes('successfully') || line.startsWith('$ ') ? (
                <span className="text-[#7DD397]">{line}</span>
              ) : (
                line || '\u00A0'
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-[#26362C] bg-[#1D2B22] px-4 py-3">
          <span className="font-mono text-xs font-medium text-[#7DD397] whitespace-nowrap shrink-0">
            {getPromptLabel(step)}
          </span>
          <input
            type="text"
            value={inputValue}
            disabled={step.mode === 'exited'}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={step.mode === 'exited' ? 'Restart CLI to continue' : 'Type choice or value and press Enter'}
            aria-label="CLI command input"
            className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white placeholder:text-[#74857A] focus:outline-none"
          />
          <button
            type="submit"
            disabled={step.mode === 'exited'}
            className="rounded-md bg-[#22543B] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#19412D] disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
