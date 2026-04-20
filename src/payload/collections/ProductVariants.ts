import type { CollectionConfig } from 'payload'

export const ProductVariants: CollectionConfig = {
  slug: 'product-variants',
  admin: {
    useAsTitle: 'sku',
    defaultColumns: ['sku', 'product', 'price', 'stock'],
    group: 'Каталог',
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      label: 'Продукт',
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      label: 'SKU',
    },
    {
      name: 'length',
      type: 'number',
      label: 'Дължина (mm)',
    },
    {
      name: 'width',
      type: 'number',
      label: 'Ширина (mm)',
    },
    {
      name: 'thickness',
      type: 'number',
      label: 'Дебелина (mm)',
    },
    {
      name: 'toothPitch',
      type: 'text',
      label: 'Стъпка на зъб (mm)',
    },
    {
      name: 'toothProfile',
      type: 'text',
      label: 'Профил на зъб',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      label: 'Цена (EUR)',
      min: 0,
    },
    {
      name: 'stock',
      type: 'number',
      label: 'Наличност',
      defaultValue: 0,
      min: 0,
    },
  ],
}
