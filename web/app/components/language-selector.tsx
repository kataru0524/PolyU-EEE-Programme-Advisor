'use client'
import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { setLocaleOnClient } from '@/i18n/client'

interface Language {
  code: string
  name: string
  shortName: string
  flag: string
}

const languages: Language[] = [
  { code: 'en', name: 'English', shortName: 'Eng', flag: '🇬🇧' },
  { code: 'zh-HK', name: '繁體廣東話', shortName: '粵', flag: '🇭🇰' },
  { code: 'zh-Hant', name: '繁體中文', shortName: '繁', flag: '🇭🇰' },
  { code: 'zh-Hans', name: '简体中文', shortName: '简', flag: '🇨🇳' },
]

// Convert locale code to language name for API
const getLanguageName = (locale: string) => {
  const languageMap: Record<string, string> = {
    'en': 'English',
    'zh-HK': 'Traditional Chinese (Cantonese)',
    'zh-Hant': 'Traditional Chinese (Mandarin)',
    'zh-Hans': 'Simplified Chinese',
  }
  return languageMap[locale] || locale
}

interface LanguageSelectorProps {
  onLanguageChange?: (languageName: string) => void
}

const LanguageSelector: FC<LanguageSelectorProps> = ({ onLanguageChange }) => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = React.useState(false)

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (langCode: string) => {
    setLocaleOnClient(langCode, true)
    setIsOpen(false)
    // Notify parent component of language change
    if (onLanguageChange) {
      onLanguageChange(getLanguageName(langCode))
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span className="text-xl mobile:hidden tablet:inline">{currentLanguage.flag}</span>
        <span className="text-sm font-medium mobile:hidden tablet:inline">{currentLanguage.name}</span>
        <span className="text-sm font-medium mobile:inline tablet:hidden">{currentLanguage.shortName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                lang.code === i18n.language ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
              {lang.code === i18n.language && (
                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSelector