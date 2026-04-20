import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Съдържание',
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
