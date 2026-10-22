import { Navigate, Route, Routes } from 'react-router'

function Home() {
  return (
    <main>
      <h1>Study Flow</h1>
      <p>Seu fluxo de estudos, um passo de cada vez.</p>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
