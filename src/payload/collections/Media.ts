import type { CollectionConfig } from 'payload'

import { isAdmin, isStaff } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Файлове' },
  admin: {
    group: 'Съдържание',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'filesize', 'createdAt'],
    description: 'Снимките се качват в Cloudflare R2 и се прикачат към продукт от полето Изображения.',
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
    create: isStaff,
    update: isStaff,
    delete: isAdmin,
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
