import { useContext, useEffect, useState } from 'react'
import {
  NodeResizer,
  NodeToolbar,
  Handle,
  Position,
  useUpdateNodeInternals,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import {
  edgeAdded,
  nodeDataChanged,
  nodeDeleted,
  nodeDuplicated,
} from '../editorSlice'
import { checkpointReady, nodeCatalog, outcomesFor } from '../nodeCatalog'
import type { FlowNodeData, FlowNodeType } from '../types'
import { NodeEditingContext } from './NodeEditingContext'
import { FlowNavigationContext } from './FlowNavigationContext'
import { InlineText } from './InlineText'

type StyledNodeProps = NodeProps<Node<FlowNodeData>> & { kind: FlowNodeType }

export function StyledNode({ id, data, selected, kind }: StyledNodeProps) {
  const dispatch = useAppDispatch()
  const nodes = useAppSelector((state) => state.editor.nodes)
  const [connecting, setConnecting] = useState(false)
  const [route, setRoute] = useState('')
  const edges = useAppSelector((state) => state.editor.edges)
  const { editingNodeId, setEditingNodeId } = useContext(NodeEditingContext)
  const navigation = useContext(FlowNavigationContext)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const updateInternals = useUpdateNodeInternals()
  const details = nodeCatalog.find((item) => item.type === kind) ?? {
    name: 'Input / Output',
    symbol: '⇄',
  }
  const outcomes = outcomesFor(data)
  const criteria = data.criteria ?? []
  const legacyOutput = edges.some(
    (edge) => edge.source === id && !edge.sourceHandle,
  )
  const linkedBoard = navigation.boards.find(
    (board) => board.id === data.linkedBoardId,
  )
  const entry = linkedBoard?.document.nodes.find(
    (node) =>
      node.type !== 'note' &&
      !linkedBoard.document.edges.some(
        (edge) =>
          edge.target === node.id &&
          linkedBoard.document.nodes.find((source) => source.id === edge.source)
            ?.type !== 'note',
      ),
  )
  const editing = editingNodeId === id

  useEffect(() => {
    updateInternals(id)
  }, [id, data, kind, updateInternals])

  function change(changes: Partial<FlowNodeData>) {
    dispatch(nodeDataChanged({ id, changes }))
  }
  async function navigate(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch {
      setError('Could not open this flow. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`flow-node flow-node--${kind}${selected ? ' is-selected' : ''}`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={120}
        color="var(--color-focus)"
        handleStyle={{ width: 10, height: 10, borderRadius: 0 }}
      />
      <NodeToolbar isVisible={selected}>
        <div className="node-actions nodrag nopan" aria-label="Node actions">
          <button onClick={() => setEditingNodeId(id)}>Edit</button>
          <button
            aria-expanded={connecting}
            onClick={() => setConnecting((value) => !value)}
          >
            Connect
          </button>
          <button
            onClick={() =>
              dispatch(nodeDuplicated({ id, newId: crypto.randomUUID() }))
            }
          >
            Duplicate
          </button>
          <button onClick={() => dispatch(nodeDeleted(id))}>Delete</button>
        </div>
        {connecting && (
          <div
            className="node-connect-picker nodrag nopan"
            role="group"
            aria-label="Connect this node"
          >
            {kind === 'decision' && (
              <select
                aria-label="Route"
                value={
                  outcomes.some((item) => item.id === route)
                    ? route
                    : outcomes[0].id
                }
                onChange={(event) => setRoute(event.target.value)}
              >
                {outcomes.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}
            <select
              aria-label="Connect to"
              defaultValue=""
              onChange={(event) => {
                if (!event.target.value) return
                dispatch(
                  edgeAdded({
                    id: crypto.randomUUID(),
                    source: id,
                    target: event.target.value,
                    ...(kind === 'decision'
                      ? {
                          sourceHandle: outcomes.some(
                            (item) => item.id === route,
                          )
                            ? route
                            : outcomes[0].id,
                        }
                      : {}),
                  }),
                )
                setConnecting(false)
              }}
            >
              <option value="">Choose a destination…</option>
              {nodes
                .filter((node) => node.id !== id)
                .map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.label || 'Untitled note'}
                  </option>
                ))}
            </select>
          </div>
        )}
      </NodeToolbar>
      <div className="flow-node__surface" />
      <Handle
        type="target"
        position={Position.Top}
        aria-label={kind === 'note' ? 'Attach note' : 'Incoming connection'}
      />
      <header
        className="flow-node__type node-drag-handle"
        title="Drag here to move"
      >
        <span aria-hidden="true">{details.symbol}</span>
        {details.name}
        <span className="node-grip" aria-hidden="true">
          ⠿
        </span>
      </header>
      <div
        className="flow-node__content nodrag nowheel"
        style={{ cursor: 'initial' }}
        onScroll={() => updateInternals(id)}
      >
        <InlineText
          key={editing ? 'focused-title' : 'title'}
          value={data.label}
          label="Node title"
          placeholder={
            kind === 'note' ? 'Title (optional)' : 'Give this a title…'
          }
          className="flow-node__label"
          autoFocus={editing}
          onFinished={() => {
            if (editing) setEditingNodeId(null)
          }}
          onCommit={(label) => change({ label })}
        />
        <InlineText
          value={data.description ?? ''}
          label={kind === 'note' ? 'Note text' : 'Instructions'}
          placeholder={
            kind === 'note'
              ? 'Write a note…'
              : kind === 'decision'
                ? 'Add context for this choice…'
                : 'Add instructions…'
          }
          multiline
          className="flow-node__description"
          onCommit={(description) => change({ description })}
        />
        {kind === 'decision' && (
          <section className="node-section" aria-label="Decision outcomes">
            <div className="node-section__label">Choose a route</div>
            {outcomes.map((outcome) => {
              const connected = edges.some(
                (edge) =>
                  edge.source === id && edge.sourceHandle === outcome.id,
              )
              return (
                <div className="outcome-row" key={outcome.id}>
                  <InlineText
                    value={outcome.label}
                    label="Outcome label"
                    placeholder="Outcome…"
                    onCommit={(label) =>
                      change({
                        outcomes: outcomes.map((item) =>
                          item.id === outcome.id
                            ? { ...item, label: label || item.label }
                            : item,
                        ),
                      })
                    }
                  />
                  <button
                    className="node-icon-button"
                    aria-label={`Remove outcome ${outcome.label}`}
                    title={
                      connected
                        ? 'Disconnect this route before removing it'
                        : 'Remove outcome'
                    }
                    disabled={connected || outcomes.length <= 2}
                    onClick={() =>
                      change({
                        outcomes: outcomes.filter(
                          (item) => item.id !== outcome.id,
                        ),
                      })
                    }
                  >
                    ×
                  </button>
                  <Handle
                    id={outcome.id}
                    type="source"
                    position={Position.Right}
                    aria-label={`Connect ${outcome.label} route`}
                  />
                </div>
              )
            })}
            <button
              className="node-text-button"
              onClick={() =>
                change({
                  outcomes: [
                    ...outcomes,
                    { id: crypto.randomUUID(), label: 'Another route' },
                  ],
                })
              }
            >
              + Add outcome
            </button>
          </section>
        )}
        {kind === 'checkpoint' && (
          <section className="node-section" aria-label="Readiness checklist">
            <div
              className={`readiness ${checkpointReady(data) ? 'is-ready' : ''}`}
              role="status"
            >
              {criteria.filter((item) => item.done).length} of {criteria.length}{' '}
              ready ·{' '}
              {checkpointReady(data) ? 'Ready to continue' : 'Not ready'}
            </div>
            <p className="node-hint">
              Check each item when you have verified it.
            </p>
            {criteria.map((item) => (
              <div className="criterion-row" key={item.id}>
                <input
                  type="checkbox"
                  aria-label={`Ready: ${item.label}`}
                  checked={item.done}
                  onChange={(event) =>
                    change({
                      criteria: criteria.map((criterion) =>
                        criterion.id === item.id
                          ? { ...criterion, done: event.target.checked }
                          : criterion,
                      ),
                    })
                  }
                />
                <InlineText
                  value={item.label}
                  label="Criterion"
                  placeholder="What must be ready?"
                  onCommit={(label) =>
                    change({
                      criteria: criteria.map((criterion) =>
                        criterion.id === item.id
                          ? { ...criterion, label: label || item.label }
                          : criterion,
                      ),
                    })
                  }
                />
                <button
                  className="node-icon-button"
                  aria-label={`Remove criterion ${item.label}`}
                  onClick={() =>
                    change({
                      criteria: criteria.filter(
                        (criterion) => criterion.id !== item.id,
                      ),
                    })
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <button
              className="node-text-button"
              onClick={() =>
                change({
                  criteria: [
                    ...criteria,
                    {
                      id: crypto.randomUUID(),
                      label: 'New criterion',
                      done: false,
                    },
                  ],
                })
              }
            >
              + Add criterion
            </button>
          </section>
        )}
        {kind === 'linked-flow' && (
          <section className="node-section" aria-label="Linked flow">
            <label className="node-section__label" htmlFor={`linked-${id}`}>
              Detailed process
            </label>
            <select
              id={`linked-${id}`}
              value={data.linkedBoardId ?? ''}
              onChange={(event) =>
                change({ linkedBoardId: event.target.value || undefined })
              }
            >
              <option value="">Choose a board…</option>
              {data.linkedBoardId && !linkedBoard && (
                <option value={data.linkedBoardId}>
                  Board unavailable — choose another
                </option>
              )}
              {navigation.boards
                .filter((board) => board.id !== navigation.boardId)
                .map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
            </select>
            {linkedBoard && (
              <>
                <p className="node-hint">
                  {linkedBoard.document.nodes.length} nodes · Starts at{' '}
                  {entry?.data.label || 'an empty flow'}
                </p>
                <button
                  className="node-open-button"
                  disabled={busy || !navigation.onOpen}
                  onClick={() =>
                    void navigate(() => navigation.onOpen!(linkedBoard.id))
                  }
                >
                  Open {linkedBoard.name} ↗
                </button>
              </>
            )}
            {!data.linkedBoardId && navigation.onCreate && (
              <button
                className="node-text-button"
                disabled={busy}
                onClick={() =>
                  void navigate(() =>
                    navigation.onCreate!(id, data.label || 'Untitled flow'),
                  )
                }
              >
                + Create a new flow
              </button>
            )}
            {error && <p role="alert">{error}</p>}
          </section>
        )}
        {kind === 'note' && (
          <p className="node-hint">Connect to a step to attach this note.</p>
        )}
      </div>
      {(kind !== 'decision' || legacyOutput) && (
        <Handle
          type="source"
          position={Position.Bottom}
          aria-label={
            kind === 'note' ? 'Attach to a step' : 'Connect next step'
          }
        />
      )}
    </div>
  )
}
