import { useParams } from 'react-router-dom'
import { EditorCanvas } from '../features/editor/components/EditorCanvas'

export function EditorPage() {
  const { boardId } = useParams()

  return (
    <main className="h-screen bg-slate-950 text-slate-100">
      <header className="flex h-14 items-center border-b border-slate-800 px-4">
        <span className="font-medium">Flowboard</span>
        <span className="ml-4 text-sm text-slate-400">
          Board: {boardId}
        </span>
      </header>

      <div className="h-[calc(100vh-3.5rem)]">
        <EditorCanvas />
      </div>
    </main>
  )
}