'use client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonEn from './lang/common.en'
import commonZh from './lang/common.zh'
import commonZhHant from './lang/common.zh-Hant'
import commonZhHK from './lang/common.zh-HK'
import appEn from './lang/app.en'
import appZh from './lang/app.zh'
import appZhHant from './lang/app.zh-Hant'
import appZhHK from './lang/app.zh-HK'
import toolsEn from './lang/tools.en'
import toolsZh from './lang/tools.zh'
import toolsZhHant from './lang/tools.zh-Hant'
import toolsZhHK from './lang/tools.zh-HK'
import questionsEn from './lang/questions.en'
import questionsZh from './lang/questions.zh'
import questionsZhHant from './lang/questions.zh-Hant'
import questionsZhHK from './lang/questions.zh-HK'

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
  'zh-HK': {
    translation: {
      common: commonZhHK,
      app: appZhHK,
      tools: toolsZhHK,
      questions: questionsZhHK,
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
