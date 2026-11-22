import * as migration_20261020_121258_baseline from './20261020_121258_baseline';
import * as migration_20261110_090000_invoices from './20261110_090000_invoices';
import * as migration_20261112_150000_accounts from './20261112_150000_accounts';
import * as migration_20261113_100000_revolut from './20261113_100000_revolut';
import * as migration_20261117_100000_billing_mol from './20261117_100000_billing_mol';
import * as migration_20261117_120000_articles_market from './20261117_120000_articles_market';
import * as migration_20261122_120000_product_changes from './20261122_120000_product_changes';

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
  {
    up: migration_20261113_100000_revolut.up,
    down: migration_20261113_100000_revolut.down,
    name: '20261113_100000_revolut'
  },
  {
    up: migration_20261117_100000_billing_mol.up,
    down: migration_20261117_100000_billing_mol.down,
    name: '20261117_100000_billing_mol'
  },
  {
    up: migration_20261117_120000_articles_market.up,
    down: migration_20261117_120000_articles_market.down,
    name: '20261117_120000_articles_market'
  },
  {
    up: migration_20261122_120000_product_changes.up,
    down: migration_20261122_120000_product_changes.down,
    name: '20261122_120000_product_changes'
  },
];
