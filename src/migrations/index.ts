import * as migration_20261020_121258_baseline from './20261020_121258_baseline';
import * as migration_20261110_090000_invoices from './20261110_090000_invoices';

export const migrations = [
  {
    up: migration_20261020_121258_baseline.up,
    down: migration_20261020_121258_baseline.down,
    name: '20261020_121258_baseline'
  },
  {
    up: migration_20261110_090000_invoices.up,
    down: migration_20261110_090000_invoices.down,
    name: '20261110_090000_invoices'
  },
];
