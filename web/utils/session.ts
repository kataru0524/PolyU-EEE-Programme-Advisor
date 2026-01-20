import { v4 } from 'uuid'

const SESSION_STORAGE_KEY = 'browser_session_id'

/**
 * Get or create a permanent session ID for this browser
 * Stored in localStorage to persist forever (unless user clears browser data)
 */
export const getBrowserSessionId = (): string => {
  if (typeof window === 'undefined') return v4()
  
  // Try to get existing session ID from localStorage
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY)
  
  // If no session ID exists, create a new one
  if (!sessionId) {
    sessionId = v4()
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  }
  
  // Also sync with cookie for API calls
  document.cookie = `session_id=${sessionId}; Max-Age=${10 * 365 * 24 * 60 * 60}; Path=/`
  
  return sessionId
}
