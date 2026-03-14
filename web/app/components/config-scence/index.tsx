import type { FC } from 'react'
import React from 'react'
import type { IWelcomeProps } from '../welcome'
import Welcome from '../welcome'

type IConfigSenceProps = IWelcomeProps

const ConfigSence: FC<IConfigSenceProps> = (props) => {
  const { hasSetInputs, showSettingsPanelWhenHasSetInputs = true } = props
  const hasSpacing = hasSetInputs && showSettingsPanelWhenHasSetInputs
  
  return (
    <div
      className={`antialiased font-sans ${hasSetInputs ? `${hasSpacing ? 'mb-8 ' : ''}shrink-0 overflow-visible` : 'flex-1 overflow-y-auto'}`}
      style={hasSetInputs ? undefined : { WebkitOverflowScrolling: 'touch' }}
    >
      <Welcome {...props} />
    </div>
  )
}
export default React.memo(ConfigSence)
