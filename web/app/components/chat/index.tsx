'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import s from './style.module.css'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid'
import { audioToText } from '@/service'
import { Mp3Encoder } from '@breezystack/lamejs'

export interface IChatProps {
  chatList: ChatItem[]
  /**
   * Whether to display the editing area and rating status
   */
  feedbackDisabled?: boolean
  /**
   * Whether to display the input area
   */
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  useCurrentUserAvatar?: boolean
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
  isSidebarCollapsed?: boolean
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  useCurrentUserAvatar,
  isSidebarCollapsed = false,
  isResponding,
  controlClearQuery,
  visionConfig,
  fileConfig,
}) => {
  const { t, i18n } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  // Detect iOS devices
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

  // Track recording duration
  useEffect(() => {
    if (isListening) {
      setRecordingDuration(0)
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setRecordingDuration(0)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isListening])

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Try M4A/MP4 first (iOS native), then fall back to webm
      let mimeType = 'audio/mp4'
      if (!MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/webm;codecs=opus'
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        setIsTranscribing(true)
        try {
          // Convert to MP3
          console.log('Converting to MP3...')
          const audioContext = new AudioContext()
          const arrayBuffer = await audioBlob.arrayBuffer()
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
          const mp3Blob = convertToMp3(audioBuffer)
          console.log('MP3 blob size:', mp3Blob.size)
          // Send to API
          const audioFile = new File([mp3Blob], 'recording.mp3', { type: 'audio/mp3' })
          console.log('Sending audio file:', audioFile.name, audioFile.type, audioFile.size, 'bytes')
          const transcribedText = await audioToText(audioFile, 'user')
          console.log('Transcribed text:', transcribedText)
          if (transcribedText) {
            const newQuery = queryRef.current + (queryRef.current ? ' ' : '') + transcribedText
            setQuery(newQuery)
            queryRef.current = newQuery
          }
        } catch (error) {
          console.error('Transcription error:', error)
          notify({ type: 'error', message: t('app.errorMessage.speechToTextFailed') || 'Failed to convert speech to text', duration: 3000 })
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsListening(true)
    } catch (error) {
      console.error('Microphone access error:', error)
      notify({ type: 'error', message: 'Could not access microphone. Please check permissions.', duration: 3000 })
    }
  }

  const convertToMp3 = (audioBuffer: AudioBuffer): Blob => {
    const channels = 1 // Mono
    const sampleRate = 44100 // 44.1kHz for better quality
    const kbps = 192 // Higher bitrate for better quality

    // Get audio data and resample to 44.1kHz mono
    const samples = audioBuffer.getChannelData(0)
    const resampleRatio = audioBuffer.sampleRate / sampleRate
    const resampledLength = Math.floor(samples.length / resampleRatio)
    const resampledSamples = new Float32Array(resampledLength)

    for (let i = 0; i < resampledLength; i++) {
      resampledSamples[i] = samples[Math.floor(i * resampleRatio)]
    }

    // Convert to 16-bit PCM
    const pcmSamples = new Int16Array(resampledLength)
    for (let i = 0; i < resampledLength; i++) {
      const s = Math.max(-1, Math.min(1, resampledSamples[i]))
      pcmSamples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }

    // Encode to MP3
    const mp3encoder = new Mp3Encoder(channels, sampleRate, kbps)
    const mp3Data = []
    const sampleBlockSize = 1152

    for (let i = 0; i < pcmSamples.length; i += sampleBlockSize) {
      const sampleChunk = pcmSamples.subarray(i, i + sampleBlockSize)
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk)
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf))
      }
    }

    const mp3buf = mp3encoder.flush()
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf))
    }

    // Flatten mp3Data to a single Uint8Array
    const totalLength = mp3Data.reduce((acc, arr) => acc + arr.length, 0)
    const mergedArray = new Uint8Array(totalLength)
    let offset = 0
    for (const arr of mp3Data) {
      mergedArray.set(arr, offset)
      offset += arr.length
    }
    return new Blob([mergedArray], { type: 'audio/mp3' })
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
      setIsListening(false)
    }
  }

  const handleVoiceButtonClick = () => {
    if (isListening) {
      stopVoiceRecording()
    } else {
      startVoiceRecording()
    }
  }

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])
  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    onSend(queryRef.current, combinedFiles)
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length) { onClear() }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) { setAttachmentFiles([]) }
  }

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current) { handleSend() }
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  return (
    <div className={cn(
      !feedbackDisabled && (isSidebarCollapsed ? 'px-1' : 'px-3.5'), 
      isSidebarCollapsed ? '' : 'pr-4', 
      'w-full'
    )}>
      {/* Chat List */}
      <div className="space-y-[30px] overflow-visible">
        {chatList.map((item) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            return <Answer
              key={item.id}
              item={item}
              feedbackDisabled={feedbackDisabled}
              onFeedback={onFeedback}
              isResponding={isResponding && isLast}
              suggestionClick={suggestionClick}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          }
          return (
            <Question
              key={item.id}
              id={item.id}
              content={item.content}
              useCurrentUserAvatar={useCurrentUserAvatar}
              imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          )
        })}
      </div>
      {
        !isHideSendInput && (
          <>
            <div className='fixed bottom-0 right-0 h-32 pointer-events-none dark:hidden' style={{
              background: 'linear-gradient(to top, rgb(255, 255, 255), transparent)',
              zIndex: 9,
              left: isSidebarCollapsed ? '0' : 'var(--sidebar-width-pc, 244px)'
            }}></div>
            <div className='fixed bottom-0 right-0 h-32 pointer-events-none hidden dark:block' style={{
              background: 'linear-gradient(to top, rgb(3, 7, 18), transparent)',
              zIndex: 9,
              left: isSidebarCollapsed ? '0' : 'var(--sidebar-width-pc, 244px)'
            }}></div>
            <div className='fixed z-10 bottom-4 left-1/2 -translate-x-1/2 mobile:ml-0' style={{ 
              marginLeft: isSidebarCollapsed ? '0' : 'calc(var(--sidebar-width-pc, 244px) / 2)', 
              width: isSidebarCollapsed ? 'min(var(--chat-input-width, 794px), calc(100vw - 40px))' : 'min(var(--chat-input-width, 794px), calc(100vw - var(--sidebar-width-pc, 244px) - 40px))', 
              maxWidth: 'calc(100vw - 28px)' 
            }}>
            <div className={`p-[5.5px] max-h-[150px] bg-white dark:bg-gray-800 rounded-xl overflow-y-auto shadow-lg transition-colors ${
              isListening ? 'border-[2px] border-red-400 dark:border-red-500' : 'border-[1.5px] border-gray-200 dark:border-gray-800'
            }`}>
              {
                visionConfig?.enabled && (
                  <>
                    <div className='absolute bottom-2 left-2 flex items-center'>
                      <ChatImageUploader
                        settings={visionConfig}
                        onUpload={onUpload}
                        disabled={files.length >= visionConfig.number_limits}
                      />
                      <div className='mx-1 w-[1px] h-4 bg-black/5' />
                    </div>
                    <div className='pl-[52px]'>
                      <ImageList
                        list={files}
                        onRemove={onRemove}
                        onReUpload={onReUpload}
                        onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                        onImageLinkLoadError={onImageLinkLoadError}
                      />
                    </div>
                  </>
                )
              }
              {
                fileConfig?.enabled && (
                  <div className={`${visionConfig?.enabled ? 'pl-[52px]' : ''} mb-1`}>
                    <FileUploaderInAttachmentWrapper
                      fileConfig={fileConfig}
                      value={attachmentFiles}
                      onChange={setAttachmentFiles}
                    />
                  </div>
                )
              }
              <div className="relative">
                <Textarea
                  className={`
                    block w-full px-2 pr-[118px] py-[7px] leading-5 max-h-none text-base outline-none appearance-none resize-none transition-colors
                    ${visionConfig?.enabled && 'pl-12'}
                    ${(isListening || isTranscribing) ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'bg-transparent text-gray-700 dark:text-gray-200'}
                  `}
                  style={{ minHeight: 'var(--chat-input-min-height, 44px)' }}
                  value={query}
                  onChange={handleContentChange}
                  onKeyUp={handleKeyUp}
                  onKeyDown={handleKeyDown}
                  autoSize
                  disabled={isListening || isTranscribing}
                />
                {(isListening || isTranscribing) && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-2 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
                    <div className="w-2 h-2 bg-white dark:bg-gray-200 rounded-full animate-pulse"></div>
                    <span className="leading-none">
                      {isListening
                        ? `${t('common.operation.voiceInput')} ${formatDuration(recordingDuration)}`
                        : t('common.operation.voiceRecognitionInProgress') || 'Voice recognition in progress...'}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-6 h-full flex items-center gap-2">
                <Tooltip
                  selector='voice-input-tip'
                  content={isListening ? t('common.operation.stopRecording') : t('common.operation.voiceInput')}
                >
                  <button
                    onClick={handleVoiceButtonClick}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {isListening ? (
                      <StopIcon className="w-5 h-5" />
                    ) : (
                      <MicrophoneIcon className="w-5 h-5" />
                    )}
                  </button>
                </Tooltip>
                {isListening ? (
                  <div 
                    className={`${s.sendBtn} w-8 h-8 rounded-md opacity-40 cursor-not-allowed pointer-events-none`} 
                  ></div>
                ) : (
                  <Tooltip
                    selector='send-tip'
                    htmlContent={
                      <div>
                        <div>{t('common.operation.send')} Enter</div>
                        <div>{t('common.operation.lineBreak')} Shift Enter</div>
                      </div>
                    }
                  >
                    <div 
                      className={`${s.sendBtn} w-8 h-8 rounded-md cursor-pointer`} 
                      onClick={handleSend}
                    ></div>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
          </>
        )
      }
    </div>
  )
}

export default React.memo(Chat)
