import { describe, expect, it } from 'vitest'
import { COMPANY, COMPANY_LATIN } from './company'
import { MARKETS } from './market'
import { customerEmail, type EmailOrder } from './order-emails'
import { serverText } from './server-text'

/** Every way the Bulgarian phone numbers can be written. */
const PHONE = /\+?359|066\s?800|878\s?800|800\s?822|800\s?162|tel:/i

const order: EmailOrder = {
  orderNumber: 'TL-261111-ABCD', id: 1,
  contact: { name: 'Ion', email: 'ion@example.invalid', phone: '+40700000000' },
  address: 'Str. Exemplu 1, Cluj', shippingMethod: 'courier', paymentMethod: 'cod',
  lines: [{ name: 'Pânză', sku: 'x', quantity: 1, price: 10, madeToMeasure: false }],
  subtotal: 10, shippingCost: 0, tax: 2.1, total: 12.1, vatRate: 0.21,
}

describe('written contact only', () => {
  it('is on for Romania and off for Bulgaria', () => {
    expect(MARKETS.ro.writtenOnly).toBe(true)
    expect(MARKETS.bg.writtenOnly).toBe(false)
  })
  it('the Romanian error messages send the buyer to the e-mail, not to a phone', () => {
    const say = serverText(MARKETS.ro)
    for (const text of [say.orderFailed, say.contactFailed]) {
      expect(text).not.toMatch(PHONE)
      expect(text).toContain(COMPANY.email)
    }
  })
  it('the Bulgarian error messages still give the phone', () => {
    const say = serverText(MARKETS.bg)
    expect(say.orderFailed).toContain(COMPANY.phone.office.display)
    expect(say.contactFailed).toContain(COMPANY.phone.office.display)
  })
  it('the order e-mail to a Romanian buyer carries no phone number, only the e-mail', () => {
    const mail = customerEmail(MARKETS.ro, order, 'https://example.invalid')
    expect(mail.text).not.toMatch(PHONE)
    expect(mail.html).not.toMatch(PHONE)
    expect(mail.text).toContain(COMPANY.email)
    // The buyer's OWN phone number is theirs to see on their own order.
    expect(COMPANY_LATIN.phone.office.display).toMatch(/359/)
  })
  it('the order e-mail to a Bulgarian buyer still carries the phone', () => {
    const mail = customerEmail(MARKETS.bg, order, 'https://example.invalid')
    expect(mail.text).toContain(COMPANY.phone.office.display)
  })
})
