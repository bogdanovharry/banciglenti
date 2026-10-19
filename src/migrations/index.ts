import * as migration_20261019_134927_baseline from './20261019_134927_baseline';

export const migrations = [
  {
    up: migration_20261019_134927_baseline.up,
    down: migration_20261019_134927_baseline.down,
    name: '20261019_134927_baseline'
  },
];
