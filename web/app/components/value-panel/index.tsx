'use client'
import type { FC, ReactNode } from 'react'
import React from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import s from './style.module.css'
import { StarIcon } from '@/app/components//welcome/massive-component'
import Button from '@/app/components/base/button'

export interface ITemplateVarPanelProps {
  className?: string
  header: ReactNode
  children?: ReactNode | null
  isFold: boolean
}

const TemplateVarPanel: FC<ITemplateVarPanelProps> = ({
  className,
  header,
  children,
  isFold,
}) => {
  return (
    <div className={cn(isFold ? 'border border-indigo-100 dark:border-gray-800' : s.boxShodow, className, 'rounded-xl')}>
      {/* header */}
      <div
        className={cn(isFold && 'rounded-b-xl', 'rounded-t-xl px-6 py-4 bg-indigo-25 dark:bg-gray-800 text-xs')}
      >
        {header}
      </div>
      {/* body */}
      {!isFold && children && (
        <div className='rounded-b-xl p-6 bg-white dark:bg-gray-900 mobile:flex-1'>
          {children}
        </div>
      )}
    </div>
  )
}

export const PanelTitle: FC<{ title: string, className?: string }> = ({
  title,
  className,
}) => {
  return (
    <div className={cn(className, 'flex items-center gap-1 text-indigo-600 dark:text-gray-100')}>
      <span className='inline-flex h-3 w-3 min-h-3 min-w-3 flex-none'>
        <StarIcon className='h-3 w-3' />
      </span>
      <span className='min-w-0 text-xs'>{title}</span>
    </div>
  )
}

export const VarOpBtnGroup: FC<{ className?: string, onConfirm: () => void, onCancel: () => void }> = ({
  className,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation()

  return (
    <div className={cn(className, 'mt-5 flex justify-end space-x-2 text-sm')}>
      <Button
        className='text-sm'
        type='primary'
        onClick={onConfirm}
      >
        {t('common.operation.save')}
      </Button>
      <Button
        className='text-sm'
        onClick={onCancel}
      >
        {t('common.operation.cancel')}
      </Button>
    </div >
  )
}

export default React.memo(TemplateVarPanel)
