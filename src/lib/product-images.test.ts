import { describe, expect, it } from 'vitest'
import { FLEXBACK_PHOTO, MEAT_PHOTO, hasDimensionLabel, profilePhoto } from './product-images'

describe('hasDimensionLabel', () => {
  it('is true only for the two photos that have a free corner for the size', () => {
    expect(hasDimensionLabel(FLEXBACK_PHOTO)).toBe(true)
    expect(hasDimensionLabel(MEAT_PHOTO)).toBe(true)
  })
  it('is false for any other photo, an uploaded one, or none', () => {
    expect(hasDimensionLabel('/images/products/kodiak.png')).toBe(false)
    expect(hasDimensionLabel('https://cdn.example/uploads/blade.jpg')).toBe(false)
    expect(hasDimensionLabel(null)).toBe(false)
    expect(hasDimensionLabel(undefined)).toBe(false)
  })
})

import { knifeKind, hasWhiteFrame, PLANER_PHOTO, PROCUT_PHOTO } from './product-images'

describe('planer knives', () => {
  it('HSS is for hard wood, 100Cr6 for soft', () => {
    expect(knifeKind('Нож за абрихт HSS 320х30х3 1бр.')).toEqual({ steel: 'HSS', wood: 'hard' })
    expect(knifeKind('Нож за абрихт 100Cr6 320х30х3 1бр.')).toEqual({ steel: '100Cr6', wood: 'soft' })
  })
  it('the new studio photos sit on a white frame', () => {
    expect(hasWhiteFrame(PLANER_PHOTO)).toBe(true)
    expect(hasWhiteFrame(PROCUT_PHOTO)).toBe(true)
    expect(hasWhiteFrame('/images/products/kodiak.png')).toBe(false)
  })
})

import { sawPhotoFor, CIRCULAR_OZ_PHOTO, CIRCULAR_VZ_PHOTO } from './product-images'

describe('plain circular saw photos', () => {
  it('follow the tooth type in the address', () => {
    expect(sawPhotoFor('circular-350x2-15-oz')).toBe(CIRCULAR_OZ_PHOTO)
    expect(sawPhotoFor('circular-350x2-15-vz')).toBe(CIRCULAR_VZ_PHOTO)
  })
})

import { horizontalPhotoFromName, PROCUT_PHOTO as _P, SOFTCUT_PHOTO as _S } from './product-images'

describe('horizontal blade photo from the name', () => {
  it('tells ProCut from SoftCut', () => {
    expect(horizontalPhotoFromName('Saw-Meister ProCut 32×1.1 L=3330 mm — Wood-Mizer LX50')).toBe(_P)
    expect(horizontalPhotoFromName('Saw-Meister SoftCut 38×1.14 L=4010 mm — Foo')).toBe(_S)
    expect(horizontalPhotoFromName('Another blade')).toBeUndefined()
  })
})

import { bimetalGrade } from './product-images'

describe('bimetal grade from the name', () => {
  it('reads M42 and M51, Latin or Cyrillic М', () => {
    expect(bimetalGrade('Биметална отрезна лента M42 27×0.9 L=2480мм')).toBe('M42')
    expect(bimetalGrade('Биметална отрезна лента М51 27×0.9')).toBe('M51')
    expect(bimetalGrade('Pânză panglică bimetalică M42 13×0,6 L=1638 mm')).toBe('M42')
    expect(bimetalGrade('Лента за дърво')).toBeNull()
  })
})

describe('profile photos', () => {
  it('maps edge profiles to their photograph', () => {
    expect(profilePhoto('wave')).toBe(profilePhoto('concave-wave'))
    expect(profilePhoto('convex-wave')).toContain('profile-convex')
    expect(profilePhoto('smooth-ground')).toContain('profile-smooth')
    expect(profilePhoto('cleaner-tooth')).toContain('profile-cleaner')
    expect(profilePhoto('3 TPI')).toContain('profile-3tpi')
    expect(profilePhoto('4 TPI')).toBeUndefined()
    expect(profilePhoto(null)).toBeUndefined()
  })
  it('sits on a white frame', () => {
    expect(hasWhiteFrame(profilePhoto('wave'))).toBe(true)
  })
})

describe('bread set photo', () => {
  it('is a white-framed studio shot like the profile photos', async () => {
    const { BREAD_SET_PHOTO, hasWhiteFrame } = await import('./product-images')
    expect(hasWhiteFrame(BREAD_SET_PHOTO)).toBe(true)
  })
})

describe('machine photos', () => {
  it('has one for each machine in the catalogue, on a white frame', async () => {
    const { machinePhotoFor, hasWhiteFrame } = await import('./product-images')
    for (const slug of ['asm-60', 'ca130', 'zm101', 'zm150', 'fbm10']) {
      const photo = machinePhotoFor(slug)
      expect(photo).toBeTruthy()
      expect(hasWhiteFrame(photo)).toBe(true)
    }
    expect(machinePhotoFor('something-else')).toBeUndefined()
  })
})
