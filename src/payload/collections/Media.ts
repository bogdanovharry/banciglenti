import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Съдържание',
  },
  /**
   * Media is the one collection that must be readable without logging in —
   * these are product photographs embedded in public pages, and Payload
   * defaults every collection to auth-required, which returned 403 for every
   * visitor.
   *
   * Read only. Uploading, editing and deleting stay behind the admin login.
   *
   * The catalogue collections are deliberately NOT opened up: the storefront
   * reads them server-side through the Local API, which bypasses access
   * control, so leaving them closed keeps the REST API from serving the whole
   * product and price list to anyone who asks.
   */
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 600, height: 600, position: 'centre' },
      { name: 'product', width: 800, height: 800, position: 'centre' },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', label: 'Alt текст' },
  ],
}
