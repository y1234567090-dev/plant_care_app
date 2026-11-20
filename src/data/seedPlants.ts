import { PlantRecord, WateringEventRecord } from '../types/plant';
import { offsetIsoDate } from '../utils/schedule';

export function createSeedPlants(): PlantRecord[] {
  return [
    {
      id: 1,
      name: 'Monstera Deliciosa',
      plant_type: 'Tropical Aroid',
      watering_days: 7,
      sunlight: 'Bright Indirect',
      health: 'Healthy',
      last_watered: offsetIsoDate(-9), // 2 days overdue
      icon: 'leaf',
      image_url: null,
    },
    {
      id: 2,
      name: 'Fiddle Leaf Fig',
      plant_type: 'Indoor Tree',
      watering_days: 10,
      sunlight: 'Bright Filtered',
      health: 'Need Attention',
      last_watered: offsetIsoDate(-10), // Due today
      icon: 'tree',
      image_url: null,
    },
    {
      id: 3,
      name: 'Snake Plant',
      plant_type: 'Succulent',
      watering_days: 14,
      sunlight: 'Low to Bright Indirect',
      health: 'Healthy',
      last_watered: offsetIsoDate(-4), // 10 days remaining
      icon: 'succulent',
      image_url: null,
    },
    {
      id: 4,
      name: 'Boston Fern',
      plant_type: 'Fern',
      watering_days: 3,
      sunlight: 'Medium Indirect',
      health: 'Unhealthy',
      last_watered: offsetIsoDate(-5), // 2 days overdue
      icon: 'fern',
      image_url: null,
    },
    {
      id: 5,
      name: 'Peace Lily',
      plant_type: 'Flowering Indoor',
      watering_days: 5,
      sunlight: 'Partial Shade',
      health: 'Healthy',
      last_watered: offsetIsoDate(-2), // 3 days remaining
      icon: 'flower',
      image_url: null,
    },
    {
      id: 6,
      name: 'String of Pearls',
      plant_type: 'Trailing Succulent',
      watering_days: 12,
      sunlight: 'Bright Direct Morning',
      health: 'Need Attention',
      last_watered: null, // Never watered yet
      icon: 'sprout',
      image_url: null,
    },
  ];
}

export function createSeedWateringEvents(): WateringEventRecord[] {
  const scheduleOffsets: { plantId: number; offsets: number[] }[] = [
    { plantId: 1, offsets: [-9, -16, -23] },
    { plantId: 2, offsets: [-10, -20] },
    { plantId: 3, offsets: [-4, -18] },
    { plantId: 4, offsets: [-5, -8, -11, -14, -17, -20, -23, -26, -29] },
    { plantId: 5, offsets: [-2, -7, -12, -17, -22, -27] },
  ];

  const events: WateringEventRecord[] = [];
  for (const entry of scheduleOffsets) {
    for (const offset of entry.offsets) {
      events.push({
        id: `seed-${entry.plantId}-${offset}`,
        plantId: entry.plantId,
        date: offsetIsoDate(offset),
      });
    }
  }
  return events;
}
