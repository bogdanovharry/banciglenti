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

/**
 * The storefront's strings live in one file per language plus one small file
 * per area under messages/parts/<area>.<language>.json.
 *
 * The area files exist because the Romanian translation is large and is done
 * in parallel, a screen at a time: one 600-key file edited by several people
 * at once is a file where somebody's work gets overwritten. Each area is owned
 * by whoever is translating it, and every file is optional — a missing one is
 * simply nothing to merge. Add a name here when a new area file is created.
 */
const AREAS = ['chrome', 'checkout', 'catalog', 'home', 'legal', 'seo'] as const

async function loadAreas(language: string): Promise<Messages> {
  let out: Messages = {}
  for (const area of AREAS) {
    try {
      const part = (await import(`../../messages/parts/${area}.${language}.json`)).default as Messages
      out = merge(out, part)
    } catch {
      // No file for this area in this language: nothing to add.
    }
  }
  return out
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

  const baseFile = (await import(`../../messages/${FALLBACK_LANGUAGE}.json`)).default as Messages
  const base = merge(baseFile, await loadAreas(FALLBACK_LANGUAGE))
  if (language === FALLBACK_LANGUAGE) return { locale, messages: base }

  const ownFile = (await loadMessages(language)) as Messages | null
  const own = ownFile ? merge(ownFile, await loadAreas(language)) : await loadAreas(language)

  return { locale, messages: merge(base, own) }
})
