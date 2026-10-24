import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Baralho } from './pages/Baralho.tsx'
import { Configuracoes } from './pages/Configuracoes.tsx'
import { Inicio } from './pages/Inicio.tsx'
import { Progresso } from './pages/Progresso.tsx'
import { Sessao } from './pages/Sessao.tsx'
import { Tema } from './pages/Tema.tsx'

// `cardsRemovidos` vem da limpeza de órfãos feita no `main.tsx`.
function App({ cardsRemovidos = 0 }: { cardsRemovidos?: number }) {
  // Fechar a faixa vale para a sessão toda.
  const [removidos, setRemovidos] = useState(cardsRemovidos)
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Inicio
            cardsRemovidos={removidos}
            aoFecharAviso={() => setRemovidos(0)}
          />
        }
      />
      <Route path="/tema/:temaSlug" element={<Tema />} />
      <Route path="/tema/:temaSlug/:baralhoId" element={<Baralho />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
      <Route path="/progresso" element={<Progresso />} />
      <Route path="/estudar" element={<Sessao />} />
      <Route path="/estudar/:temaSlug" element={<Sessao />} />
      <Route path="/estudar/:temaSlug/:baralhoId" element={<Sessao />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
