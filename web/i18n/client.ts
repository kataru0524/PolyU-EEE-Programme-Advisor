import Cookies from 'js-cookie'
import type { Locale } from '.'
import { i18n } from '.'
import { LOCALE_COOKIE_NAME } from '@/config'
import { changeLanguage } from '@/i18n/i18next-config'

/** localStorage key written ONLY when the user explicitly selects a language. */
const USER_LOCALE_EXPLICIT_KEY = 'user_locale_explicit'

/**
 * Maps a browser language tag (e.g. navigator.language) to one of the
 * supported app locales.  Returns the default locale when no match is found.
 */
const mapBrowserLanguageToLocale = (browserLang: string): Locale => {
  const lower = browserLang.toLowerCase()

  // Traditional Chinese – Hong Kong / Macau
  if (lower === 'zh-hk' || lower === 'zh-mo')
    return 'zh-HK'

  // Traditional Chinese – Taiwan and generic Hant
  if (lower === 'zh-tw' || lower === 'zh-hant')
    return 'zh-Hant'

  // Simplified Chinese – Mainland, Singapore and generic Hans / bare "zh"
  if (lower.startsWith('zh'))
    return 'zh-Hans'

  // English and everything else
  if (lower.startsWith('en'))
    return 'en'

  return i18n.defaultLocale
}

/**
 * Detect the best locale from the browser's language list.
 */
const detectBrowserLocale = (): Locale => {
  if (typeof navigator === 'undefined')
    return i18n.defaultLocale

  const langs: string[] = Array.from(
    navigator.languages?.length ? navigator.languages : [navigator.language],
  )
  for (const lang of langs) {
    if (!lang) continue
    const mapped = mapBrowserLanguageToLocale(lang)
    // Accept this mapping if it resolves to a non-default locale, or if the
    // browser language is explicitly English (so 'en' is returned for English
    // browsers rather than falling through indefinitely).
    if (mapped !== i18n.defaultLocale || lang.toLowerCase().startsWith('en'))
      return mapped
  }
  return i18n.defaultLocale
}

/**
 * Returns the locale that should be active on the client.
 *
 * Priority:
 *  1. USER_LOCALE_EXPLICIT_KEY in localStorage — set only when the user picks
 *     a language via the settings/language-selector UI.
 *  2. Browser language auto-detection.
 *  3. App default locale.
 *
 * The generic `locale` cookie is intentionally NOT used as the sole source of
 * truth here because older versions of the app wrote the app default ('en')
 * into that cookie on every startup, making it impossible to distinguish a
 * real user preference from the hardcoded default.
 */
export const getLocaleOnClient = (): Locale => {
  // Only respect the stored value when the user explicitly chose it.
  if (typeof localStorage !== 'undefined') {
    const explicit = localStorage.getItem(USER_LOCALE_EXPLICIT_KEY) as Locale | null
    if (explicit && (i18n.locales as readonly string[]).includes(explicit))
      return explicit
  }

  // Auto-detect from browser language.
  return detectBrowserLocale()
}

export const setLocaleOnClient = (locale: Locale, notReload?: boolean) => {
  // Mark as explicit user choice so future loads respect it.
  if (typeof localStorage !== 'undefined')
    localStorage.setItem(USER_LOCALE_EXPLICIT_KEY, locale)
  Cookies.set(LOCALE_COOKIE_NAME, locale)
  localStorage.setItem('user_language', locale)
  changeLanguage(locale)
  // Notify any listeners (e.g. welcome inputs) of the locale change without a full reload.
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('localechange', { detail: locale }))
  if (!notReload) { location.reload() }
}
