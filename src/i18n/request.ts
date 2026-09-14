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
    return null
  }
}

type Messages = { [k: string]: string | Messages }

/**
 * Bulgarian under everything, the market's own language on top.
 *
 * The fallback above is all-or-nothing: it saves a market with no file at all,
 * but a file that merely lags behind still breaks, because next-intl throws on
 * a message it cannot find. With the site being translated a screen at a time,
 * every half-finished file would be a set of 500s waiting for whoever visited
 * the screen that had not been done yet.
 *
 * Merging keyed by key means an untranslated string renders in Bulgarian —
 * visibly untranslated, which is a bug report, rather than a dead page. It also
 * means ro.json and el.json need only carry what has actually been translated.
 */
function merge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base }
  for (const [k, v] of Object.entries(over)) {
    const b = out[k]
    out[k] =
      b && typeof b === 'object' && v && typeof v === 'object'
        ? merge(b, v as Messages)
        : (v as string)
  }
  return out
}

export default getRequestConfig(async () => {
  const locale = await getLocale()
  const language = locale.split('-')[0]

  const base = (await import(`../../messages/${FALLBACK_LANGUAGE}.json`)).default as Messages
  const own = language === FALLBACK_LANGUAGE ? null : ((await loadMessages(language)) as Messages | null)

  return { locale, messages: own ? merge(base, own) : base }
})
