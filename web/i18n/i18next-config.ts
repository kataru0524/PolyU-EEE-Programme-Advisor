'use client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonEn from './lang/common.en'
import commonEs from './lang/common.es'
import commonZh from './lang/common.zh'
import commonZhHant from './lang/common.zh-Hant'
import commonVi from './lang/common.vi'
import commonJa from './lang/common.ja'
import commonFr from './lang/common.fr'
import appEn from './lang/app.en'
import appEs from './lang/app.es'
import appZh from './lang/app.zh'
import appZhHant from './lang/app.zh-Hant'
import appVi from './lang/app.vi'
import appJa from './lang/app.ja'
import appFr from './lang/app.fr'
import toolsEn from './lang/tools.en'
import toolsZh from './lang/tools.zh'
import toolsZhHant from './lang/tools.zh-Hant'
import toolsVi from './lang/tools.vi'
import toolsJa from './lang/tools.ja'
import toolsFr from './lang/tools.fr'
import questionsEn from './lang/questions.en'
import questionsZh from './lang/questions.zh'
import questionsZhHant from './lang/questions.zh-Hant'

import type { Locale } from '.'

const resources = {
  'en': {
    translation: {
      common: commonEn,
      app: appEn,
      tools: toolsEn,
      questions: questionsEn,
    },
  },
  'es': {
    translation: {
      common: commonEs,
      app: appEs,
    },
  },
  'zh-Hans': {
    translation: {
      common: commonZh,
      app: appZh,
      tools: toolsZh,
      questions: questionsZh,
    },
  },
  'zh-Hant': {
    translation: {
      common: commonZhHant,
      app: appZhHant,
      tools: toolsZhHant,
      questions: questionsZhHant,
    },
  },
  'vi': {
    translation: {
      common: commonVi,
      app: appVi,
      tools: toolsVi,
    },
  },
  'ja': {
    translation: {
      common: commonJa,
      app: appJa,
      tools: toolsJa,
    },
  },
  'fr': {
    translation: {
      common: commonFr,
      app: appFr,
      tools: toolsFr,
    },
  },
}

i18n.use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    lng: 'en',
    fallbackLng: 'en',
    // debug: true,
    resources,
  })

export const changeLanguage = (lan: Locale) => {
  i18n.changeLanguage(lan)
}
export default i18n
