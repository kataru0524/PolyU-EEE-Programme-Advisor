'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import TemplateVarPanel, { PanelTitle, VarOpBtnGroup } from '../value-panel'
import FileUploaderInAttachmentWrapper from '../base/file-uploader-in-attachment'
import ConversationMenu from '../base/conversation-menu'
import RenameDialog from '../base/rename-dialog'
import s from './style.module.css'
import { AppInfoComp, ChatBtn, EditBtn, FootLogo, PromptTemplate } from './massive-component'
import { getLocaleOnClient, setLocaleOnClient } from '@/i18n/client'
import type { Locale } from '@/i18n'
import type { AppInfo, PromptConfig } from '@/types/app'
import Toast from '@/app/components/base/toast'
import Button from '@/app/components/base/button'
import Select from '@/app/components/base/select'
import { DEFAULT_VALUE_MAX_LEN, WELCOME_INTRO_PREF_EVENT, WELCOME_INTRO_SHOW_KEY } from '@/config'

// regex to match the {{}} and replace it with a span
const regex = /\{\{([^}]+)\}\}/g

export interface IWelcomeProps {
  conversationName: string
  conversationId?: string
  isPinned?: boolean
  hasSetInputs: boolean
  isPublicVersion: boolean
  siteInfo: AppInfo
  promptConfig: PromptConfig
  onStartChat: (inputs: Record<string, any>) => void
  canEditInputs: boolean
  savedInputs: Record<string, any>
  onInputsChange: (inputs: Record<string, any>) => void
  onPinConversation?: () => void
  onRenameConversation?: (name: string) => void
  onDeleteConversation?: () => void
  isSidebarCollapsed?: boolean
  hideHeader?: boolean
  showSettingsPanelWhenHasSetInputs?: boolean
}

