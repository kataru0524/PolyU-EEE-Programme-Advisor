'use client'
import type { FC } from 'react'
import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  EllipsisVerticalIcon,
  PencilIcon,
  StarIcon as StarOutlineIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

export interface IConversationMenuProps {
  isPinned?: boolean
  onPin?: () => void
  onRename?: () => void
  className?: string
}

const ConversationMenu: FC<IConversationMenuProps> = ({
  isPinned = false,
  onPin,
  onRename,
  className = '',
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1 rounded hover:bg-gray-200 transition-colors"
        aria-label="Conversation menu"
      >
        <EllipsisVerticalIcon className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-[10000] w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPin?.()
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            {isPinned ? (
              <>
                <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                {t('common.operation.unpin')}
              </>
            ) : (
              <>
                <StarOutlineIcon className="w-4 h-4" />
                {t('common.operation.pin')}
              </>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRename?.()
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            {t('common.operation.rename')}
          </button>
        </div>
      )}
    </div>
  )
}

export default ConversationMenu
