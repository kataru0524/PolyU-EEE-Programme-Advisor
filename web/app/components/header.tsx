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
    <>
    <div className='shrink-0 flex items-center justify-between px-4 h-14 backdrop-blur-sm bg-white/90 dark:bg-gray-950/90 border-b border-gray-200/70 dark:border-gray-800/70 z-30'
      style={{ boxShadow: '0 1px 12px 0 rgba(0,0,0,0.06)' }}
    >
      <div className='flex items-center gap-2 min-w-0'>
        {isMobile && onShowSideBar && (
          <button
            onClick={onShowSideBar}
            className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0'
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* EEE Logo — light */}
        <a
          href="https://www.polyu.edu.hk/eee/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity duration-150 dark:hidden"
        >
          {/* icon-only on mobile/tablet, full logo on pc */}
          <img
            src="/eee-logo-light.png"
            alt="EEE"
            className="h-8 w-8 object-contain block pc:hidden"
          />
          <img
            src="/eee-logo-full-light.png"
            alt="Department of Electrical and Electronic Engineering"
            className="h-8 w-auto object-contain hidden pc:block"
          />
        </a>

        {/* EEE Logo — dark */}
        <a
          href="https://www.polyu.edu.hk/eee/"
          target="_blank"
          rel="noreferrer"
          className="items-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity duration-150 hidden dark:flex"
        >
          {/* icon-only on mobile/tablet, full logo on pc */}
          <img
            src="/eee-logo-dark.png"
            alt="EEE"
            className="h-8 w-8 object-contain block pc:hidden"
          />
          <img
            src="/eee-logo-full-dark.png"
            alt="Department of Electrical and Electronic Engineering"
            className="h-8 w-auto object-contain hidden pc:block"
          />
        </a>

        <div className='w-px h-5 bg-gray-300 dark:bg-gray-700 flex-shrink-0' />
        <h1 className='text-base font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate'>
          <span className='hidden pc:inline'>{translatedTitle}</span>
          <span className='inline pc:hidden'>{translatedTitleShort}</span>
        </h1>
      </div>

      <div className='flex items-center gap-2'>
        <button
          onClick={() => setSettingsOpen(true)}
          className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm font-medium'
          title={t('common.settings.title', { defaultValue: 'Settings' })}
        >
          <Cog6ToothIcon className="w-4 h-4" />
          <span className="mobile:hidden tablet:inline">{t('common.settings.title', { defaultValue: 'Settings' })}</span>
        </button>
      </div>
      

    </div>
    <SettingsDialog
      isOpen={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      onLanguageChange={onLanguageChange}
    />
    </>
  )
}

export default React.memo(Header)