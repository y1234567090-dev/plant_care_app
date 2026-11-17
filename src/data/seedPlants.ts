import { PlantRecord } from '../types/plant';
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
    },
    {
      id: 2,
      name: 'Fiddle Leaf Fig',
      plant_type: 'Indoor Tree',
      watering_days: 10,
      sunlight: 'Bright Filtered',
      health: 'Need Attention',
      last_watered: offsetIsoDate(-10), // Due today
    },
    {
      id: 3,
      name: 'Snake Plant',
      plant_type: 'Succulent',
      watering_days: 14,
      sunlight: 'Low to Bright Indirect',
      health: 'Healthy',
      last_watered: offsetIsoDate(-4), // 10 days remaining
    },
    {
      id: 4,
      name: 'Boston Fern',
      plant_type: 'Fern',
      watering_days: 3,
      sunlight: 'Medium Indirect',
      health: 'Unhealthy',
      last_watered: offsetIsoDate(-5), // 2 days overdue
    },
    {
      id: 5,
      name: 'Peace Lily',
      plant_type: 'Flowering Indoor',
      watering_days: 5,
      sunlight: 'Partial Shade',
      health: 'Healthy',
      last_watered: offsetIsoDate(-2), // 3 days remaining
    },
    {
      id: 6,
      name: 'String of Pearls',
      plant_type: 'Trailing Succulent',
      watering_days: 12,
      sunlight: 'Bright Direct Morning',
      health: 'Need Attention',
      last_watered: null, // Never watered yet (like add_plant() before first watering)
    },
  ];
}
