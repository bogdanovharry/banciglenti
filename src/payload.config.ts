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

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-min-32-chars-long-for-payload',
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
      connectionString: process.env.DATABASE_URL || '',
    },
    push: true,
  }),
  sharp,
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
})
