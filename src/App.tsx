import { Navigate, Route, Routes } from 'react-router-dom'
import { BoardsPage } from './pages/BoardsPage'
import { EditorPage } from './pages/EditorPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<BoardsPage />} />
      <Route path="/boards/:boardId" element={<EditorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