const Welcome: FC<IWelcomeProps> = ({
  conversationName,
  conversationId,
  isPinned = false,
  hasSetInputs,
  isPublicVersion,
  siteInfo,
  promptConfig,
  onStartChat,
  canEditInputs,
  savedInputs,
  onInputsChange,
  onPinConversation,
  onRenameConversation,
  onDeleteConversation,
  isSidebarCollapsed = false,
  hideHeader = false,
  showSettingsPanelWhenHasSetInputs = true,
}) => {
  const { t } = useTranslation()
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showWelcomePopupRender, setShowWelcomePopupRender] = useState(false)
  const [isWelcomePopupAnimating, setIsWelcomePopupAnimating] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [currentLocale, setCurrentLocale] = useState<Locale>(getLocaleOnClient())
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false)
  const [isLanguageDropdownAnimating, setIsLanguageDropdownAnimating] = useState(false)
  const languageDropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelAnimationResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelFoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settingsPanelAnimationDurationMs = 280
  const [settingsPanelAnimationClass, setSettingsPanelAnimationClass] = useState('')
  const [showWelcomeSectionFade, setShowWelcomeSectionFade] = useState(false)
  const welcomeInfoScrollRef = useRef<HTMLDivElement>(null)

  const openLanguageDropdown = () => {
    if (languageDropdownTimerRef.current) {
      clearTimeout(languageDropdownTimerRef.current)
      languageDropdownTimerRef.current = null
    }
    setLanguageDropdownOpen(true)
    setTimeout(() => setIsLanguageDropdownAnimating(true), 10)
  }

  const closeLanguageDropdown = () => {
    setIsLanguageDropdownAnimating(false)
    languageDropdownTimerRef.current = setTimeout(() => {
      setLanguageDropdownOpen(false)
      languageDropdownTimerRef.current = null
    }, 200)
  }

  const triggerSettingsPanelAnimation = (animationClass: string) => {
    if (panelAnimationResetTimerRef.current) {
      clearTimeout(panelAnimationResetTimerRef.current)
      panelAnimationResetTimerRef.current = null
    }

    setSettingsPanelAnimationClass('')
    requestAnimationFrame(() => {
      setSettingsPanelAnimationClass(animationClass)
    })

    panelAnimationResetTimerRef.current = setTimeout(() => {
      setSettingsPanelAnimationClass('')
      panelAnimationResetTimerRef.current = null
    }, settingsPanelAnimationDurationMs + 80)
  }

  const openSettingsPanel = () => {
    if (panelFoldTimerRef.current) {
      clearTimeout(panelFoldTimerRef.current)
      panelFoldTimerRef.current = null
    }
    setIsFold(false)
    triggerSettingsPanelAnimation(s.settingsPanelSlideDown)
  }

  const closeSettingsPanel = () => {
    if (panelFoldTimerRef.current) {
      clearTimeout(panelFoldTimerRef.current)
      panelFoldTimerRef.current = null
    }
    triggerSettingsPanelAnimation(s.settingsPanelSlideUp)
    panelFoldTimerRef.current = setTimeout(() => {
      setIsFold(true)
      panelFoldTimerRef.current = null
    }, settingsPanelAnimationDurationMs)
  }

  const handleRename = () => {
    setRenameDialogOpen(true)
  }

  const handleRenameConfirm = async (newName: string) => {
    setIsRenaming(true)
    try {
      await onRenameConversation?.(newName)
      setRenameDialogOpen(false)
    } finally {
      setIsRenaming(false)
    }
  }

  const handleRenameCancel = () => {
    if (!isRenaming) {
      setRenameDialogOpen(false)
    }
  }
  const hasVar = promptConfig.prompt_variables.length > 0
  const [isFold, setIsFold] = useState<boolean>(true)
  const welcomeScopeItems = t('questions.welcome_card.scope_items', {
    returnObjects: true,
    defaultValue: [],
  }) as string[]
  const languageOptions: Array<{ code: Locale, name: string }> = [
    { code: 'en', name: 'English' },
    { code: 'zh-HK', name: '繁體中文（粵語）' },
    { code: 'zh-Hant', name: '繁體中文（國語）' },
    { code: 'zh-Hans', name: '简体中文' },
  ]
  
  // Convert locale code to language name
  const getLanguageName = (locale: string) => {
    const languageMap: Record<string, string> = {
      'en': 'English',
      'zh-HK': 'Traditional Chinese (Cantonese)',
      'zh-Hant': 'Traditional Chinese (Mandarin)',
      'zh-Hans': 'Simplified Chinese',
    }
    return languageMap[locale] || locale
  }
  
  const [inputs, setInputs] = useState<Record<string, any>>((() => {
    const currentLanguageName = getLanguageName(getLocaleOnClient())
    if (hasSetInputs) {
      const init = { ...savedInputs }
      if ('language' in init) init.language = currentLanguageName
      return init
    }

    const res: Record<string, any> = {}
    if (promptConfig) {
      promptConfig.prompt_variables.forEach((item) => {
        // Auto-populate language field with current locale
        if (item.key === 'language') {
          res[item.key] = currentLanguageName
        } else {
          res[item.key] = ''
        }
      })
    }
    return res
  })())
  useEffect(() => {
    const currentLanguageName = getLanguageName(getLocaleOnClient())
    if (!savedInputs) {
      const res: Record<string, any> = {}
      if (promptConfig) {
        promptConfig.prompt_variables.forEach((item) => {
          // Auto-populate language field with current locale
          if (item.key === 'language') {
            res[item.key] = currentLanguageName
          } else {
            res[item.key] = ''
          }
        })
      }
      setInputs(res)
    }
    else {
      // Always override language with the current locale, even if savedInputs
      // already has a stale value from a previous locale setting.
      const updated = { ...savedInputs }
      if ('language' in updated)
        updated.language = currentLanguageName
      setInputs(updated)
    }
  }, [savedInputs])

  // Keep inputs.language in sync when the user changes locale without a page reload.
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const handleLocaleChange = (e: Event) => {
      const locale = (e as CustomEvent<Locale>).detail
      const newLanguageName = getLanguageName(locale)
      setCurrentLocale(locale)
      setInputs(prev => 'language' in prev ? { ...prev, language: newLanguageName } : prev)
    }
    window.addEventListener('localechange-before', handleLocaleChange)
    return () => window.removeEventListener('localechange-before', handleLocaleChange)
  }, [])

  const highLightPromoptTemplate = (() => {
    if (!promptConfig) { return '' }
    const res = promptConfig.prompt_template.replace(regex, (match, p1) => {
      return `<span class='text-gray-800 font-bold'>${inputs?.[p1] ? inputs?.[p1] : match}</span>`
    })
    return res
  })()

  const [questionnaireVisible, setQuestionnaireVisible] = useState(false)

  useEffect(() => {
    if (!hasSetInputs) {
      const frame = requestAnimationFrame(() => setQuestionnaireVisible(true))
      return () => cancelAnimationFrame(frame)
    }
    else {
      setQuestionnaireVisible(false)
    }
  }, [hasSetInputs])

  useEffect(() => {
    if (hasSetInputs) {
      setShowWelcomePopup(false)
      return
    }
    const savedShowWelcomeIntro = localStorage.getItem(WELCOME_INTRO_SHOW_KEY)
    // Default to showing the popup when no explicit settings preference exists.
    setShowWelcomePopup(savedShowWelcomeIntro !== '0')
  }, [hasSetInputs])

  // Keep popup mounted during close animation, same pattern as settings dialog.
  useEffect(() => {
    if (showWelcomePopup) {
      const savedShowWelcomeIntro = localStorage.getItem(WELCOME_INTRO_SHOW_KEY)
      setDontShowAgain(savedShowWelcomeIntro === '0')
      setShowWelcomePopupRender(true)
      const timer = window.setTimeout(() => setIsWelcomePopupAnimating(true), 10)
      return () => window.clearTimeout(timer)
    }

    setIsWelcomePopupAnimating(false)
    const timer = window.setTimeout(() => setShowWelcomePopupRender(false), 300)
    return () => window.clearTimeout(timer)
  }, [showWelcomePopup])

  useEffect(() => {
    const handleWelcomePrefChange = (e: Event) => {
      const shouldShow = (e as CustomEvent<boolean>).detail
      // Keep checkbox state in sync with Settings, but do not immediately
      // open/close the popup in the current view. Apply on next eligibility cycle.
      setDontShowAgain(!shouldShow)
    }
    window.addEventListener(WELCOME_INTRO_PREF_EVENT, handleWelcomePrefChange)
    return () => window.removeEventListener(WELCOME_INTRO_PREF_EVENT, handleWelcomePrefChange)
  }, [])

  const handleCloseWelcomePopup = () => {
    closeLanguageDropdown()
    setShowWelcomePopup(false)
  }

  const handlePopupLanguageChange = (locale: Locale) => {
    setCurrentLocale(locale)
    setLocaleOnClient(locale, true)
    closeLanguageDropdown()
  }

  const handleDontShowAgainToggle = () => {
    const nextDontShowAgain = !dontShowAgain
    setDontShowAgain(nextDontShowAgain)
    const nextShowWelcome = !nextDontShowAgain
    localStorage.setItem(WELCOME_INTRO_SHOW_KEY, nextShowWelcome ? '1' : '0')
    window.dispatchEvent(new CustomEvent(WELCOME_INTRO_PREF_EVENT, { detail: nextShowWelcome }))
  }

  const updateWelcomeScrollFade = () => {
    const el = welcomeInfoScrollRef.current
    if (!el) {
      setShowWelcomeSectionFade(false)
      return
    }
    const hasScrollableContent = el.scrollHeight > el.clientHeight + 1
    const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
    setShowWelcomeSectionFade(hasScrollableContent && !reachedBottom)
  }

  useEffect(() => {
    if (!showWelcomePopupRender) {
      setShowWelcomeSectionFade(false)
      return
    }
    const animationFrameId = window.requestAnimationFrame(() => updateWelcomeScrollFade())
    const settleTimer = window.setTimeout(() => updateWelcomeScrollFade(), 340)
    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.clearTimeout(settleTimer)
    }
  }, [showWelcomePopupRender, currentLocale, welcomeScopeItems.length])

  useEffect(() => {
    if (!showWelcomePopupRender) return

    const handleResize = () => updateWelcomeScrollFade()
    window.addEventListener('resize', handleResize)

    const scrollEl = welcomeInfoScrollRef.current
    let observer: ResizeObserver | null = null
    if (scrollEl && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateWelcomeScrollFade())
      observer.observe(scrollEl)
    }

    const animationFrameId = window.requestAnimationFrame(() => updateWelcomeScrollFade())
    const settleTimer = window.setTimeout(() => updateWelcomeScrollFade(), 340)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (observer) observer.disconnect()
      window.cancelAnimationFrame(animationFrameId)
      window.clearTimeout(settleTimer)
    }
  }, [showWelcomePopupRender])

  useEffect(() => {
    return () => {
      if (languageDropdownTimerRef.current)
        clearTimeout(languageDropdownTimerRef.current)
      if (panelAnimationResetTimerRef.current)
        clearTimeout(panelAnimationResetTimerRef.current)
      if (panelFoldTimerRef.current)
        clearTimeout(panelFoldTimerRef.current)
    }
  }, [])

  const { notify } = Toast
  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const renderHeader = () => {
    // Use translated "New Chat" for new conversations
    const displayName = conversationId === '-1' ? t('app.chat.newChat') : conversationName
    
    return (
      <div className='sticky top-0 left-0 right-0 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 mobile:min-h-12 tablet:min-h-16 mobile:py-2 tablet:py-3 px-8 bg-white dark:bg-gray-950 group z-10 overflow-visible shadow-[0_3px_8px_rgba(15,23,42,0.04)] dark:shadow-[0_3px_8px_rgba(0,0,0,0.2)]'>
        <div className='flex items-center gap-2 min-w-0'>
          <div className='text-gray-900 dark:text-gray-100'>{displayName}</div>
          {conversationId && conversationId !== '-1' && (
            <ConversationMenu
              isPinned={isPinned}
              onPin={onPinConversation}
              onRename={handleRename}
              onDelete={onDeleteConversation}
            />
          )}
        </div>
      </div>
    )
  }

  const renderInputs = () => {
    return (
      <div className='flex flex-col' style={{ gap: 'var(--field-spacing, 0.75rem)' }}>
        {promptConfig.prompt_variables.filter(item => !item.hide).map(item => {
          // Get translated label and options
          const translatedLabel = t(`questions.user_input_form.${item.key}.label`, { defaultValue: item.name })
          const originalOptions = item.options || []
          const translatedOptions = item.type === 'select' 
            ? t(`questions.user_input_form.${item.key}.options`, { returnObjects: true, defaultValue: originalOptions }) as string[]
            : originalOptions

          // For select, find the current translated value based on the stored original value
          const currentSelectValue = item.type === 'select' && inputs?.[item.key]
            ? (() => {
                const originalIndex = originalOptions.indexOf(inputs[item.key])
                return originalIndex >= 0 ? translatedOptions[originalIndex] : inputs[item.key]
              })()
            : inputs?.[item.key]

          return (
            <div className='flex flex-col text-base' key={item.key} style={{ gap: 'var(--field-label-spacing, 0.5rem)' }}>
              <label className='block text-gray-900 dark:text-gray-100 font-medium'>{translatedLabel}</label>
              {item.type === 'select'
                && (
                  <Select
                    className='w-full'
                    defaultValue={currentSelectValue}
                    onSelect={(i) => { 
                      // Store the original (English) value instead of translated
                      const selectedIndex = translatedOptions.indexOf(i.value as string)
                      const originalValue = originalOptions[selectedIndex] || i.value
                      setInputs({ ...inputs, [item.key]: originalValue })
                    }}
                    items={translatedOptions.map((translated, idx) => ({ 
                      name: translated, 
                      value: translated 
                    }))}
                    allowSearch={false}
                    bgClassName='bg-gray-50'
                  />
                )}
            {item.type === 'string' && (
              <input
                placeholder={t(`questions.user_input_form.${item.key}.placeholder`, { 
                  defaultValue: !item.required ? `${translatedLabel} (${t('app.variableTable.optional')})` : translatedLabel 
                })}
                value={inputs?.[item.key] || ''}
                onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
                className={'w-full flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'}
                maxLength={item.max_length || DEFAULT_VALUE_MAX_LEN}
              />
            )}
            {item.type === 'paragraph' && (
              <textarea
                className="w-full h-[104px] flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
                placeholder={`${translatedLabel}${!item.required ? `(${t('app.variableTable.optional')})` : ''}`}
                value={inputs?.[item.key] || ''}
                onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
              />
            )}
            {item.type === 'number' && (
              <input
                type="number"
                className="block w-full p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-base focus:ring-blue-500 focus:border-blue-500 "
                placeholder={`${translatedLabel}${!item.required ? `(${t('appDebug.variableTable.optional')})` : ''}`}
                value={inputs[item.key]}
                onChange={(e) => { onInputsChange({ ...inputs, [item.key]: e.target.value }) }}
              />
            )}

            {
              item.type === 'file' && (
                <FileUploaderInAttachmentWrapper
                  fileConfig={{
                    allowed_file_types: item.allowed_file_types,
                    allowed_file_extensions: item.allowed_file_extensions,
                    allowed_file_upload_methods: item.allowed_file_upload_methods!,
                    number_limits: 1,
                    fileUploadConfig: {} as any,
                  }}
                  onChange={(files) => {
                    setInputs({ ...inputs, [item.key]: files[0] })
                  }}
                  value={inputs?.[item.key] || []}
                />
              )
            }
            {
              item.type === 'file-list' && (
                <FileUploaderInAttachmentWrapper
                  fileConfig={{
                    allowed_file_types: item.allowed_file_types,
                    allowed_file_extensions: item.allowed_file_extensions,
                    allowed_file_upload_methods: item.allowed_file_upload_methods!,
                    number_limits: item.max_length,
                    fileUploadConfig: {} as any,
                  }}
                  onChange={(files) => {
                    setInputs({ ...inputs, [item.key]: files })
                  }}
                  value={inputs?.[item.key] || []}
                />
              )
            }
          </div>
          )
        })}
      </div>
    )
  }

  const canChat = () => {
    const inputLens = Object.values(inputs).length
    const promptVariablesLens = promptConfig.prompt_variables.length
    const emptyInput = inputLens < promptVariablesLens || Object.entries(inputs).filter(([k, v]) => {
      const isRequired = promptConfig.prompt_variables.find(item => item.key === k)?.required ?? true
      return isRequired && v === ''
    }).length > 0
    return !emptyInput
  }

  const handleChat = () => {
    if (!canChat()) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return
    }

    onStartChat(inputs)
  }

  const renderNoVarPanel = () => {
    if (isPublicVersion) {
      return (
        <div>
          <AppInfoComp siteInfo={siteInfo} />
          <TemplateVarPanel
            isFold={false}
            header={
              <>
                <PanelTitle
                  title={t('app.chat.publicPromptConfigTitle')}
                  className='mb-1'
                />
                <PromptTemplate html={highLightPromoptTemplate} />
              </>
            }
          >
            <ChatBtn onClick={handleChat} />
          </TemplateVarPanel>
        </div>
      )
    }
    // private version
    return (
      <TemplateVarPanel
        isFold={false}
        className='mobile:flex-1 mobile:flex mobile:flex-col'
        header={
          <AppInfoComp siteInfo={siteInfo} />
        }
      >
        <ChatBtn onClick={handleChat} />
      </TemplateVarPanel>
    )
  }

  const renderVarPanel = () => {
    const isFormComplete = canChat()
    
    return (
      <TemplateVarPanel
        isFold={false}
        className='mobile:flex-1 mobile:flex mobile:flex-col'
        header={
          <AppInfoComp siteInfo={siteInfo} />
        }
      >
        {renderInputs()}
        <ChatBtn
          className='mt-6'
          onClick={handleChat}
          disabled={!isFormComplete}
        />
      </TemplateVarPanel>
    )
  }

  const renderVarOpBtnGroup = () => {
    return (
      <VarOpBtnGroup
        onConfirm={() => {
          if (!canChat()) { return }

          onInputsChange(inputs)
          closeSettingsPanel()
        }}
        onCancel={() => {
          const reverted = { ...savedInputs }
          if ('language' in reverted)
            reverted.language = getLanguageName(getLocaleOnClient())
          setInputs(reverted)
          closeSettingsPanel()
        }}
      />
    )
  }

  const renderHasSetInputsPublic = () => {
    if (!canEditInputs) {
      return (
        <TemplateVarPanel
          isFold={false}
          className='rounded-xl overflow-hidden'
          header={
            <>
              <PanelTitle
                title={t('app.chat.publicPromptConfigTitle')}
                className='mb-1'
              />
              <PromptTemplate html={highLightPromoptTemplate} />
            </>
          }
        />
      )
    }

    return (
      <TemplateVarPanel
        isFold={isFold}
        className={`rounded-xl overflow-hidden ${settingsPanelAnimationClass}`}
        header={
          <>
            <PanelTitle
              title={t('app.chat.publicPromptConfigTitle')}
              className='mb-1'
            />
            <PromptTemplate html={highLightPromoptTemplate} />
            {isFold && (
              <div className='flex items-center justify-between mt-3 border-t border-primary-100 pt-4 text-xs text-primary-600'>
                <span className='text-gray-700 dark:text-gray-300'>{t('app.chat.configStatusDes')}</span>
                <EditBtn onClick={openSettingsPanel} />
              </div>
            )}
          </>
        }
      >
        {renderInputs()}
        {renderVarOpBtnGroup()}
      </TemplateVarPanel>
    )
  }

  const renderHasSetInputsPrivate = () => {
    if (!canEditInputs || !hasVar) { return null }

    return (
      <TemplateVarPanel
        isFold={isFold}
        className={`rounded-xl overflow-hidden ${settingsPanelAnimationClass}`}
        header={
          <div className='flex items-center justify-between text-primary-600'>
            <PanelTitle
              title={!isFold ? t('app.chat.privatePromptConfigTitle') : t('app.chat.configStatusDes')}
            />
            {isFold && (
              <EditBtn onClick={openSettingsPanel} />
            )}
          </div>
        }
      >
        {renderInputs()}
        {renderVarOpBtnGroup()}
      </TemplateVarPanel>
    )
  }

  const renderHasSetInputs = () => {
    if ((!isPublicVersion && !canEditInputs) || !hasVar) { return null }

    return (
      <div
        className='pt-4 mb-5'
      >
        {isPublicVersion ? renderHasSetInputsPublic() : renderHasSetInputsPrivate()}
      </div>)
  }

  return (
    <div className={`relative mobile:min-h-[48px] tablet:min-h-[64px] ${!hasSetInputs ? 'mobile:flex-1 mobile:flex mobile:flex-col' : ''}`}>
      {hasSetInputs && !hideHeader && renderHeader()}
      <div 
        className={`mx-auto mobile:w-full px-3.5 ${!hasSetInputs ? 'mobile:flex-1 mobile:flex mobile:flex-col' : ''}`}
        style={{ 
          maxWidth: isSidebarCollapsed 
            ? '100%' 
            : 'min(794px, calc(100vw - var(--sidebar-width-pc, 244px) - 48px))'
        }}
      >
        {/*  Has't set inputs  */}
        {
          !hasSetInputs && (
            <div className={`mobile:pt-[24px] tablet:pt-[128px] pc:pt-[80px] mobile:flex-1 mobile:flex mobile:flex-col transition-all duration-500 ease-out ${questionnaireVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              {/* Gradient accent bar card wrapper */}
              <div
                data-lang-resize="height"
                className='relative rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10 bg-primary-50 dark:bg-gray-800'
              >
                {/* Left accent bar */}
                <div className='absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary-400 via-primary-600 to-primary-700' />
                <div className='pl-1.5'>
                  {hasVar
                    ? (
                      renderVarPanel()
                    )
                    : (
                      renderNoVarPanel()
                    )}
                </div>
              </div>
            </div>
          )
        }

        {/* Has set inputs */}
        {hasSetInputs && showSettingsPanelWhenHasSetInputs && renderHasSetInputs()}

        {!hasSetInputs && showWelcomePopupRender && isClient && createPortal(
          <div className='fixed inset-0 z-50 flex items-center justify-center p-3 tablet:p-4'>
            <div
              className={`fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity duration-300 ${isWelcomePopupAnimating ? 'opacity-100' : 'opacity-0'}`}
            />
            <div
              data-lang-resize="height"
              className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-1.5rem)] flex flex-col overflow-hidden transition-all duration-300 ${isWelcomePopupAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'}`}
              style={{ transitionTimingFunction: isWelcomePopupAnimating ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-in' }}
            >
              <div className='flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800'>
                <div className='flex items-center gap-3'>
                  {/* EEE logo in popup header */}
                  <img
                    src="/eee-logo-light.png"
                    alt="EEE"
                    className="h-8 w-8 object-contain dark:hidden"
                  />
                  <img
                    src="/eee-logo-dark.png"
                    alt="EEE"
                    className="h-8 w-8 object-contain hidden dark:block"
                  />
                  <div className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                    {t('questions.welcome_popup.title', { defaultValue: 'Welcome' })}
                  </div>
                </div>
                <button
                  onClick={handleCloseWelcomePopup}
                  aria-label={t('common.operation.cancel', { defaultValue: 'Close' })}
                  className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors'
                >
                  <XMarkIcon className='w-5 h-5' />
                </button>
              </div>

              <div className='flex-1 px-6 pb-4 flex flex-col min-h-0'>
              <div className='relative py-5'>
                <div className='text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-2'>
                  {t('common.settings.language', { defaultValue: 'Language' })}
                </div>
                <button
                  onClick={() => {
                    if (languageDropdownOpen)
                      closeLanguageDropdown()
                    else
                      openLanguageDropdown()
                  }}
                  className='w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 transition-all hover:border-gray-300 dark:hover:border-gray-600'
                >
                  <span>{languageOptions.find(l => l.code === currentLocale)?.name}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${languageDropdownOpen ? 'rotate-180' : ''}`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </button>
                {languageDropdownOpen && (
                  <div className={`absolute z-10 mt-2 w-full py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-auto transition-all duration-200 ${isLanguageDropdownAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                    {languageOptions.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handlePopupLanguageChange(lang.code)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          currentLocale === lang.code
                            ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-gray-200 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className='relative'>
              <div
                ref={welcomeInfoScrollRef}
                onScroll={updateWelcomeScrollFade}
                className='pt-2 pb-4 max-h-[38vh] tablet:max-h-[42vh] overflow-y-auto pr-3'
              >
              <div className='text-sm font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300'>
                {t('questions.welcome_card.title')}
              </div>
              <p className='mt-2 text-sm leading-7 text-gray-700 dark:text-gray-300'>
                {t('questions.welcome_card.subtitle')}
              </p>

              <div className='mt-3 rounded-xl border border-primary-200 dark:border-gray-600 bg-primary-50 dark:bg-gray-800/50 px-4 py-3.5'>
                <div className='text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300'>
                  {t('questions.welcome_card.scope_title')}
                </div>
                <ul className='mt-2.5 space-y-1.5 text-sm text-gray-700 dark:text-gray-300'>
                  {welcomeScopeItems.map((item, idx) => (
                    <li key={`${idx}-${item}`} className='leading-6'>{item}</li>
                  ))}
                </ul>
              </div>

              <p className='mt-2.5 text-xs leading-5 text-gray-500 dark:text-gray-400'>
                {t('questions.welcome_card.disclaimer')}
              </p>
              </div>
              {showWelcomeSectionFade && (
                <div className='pointer-events-none absolute left-0 right-0 bottom-0 h-10 bg-gradient-to-t from-white dark:from-gray-900 to-transparent' />
              )}
              </div>

              <div className='pt-4 pb-2 flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between'>
                <label className='flex items-center gap-2 text-sm leading-5 text-gray-600 dark:text-gray-300'>
                  <button
                    type='button'
                    role='checkbox'
                    aria-checked={dontShowAgain}
                    onClick={handleDontShowAgainToggle}
                    className={`h-5 w-5 rounded border flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${dontShowAgain ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-transparent'}`}
                  >
                    <CheckIcon className='h-3.5 w-3.5' />
                  </button>
                  {t('questions.welcome_popup.dont_show_again', { defaultValue: "Don't show again" })}
                </label>
                <Button
                  type='primary'
                  className='w-full tablet:w-auto'
                  onClick={handleCloseWelcomePopup}
                >
                  {t('questions.welcome_popup.continue', { defaultValue: 'Continue' })}
                </Button>
              </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

        {/* foot */}
        {!hasSetInputs && (
          <div className='mt-4 flex justify-between items-center h-8 text-xs text-gray-400'>

            {siteInfo.privacy_policy
              ? <div>{t('app.chat.privacyPolicyLeft')}
                <a
                  className='text-gray-500'
                  href={siteInfo.privacy_policy}
                  target='_blank'
                >{t('app.chat.privacyPolicyMiddle')}</a>
                {t('app.chat.privacyPolicyRight')}
              </div>
              : <div>
              </div>}
            <a className='flex items-center pr-3 space-x-2' href="https://dify.ai/" target="_blank">
              <span className='uppercase'>{t('app.chat.powerBy')}</span>
              <FootLogo />
            </a>
          </div>
        )}
      </div>
      
      <RenameDialog
        isOpen={renameDialogOpen}
        currentName={conversationName}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
        isLoading={isRenaming}
      />
    </div >
  )
}

export default React.memo(Welcome)
