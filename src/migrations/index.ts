import * as migration_20261020_121258_baseline from './20261020_121258_baseline';
import * as migration_20261110_090000_invoices from './20261110_090000_invoices';
import * as migration_20261112_150000_accounts from './20261112_150000_accounts';

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
  {
    up: migration_20261112_150000_accounts.up,
    down: migration_20261112_150000_accounts.down,
    name: '20261112_150000_accounts'
  },
];
