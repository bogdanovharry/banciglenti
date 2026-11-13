import { ValidationError, type CollectionConfig } from 'payload'

import { isAdmin, isStaff } from '../access'

/**
 * Customer accounts — a shopper's own login, kept apart from the staff in
 * `users` and from the customer book in `customers`.
 *
 * Why a collection of its own, and not a login on `customers`:
 *
 * - `customers` is the workshop's record of whoever ordered, created from
 *   whatever was typed at checkout and keyed by e-mail. Until an address is
 *   verified, anyone can register an e-mail that is not theirs; if that
 *   registration attached to the existing customer it would hand a stranger
 *   that customer's orders. Here an account has only what it was created with
 *   and the orders placed while it was logged in (Orders.account) — never a
 *   match on e-mail.
 * - The staff screens look at `customers`; an account's saved addresses and
 *   machines do not appear in the CRM by accident.
 *
 * Nobody reaches this through Payload's REST or admin except staff, read-only:
 * registration, login and every edit go through /api/account/*, which write
 * through the Local API after checking who is asking. The session is a cookie
 * of our own (see lib/account.ts), not `payload-token`, so a shopper logging in
 * never replaces a staff member's admin session on the same browser.
 */

export const MIN_PASSWORD_LENGTH = 10

export const Accounts: CollectionConfig = {
  slug: 'accounts',
  labels: { singular: 'Профил', plural: 'Профили на клиенти' },
  auth: {
    // Eight wrong passwords lock the account for a quarter of an hour. The
    // login route has a limiter per address as well; this one is per account,
    // so it also stops a slow guess spread across many addresses.
    maxLoginAttempts: 8,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 60 * 60 * 24 * 14,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'market', 'createdAt'],
    group: 'Поръчки',
    description: 'Профилите, които клиентите са си направили в магазина. Само за четене — клиентът ги редактира сам.',
  },
  access: {
    read: isStaff,
    create: () => false,
    update: () => false,
    delete: isAdmin,
    // Staff can free a locked account; they never choose a customer's password.
    unlock: isStaff,
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const password = (data as { password?: unknown } | undefined)?.password
        if (typeof password === 'string' && password.length > 0 && password.length < MIN_PASSWORD_LENGTH) {
          throw new ValidationError({
            collection: 'accounts',
            errors: [{ path: 'password', message: `Паролата трябва да е поне ${MIN_PASSWORD_LENGTH} знака.` }],
            req,
          })
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Име' },
    { name: 'phone', type: 'text', label: 'Телефон' },
    { name: 'company', type: 'text', label: 'Фирма' },
    { name: 'taxId', type: 'text', label: 'ЕИК / CUI / регистрационен номер' },
    { name: 'vatNumber', type: 'text', label: 'ДДС номер' },
    {
      name: 'market',
      type: 'select',
      label: 'Магазин, в който е регистриран',
      options: [
        { label: 'България', value: 'bg' },
        { label: 'Румъния', value: 'ro' },
        { label: 'Гърция', value: 'gr' },
      ],
    },
    {
      // When the shopper ticked "I have read the terms and the privacy policy".
      name: 'termsAcceptedAt',
      type: 'date',
      label: 'Приел условията на',
    },
    {
      name: 'addresses',
      type: 'array',
      label: 'Адреси за доставка',
      fields: [
        { name: 'label', type: 'text', label: 'Наименование' },
        { name: 'street', type: 'text', label: 'Улица' },
        { name: 'city', type: 'text', label: 'Град' },
        { name: 'postalCode', type: 'text', label: 'Пощенски код' },
        { name: 'isDefault', type: 'checkbox', label: 'По подразбиране' },
      ],
    },
    {
      name: 'machines',
      type: 'array',
      label: 'Машини',
      fields: [
        { name: 'brand', type: 'text', label: 'Марка' },
        { name: 'model', type: 'text', label: 'Модел' },
        { name: 'bladeLength', type: 'number', label: 'Дължина на лентата (мм)' },
        { name: 'bladeWidth', type: 'number', label: 'Ширина (мм)' },
        { name: 'bladeThickness', type: 'number', label: 'Дебелина (мм)' },
      ],
    },
  ],
}
