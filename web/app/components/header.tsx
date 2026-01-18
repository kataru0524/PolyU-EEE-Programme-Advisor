'use client'
import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from './language-selector'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import AppIcon from '@/app/components/base/app-icon'
export interface IHeaderProps {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
}
const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
}) => {
  const { t } = useTranslation()
  const translatedTitle = t('questions.title', { defaultValue: title })
  const translatedTitleShort = t('questions.titleShort', { defaultValue: translatedTitle })
  
  return (
    <div className='flex items-center justify-between px-6 h-12 bg-white border-b border-gray-200'>
      <div className='flex items-center gap-3'>
        {isMobile && onShowSideBar && (
          <button
            onClick={onShowSideBar}
            className='p-2 rounded-lg hover:bg-gray-100'
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className='text-lg font-semibold text-gray-900'>
          <span className='mobile:hidden tablet:inline'>{translatedTitle}</span>
          <span className='mobile:inline tablet:hidden'>{translatedTitleShort}</span>
        </h1>
      </div>

      <LanguageSelector />
    </div>
  )
}

export default React.memo(Header)