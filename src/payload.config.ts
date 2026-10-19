import { buildConfig, type EmailAdapter, type Plugin } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { bg } from '@payloadcms/translations/languages/bg'
// import { en } from '@payloadcms/translations/languages/en' // re-enable to offer a language switch
import sharp from 'sharp'

import { Products } from './payload/collections/Products'
import { ProductVariants } from './payload/collections/ProductVariants'
import { Categories } from './payload/collections/Categories'
import { Brands } from './payload/collections/Brands'
import { Orders } from './payload/collections/Orders'
import { Enquiries } from './payload/collections/Enquiries'
import { Customers } from './payload/collections/Customers'
import { Articles } from './payload/collections/Articles'
import { Pages } from './payload/collections/Pages'
import { Media } from './payload/collections/Media'
import { Users } from './payload/collections/Users'
import { emailConfigured, sendEmail } from './lib/email'
import { PRODUCTION_ORIGINS } from './lib/domains'

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

/**
 * Payload's own emails — a staff member's password reset, mainly — through the
 * same provider the shop's order emails use.
 *
 * Without an adapter Payload writes the message to the server console, so a
 * reset link goes to a log nobody reads. Only installed once the provider is
 * configured; until then the default stays, which is right for development.
 */
function emailAdapter(): EmailAdapter | undefined {
  if (!emailConfigured()) return undefined

  const from = process.env.EMAIL_FROM as string
  const match = /^(.*)<(.+)>$/.exec(from)
  const defaultFromName = match ? match[1].trim().replace(/^"|"$/g, '') : 'Saw-Meister'
  const defaultFromAddress = match ? match[2].trim() : from

  const adapter: EmailAdapter = () => ({
    name: 'resend',
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message) => {
      const list = (v: unknown): string[] =>
        (Array.isArray(v) ? v : [v])
          .map((x) => (typeof x === 'string' ? x : ((x as { address?: string } | null)?.address ?? '')))
          .filter(Boolean)
      const result = await sendEmail({
        to: list(message.to),
        subject: String(message.subject ?? ''),
        html: String(message.html ?? message.text ?? ''),
        text: String(message.text ?? ''),
      })
      // A reset email that silently did not go is worse than an error the
      // person sees, so a refusal is thrown; "not configured" cannot reach here.
      if (!result.ok) throw new Error('email was not sent')
      return result
    },
  })
  return adapter
}

/**
 * The admin's own address, for the links in its emails, and the origins allowed
 * to use it. Production only: locally Payload works the origin out from the
 * request, and an allow-list of real domains would only get in the way.
 *
 * Every market's domain is listed, because staff open the admin from whichever
 * they are working on, and Payload ignores a session cookie sent from an origin
 * that is not on the list — a login that works and then never sticks.
 */
const production = process.env.NODE_ENV === 'production'
const serverURL = production ? process.env.NEXT_PUBLIC_SITE_URL : undefined
const csrf = production ? [...new Set([...(serverURL ? [serverURL] : []), ...PRODUCTION_ORIGINS])] : undefined

export default buildConfig({
  secret: required('PAYLOAD_SECRET'),
  ...(serverURL ? { serverURL } : {}),
  ...(csrf ? { csrf } : {}),
  email: emailAdapter(),
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' | ТЕХНОЛЕС',
    },
    components: {
      // Stat cards and action panels above Payload's own collection cards.
      beforeDashboard: ['@/payload/components/Dashboard#Dashboard'],
    },
  },
  /**
   * Bulgarian only, on purpose.
   *
   * Payload resolves the admin language from the browser's Accept-Language
   * header and only falls back to `fallbackLanguage` when nothing matches. With
   * English also listed, any browser set to English got an English panel — which
   * is exactly what happened here — while the field labels stayed Bulgarian.
   *
   * Listing a single language removes the ambiguity: the panel is Bulgarian
   * regardless of browser settings. Add `en` (imported below) back to
   * supportedLanguages to offer a per-user switch. Romanian ships in
   * @payloadcms/translations for when that market opens.
   */
  i18n: {
    supportedLanguages: { bg },
    fallbackLanguage: 'bg',
  },
  collections: [
    Products,
    ProductVariants,
    Categories,
    Brands,
    Orders,
    Enquiries,
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
