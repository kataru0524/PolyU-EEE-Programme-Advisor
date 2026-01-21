'use client'
import type { FC } from 'react'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from './language-selector'
import {
  Bars3Icon,
  PencilSquareIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/solid'
import AppIcon from '@/app/components/base/app-icon'

type ThemeMode = 'light' | 'dark' | 'system'
export interface IHeaderProps {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
  onLanguageChange?: (languageName: string) => void
}
const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
  onLanguageChange,
}) => {
  const { t } = useTranslation()
  const translatedTitle = t('questions.title', { defaultValue: title })
  const translatedTitleShort = t('questions.titleShort', { defaultValue: translatedTitle })
  
  const [themeMode, setThemeMode] = useState<ThemeMode>('system')

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme_mode') as ThemeMode | null
    if (savedTheme) {
      setThemeMode(savedTheme)
      applyTheme(savedTheme)
    } else {
      applyTheme('system')
    }
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

  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system']
    const currentIndex = modes.indexOf(themeMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    
    setThemeMode(nextMode)
    localStorage.setItem('theme_mode', nextMode)
    applyTheme(nextMode)
  }

  const getThemeIcon = () => {
    if (themeMode === 'light') return <SunIcon className="w-5 h-5" />
    if (themeMode === 'dark') return <MoonIcon className="w-5 h-5" />
    return <ComputerDesktopIcon className="w-5 h-5" />
  }

  const getThemeTooltip = () => {
    if (themeMode === 'light') return t('common.theme.light')
    if (themeMode === 'dark') return t('common.theme.dark')
    return t('common.theme.system')
  }
  
  return (
    <div className='flex items-center justify-between px-6 h-12 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800'>
      <div className='flex items-center gap-3'>
        {isMobile && onShowSideBar && (
          <button
            onClick={onShowSideBar}
            className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
          <span className='mobile:hidden tablet:inline'>{translatedTitle}</span>
          <span className='mobile:inline tablet:hidden'>{translatedTitleShort}</span>
        </h1>
      </div>

      <div className='flex items-center gap-3'>
        <button
          onClick={cycleTheme}
          className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors'
          title={getThemeTooltip()}
        >
          {getThemeIcon()}
        </button>
        <LanguageSelector onLanguageChange={onLanguageChange} />
      </div>
    </div>
  )
}

export default React.memo(Header)