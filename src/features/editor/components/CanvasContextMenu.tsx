import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { FlowNodeType } from '../types'

import { nodeCatalog } from '../nodeCatalog'

const items = nodeCatalog

type Props = {
  x: number
  y: number
  onAdd: (type: FlowNodeType, label: string) => void
  onClose: () => void
  onExport: () => void
  node?: { type: FlowNodeType; selected: boolean }
  onTypeChange: (type: FlowNodeType) => void
  onRename: () => void
  onSelect: () => void
}

export function CanvasContextMenu({
  x,
  y,
  onAdd,
  onClose,
  onExport,
  node,
  onTypeChange,
  onRename,
  onSelect,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const bounds = menu.getBoundingClientRect()
    menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - bounds.width - 8))}px`
    menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - bounds.height - 8))}px`
    if (!menu.contains(document.activeElement)) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    }
    menu.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
  }, [x, y])

  useEffect(() => {
    const menu = menuRef.current
    function dismiss(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) onClose()
    }
    window.addEventListener('pointerdown', dismiss, true)
    window.addEventListener('resize', onClose)
    window.addEventListener('wheel', onClose, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', dismiss, true)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('wheel', onClose)
      if (
        document.activeElement === document.body ||
        menu?.contains(document.activeElement)
      ) {
        previousFocusRef.current?.focus()
      }
    }
  }, [onClose])

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={node ? 'Node options' : 'Board options'}
      className="canvas-context-menu"
      style={{ left: x, top: y }}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Escape' || event.key === 'Tab') {
          event.preventDefault()
          onClose()
        }
        const buttons = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            'button:not(:disabled)',
          ),
        )
        const current = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        )
        const next =
          event.key === 'ArrowDown'
            ? (current + 1) % buttons.length
            : event.key === 'ArrowUp'
              ? (current - 1 + buttons.length) % buttons.length
              : event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? buttons.length - 1
                  : null
        if (next !== null) {
          event.preventDefault()
          buttons[next]?.focus()
        }
      }}
    >
      {node && (
        <>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="tool-button"
            onClick={onRename}
          >
            Edit text
          </button>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="tool-button"
            disabled={node.selected}
            onClick={onSelect}
          >
            {node.selected ? 'Already selected' : 'Add to selection'}
          </button>
          <div className="context-menu-divider" role="separator" />
          <div className="context-menu-heading">Change type</div>
        </>
      )}
      {items.map((item) => (
        <button
          key={item.type}
          type="button"
          role={node ? 'menuitemradio' : 'menuitem'}
          aria-checked={node ? node.type === item.type : undefined}
          tabIndex={-1}
          className="tool-button"
          onClick={() =>
            node ? onTypeChange(item.type) : onAdd(item.type, item.label)
          }
        >
          <span className="tool-symbol" aria-hidden="true">
            {item.symbol}
          </span>
          {node ? item.name : `Add ${item.name}`}
          {node?.type === item.type && <span aria-hidden="true">✓</span>}
        </button>
      ))}
      {!node && (
        <div className="context-menu-footer">
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="tool-button"
            onClick={onExport}
          >
            Export board
          </button>
        </div>
      )}
    </div>,
    document.body,
  )
}
