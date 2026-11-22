import { describe, expect, it } from 'vitest'

import { moneyLockReason, nextStatuses } from './vocabulary'

describe('nextStatuses', () => {
  it('lets staff move an order forward and back one step', () => {
    expect(nextStatuses('pending', false)).toEqual(['confirmed', 'processing', 'cancelled'])
    expect(nextStatuses('confirmed', false)).toContain('pending')
  })

  it('closes delivered and cancelled orders for staff', () => {
    expect(nextStatuses('delivered', false)).toEqual([])
    expect(nextStatuses('cancelled', false)).toEqual([])
  })

  it('lets only an administrator reopen a closed order', () => {
    expect(nextStatuses('cancelled', true)).toEqual(['pending'])
    expect(nextStatuses('delivered', true)).toEqual(['shipped'])
    expect(nextStatuses('shipped', true)).toContain('processing')
  })

  it('never allows a cancelled order to be shipped directly', () => {
    expect(nextStatuses('cancelled', true)).not.toContain('shipped')
  })

  it('treats an unknown status as a new order', () => {
    expect(nextStatuses(null, false)).toEqual(['pending'])
  })
})

describe('moneyLockReason', () => {
  it('is open while the order is in work and unpaid', () => {
    for (const status of ['pending', 'confirmed', 'processing']) {
      expect(moneyLockReason({ status, paymentStatus: 'pending' })).toBeNull()
    }
  })

  it('locks once shipped, delivered or cancelled', () => {
    for (const status of ['shipped', 'delivered', 'cancelled']) {
      expect(moneyLockReason({ status, paymentStatus: 'pending' })).not.toBeNull()
    }
  })

  it('locks once payment is marked paid or refunded', () => {
    expect(moneyLockReason({ status: 'pending', paymentStatus: 'paid' })).not.toBeNull()
    expect(moneyLockReason({ status: 'pending', paymentStatus: 'refunded' })).not.toBeNull()
    expect(moneyLockReason({ status: 'pending', paymentStatus: 'failed' })).toBeNull()
  })
})
