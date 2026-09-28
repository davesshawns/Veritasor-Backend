import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CookieConsentProvider, useCookieConsent } from './CookieConsentContext'

// Component that calls hook outside provider and displays error message
function HookOutsideProvider() {
  try {
    useCookieConsent()
    return <div data-testid="error-message">no error thrown</div>
  } catch (e: any) {
    return <div data-testid="error-message">{e.message}</div>
  }
}

// Component that calls hook inside provider and displays state
function HookInsideProvider() {
  const state = useCookieConsent()
  return (
    <div>
      <span data-testid="has-given-consent">{String(state.hasGivenConsent)}</span>
      <span data-testid="consent-status">{state.consentStatus}</span>
    </div>
  )
}

describe('useCookieConsent', () => {
  it('renders error when used outside CookieConsentProvider', () => {
    render(<HookOutsideProvider />)
    const errorElement = screen.getByTestId('error-message')
    expect(errorElement).toHaveTextContent('useCookieConsent must be used within CookieConsentProvider')
  })

  it('returns consent state when used within CookieConsentProvider', () => {
    render(
      <CookieConsentProvider>
        <HookInsideProvider />
      </CookieConsentProvider>,
    )
    const hasGivenConsent = screen.getByTestId('has-given-consent').textContent
    const consentStatus = screen.getByTestId('consent-status').textContent
    expect(hasGivenConsent).toBe('false')
    expect(consentStatus).toBe('pending')
  })

  it('accepts custom initialState', () => {
    render(
      <CookieConsentProvider initialState={{ hasGivenConsent: true, consentStatus: 'granted' }}>
        <HookInsideProvider />
      </CookieConsentProvider>,
    )
    const hasGivenConsent = screen.getByTestId('has-given-consent').textContent
    const consentStatus = screen.getByTestId('consent-status').textContent
    expect(hasGivenConsent).toBe('true')
    expect(consentStatus).toBe('granted')
  })
})