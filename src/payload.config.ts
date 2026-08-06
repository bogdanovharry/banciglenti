import { buildConfig, type Plugin } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
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

/**
 * Object storage for uploads, S3-compatible so it points at Cloudflare R2.
 *
 * Only switches on once all four variables are present — until then uploads
 * stay on the local filesystem, which is correct for local development and
 * obviously wrong in production. That is deliberate: a half-configured bucket
 * should not silently swallow files, and a missing bucket should not stop the
 * site from booting.
 *
 * R2 has no regions, so `region` is the literal "auto" its API expects.
 */
function storagePlugins(): Plugin[] {
  const bucket = process.env.S3_BUCKET
  const endpoint = process.env.S3_ENDPOINT
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[payload] Object storage is not configured — uploads will be written to the ' +
          'local filesystem and lost on the next deploy. Set S3_BUCKET, S3_ENDPOINT, ' +
          'S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.',
      )
    }
    return []
  }

  return [
    s3Storage({
      collections: { media: true },
      bucket,
      config: {
        endpoint,
        // R2 is region-less; "auto" is what its S3 API expects.
        region: process.env.S3_REGION || 'auto',
        credentials: { accessKeyId, secretAccessKey },
      },
    }),
  ]
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
  plugins: storagePlugins(),
  sharp,
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
})
