import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'

import { Products } from './payload/collections/Products'
import { ProductVariants } from './payload/collections/ProductVariants'
import { Categories } from './payload/collections/Categories'
import { Brands } from './payload/collections/Brands'
import { Orders } from './payload/collections/Orders'
import { Customers } from './payload/collections/Customers'
import { Articles } from './payload/collections/Articles'
import { Pages } from './payload/collections/Pages'
import { Media } from './payload/collections/Media'
import { Users } from './payload/collections/Users'

/**
 * Fail loudly rather than booting a second market with a publicly-known secret
 * or an empty connection string. Both used to fall back silently — a deployment
 * that forgot the env var came up looking healthy.
 */
function required(name: 'PAYLOAD_SECRET' | 'DATABASE_URL'): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set. Refusing to start.`)
  return value
}

export default buildConfig({
  secret: required('PAYLOAD_SECRET'),
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' | ТЕХНОЛЕС Admin',
    },
  },
  collections: [
    Products,
    ProductVariants,
    Categories,
    Brands,
    Orders,
    Customers,
    Articles,
    Pages,
    Media,
    Users,
  ],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: required('DATABASE_URL'),
    },
    push: true,
  }),
  sharp,
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
})
