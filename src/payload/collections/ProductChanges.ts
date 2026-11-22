import type { CollectionConfig } from 'payload'

import { isStaff } from '../access'

/**
 * Who changed a product's price, stock or status on the management screens, and
 * from what to what. Append-only: nothing edits or deletes a row, through the
 * API or the admin; the stock-take screen writes it through the Local API.
 */
const never = () => false

export const ProductChanges: CollectionConfig = {
  slug: 'product-changes',
  labels: { singular: 'Промяна на продукт', plural: 'Промени на продукти' },
  admin: {
    useAsTitle: 'field',
    defaultColumns: ['product', 'field', 'oldValue', 'newValue', 'actor', 'at'],
    group: 'Система',
  },
  access: { read: isStaff, create: never, update: never, delete: never },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true },
    { name: 'field', type: 'text', required: true, label: 'Поле' },
    { name: 'oldValue', type: 'text', label: 'Преди' },
    { name: 'newValue', type: 'text', label: 'След' },
    { name: 'actor', type: 'relationship', relationTo: 'users', label: 'Кой' },
    { name: 'at', type: 'date', required: true, label: 'Кога' },
  ],
}
