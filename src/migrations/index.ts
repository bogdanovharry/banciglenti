import * as migration_20261020_121258_baseline from './20261020_121258_baseline';
import * as migration_20261112_150000_accounts from './20261112_150000_accounts';
import * as migration_20261113_100000_revolut from './20261113_100000_revolut';

export const migrations = [
  {
    up: migration_20261020_121258_baseline.up,
    down: migration_20261020_121258_baseline.down,
    name: '20261020_121258_baseline'
  },
  {
    up: migration_20261112_150000_accounts.up,
    down: migration_20261112_150000_accounts.down,
    name: '20261112_150000_accounts'
  },
  {
    up: migration_20261113_100000_revolut.up,
    down: migration_20261113_100000_revolut.down,
    name: '20261113_100000_revolut'
  },
];
