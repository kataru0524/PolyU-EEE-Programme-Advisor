'use client'
import type { FC } from 'react'
import React from 'react'
import type { IChatItem } from '../type'
import s from '../style.module.css'

import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'

type IQuestionProps = Pick<IChatItem, 'id' | 'content' | 'useCurrentUserAvatar'> & {
  imgSrcs?: string[]
  isSidebarCollapsed?: boolean
}

const Question: FC<IQuestionProps> = ({ id, content, useCurrentUserAvatar, imgSrcs, isSidebarCollapsed = false }) => {
  const userName = ''
  
  // Calculate max width based on sidebar state
  const getMaxWidth = () => {
    if (isSidebarCollapsed) {
      // When sidebar collapsed, message box should account for avatar and margins
      return 'calc(100% - var(--avatar-size, 40px) - 2rem)'
    }
    return 'var(--message-box-max-width, calc(100% - 3rem))'
  }
  
  return (
    <div className='flex items-start justify-end' key={id} style={{ maxWidth: '100%' }}>
      <div style={{ maxWidth: getMaxWidth() }}>
        <div className={`${s.question} relative text-base`}>
          <div
            className={'mr-2 py-3 px-4 bg-blue-500 dark:bg-blue-600 text-gray-900 dark:text-white rounded-tl-2xl rounded-b-2xl'}
          >
            {imgSrcs && imgSrcs.length > 0 && (
              <ImageGallery srcs={imgSrcs} />
            )}
            <StreamdownMarkdown content={content} />
          </div>
        </div>
      </div>
      {useCurrentUserAvatar
        ? (
          <div className='w-10 h-10 shrink-0 leading-10 text-center mr-2 rounded-full bg-primary-600 text-white' style={{ width: 'var(--avatar-size, 40px)', height: 'var(--avatar-size, 40px)', lineHeight: 'var(--avatar-size, 40px)' }}>
            {userName?.[0].toLocaleUpperCase()}
          </div>
        )
        : (
          <div className={`${s.questionIcon} w-10 h-10 shrink-0 `} style={{ width: 'var(--avatar-size, 40px)', height: 'var(--avatar-size, 40px)' }}></div>
        )}
    </div>
  )
}

export default React.memo(Question)
