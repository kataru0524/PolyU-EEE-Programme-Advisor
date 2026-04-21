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
      // When sidebar collapsed and avatar hidden, use more space
      return 'calc(100% - 1rem)'
    }
    return 'var(--message-box-max-width, calc(100% - 3rem))'
  }
  
  return (
    <div className='flex items-start justify-end' key={id} style={{ maxWidth: '100%' }}>
      <div style={{ maxWidth: getMaxWidth() }}>
        <div className={`${s.question} relative text-base`}>
          <div
            className={`py-3 px-4 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-tl-2xl rounded-b-2xl ${!isSidebarCollapsed && 'mr-2'}`}
          >
            {imgSrcs && imgSrcs.length > 0 && (
              <ImageGallery srcs={imgSrcs} />
            )}
            <StreamdownMarkdown content={content} />
          </div>
        </div>
      </div>
      {!isSidebarCollapsed && (
        <>
          {useCurrentUserAvatar
            ? (
              <div className='w-10 h-10 shrink-0 leading-10 text-center mr-2 rounded-full bg-primary-600 text-white' style={{ width: 'var(--avatar-size, 40px)', height: 'var(--avatar-size, 40px)', lineHeight: 'var(--avatar-size, 40px)' }}>
                {userName?.[0].toLocaleUpperCase()}
              </div>
            )
            : (
              <div
                className='shrink-0 rounded-full bg-primary-100 text-primary-600 overflow-hidden relative'
                style={{ width: 'var(--avatar-size, 40px)', height: 'var(--avatar-size, 40px)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-9 h-9">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
              </div>
            )}
        </>
      )}
    </div>
  )
}

export default React.memo(Question)
