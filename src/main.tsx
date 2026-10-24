import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { temas } from './content/load.ts'
import { limparOrfaos } from './progress/db.ts'
import { cardsDoEscopo } from './study/session.ts'

// Uma falha na limpeza nunca impede o app de abrir.
const cardsRemovidos = await limparOrfaos(
  new Set(cardsDoEscopo(temas, {}).map((c) => c.id)),
).catch(() => 0)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App cardsRemovidos={cardsRemovidos} />
    </HashRouter>
  </StrictMode>,
)
