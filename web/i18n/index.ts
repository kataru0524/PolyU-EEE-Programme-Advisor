export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'zh-Hans', 'zh-Hant', 'zh-HK'],
} as const

export type Locale = typeof i18n['locales'][number]
