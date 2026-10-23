import { Navigate, Route, Routes } from 'react-router'
import { Baralho } from './pages/Baralho.tsx'
import { Inicio } from './pages/Inicio.tsx'
import { Tema } from './pages/Tema.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/tema/:temaSlug" element={<Tema />} />
      <Route path="/tema/:temaSlug/:baralhoId" element={<Baralho />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
