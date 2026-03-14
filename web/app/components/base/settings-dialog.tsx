'use client'
import type { FC } from 'react'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { XMarkIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/solid'
import { getLocaleOnClient, setLocaleOnClient } from '@/i18n/client'
import type { Locale } from '@/i18n'
import { WELCOME_INTRO_PREF_EVENT, WELCOME_INTRO_SHOW_KEY } from '@/config'
import TurtleIcon from '@/app/components/icons/TurtleIcon'
import RabbitIcon from '@/app/components/icons/RabbitIcon'

type ThemeMode = 'light' | 'dark' | 'system'
type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

const fontSizeMap: Record<string, FontSize> = {
  '1': 'xs',
  '2': 'sm',
  '3': 'md',
  '4': 'lg',
  '5': 'xl',
  '6': '2xl',
  '7': '3xl',
}

const reverseFontSizeMap: Record<FontSize, string> = {
  'xs': '1',
  'sm': '2',
  'md': '3',
  'lg': '4',
  'xl': '5',
  '2xl': '6',
  '3xl': '7',
}

const speedMap: Record<string, number> = {
  '1': 0.8,
  '2': 0.95,
  '3': 1.1,
  '4': 1.3,
  '5': 1.5,
  '6': 1.7,
  '7': 1.9,
}

const reverseSpeedMap: Record<number, string> = {
  0.8: '1',
  0.95: '2',
  1.1: '3',
  1.3: '4',
  1.5: '5',
  1.7: '6',
  1.9: '7',
}

export interface ISettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onLanguageChange?: (languageName: string) => void
}

// Initialize theme and font size on module load
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

  const applyFontSizeGlobal = (size: FontSize) => {
    const root = document.documentElement
    root.classList.remove('font-size-xs', 'font-size-sm', 'font-size-md', 'font-size-lg', 'font-size-xl', 'font-size-2xl', 'font-size-3xl')
    root.classList.add(`font-size-${size}`)
  }

  const savedTheme = localStorage.getItem('theme_mode') as ThemeMode | null
  if (savedTheme) {
    applyThemeGlobal(savedTheme)
  } else {
    applyThemeGlobal('system')
  }

  const savedFontSize = localStorage.getItem('font_size') as FontSize | null
  if (savedFontSize) {
    applyFontSizeGlobal(savedFontSize)
  } else {
    applyFontSizeGlobal('md')
  }
}

