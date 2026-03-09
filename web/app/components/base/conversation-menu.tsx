'use client'
import type { FC } from 'react'
import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  EllipsisVerticalIcon,
  PencilIcon,
  StarIcon as StarOutlineIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

export interface IConversationMenuProps {
  isPinned?: boolean
  onPin?: () => void
  onRename?: () => void
  onDelete?: () => void
  className?: string
}

const ConversationMenu: FC<IConversationMenuProps> = ({
  isPinned = false,
  onPin,
  onRename,
  onDelete,
  className = '',
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      setTimeout(() => setIsVisible(false), 200)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node)
        && buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen)
      document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const left = Math.min(rect.right + 4, window.innerWidth - 168)
      setDropdownPos({ top: rect.top, left })
    }
    setIsOpen(v => !v)
  }

  const handleMenuAction = (action?: () => void) => {
    action?.()
    setIsOpen(false)
  }

  const dropdown = isVisible
    ? ReactDOM.createPortal(
      <div
        ref={menuRef}
        style={{ top: dropdownPos.top, left: dropdownPos.left }}
        className={`fixed z-[99999] w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 transition-all duration-200 origin-top-left ${
          isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); handleMenuAction(onPin) }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-all duration-150 hover:pl-5"
        >
          {isPinned ? (
            <><StarSolidIcon className="w-4 h-4 text-yellow-500" />{t('common.operation.unpin')}</>
          ) : (
            <><StarOutlineIcon className="w-4 h-4" />{t('common.operation.pin')}</>
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleMenuAction(onRename) }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-all duration-150 hover:pl-5"
        >
          <PencilIcon className="w-4 h-4" />{t('common.operation.rename')}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleMenuAction(onDelete) }}
          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition-all duration-150 hover:pl-5"
        >
          <TrashIcon className="w-4 h-4" />{t('common.operation.delete')}
        </button>
      </div>,
      document.body,
    )
    : null

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Conversation menu"
      >
        <EllipsisVerticalIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
      {dropdown}
    </div>
  )
}

export default ConversationMenu
