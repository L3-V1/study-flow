export function AvisoOrfaos({
  quantidade,
  aoFechar,
}: {
  quantidade: number
  aoFechar: () => void
}) {
  if (quantidade === 0) return null
  return (
    <aside className="aviso-backup" role="status">
      <p>
        <span aria-hidden="true">🧹 </span>
        {quantidade === 1
          ? 'Progresso de 1 Card removido do conteúdo foi apagado.'
          : `Progresso de ${quantidade} Cards removidos do conteúdo foi apagado.`}
      </p>
      <button type="button" onClick={aoFechar}>
        Fechar
      </button>
    </aside>
  )
}
