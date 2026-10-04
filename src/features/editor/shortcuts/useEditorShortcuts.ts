import { useCallback, useEffect } from 'react'

import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import {
  redo,
  undo,
  selectionDeleted,
  duplicateSelection,
  clipboardPasted,
  selectionCopied,
} from '../editorSlice'

export function useEditorShortcuts() {
  const dispatch = useAppDispatch()

  const nodes = useAppSelector((state) => state.editor.nodes)
  const edges = useAppSelector((state) => state.editor.edges)
  const clipboard = useAppSelector((state) => state.editor.clipboard)
  const selectedNodeIds = useAppSelector(
    (state) => state.editor.selectedNodeIds,
  )

  const duplicateSelectedNodes = useCallback(() => {
    const selectedIds = new Set(selectedNodeIds)

    const nodeIds = Object.fromEntries(
      nodes
        .filter((node) => selectedIds.has(node.id))
        .map((node) => [node.id, crypto.randomUUID()]),
    )

    const edgeIds = Object.fromEntries(
      edges
        .filter(
          (edge) =>
            selectedIds.has(edge.source) && selectedIds.has(edge.target),
        )
        .map((edge) => [edge.id, crypto.randomUUID()]),
    )

    dispatch(
      duplicateSelection({
        nodeIds,
        edgeIds,
      }),
    )
  }, [dispatch, edges, nodes, selectedNodeIds])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        dispatch(selectionDeleted())
        return
      }

      const modifierPressed = event.ctrlKey || event.metaKey

      if (!modifierPressed) {
        return
      }

      if (event.key.toLowerCase() === 'd') {
        event.preventDefault()
        duplicateSelectedNodes()
        return
      }

      if (event.key.toLowerCase() === 'c') {
        event.preventDefault()
        dispatch(selectionCopied())
        return
      }

      if (event.key.toLowerCase() === 'v') {
        if (!clipboard) {
          return
        }

        event.preventDefault()

        const nodeIds = Object.fromEntries(
          clipboard.nodes.map((node) => [node.id, crypto.randomUUID()]),
        )

        const edgeIds = Object.fromEntries(
          clipboard.edges.map((edge) => [edge.id, crypto.randomUUID()]),
        )

        dispatch(
          clipboardPasted({
            nodeIds,
            edgeIds,
          }),
        )

        return
      }

      if (event.key.toLowerCase() === 'z') {
        event.preventDefault()

        if (event.shiftKey) {
          dispatch(redo())
        } else {
          dispatch(undo())
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [clipboard, dispatch, duplicateSelectedNodes])
}
