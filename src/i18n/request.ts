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
export default getRequestConfig(async () => {
  const locale = await getLocale()
  const language = locale.split('-')[0]

  return {
    locale,
    messages: (await import(`../../messages/${language}.json`)).default,
  }
})
