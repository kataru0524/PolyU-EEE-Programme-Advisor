'use client'
import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Button from './button'

export interface IDeleteDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

const DeleteDialog: FC<IDeleteDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation()

  if (!isOpen) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" 
      onClick={onCancel}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-gray-700 dark:text-gray-300 mb-3">{message}</p>
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">
              {t('common.operation.cannotUndo')}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <Button
            onClick={onCancel}
            className="!h-9 !bg-white dark:!bg-gray-700 !text-gray-700 dark:!text-gray-200 hover:!bg-gray-100 dark:hover:!bg-gray-600 border border-gray-300 dark:border-gray-600"
          >
            {t('common.operation.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            className="!h-9 !bg-red-600 !text-white hover:!bg-red-700"
          >
            {t('common.operation.delete')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DeleteDialog
