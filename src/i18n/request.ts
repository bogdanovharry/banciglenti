import { getRequestConfig } from 'next-intl/server'

import { getLocale } from './locale'

/**
 * next-intl in "without i18n routing" mode: the locale comes from the domain
 * (see ./locale.ts) rather than from a route segment, so there is no proxy and
 * no `[lang]` folder.
 *
 * Message files are keyed by language, not by market — `bg-BG` loads `bg.json`.
 * Markets and languages are not the same axis: a fourth market speaking an
 * existing language would reuse its file rather than duplicate it.
 */
const FALLBACK_LANGUAGE = 'bg'

/**
 * A market whose message file does not exist yet must not take the site down.
 *
 * It did: adding `gr` to the market registry without writing messages/el.json
 * made the import throw inside the root layout, which 500s every page for that
 * host rather than degrading to untranslated text. Falling back keeps the store
 * serving and leaves a loud server-side warning instead of a dead storefront.
 */
async function loadMessages(language: string) {
  try {
    return (await import(`../../messages/${language}.json`)).default
  } catch {
    console.warn(
      `[i18n] No messages/${language}.json — falling back to "${FALLBACK_LANGUAGE}". ` +
        `The storefront will render untranslated for this market.`,
    )
    return (await import(`../../messages/${FALLBACK_LANGUAGE}.json`)).default
  }
}

export default getRequestConfig(async () => {
  const locale = await getLocale()
  const language = locale.split('-')[0]

  return { locale, messages: await loadMessages(language) }
})
