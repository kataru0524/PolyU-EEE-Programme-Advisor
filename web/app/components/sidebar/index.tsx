import React, { useState } from 'react'
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

export interface ISidebarProps {
  copyRight: string
  currentId: string
  onCurrentIdChange: (id: string) => void
  list: ConversationItem[]
  onPinConversation?: (id: string) => void
  onRenameConversation?: (id: string, name: string) => void
}

const Sidebar: FC<ISidebarProps> = ({
  copyRight,
  currentId,
  onCurrentIdChange,
  list,
  onPinConversation,
  onRenameConversation,
}) => {
  const { t } = useTranslation()
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingId, setRenamingId] = useState<string>('')
  const [renamingName, setRenamingName] = useState('')

  const handleRename = (id: string) => {
    const conversation = list.find(item => item.id === id)
    if (!conversation) return
    
    setRenamingId(id)
    setRenamingName(conversation.name)
    setRenameDialogOpen(true)
  }

  const handleRenameConfirm = (newName: string) => {
    onRenameConversation?.(renamingId, newName)
    setRenameDialogOpen(false)
    setRenamingId('')
    setRenamingName('')
  }

  const handleRenameCancel = () => {
    setRenameDialogOpen(false)
    setRenamingId('')
    setRenamingName('')
  }
  return (
    <div
      className="shrink-0 flex flex-col overflow-y-auto bg-white pc:w-[244px] tablet:w-[192px] mobile:w-[240px]  border-r border-gray-200 tablet:h-[calc(100vh_-_3rem)] mobile:h-screen"
    >
      {list.length < MAX_CONVERSATION_LENTH && (
        <div className="flex flex-shrink-0 p-4 !pb-0">
          <Button
            onClick={() => { onCurrentIdChange('-1') }}
            className="group block w-full flex-shrink-0 !justify-start !h-9 text-primary-600 items-center text-sm"
          >
            <PencilSquareIcon className="mr-2 h-4 w-4" /> {t('app.chat.newChat')}
          </Button>
        </div>
      )}

      <nav className="mt-4 flex-1 space-y-1 bg-white p-4 !pt-0">
        {list.map((item) => {
          const isCurrent = item.id === currentId
          const ItemIcon
            = isCurrent ? ChatBubbleOvalLeftEllipsisSolidIcon : ChatBubbleOvalLeftEllipsisIcon
          return (
            <div
              onClick={() => onCurrentIdChange(item.id)}
              key={item.id}
              className={classNames(
                isCurrent
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-700',
                'group flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium cursor-pointer',
              )}
            >
              <div className="flex items-center flex-1 min-w-0 gap-2">
                <ItemIcon
                  className={classNames(
                    isCurrent
                      ? 'text-primary-600'
                      : 'text-gray-400 group-hover:text-gray-500',
                    'h-5 w-5 flex-shrink-0',
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
                {item.is_pinned && (
                  <StarIcon className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <ConversationMenu
                  isPinned={item.is_pinned}
                  onPin={() => onPinConversation?.(item.id)}
                  onRename={() => handleRename(item.id)}
                />
              </div>
            </div>
          )
        })}
      </nav>
      {/* <a className="flex flex-shrink-0 p-4" href="https://langgenius.ai/" target="_blank">
        <Card><div className="flex flex-row items-center"><ChatBubbleOvalLeftEllipsisSolidIcon className="text-primary-600 h-6 w-6 mr-2" /><span>LangGenius</span></div></Card>
      </a> */}
      <div className="flex flex-shrink-0 pr-4 pb-4 pl-4">
        <div className="text-gray-400 font-normal text-xs">© {copyRight} {(new Date()).getFullYear()}</div>
      </div>
      
      <RenameDialog
        isOpen={renameDialogOpen}
        currentName={renamingName}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
      />
    </div>
  )
}

export default React.memo(Sidebar)
