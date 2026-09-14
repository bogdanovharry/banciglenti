import { ValidationError, type CollectionConfig } from 'payload'

import { isAdmin, isAdminField, isAdminOrSelf, isStaff } from '../access'

/**
 * Twelve characters. Payload's own floor is three, which a staff account that
 * can see every customer's phone number and address should not be allowed to
 * choose. Long rather than complicated: a passphrase is easier to remember and
 * harder to guess than "P@ss1".
 */
const MIN_PASSWORD_LENGTH = 12

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Потребител', plural: 'Потребители' },
  auth: {
    cookies: {
      // Never sent over plain HTTP in production. Off locally, where the dev
      // server has no certificate and a Secure cookie would never come back.
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role'],
    group: 'Система',
  },
  /**
   * Accounts are an administrator's business. An editor may read the staff
   * list (history entries name their authors) and change their own name and
   * password, and nothing else — in particular not their own role.
   */
  access: {
    read: isStaff,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
    unlock: isAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const password = (data as { password?: unknown } | undefined)?.password
        if (typeof password === 'string' && password.length > 0 && password.length < MIN_PASSWORD_LENGTH) {
          throw new ValidationError({
            collection: 'users',
            errors: [
              {
                path: 'password',
                message: `Паролата трябва да е поне ${MIN_PASSWORD_LENGTH} знака.`,
              },
            ],
            req,
          })
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Име' },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      options: [
        { label: 'Администратор', value: 'admin' },
        { label: 'Редактор', value: 'editor' },
      ],
      // Without this, "update your own account" includes "promote yourself".
      access: { create: isAdminField, update: isAdminField },
      admin: { position: 'sidebar' },
    },
  ],
}
