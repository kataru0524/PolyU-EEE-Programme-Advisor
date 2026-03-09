import type { FC } from 'react'
import React from 'react'
import type { IWelcomeProps } from '../welcome'
import Welcome from '../welcome'

const ConfigSence: FC<IWelcomeProps> = (props) => {
  const { hasSetInputs } = props
  
  return (
    <div className={`antialiased font-sans overflow-y-scroll ${hasSetInputs ? 'mb-5 shrink-0 max-h-[50vh]' : 'flex-1'}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <Welcome {...props} />
    </div>
  )
}
export default React.memo(ConfigSence)
