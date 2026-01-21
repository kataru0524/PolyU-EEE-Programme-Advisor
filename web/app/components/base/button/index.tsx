import type { FC, MouseEventHandler } from 'react'
import React from 'react'
import Spinner from '@/app/components/base/spinner'

export interface IButtonProps {
  type?: string
  className?: string
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: MouseEventHandler<HTMLDivElement>
}

const Button: FC<IButtonProps> = ({
  type,
  disabled,
  children,
  className,
  onClick,
  loading = false,
}) => {
  let style = 'cursor-pointer'
  switch (type) {
    case 'link':
      style = disabled ? 'border-solid border border-gray-200 dark:border-gray-800 bg-gray-200 dark:bg-gray-700 cursor-not-allowed text-gray-800 dark:text-gray-400' : 'border-solid border border-gray-200 dark:border-gray-800 cursor-pointer text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600'
      break
    case 'primary':
      style = (disabled || loading) ? 'bg-primary-600/75 cursor-not-allowed text-white' : 'bg-primary-600 hover:bg-primary-600/75 hover:shadow-md cursor-pointer text-white hover:shadow-sm'
      break
    default:
      style = disabled ? 'border-solid border border-gray-200 dark:border-gray-800 bg-gray-200 dark:bg-gray-700 cursor-not-allowed text-gray-800 dark:text-gray-400' : 'border-solid border border-gray-200 dark:border-gray-800 cursor-pointer text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600'
      break
  }

  return (
    <div
      className={`flex justify-center items-center content-center h-9 leading-5 rounded-lg px-4 py-2 text-base ${style} ${className && className}`}
      onClick={disabled ? undefined : onClick}
    >
      {children}
      {/* Spinner is hidden when loading is false */}
      <Spinner loading={loading} className='!text-white !h-3 !w-3 !border-2 !ml-1' />
    </div>
  )
}

export default React.memo(Button)
