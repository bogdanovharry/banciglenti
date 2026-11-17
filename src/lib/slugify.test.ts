import { describe, expect, it } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('turns a Bulgarian title into a Latin address', () => {
    expect(slugify('Как да изберем лента за дърво?')).toBe('kak-da-izberem-lenta-za-darvo')
  })
  it('keeps digits and drops punctuation', () => {
    expect(slugify('  M42 или M51: 27 x 0,9  ')).toBe('m42-ili-m51-27-x-0-9')
  })
  it('handles Romanian diacritics', () => {
    expect(slugify('Pânze pentru lemn și metal')).toBe('panze-pentru-lemn-si-metal')
  })
})
