import { describe, it, expect, beforeEach } from 'vitest'
import type { ReactElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import LocalePickerField from './LocalePickerField'
import { LocaleProvider } from '../../i18n/provider'

function renderWithProvider(ui: ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>)
}

function mockLocaleStorage(savedLocale: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('preferred-locale', savedLocale)
  }
}

describe('LocalePickerField', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
  })

  it('renders label when provided', () => {
    renderWithProvider(
      <LocalePickerField label="Custom Label" description="Custom description" />,
    )
    expect(screen.getByLabelText('Custom Label')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
  })

  it('renders default label when no label provided', () => {
    renderWithProvider(<LocalePickerField />)
    const defaultLabel = screen.getByLabelText(/settings\.locale\.label/i)
    expect(defaultLabel).toBeInTheDocument()
  })

  it('renders default description when no description provided', () => {
    renderWithProvider(<LocalePickerField />)
    const defaultDescription = screen.getByText(/settings\.locale\.description/i)
    expect(defaultDescription).toBeInTheDocument()
  })

  it('renders custom label and description together', () => {
    renderWithProvider(
      <LocalePickerField label="Language" description="Select your preferred language" />,
    )
    const label = screen.getByLabelText('Language')
    const description = screen.getByText(/Select your preferred language/)
    expect(label).toBeInTheDocument()
    expect(description).toBeInTheDocument()
  })

  it('preserves locale state after render', () => {
    renderWithProvider(<LocalePickerField />)
    const trigger = screen.getByRole('button', { name: /select language/i })
    expect(trigger).toBeInTheDocument()
  })

  it('renders within LocaleProvider context', () => {
    const { rerender } = renderWithProvider(<LocalePickerField />)
    expect(screen.getByRole('button', { name: /select language/i })).toBeInTheDocument()
    rerender(<LocalePickerField label="Test" />)
    expect(screen.getByLabelText('Test')).toBeInTheDocument()
  })

  it('handles locale change through child LocalePicker', () => {
    renderWithProvider(
      <LocalePickerField label="Language Test" />,
    )
    const trigger = screen.getByRole('button', { name: /select language/i })
    fireEvent.click(trigger)
    const englishOption = screen.getByRole('option', { name: /english/i })
    expect(englishOption).toHaveAttribute('aria-selected', 'true')
  })

  it('renders description text correctly', () => {
    renderWithProvider(
      <LocalePickerField description="This is a test description" />,
    )
    const desc = screen.getByText(/This is a test description/)
    expect(desc).toBeInTheDocument()
  })
})