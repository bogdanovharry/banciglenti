import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
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
    push: true, // Auto-create tables in development/first deploy
  }),
  sharp,
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
  plugins: [
    seoPlugin({
      collections: ['products', 'articles', 'pages'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }: { doc: Record<string, unknown> }) =>
        `${doc?.title || doc?.name || 'ТЕХНОЛЕС'} | Банциг ленти и режещи инструменти`,
      generateDescription: ({ doc }: { doc: Record<string, unknown> }) =>
        (doc?.shortDescription as string) || (doc?.description as string) || '',
    }),
  ],
})
