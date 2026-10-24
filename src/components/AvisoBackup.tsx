import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { atrasoDoBackup, baixarBackup } from '../progress/backup.ts'

// Reativo ao `settings`: some sozinho depois de exportar.
export function AvisoBackup() {
  const atraso = useLiveQuery(() => atrasoDoBackup(new Date()))
  const [erro, setErro] = useState(false)
  if (atraso === undefined) return null

  async function exportar() {
    try {
      await baixarBackup(new Date())
      setErro(false)
    } catch {
      setErro(true)
    }
  }

  return (
    <aside className="aviso-backup" role="status">
      <p>
        <span aria-hidden="true">💾 </span>
        {atraso.dias === undefined
          ? 'Você ainda não fez um backup do seu progresso.'
          : `Seu último backup foi há ${atraso.dias} dias.`}
        {erro && ' Não foi possível exportar.'}
      </p>
      <button type="button" onClick={() => void exportar()}>
        Exportar agora
      </button>
    </aside>
  )
}
