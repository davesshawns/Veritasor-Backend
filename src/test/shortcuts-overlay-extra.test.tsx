import { render, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import ShortcutsOverlay, {
  Shortcut,
  ShortcutCategory,
  SHORTCUT_CATEGORIES,
} from '../components/ShortcutsOverlay'

describe('ShortcutsOverlay — interface coverage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() {
    vi.useRealTimers()
  })

  describe('Shortcut interface', () => {
    it('has the correct type shape', () => {
      const shortcut: Shortcut = {
        keys: ['Ctrl', 'K'],
        label: 'Open command palette',
      }
      expect(shortcut).toHaveProperty('keys')
      expect(shortcut).toHaveProperty('label')
      expect(Array.isArray(shortcut.keys)).toBe(true)
      expect(typeof shortcut.label).toBe('string')
    })

    it('validates keys are strings', () => {
      const shortcut: Shortcut = {
        keys: ['Ctrl', 'K'],
        label: 'Open command palette',
      }
      shortcut.keys.forEach((key) => {
        expect(typeof key).toBe('string')
      })
    })
  })

  describe('ShortcutCategory interface', () => {
    it('has the correct type shape', () => {
      const category: ShortcutCategory = {
        name: 'Global',
        shortcuts: [
          { keys: ['Shift', '?'], label: 'Open keyboard shortcuts' },
        ],
      }
      expect(category).toHaveProperty('name')
      expect(category).toHaveProperty('shortcuts')
      expect(Array.isArray(category.shortcuts)).toBe(true)
    })

    it('validates shortcuts array length', () => {
      const category: ShortcutCategory = {
        name: 'Global',
        shortcuts: [
          { keys: ['Esc'], label: 'Close dialog' },
          { keys: ['Ctrl', 'S'], label: 'Save' },
        ],
      }
      expect(category.shortcuts.length).toBe(2)
    })
  })

  describe('SHORTCUT_CATEGORIES constant', () => {
    it('is an array', () => {
      expect(Array.isArray(SHORTCUT_CATEGORIES)).toBe(true)
    })

    it('has exactly 4 categories', () => {
      expect(SHORTCUT_CATEGORIES.length).toBe(4)
    })

    it('each category has a name and shortcuts array', () => {
      SHORTCUT_CATEGORIES.forEach((cat) => {
        expect(typeof cat.name).toBe('string')
        expect(Array.isArray(cat.shortcuts)).toBe(true)
        expect(cat.shortcuts.length).toBeGreaterThan(0)
      })
    })

    it('each shortcut has keys and label', () => {
      SHORTCUT_CATEGORIES.forEach((cat) => {
        cat.shortcuts.forEach((shortcut) => {
          expect(Array.isArray(shortcut.keys)).toBe(true)
          expect(typeof shortcut.label).toBe('string')
          expect(shortcut.keys.length).toBeGreaterThan(0)
        })
      })
    })

    it('categories have expected names', () => {
      const categoryNames = SHORTCUT_CATEGORIES.map((cat) => cat.name)
      expect(categoryNames).toContain('Global')
      expect(categoryNames).toContain('Navigation')
      expect(categoryNames).toContain('Editing')
      expect(categoryNames).toContain('Attestations')
    })
  })

  describe('ShortcutsOverlay component', () => {
    const renderOverlay = (open = true, onClose = vi.fn()) =>
      render(<ShortcutsOverlay open={open} onClose={onClose} />)

    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('renders all four category names from SHORTCUT_CATEGORIES', () => {
      renderOverlay()
      for (const cat of SHORTCUT_CATEGORIES) {
        expect(screen.getByText(cat.name)).toBeInTheDocument()
      }
    })

    it('renders shortcut labels from all categories', () => {
      renderOverlay()
      // Spot-check shortcuts from each category
      const all shortcutLabels = [
        'Open keyboard shortcuts',
        'Open command palette',
        'Quick-jump workspaces',
        'Close dialog',
        'Go to Dashboard',
        'Go to Attestations',
        'Toggle theme',
        'Connect revenue source',
        'New attestation',
        'Confirm attestation',
      ]
      for (const label of all shortcutLabels) {
        expect(screen.getByText(label)).toBeInTheDocument()
      }
    })

    it('renders kbd elements for each shortcut key', () => {
      renderOverlay()
      // Shift+? has 2 keys, Ctrl+K has 2 keys
      const shiftKbds = screen.getAllByText('Shift')
      const questionKbds = screen.getAllByText('?')
      const ctrlKbds = screen.getAllByText('Ctrl')
      expect(shiftKbds.length).toBeGreaterThan(0)
      expect(questionKbds.length).toBeGreaterThan(0)
      expect(ctrlKbds.length).toBeGreaterThan(0)
    })

    it('filters shortcuts by label (success path)', () => {
      renderOverlay()
      const input = screen.getByRole('searchbox')
      fireEvent.change(input, { target: { value: 'dashboard' } })
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
    })

    it('filters shortcuts by category name (success path)', () => {
      renderOverlay()
      const input = screen.getByRole('searchbox')
      fireEvent.change(input, { target: { value: 'Global' } })
      expect(screen.getByText('Global')).toBeInTheDocument()
    })

    it('shows empty state when no matches', () => {
      renderOverlay()
      const input = screen.getByRole('searchbox')
      fireEvent.change(input, { target: { value: 'zzznomatch999' } })
      expect(screen.getByText(/No shortcuts match/i)).toBeInTheDocument()
    })

    it('closes on Escape key', () => {
      const onClose = vi.fn()
      renderOverlay(true, onClose)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).toHaveBeenCalled()
    })

    it('closes when backdrop clicked', () => {
      const onClose = vi.fn()
      renderOverlay(true, onClose)
      const backdrop = document.querySelector('.modal-backdrop') as HTMLElement
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    })

    it('does not close when dialog content clicked', () => {
      const onClose = vi.fn()
      renderOverlay(true, onClose)
      fireEvent.click(screen.getByRole('dialog'))
      expect(onClose).not.toHaveBeenCalled()
    })

    it('closes via close button', () => {
      const onClose = vi.fn()
      renderOverlay(true, onClose)
      fireEvent.click(screen.getByRole('button', { name: /close keyboard shortcuts/i }))
      expect(onClose).toHaveBeenCalled()
    })

    it('has proper ARIA attributes', () => {
      renderOverlay()
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
      const titleId = dialog.getAttribute('aria-labelledby')!
      expect(document.getElementById(titleId)).toHaveTextContent('Keyboard shortcuts')
    })

    it('has accessible search input', () => {
      renderOverlay()
      const input = screen.getByRole('searchbox')
      expect(input).toHaveAttribute('aria-label', 'Filter shortcuts')
    })

    it('announces result count to screen readers', () => {
      renderOverlay()
      const input = screen.getByRole('searchbox')
      fireEvent.change(input, { target: { value: 'Dashboard' } })
      const status = document.querySelector('[role="status"]')
      expect(status).toBeInTheDocument()
      expect(status?.textContent).toMatch(/\d+ shortcut/)
    })

    it('resets search query when re-opened', () => {
      const { rerender } = renderOverlay(true)
      const input = screen.getByRole('searchbox')
      fireEvent.change(input, { target: { value: 'foo' } })
      expect(input).toHaveValue('foo')

      rerender(<ShortcutsOverlay open={false} onClose={vi.fn()} />)
      rerender(<ShortcutsOverlay open={true} onClose={vi.fn()} />)
      expect(screen.getByRole('searchbox')).toHaveValue('')
    })

    it('filters by key name', () => {
      renderOverlay()
      const input = screen.getByRole('searchbox')
      fireEvent.change(input, { target: { value: 'Ctrl' } })
      expect(screen.getByText('Open command palette')).toBeInTheDocument()
    })
  })
})
