import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { Heatmap } from '../components/Heatmap.tsx'
import { temas } from '../content/load.ts'
import { db, lerEstados } from '../progress/db.ts'
import {
  type Contagem,
  contagemDoEscopo,
  revisoesPorDia,
  sequencia,
} from '../progress/stats.ts'

// Reativo ao banco; `undefined` enquanto carrega. Das revisões, só o índice.
function useProgresso() {
  return useLiveQuery(async () => {
    const estados = await lerEstados()
    const datas = (await db.reviewLogs.orderBy('review').keys()) as Date[]
    return { estados, porDia: revisoesPorDia(datas), agora: new Date() }
  })
}

const colunas: [keyof Contagem, string][] = [
  ['novos', 'Novos'],
  ['aprendizado', 'Em aprendizado'],
  ['maduros', 'Maduros'],
  ['vencidos', 'Vencidos hoje'],
  ['suspensos', 'Suspensos'],
]

function Linha({ nome, contagem }: { nome: string; contagem: Contagem }) {
  return (
    <tr>
      <th scope="row">{nome}</th>
      {colunas.map(([chave]) => (
        <td key={chave}>{contagem[chave]}</td>
      ))}
    </tr>
  )
}

export function Progresso() {
  const progresso = useProgresso()

  return (
    <main className="progresso">
      <nav className="trilha">
        <Link to="/">Início</Link> › <Link to="/progresso">Progresso</Link>
      </nav>
      <h1>Progresso</h1>
      {progresso !== undefined && (
        <>
          <Resumo porDia={progresso.porDia} agora={progresso.agora} />
          {temas.length === 0 && <p>Nenhum Baralho por enquanto.</p>}
          {temas.map((tema) => (
            <section key={tema.slug}>
              <h2>{tema.nome}</h2>
              <div className="tabela-rolagem">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Baralho</th>
                      {colunas.map(([chave, rotulo]) => (
                        <th key={chave} scope="col">
                          {rotulo}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tema.baralhos.map((baralho) => (
                      <Linha
                        key={baralho.id}
                        nome={baralho.nome}
                        contagem={contagemDoEscopo(
                          temas,
                          { temaSlug: tema.slug, baralhoId: baralho.id },
                          progresso.estados,
                          progresso.agora,
                        )}
                      />
                    ))}
                  </tbody>
                  <tfoot>
                    <Linha
                      nome="Total"
                      contagem={contagemDoEscopo(
                        temas,
                        { temaSlug: tema.slug },
                        progresso.estados,
                        progresso.agora,
                      )}
                    />
                  </tfoot>
                </table>
              </div>
            </section>
          ))}
        </>
      )}
    </main>
  )
}

function Resumo({
  porDia,
  agora,
}: {
  porDia: Map<string, number>
  agora: Date
}) {
  const dias = sequencia(porDia, agora)
  return (
    <section>
      <p className="sequencia">
        Sequência: {dias} {dias === 1 ? 'dia seguido' : 'dias seguidos'}
      </p>
      <Heatmap porDia={porDia} agora={agora} />
    </section>
  )
}
