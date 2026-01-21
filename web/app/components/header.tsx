'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SettingsDialog from './base/settings-dialog'
import {
  Cog6ToothIcon,
} from '@heroicons/react/24/solid'

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
  
  const [settingsOpen, setSettingsOpen] = useState(false)
  
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
          onClick={() => setSettingsOpen(true)}
          className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors'
          title={t('common.settings.title', { defaultValue: 'Settings' })}
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      </div>
      
      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLanguageChange={onLanguageChange}
      />
    </div>
  )
}

export default React.memo(Header)