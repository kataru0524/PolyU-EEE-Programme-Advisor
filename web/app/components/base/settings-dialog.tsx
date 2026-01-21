'use client'
import type { FC } from 'react'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { XMarkIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/solid'
import { getLocaleOnClient, setLocaleOnClient } from '@/i18n/client'

type ThemeMode = 'light' | 'dark' | 'system'

export interface ISettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onLanguageChange?: (languageName: string) => void
}

// Initialize theme on module load
if (typeof window !== 'undefined') {
  const applyThemeGlobal = (mode: ThemeMode) => {
    const root = document.documentElement
    
    if (mode === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', isDark)
    } else if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const savedTheme = localStorage.getItem('theme_mode') as ThemeMode | null
  if (savedTheme) {
    applyThemeGlobal(savedTheme)
  } else {
    applyThemeGlobal('system')
  }
}

const SettingsDialog: FC<ISettingsDialogProps> = ({
  isOpen,
  onClose,
  onLanguageChange,
}) => {
  const { t, i18n } = useTranslation()
  const [themeMode, setThemeMode] = useState<ThemeMode>('system')
  const [currentLanguage, setCurrentLanguage] = useState(getLocaleOnClient())

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme_mode') as ThemeMode | null
    if (savedTheme) {
      setThemeMode(savedTheme)
    }
  }, [isOpen])

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement
    
    if (mode === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', isDark)
    } else if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode)
    localStorage.setItem('theme_mode', mode)
    applyTheme(mode)
  }

  const handleLanguageChange = (locale: string) => {
    setCurrentLanguage(locale)
    setLocaleOnClient(locale, true)
    
    // Get the language name for the callback
    const languageMap: Record<string, string> = {
      'en': 'English',
      'zh-HK': 'Traditional Chinese (Cantonese)',
      'zh-Hant': 'Traditional Chinese (Mandarin)',
      'zh-Hans': 'Simplified Chinese',
    }
    const languageName = languageMap[locale] || locale
    onLanguageChange?.(languageName)
  }

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh-HK', name: '繁體中文（粵語）' },
    { code: 'zh-Hant', name: '繁體中文（國語）' },
    { code: 'zh-Hans', name: '简体中文' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('common.settings.title', { defaultValue: 'Settings' })}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              {t('common.settings.appearance', { defaultValue: 'Appearance' })}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleThemeChange('system')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  themeMode === 'system'
                    ? 'border-primary-600 dark:border-gray-500 bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-gray-200'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                }`}
              >
                <ComputerDesktopIcon className="w-6 h-6" />
                <span className="text-xs font-medium">
                  {t('common.theme.system')}
                </span>
              </button>
              
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  themeMode === 'light'
                    ? 'border-primary-600 dark:border-gray-500 bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-gray-200'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                }`}
              >
                <SunIcon className="w-6 h-6" />
                <span className="text-xs font-medium">
                  {t('common.theme.light')}
                </span>
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  themeMode === 'dark'
                    ? 'border-primary-600 dark:border-gray-500 bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-gray-200'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                }`}
              >
                <MoonIcon className="w-6 h-6" />
                <span className="text-xs font-medium">
                  {t('common.theme.dark')}
                </span>
              </button>
            </div>
          </div>

          {/* Language Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              {t('common.settings.language', { defaultValue: 'Language' })}
            </h3>
            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    currentLanguage === lang.code
                      ? 'border-primary-600 dark:border-gray-500 bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-gray-200'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <span className="font-medium">{lang.name}</span>
                  {currentLanguage === lang.code && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsDialog
