import * as migration_20261020_121258_baseline from './20261020_121258_baseline';

export const migrations = [
  {
    up: migration_20261020_121258_baseline.up,
    down: migration_20261020_121258_baseline.down,
    name: '20261020_121258_baseline'
  },
];
