'use client'
import type { FC } from 'react'
import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Button from './button'

export interface IRenameDialogProps {
  isOpen: boolean
  currentName: string
  onConfirm: (newName: string) => void
  onCancel: () => void
}

const RenameDialog: FC<IRenameDialogProps> = ({
  isOpen,
  currentName,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation()
  const [name, setName] = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName(currentName)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 100)
    }
  }, [isOpen, currentName])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onCancel}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('app.chat.renameConversation')}</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('app.chat.renameConversation')}
          />
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50">
          <Button
            onClick={onCancel}
            className="!h-9 !bg-white !text-gray-700 hover:!bg-gray-100 border border-gray-300"
          >
            {t('common.operation.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            className="!h-9 !bg-primary-600 !text-white hover:!bg-primary-700 disabled:!bg-gray-300 disabled:!text-gray-500"
            disabled={!name.trim()}
          >
            {t('common.operation.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RenameDialog
