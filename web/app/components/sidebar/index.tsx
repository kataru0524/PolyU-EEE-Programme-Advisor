import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChatBubbleOvalLeftEllipsisIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { ChatBubbleOvalLeftEllipsisIcon as ChatBubbleOvalLeftEllipsisSolidIcon, StarIcon } from '@heroicons/react/24/solid'
import Button from '@/app/components/base/button'
import ConversationMenu from '@/app/components/base/conversation-menu'
import RenameDialog from '@/app/components/base/rename-dialog'
// import Card from './card'
import type { ConversationItem } from '@/types/app'

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

const MAX_CONVERSATION_LENTH = 20
const MIN_SIDEBAR_WIDTH = 244

const getMaxSidebarWidth = () =>
  typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.4) : 9999

function getInitialWidth(): number {
  if (typeof window === 'undefined') return MIN_SIDEBAR_WIDTH
  const stored = localStorage.getItem('sidebar-width')
  if (stored) {
    const n = parseFloat(stored)
    if (!Number.isNaN(n) && n >= MIN_SIDEBAR_WIDTH) return n
  }
  const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width-pc')
  const parsed = parseFloat(cssVar)
  return Number.isNaN(parsed) ? MIN_SIDEBAR_WIDTH : Math.max(parsed, MIN_SIDEBAR_WIDTH)
}

export interface ISidebarProps {
  copyRight: string
  currentId: string
  onCurrentIdChange: (id: string) => void
  list: ConversationItem[]
  onPinConversation?: (id: string) => void
  onRenameConversation?: (id: string, name: string) => void
  onDeleteConversation?: (id: string) => void
}

