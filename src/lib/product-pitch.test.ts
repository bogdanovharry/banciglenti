import { describe, expect, it } from 'vitest'
import { nameWithPitch, pitchInfoFor, pitchText, type PitchProduct } from './product-pitch'

const product = (p: Partial<PitchProduct>): PitchProduct => ({
  categorySlugs: [], series: null, name: 'x', width: null, thickness: null, length: null, toothPitch: null, price: 10, ...p,
})

describe('pitchInfoFor — vertical bandsaws', () => {
  it('a Vector band offers the pitches of its own steel, at one price', () => {
    const i = pitchInfoFor(product({ categorySlugs: ['vertikalni-bantsizi'], series: 'vector', width: 30, thickness: 0.7, length: 3500, price: 11.06 }))!
    expect(i.table).toBe('wood-v')
    expect(i.options.map((o) => o.pitch)).toEqual(['10'])
    expect(i.options.every((o) => o.unitPrice === 11.06)).toBe(true)
    const wide = pitchInfoFor(product({ categorySlugs: ['vertikalni-bantsizi'], series: 'vector', width: 25, thickness: 0.6, length: 3500, price: 6.67 }))!
    expect(wide.options.map((o) => o.pitch)).toEqual(['6', '8', '10'])
    expect(wide.defaultPitch).toBeNull()
  })
  it('a FlexCut band on a vertical machine offers the flexback pitches', () => {
    const i = pitchInfoFor(product({ categorySlugs: ['vertikalni-bantsizi'], series: 'flexcut', width: 13, thickness: 0.65, length: 3500, price: 12.94 }))!
    expect(i.options.map((o) => o.pitch)).toEqual(['4 TPI', '8 TPI', '14 TPI'])
  })
})

describe('pitchInfoFor', () => {
  it('a bimetal blade offers its pitches, none preselected, at the product price', () => {
    const i = pitchInfoFor(product({ categorySlugs: ['bimetalni-lenti', 'metal'], name: 'Биметална отрезна лента М42 13х0.65 L=1140mm', width: 13, thickness: 0.65, price: 12.5 }))!
    expect(i.table).toBe('metal-bi')
    expect(i.options.map((o) => o.pitch)).toEqual(['6/10', '8/12', '10/14'])
    expect(i.defaultPitch).toBeNull()
    expect(i.options.every((o) => o.unitPrice === 12.5)).toBe(true)
  })
  it('a hobby blade has its own recorded pitch preselected, and can be switched', () => {
    const i = pitchInfoFor(product({ categorySlugs: ['hobi-bantsig'], series: 'flexcut', width: 8, thickness: 0.65, toothPitch: '8', price: 5 }))!
    expect(i.options.map((o) => o.pitch)).toEqual(['4 TPI', '8 TPI', '14 TPI'])
    expect(i.defaultPitch).toBe('8 TPI')
  })
  it('meat blades are priced by length × the profile, starting from the profile the product is quoted at', () => {
    const i = pitchInfoFor(product({ categorySlugs: ['meso-i-riba', 'hrani'], series: 'finecut', width: 16, thickness: 0.5, length: 1760, price: 6.92 }))!
    const by = Object.fromEntries(i.options.map((o) => [o.pitch, o.unitPrice]))
    expect(by['smooth-ground']).toBe(6.92) // 1.76 m × 3.93
    expect(by['3 TPI']).toBe(7.44) // 1.76 m × 4.23
    expect(by['convex-wave']).toBe(11.88) // 1.76 m × 6.75
    expect(i.defaultPitch).toBe('smooth-ground')
  })
  it('meat blades with no recorded length cannot be priced by profile, so no choice is offered', () => {
    expect(pitchInfoFor(product({ categorySlugs: ['meso-i-riba'], width: 16, thickness: 0.5, length: null }))).toBeNull()
  })
  it('a size the tables do not make in several pitches is shown as the one pitch it has, or not at all', () => {
    expect(pitchInfoFor(product({ categorySlugs: ['tsirkulyarni-trioni'], width: 100, thickness: 1.1 }))).toBeNull()
    expect(pitchInfoFor(product({ categorySlugs: ['bimetalni-lenti'], name: 'M42', width: 999, thickness: 9 }))).toBeNull()
  })
  it('a product with no size has nothing to offer', () => {
    expect(pitchInfoFor(product({ categorySlugs: ['bimetalni-lenti'] }))).toBeNull()
  })
  it('the choice comes from the table, so an invented pitch is not among the options', () => {
    const i = pitchInfoFor(product({ categorySlugs: ['hobi-bantsig'], width: 8, thickness: 0.65 }))!
    expect(i.options.some((o) => o.pitch === '99 TPI')).toBe(false)
  })
})

describe('naming the choice', () => {
  it('writes a tooth pitch and a profile differently, in the catalogue language', () => {
    expect(nameWithPitch('Лента', '8 TPI')).toBe('Лента · стъпка 8 TPI')
    expect(nameWithPitch('Лента', 'convex-wave')).toBe('Лента · профил Изпъкнала вълна')
  })
  it('shows a profile in the language asked for and a number as it is', () => {
    expect(pitchText('convex-wave', 'ro')).toBe('Val convex')
    expect(pitchText('convex-wave', 'bg')).toBe('Изпъкнала вълна')
    expect(pitchText('8 TPI', 'ro')).toBe('8 TPI')
  })
})

import { pitchFromName as _pitchFromName } from './product-pitch'
describe('pitchFromName', () => {
  it('reads back what nameWithPitch wrote', () => {
    for (const p of ['wave', 'smooth-ground', '3/4', '4']) {
      expect(_pitchFromName(nameWithPitch('Saw-Meister X', p))).toBe(p)
    }
    expect(_pitchFromName('Saw-Meister X')).toBeNull()
  })
})

describe('pitchInfoFor — bimetal steels', () => {
  it('an M51 band offers the M51 pitches, an M42 band of the same size the M42 ones', () => {
    const m51 = pitchInfoFor(product({ categorySlugs: ['bimetalni-lenti'], name: 'Биметална отрезна лента M51 27×0.9 L=2450мм', width: 27, thickness: 0.9 }))!
    expect(m51.options.map((o) => o.pitch).sort()).toEqual(['3/4', '4/6'])
    const m42 = pitchInfoFor(product({ categorySlugs: ['bimetalni-lenti'], name: 'Биметална отрезна лента M42 27×0.9 L=2450мм', width: 27, thickness: 0.9 }))!
    expect(m42.options.length).toBeGreaterThan(2)
  })
  it('41×1.3 is made in M42 pitches', () => {
    const i = pitchInfoFor(product({ categorySlugs: ['bimetalni-lenti'], name: 'Биметална отрезна лента M42 41×1.3 L=4115мм', width: 41, thickness: 1.3 }))!
    expect(i.options.map((o) => o.pitch).sort()).toEqual(['1.4/2', '2/3', '3/4', '4/6'])
  })
})
