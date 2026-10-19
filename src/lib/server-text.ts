import type { Market } from './market'
import { companyFor } from './company'

/**
 * What the API routes say back to a browser, in the market's language.
 *
 * The routes are the one place the visitor reads server text — a validation
 * error, a refusal — and they were Bulgarian-only, so a Romanian buyer whose
 * email was mistyped was told off in Cyrillic. The storefront shows `error`
 * and `fields` as received, so the translation has to happen here.
 *
 * Two languages exist: Romanian, and Bulgarian as the fallback for every other
 * market (Greek storefront copy is not written yet, and falls back everywhere
 * else in the app the same way). Draft Romanian — to be read by a native
 * speaker with the rest of the storefront text.
 */
export type ServerText = ReturnType<typeof build>

function build(lang: 'bg' | 'ro', phone: string) {
  const t = {
    bg: {
      invalidRequest: 'Невалидна заявка.',
      tooLarge: 'Заявката е твърде голяма.',
      rateLimited: 'Твърде много опити. Изчакайте малко и опитайте отново.',
      checkFields: 'Проверете полетата.',
      email: 'Въведете валиден имейл.',
      phone: 'Въведете телефон.',
      name: 'Въведете име.',
      city: 'Въведете град.',
      street: 'Въведете адрес.',
      tooLong: 'Твърде дълго.',
      pickupUnavailable: 'Личното вземане не се предлага.',
      paymentMethod: 'Изберете начин на плащане.',
      itemsEmpty: 'Количката е празна.',
      tooManyItems: 'Твърде много артикули в една поръчка. Обадете се.',
      acceptTerms: 'Трябва да приемете общите условия и политиката за поверителност.',
      billingCompany: 'Въведете фирма.',
      billingTaxId: 'Въведете ЕИК.',
      billingAddress: 'Въведете седалище.',
      invalidQuantity: 'Невалидно количество.',
      missingSku: 'Липсва артикул.',
      comboNotListed: (sku: string) => `Комбинацията за ${sku} не е в ценоразписа.`,
      unavailable: (sku: string) => `Артикулът ${sku} вече не е наличен.`,
      retired: (name: string) => `${name} вече не се предлага.`,
      outOfStock: (name: string) => `${name} е изчерпан.`,
      orderFailed: `Възникна грешка при създаване на поръчката. Опитайте отново или се обадете на ${phone}.`,
      contactName: 'Името е задължително.',
      contactEmail: 'Имейлът е задължителен.',
      contactEmailInvalid: 'Имейлът изглежда невалиден.',
      contactMessage: 'Съобщението е задължително.',
      contactFailed: `Възникна грешка при изпращането. Обадете се на ${phone}.`,
      customLine: (length: number, width: number, thickness: number, brand: string) =>
        `Лента по размер ${length}×${width}×${thickness} мм · ${brand}`,
    },
    ro: {
      invalidRequest: 'Cerere invalidă.',
      tooLarge: 'Cererea este prea mare.',
      rateLimited: 'Prea multe încercări. Așteptați puțin și încercați din nou.',
      checkFields: 'Verificați câmpurile.',
      email: 'Introduceți o adresă de e-mail validă.',
      phone: 'Introduceți numărul de telefon.',
      name: 'Introduceți numele.',
      city: 'Introduceți localitatea.',
      street: 'Introduceți adresa.',
      tooLong: 'Prea lung.',
      pickupUnavailable: 'Ridicarea personală nu este disponibilă.',
      paymentMethod: 'Alegeți modalitatea de plată.',
      itemsEmpty: 'Coșul este gol.',
      tooManyItems: 'Prea multe articole într-o singură comandă. Vă rugăm să ne sunați.',
      acceptTerms: 'Trebuie să acceptați termenii și condițiile și politica de confidențialitate.',
      billingCompany: 'Introduceți denumirea firmei.',
      billingTaxId: 'Introduceți CUI.',
      billingAddress: 'Introduceți sediul firmei.',
      invalidQuantity: 'Cantitate invalidă.',
      missingSku: 'Lipsește articolul.',
      comboNotListed: (sku: string) => `Combinația pentru ${sku} nu există în lista de prețuri.`,
      unavailable: (sku: string) => `Articolul ${sku} nu mai este disponibil.`,
      retired: (name: string) => `${name} nu se mai comercializează.`,
      outOfStock: (name: string) => `${name} nu este în stoc.`,
      orderFailed: `A apărut o eroare la plasarea comenzii. Încercați din nou sau sunați la ${phone}.`,
      contactName: 'Numele este obligatoriu.',
      contactEmail: 'Adresa de e-mail este obligatorie.',
      contactEmailInvalid: 'Adresa de e-mail pare invalidă.',
      contactMessage: 'Mesajul este obligatoriu.',
      contactFailed: `A apărut o eroare la trimitere. Sunați la ${phone}.`,
      customLine: (length: number, width: number, thickness: number, brand: string) =>
        `Pânză la dimensiune ${length}×${width}×${thickness} mm · ${brand}`,
    },
  }
  return t[lang]
}

export function serverText(market: Market): ServerText {
  const lang = market.locale.startsWith('ro') ? 'ro' : 'bg'
  // The number to ring is the one the visitor can dial from where they are.
  return build(lang, companyFor(market.locale).phone.office.display)
}