const Sidebar: FC<ISidebarProps> = ({
  copyRight,
  currentId,
  onCurrentIdChange,
  list,
  onPinConversation,
  onRenameConversation,
  onDeleteConversation,
}) => {
  const { t } = useTranslation()
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingId, setRenamingId] = useState<string>('')
  const [renamingName, setRenamingName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState<number>(MIN_SIDEBAR_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  // Initialise from stored / CSS value after mount
  useEffect(() => {
    const w = getInitialWidth()
    setSidebarWidth(w)
    document.documentElement.style.setProperty('--sidebar-width-pc', `${w}px`)
  }, [])

  const startDrag = useCallback((startX: number) => {
    dragStartX.current = startX
    dragStartWidth.current = sidebarWidth
    setIsDragging(true)
  }, [sidebarWidth])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startDrag(e.clientX)
  }, [startDrag])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't call preventDefault here — it would block scrolling outside the handle.
    startDrag(e.touches[0].clientX)
  }, [startDrag])

  useEffect(() => {
    if (!isDragging) return

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    const applyDelta = (clientX: number) => {
      const delta = clientX - dragStartX.current
      const newWidth = Math.min(getMaxSidebarWidth(), Math.max(MIN_SIDEBAR_WIDTH, dragStartWidth.current + delta))
      setSidebarWidth(newWidth)
      document.documentElement.style.setProperty('--sidebar-width-pc', `${newWidth}px`)
      return newWidth
    }

    const onMouseMove = (e: MouseEvent) => applyDelta(e.clientX)
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault() // prevent page scroll while resizing
      applyDelta(e.touches[0].clientX)
    }

    const endDrag = (clientX: number) => {
      const finalWidth = Math.min(getMaxSidebarWidth(), Math.max(MIN_SIDEBAR_WIDTH, dragStartWidth.current + (clientX - dragStartX.current)))
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      setIsDragging(false)
      localStorage.setItem('sidebar-width', String(finalWidth))
    }

    const onMouseUp = (e: MouseEvent) => endDrag(e.clientX)
    const onTouchEnd = (e: TouchEvent) => endDrag(e.changedTouches[0].clientX)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDragging])

  const handleRename = (id: string) => {
    const conversation = list.find(item => item.id === id)
    if (!conversation) return

    setRenamingId(id)
    setRenamingName(conversation.name)
    setRenameDialogOpen(true)
  }

  const handleRenameConfirm = async (newName: string) => {
    setIsRenaming(true)
    try {
      await onRenameConversation?.(renamingId, newName)
      setRenameDialogOpen(false)
      setRenamingId('')
      setRenamingName('')
    }
    finally {
      setIsRenaming(false)
    }
  }

  const handleRenameCancel = () => {
    if (!isRenaming) {
      setRenameDialogOpen(false)
      setRenamingId('')
      setRenamingName('')
    }
  }

  return (
    <div
      data-lang-resize-ignore
      className="relative shrink-0 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full"
      style={{ width: sidebarWidth }}
    >
      {list.length < MAX_CONVERSATION_LENTH && (
        <div className="flex flex-shrink-0 p-4 !pb-0">
          <Button
            onClick={() => { onCurrentIdChange('-1') }}
            className="group block w-full flex-shrink-0 !justify-start !h-9 text-primary-600 dark:text-white items-center text-sm bg-primary-50 dark:bg-gray-800/50 border border-primary-200 dark:border-gray-600 hover:!bg-primary-100 dark:hover:!bg-gray-800"
          >
            <PencilSquareIcon className="mr-2 h-4 w-4" /> {t('app.chat.newChat')}
          </Button>
        </div>
      )}

      <nav className="mt-4 flex-1 overflow-y-auto space-y-1 bg-white dark:bg-gray-900 p-4 !pt-0">
        {list.map((item) => {
          const isCurrent = item.id === currentId
          const ItemIcon
            = isCurrent ? ChatBubbleOvalLeftEllipsisSolidIcon : ChatBubbleOvalLeftEllipsisIcon
          const isNewChat = item.id === '-1'
          const displayName = isNewChat ? t('app.chat.newChat') : item.name
          return (
            <div
              onClick={() => onCurrentIdChange(item.id)}
              onTouchEnd={(e) => {
                const target = e.target as HTMLElement
                if (target.closest('button')) return
                e.preventDefault()
                onCurrentIdChange(item.id)
              }}
              key={item.id}
              className={classNames(
                isCurrent
                  ? 'bg-gradient-to-r from-primary-50 to-transparent dark:from-gray-800 dark:to-transparent text-primary-600 dark:text-gray-100 border-l-2 border-primary-600 dark:border-primary-400 pl-[6px]'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200 hover:translate-x-0.5 border-l-2 border-transparent',
                'group flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium cursor-pointer',
                'transition-all duration-200 ease-out',
              )}
            >
              <div className="flex items-center flex-1 min-w-0 gap-2">
                <ItemIcon
                  className={classNames(
                    isCurrent
                      ? 'text-primary-600 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400',
                    'h-5 w-5 flex-shrink-0 transition-colors duration-200',
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{displayName}</span>
                {item.is_pinned && (
                  <StarIcon className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <div className={classNames(
                'transition-opacity flex-shrink-0 w-6 h-6',
                isNewChat ? 'invisible pointer-events-none' : 'opacity-0 group-hover:opacity-100',
              )}>
                <ConversationMenu
                  isPinned={item.is_pinned}
                  onPin={() => onPinConversation?.(item.id)}
                  onRename={() => handleRename(item.id)}
                  onDelete={() => onDeleteConversation?.(item.id)}
                />
              </div>
            </div>
          )
        })}
      </nav>

      {/* PolyU Logo Footer */}
      <div className='flex-shrink-0 px-3 py-5 flex items-center justify-center'>
        <a href="https://www.polyu.edu.hk/" target="_blank" rel="noreferrer" className="flex items-center">
          <img
            src="/polyu-logo-full-light.png"
            alt="The Hong Kong Polytechnic University"
            className="h-10 w-auto object-contain opacity-60 hover:opacity-90 transition-opacity dark:hidden"
          />
          <img
            src="/polyu-logo-full-dark.png"
            alt="The Hong Kong Polytechnic University"
            className="h-10 w-auto object-contain opacity-50 hover:opacity-80 transition-opacity hidden dark:block"
          />
        </a>
      </div>

      <RenameDialog
        isOpen={renameDialogOpen}
        currentName={renamingName}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
        isLoading={isRenaming}
      />

      {/* Resize handle – positioned on the right edge, wider tap target on touch */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className={classNames(
          'absolute top-0 right-0 h-full z-10',
          'w-1 hover:w-2 active:w-2 cursor-col-resize touch-none',
          'hover:bg-primary-300 dark:hover:bg-primary-700 transition-all duration-150',
          isDragging ? 'bg-primary-400 dark:bg-primary-600 w-2' : 'bg-transparent',
        )}
        title="Drag to resize"
      />
    </div>
  )
}

export default React.memo(Sidebar)
