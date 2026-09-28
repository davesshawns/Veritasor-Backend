import { createContext, useCallback, useContext, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConsentState = {
  analytics: boolean
  marketing: boolean
  productCommunications: boolean
}

type CookieConsentContextValue = {
  hasDecided: boolean
  consent: ConsentState
  bannerVisible: boolean
  acceptAll: () => void
  rejectAll: () => void
  savePreferences: (next: ConsentState) => void
  openSettings: () => void
  closeBanner: () => void
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export const STORAGE_KEY = 'veritasor_cookie_consent'

const DEFAULT_CONSENT: ConsentState = { analytics: false, marketing: false, productCommunications: false }

function readStorage(): { hasDecided: boolean; consent: ConsentState } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { hasDecided: false, consent: DEFAULT_CONSENT }
    const parsed = JSON.parse(raw) as ConsentState
    return { hasDecided: true, consent: parsed }
  } catch {
    return { hasDecided: false, consent: DEFAULT_CONSENT }
  }
}

function writeStorage(consent: ConsentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
  } catch {
    // localStorage unavailable — silently skip
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(
  undefined,
)

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const stored = readStorage()
  const [hasDecided, setHasDecided] = useState(stored.hasDecided)
  const [consent, setConsent] = useState<ConsentState>(stored.consent)
  const [bannerVisible, setBannerVisible] = useState(!stored.hasDecided)

  const decide = useCallback((next: ConsentState) => {
    writeStorage(next)
    setConsent(next)
    setHasDecided(true)
    setBannerVisible(false)
  }, [])

  const acceptAll = useCallback(() => decide({ analytics: true, marketing: true, productCommunications: true }), [decide])
  const rejectAll = useCallback(() => decide({ analytics: false, marketing: false, productCommunications: false }), [decide])
  const savePreferences = useCallback((next: ConsentState) => decide(next), [decide])
  const openSettings = useCallback(() => setBannerVisible(true), [])
  const closeBanner = useCallback(() => {
    if (hasDecided) setBannerVisible(false)
  }, [hasDecided])

  return (
    <CookieConsentContext.Provider
      value={{
        hasDecided,
        consent,
        bannerVisible,
        acceptAll,
        rejectAll,
        savePreferences,
        openSettings,
        closeBanner,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider')
  return ctx
}
