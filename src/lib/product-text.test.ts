import { describe, expect, it } from 'vitest'
import { localizeName } from './product-text'

describe('the pitch a buyer chose, in the line name', () => {
  it('a tooth pitch reads "pas" in Romanian and is left alone in Bulgarian', () => {
    const name = 'Банцигова лента 20x0.6 L=1425мм · стъпка 8 TPI'
    expect(localizeName(name, 'ro')).toContain('· pas 8 TPI')
    expect(localizeName(name, 'bg')).toBe(name)
  })
  it.each([
    ['Зъб чистач', 'Dinte cu curățitor'],
    ['Вдлъбната вълна', 'Val concav'],
    ['Изпъкнала вълна', 'Val convex'],
    ['Гладко заточен', 'Ascuțit neted'],
    ['Вълна', 'Val'],
  ])('the profile "%s" reads "%s" in Romanian', (bg, ro) => {
    const out = localizeName(`Saw-Meister FineCut 16×0.5 L=1760мм · профил ${bg}`, 'ro')
    expect(out).toContain(`· profil ${ro}`)
    expect(out).not.toMatch(/[А-Яа-я]{4,}\s*$/)
  })
})

describe('bimetal cut-off bands', () => {
  it('read as a Romanian workshop would say it, whichever M the name was typed with', () => {
    const expected = 'Pânză de panglică bimetalică M42 pentru metal 27×0.9 L=2480 mm — Optimum S 275 G'
    expect(localizeName('Биметална отрезна лента M42 27×0.9 L=2480мм — Optimum S 275 G', 'ro')).toBe(expected)
    expect(localizeName('Биметална отрезна лента М42 27×0.9 L=2480мм — Optimum S 275 G', 'ro')).toBe(expected)
  })
})
