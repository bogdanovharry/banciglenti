import { describe, expect, it } from 'vitest'
import { commaDecimals, localizeName } from './product-text'

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
    ['Concave', 'Concave'],
    ['Convex', 'Convex'],
    ['Гладко заточен', 'Ascuțit neted'],
    ['Вълна', 'Val'],
  ])('the profile "%s" reads "%s" in Romanian', (bg, ro) => {
    const out = localizeName(`Saw-Meister FineCut 16×0.5 L=1760мм · профил ${bg}`, 'ro')
    expect(out).toContain(`· profil ${ro}`)
    expect(out).not.toMatch(/[А-Яа-я]{4,}\s*$/)
  })
})

describe('abrasives, circular and workshop names', () => {
  it.each([
    ['Циркулярен трион с твърдосплавни пластини (HM) Ø200 × 3.2 × 30 мм · z=64 · WZ', 'Pânză de fierăstrău circular cu plăcuțe din carbură (HM) Ø200 × 3,2 × 30 mm · z=64 · WZ'],
    ['CBN диск за заточване (Боразон)', 'Disc de ascuțire CBN (Borazon)'],
    ['Диамантен диск за заточване Ø125 мм · 12A2-20', 'Disc diamantat de ascuțire Ø125 mm · 12A2-20'],
    ['Абразивен диск за заточване Ø150 · 10/3', 'Disc abraziv de ascuțire Ø150 · 10/3'],
    ['Охлаждаща течност ACP-2E', 'Lichid de răcire ACP-2E'],
    ['Заточна машина за банцигови ленти ZM101', 'Mașină de ascuțit pânze panglică ZM101'],
  ])('"%s" reads "%s" in Romanian', (bg, ro) => {
    expect(localizeName(bg, 'ro')).toBe(ro)
  })
})

describe('bimetal cut-off bands', () => {
  it('read as a Romanian workshop would say it, whichever M the name was typed with', () => {
    const expected = 'Pânză panglică bimetalică M42 27×0,9 L=2480 mm — Optimum S 275 G'
    expect(localizeName('Биметална отрезна лента M42 27×0.9 L=2480мм — Optimum S 275 G', 'ro')).toBe(expected)
    expect(localizeName('Биметална отрезна лента М42 27×0.9 L=2480мм — Optimum S 275 G', 'ro')).toBe(expected)
  })
})

describe('Romanian reading of numbers', () => {
  it('writes a decimal comma', () => {
    expect(commaDecimals('2360 × 13 × 0.65 mm')).toBe('2360 × 13 × 0,65 mm')
    expect(commaDecimals('M42 L=2480 mm')).toBe('M42 L=2480 mm')
  })
  it('puts TPI beside a two-number pitch', () => {
    expect(localizeName('Лента за метал 27×0.9 · стъпка 4/6', 'ro')).toContain('· pas 4/6 TPI')
    expect(localizeName('Лента 27×0.9 · стъпка 22.2', 'ro')).toContain('· pas 22,2')
    expect(localizeName('Лента · стъпка 8 TPI', 'ro')).toContain('· pas 8 TPI')
  })
})

describe('plain circular saws', () => {
  it('read in Romanian with the tooth type and the number of teeth', () => {
    expect(localizeName('Циркулярен трион Ø350 x 2.15 x 30 · OZ остър зъб · z=60', 'ro')).toBe('Pânză de fierăstrău circular Ø350×2,15×30 · OZ dinte ascuțit · z=60')
    expect(localizeName('Циркулярен трион Ø350 x 2.15 x 30 · VZ вълчи зъб · z=48', 'ro')).toBe('Pânză de fierăstrău circular Ø350×2,15×30 · VZ dinte de lup · z=48')
  })
})
