import React, { useEffect, useState } from 'react';
import {
  Clover,
  Flower2,
  Leaf,
  Sprout,
  Sun,
  TreeDeciduous,
} from 'lucide-react';
import { PlantIconId } from '../types/plant';

export const PREDEFINED_PLANT_ICONS: {
  id: PlantIconId;
  label: string;
  Icon: typeof Sprout;
}[] = [
  { id: 'sprout', label: 'Sprout', Icon: Sprout },
  { id: 'leaf', label: 'Foliage', Icon: Leaf },
  { id: 'flower', label: 'Bloom', Icon: Flower2 },
  { id: 'tree', label: 'Tree', Icon: TreeDeciduous },
  { id: 'fern', label: 'Fern', Icon: Clover },
  { id: 'succulent', label: 'Succulent', Icon: Sun },
];

export function getPlantIconComponent(iconId?: PlantIconId): typeof Sprout {
  const match = PREDEFINED_PLANT_ICONS.find((item) => item.id === iconId);
  return match ? match.Icon : Sprout;
}

interface PlantThumbnailProps {
  name: string;
  imageUrl?: string | null;
  icon?: PlantIconId;
  size?: 'sm' | 'md';
}

export const PlantThumbnail: React.FC<PlantThumbnailProps> = ({
  name,
  imageUrl,
  icon = 'sprout',
  size = 'sm',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  const dimensions = size === 'md' ? 'h-11 w-11' : 'h-9 w-9';
  const iconSize = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  const Icon = getPlantIconComponent(icon);

  const trimmedUrl = imageUrl?.trim();

  if (trimmedUrl && !imgFailed) {
    return (
      <div
        className={`${dimensions} shrink-0 overflow-hidden rounded-lg border border-[var(--border-strong)] bg-[var(--bg-muted)]`}
      >
        <img
          src={trimmedUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-muted)] text-[var(--status-healthy)]`}
      aria-hidden="true"
    >
      <Icon className={iconSize} />
    </div>
  );
};
