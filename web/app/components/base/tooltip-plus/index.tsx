'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import { PortalToFollowElem, PortalToFollowElemContent, PortalToFollowElemTrigger } from '@/app/components/base/portal-to-follow-elem'
export interface TooltipProps {
  position?: 'top' | 'right' | 'bottom' | 'left'
  triggerMethod?: 'hover' | 'click'
  popupContent: React.ReactNode
  children: React.ReactNode
}

const arrow = (
  <svg className="absolute text-white dark:text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"></polygon></svg>
)

const Tooltip: FC<TooltipProps> = ({
  position = 'top',
  triggerMethod = 'hover',
  popupContent,
  children,
}) => {
  const [open, setOpen] = useState(false)
  const isTouchRef = React.useRef(false)

  return (
    <PortalToFollowElem
      open={open}
      onOpenChange={setOpen}
      placement={position}
      offset={10}
    >
      <PortalToFollowElemTrigger
        onClick={() => triggerMethod === 'click' && setOpen(v => !v)}
        onMouseEnter={() => { if (triggerMethod === 'hover' && !isTouchRef.current) setOpen(true) }}
        onMouseLeave={() => { if (triggerMethod === 'hover' && !isTouchRef.current) setOpen(false) }}
        onTouchStart={() => { isTouchRef.current = true; setOpen(false); setTimeout(() => { isTouchRef.current = false }, 500) }}
      >
        {children}
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent
        className="z-[999]"
      >
        <div className='relative px-3 py-2 text-xs font-normal text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-md shadow-lg'>
          {popupContent}
          {arrow}
        </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  )
}

export default React.memo(Tooltip)