const SettingsDialog: FC<ISettingsDialogProps> = ({
  isOpen,
  onClose,
  onLanguageChange,
}) => {
  const { t, i18n } = useTranslation()
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false)
  const [isDropdownAnimating, setIsDropdownAnimating] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Small delay to ensure the element is mounted before animating
      const timer = setTimeout(() => setIsAnimating(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
      // Keep mounted for exit animation
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])
  const [themeMode, setThemeMode] = useState<ThemeMode>('system')
  const [fontSize, setFontSize] = useState<FontSize>('md')
  const [currentLanguage, setCurrentLanguage] = useState(getLocaleOnClient())
  const [ttsSpeed, setTtsSpeed] = useState(1.10)
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(true)

  useEffect(() => {
    setCurrentLanguage(getLocaleOnClient())

    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme_mode') as ThemeMode | null
    if (savedTheme) {
      setThemeMode(savedTheme)
    }
    
    // Load font size preference from localStorage
    const savedFontSize = localStorage.getItem('font_size') as FontSize | null
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }

    // Load TTS preferences from localStorage
    const savedTtsSpeed = localStorage.getItem('tts_speed')
    if (savedTtsSpeed !== null) {
      setTtsSpeed(parseFloat(savedTtsSpeed))
    } else {
      setTtsSpeed(1.1)
      localStorage.setItem('tts_speed', '1.1')
    }

    const savedShowWelcomeIntro = localStorage.getItem(WELCOME_INTRO_SHOW_KEY)
    // Default to enabled when no explicit preference exists.
    setShowWelcomeIntro(savedShowWelcomeIntro !== '0')
  }, [isOpen])

  useEffect(() => {
    const handleLocaleChange = () => {
      setCurrentLanguage(getLocaleOnClient())
    }
    window.addEventListener('localechange', handleLocaleChange)
    return () => window.removeEventListener('localechange', handleLocaleChange)
  }, [])

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

  const applyFontSize = (size: FontSize) => {
    const root = document.documentElement
    root.classList.remove('font-size-xs', 'font-size-sm', 'font-size-md', 'font-size-lg', 'font-size-xl', 'font-size-2xl', 'font-size-3xl')
    root.classList.add(`font-size-${size}`)
  }

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size)
    localStorage.setItem('font_size', size)
    applyFontSize(size)
  }

  const handleLanguageChange = (locale: Locale) => {
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

  const handleTtsSpeedChange = (speed: number) => {
    setTtsSpeed(speed)
    localStorage.setItem('tts_speed', speed.toString())
  }

  const handleShowWelcomeIntroChange = (nextShow: boolean) => {
    setShowWelcomeIntro(nextShow)
    localStorage.setItem(WELCOME_INTRO_SHOW_KEY, nextShow ? '1' : '0')
    window.dispatchEvent(new CustomEvent(WELCOME_INTRO_PREF_EVENT, { detail: nextShow }))
  }

  const getTtsSpeedLevel = (speed: number): string => {
    // Find the closest speed level
    const speeds = Object.values(speedMap)
    const closest = speeds.reduce((prev, curr) => 
      Math.abs(curr - speed) < Math.abs(prev - speed) ? curr : prev
    )
    return reverseSpeedMap[closest] || '3'
  }

  const languages: Array<{ code: Locale, name: string }> = [
    { code: 'en', name: 'English' },
    { code: 'zh-HK', name: '繁體中文（粵語）' },
    { code: 'zh-Hant', name: '繁體中文（國語）' },
    { code: 'zh-Hans', name: '简体中文' },
  ]

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-3rem)] flex flex-col overflow-hidden transition-all duration-300 ${
        isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('common.settings.title', { defaultValue: 'Settings' })}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {/* Language Section */}
          <div className="relative py-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              {t('common.settings.language', { defaultValue: 'Language' })}
            </h3>
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setDropdownPosition({
                  top: rect.bottom + 8,
                  left: rect.left,
                  width: rect.width
                })
                if (!languageDropdownOpen) {
                  setLanguageDropdownOpen(true)
                  setTimeout(() => setIsDropdownAnimating(true), 10)
                } else {
                  setIsDropdownAnimating(false)
                  setTimeout(() => setLanguageDropdownOpen(false), 200)
                }
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 transition-all hover:border-gray-300 dark:hover:border-gray-600"
            >
              <span>{languages.find(l => l.code === currentLanguage)?.name}</span>
              <svg 
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${languageDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* Theme Section */}
          <div className="py-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
              {t('common.settings.appearance', { defaultValue: 'Appearance' })}
            </h3>
            {/* Segmented Control */}
            <div className="relative grid grid-cols-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-full gap-1">
              {/* Sliding background */}
              <div 
                className="absolute top-1 bottom-1 bg-white dark:bg-gray-700 rounded-full shadow-md transition-all duration-300 ease-out"
                style={{
                  left: themeMode === 'system' ? '0.25rem' : themeMode === 'light' ? 'calc(33.333% + 0.125rem)' : 'calc(66.666% + 0rem)',
                  width: 'calc(33.333% - 0.375rem)'
                }}
              />
              <button
                onClick={() => handleThemeChange('system')}
                aria-label="System theme"
                aria-pressed={themeMode === 'system'}
                className={`relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 z-10 ${
                  themeMode === 'system'
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <ComputerDesktopIcon className="w-5 h-5 transition-transform duration-200" />
                <span className="text-xs hidden sm:block">{t('common.theme.system')}</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('light')}
                aria-label="Light theme"
                aria-pressed={themeMode === 'light'}
                className={`relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 z-10 ${
                  themeMode === 'light'
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <SunIcon className="w-5 h-5 transition-transform duration-200" />
                <span className="text-xs hidden sm:block">{t('common.theme.light')}</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                aria-label="Dark theme"
                aria-pressed={themeMode === 'dark'}
                className={`relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 z-10 ${
                  themeMode === 'dark'
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <MoonIcon className="w-5 h-5 transition-transform duration-200" />
                <span className="text-xs hidden sm:block">{t('common.theme.dark')}</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* Font Size Section */}
          <div className="py-6 pb-8">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
              {t('common.settings.fontSize', { defaultValue: 'Font Size' })}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">A</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={reverseFontSizeMap[fontSize]}
                  onChange={(e) => handleFontSizeChange(fontSizeMap[e.target.value])}
                  aria-label="Font size"
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:accent-gray-300 transition-all duration-150 hover:h-2.5 active:h-3"
                />
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-semibold text-gray-600 dark:text-gray-400">A</span>
                </div>
              </div>
              <div className="flex items-start gap-4 text-xs text-gray-500 dark:text-gray-500 font-medium">
                <span className="w-6 flex-shrink-0 flex justify-center whitespace-nowrap">{t('common.settings.fontSizeXs', { defaultValue: 'Small' })}</span>
                <div className="flex-1 relative h-4">
                  <span className="absolute -translate-x-1/2" style={{ left: '34%' }}>{t('common.settings.fontSizeMd', { defaultValue: 'Default' })}</span>
                </div>
                <span className="w-6 flex-shrink-0 flex justify-center whitespace-nowrap">{t('common.settings.fontSize3xl', { defaultValue: 'Large' })}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* Speech Speed Section */}
          <div className="py-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
              {t('common.settings.ttsSpeed', { defaultValue: 'Text-to-Speech Speed' })}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                  <TurtleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={getTtsSpeedLevel(ttsSpeed)}
                  onChange={(e) => handleTtsSpeedChange(speedMap[e.target.value])}
                  aria-label="Speech speed"
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:accent-gray-300 transition-all duration-150 hover:h-2.5 active:h-3"
                />
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                  <RabbitIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              <div className="flex items-start gap-4 text-xs text-gray-500 dark:text-gray-500 font-medium">
                <span className="w-6 flex-shrink-0 flex justify-center whitespace-nowrap">{t('common.settings.ttsSlow', { defaultValue: 'Slow' })}</span>
                <div className="flex-1 relative h-4">
                  <span className="absolute -translate-x-1/2" style={{ left: '34%' }}>{t('common.settings.ttsDefault', { defaultValue: 'Default' })}</span>
                </div>
                <span className="w-6 flex-shrink-0 text-center">{t('common.settings.ttsFast', { defaultValue: 'Fast' })}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* Welcome Intro Section */}
          <div className="pt-6 pb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              {t('common.settings.welcomeIntro', { defaultValue: 'Welcome Card' })}
            </h3>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {t('common.settings.showWelcomeIntro', { defaultValue: 'Show welcome card for new chats' })}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showWelcomeIntro}
                onClick={() => handleShowWelcomeIntroChange(!showWelcomeIntro)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${showWelcomeIntro ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span
                  className={`absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${showWelcomeIntro ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Language Dropdown - Floating above dialog */}
      {languageDropdownOpen && (
        <>
          <div 
            className={`fixed inset-0 z-[60] transition-opacity duration-200 ${
              isDropdownAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => {
              setIsDropdownAnimating(false)
              setTimeout(() => setLanguageDropdownOpen(false), 200)
            }}
          />
          <div 
            className={`fixed z-[70] py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-auto transition-all duration-200 ${
              isDropdownAnimating 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 -translate-y-2'
            }`}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  handleLanguageChange(lang.code)
                  setIsDropdownAnimating(false)
                  setTimeout(() => setLanguageDropdownOpen(false), 200)
                }}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  currentLanguage === lang.code
                    ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-gray-200 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default SettingsDialog
