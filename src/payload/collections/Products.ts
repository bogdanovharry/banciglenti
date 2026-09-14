import type { CollectionConfig } from 'payload'

import { isAdminField, staffEditAdminDelete } from '../access'

export const Products: CollectionConfig = {
  slug: 'products',
  access: staffEditAdminDelete,
  labels: { singular: 'Продукт', plural: 'Продукти' },
  admin: {
    useAsTitle: 'name',
    // Scalar and relationship fields only — a group field like `specs` renders
    // unpredictably as a column. Dimensions can still be added per-user from
    // the Columns picker in the list header.
    defaultColumns: ['name', 'series', 'basePrice', 'stock', 'status'],
    listSearchableFields: ['name', 'slug'],
    description: 'Каталогът. Търсенето работи по име и SKU.',
    pagination: { defaultLimit: 50 },
    group: 'Каталог',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Име на продукта',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      label: 'Кратко описание',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Пълно описание',
    },
    {
      name: 'images',
      type: 'array',
      label: 'Изображения',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      label: 'Марка',
    },
    {
      name: 'series',
      type: 'select',
      label: 'Серия Saw-Meister',
      admin: {
        description:
          'Продуктовата линия. Определя коя снимка и кое описание се показват в каталога. ' +
          'Оставете празно за артикули извън обхвата на сериите (биметал, циркуляри, ножове, абразиви).',
      },
      options: [
        { label: 'ProCut — хоризонтален, 10/30°, смесена дървесина', value: 'procut' },
        { label: 'SoftCut — хоризонтален, 14°, мека дървесина', value: 'softcut' },
        { label: 'Vector — вертикален, работилница и мебели', value: 'vector' },
        { label: 'FlexCut — въглеродна Flexback, дърво / пластмаса / цветни метали', value: 'flexcut' },
        { label: 'FineCut — хранителна, месо и храни', value: 'finecut' },
        /**
         * 'hardcut' was here and is gone, which cost an outage worth recording.
         *
         * This is a Postgres enum. Dropping a value that rows still hold makes
         * Payload's schema push run
         *   ALTER COLUMN "series" ... USING "series"::"enum_products_series"
         * on boot. The cast cannot map the retired value, the statement fails,
         * Payload never finishes initialising, and every query hangs — so the
         * storefront serves its loading skeleton forever while still returning
         * HTTP 200. Removing an option here is not a code change, it is a data
         * migration, and the code half is the half that does not matter.
         *
         * The five MasterGold products that carried it were re-tagged to
         * 'procut' before this line came out. Before retiring any value below,
         * clear it from the data first:
         *   select count(*) from products where series = '<value>';
         */
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Категории',
    },
    {
      name: 'basePrice',
      type: 'number',
      label: 'Базова цена (EUR)',
      min: 0,
      // Staff keep stock and descriptions current; the price list is the
      // owner's. Same rule as the price column on /manage/products.
      access: { create: isAdminField, update: isAdminField },
    },
    {
      name: 'specs',
      type: 'group',
      label: 'Спецификации',
      fields: [
        { name: 'width', type: 'number', label: 'Ширина (mm)' },
        { name: 'thickness', type: 'number', label: 'Дебелина (mm)' },
        {
          name: 'length',
          type: 'number',
          label: 'Дължина на контура (mm)',
          admin: { description: 'Обиколката на лентата — размерът, който трябва да съвпадне с машината.' },
        },
        { name: 'material', type: 'text', label: 'Материал' },
        {
          name: 'toothPitch',
          type: 'text',
          label: 'Стъпка на зъба',
          admin: {
            description:
              'TPI за хоби и метал ("8"), милиметри за гатер ("22.2"), или името на профила ' +
              'за хранителните ленти. Без нея две ленти с еднакъв размер са неразличими.',
          },
        },
      ],
    },
    {
      /**
       * What is in a mixed set — one line per blade.
       *
       * Deliberately plain text rather than relationships to the member
       * products. A set is sold as one thing at one price; linking it to the
       * singles would imply stock and price flow between them, which they do
       * not. If that ever becomes true, this is the field to replace.
       */
      name: 'setContents',
      type: 'array',
      label: 'Съдържание на комплекта',
      admin: { description: 'Попълва се само за комплекти. Празно за единична лента.' },
      fields: [{ name: 'label', type: 'text', required: true, label: 'Ред' }],
    },
    {
      name: 'machines',
      type: 'array',
      label: 'Пасва на машини',
      admin: {
        description:
          'Марка и модел на машините, за които е този размер. Показва се като филтър в каталога.',
      },
      fields: [
        { name: 'brand', type: 'text', required: true, label: 'Марка' },
        { name: 'model', type: 'text', required: true, label: 'Модел' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'active',
      options: [
        { label: 'Активен', value: 'active' },
        { label: 'Неактивен', value: 'inactive' },
        { label: 'Изчерпан', value: 'out_of_stock' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'stock',
      type: 'number',
      label: 'Наличност (бр.)',
      defaultValue: 0,
      min: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Препоръчан продукт',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'topProduct',
      type: 'checkbox',
      label: 'TOP продукт',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Показва значка TOP в каталога.',
      },
    },
  ],
}
