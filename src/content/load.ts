import { type Baralho, baralhoSchema } from './schema.ts'

// As regras entre arquivos (IDs únicos, Tema = pasta etc.) já são garantidas
// pelo `npm run validate` no build; aqui só o schema de cada Baralho.
const arquivos = import.meta.glob('/content/**/*.json', {
  eager: true,
  import: 'default',
})

export const baralhos: Baralho[] = Object.values(arquivos).map((dados) =>
  baralhoSchema.parse(dados),
)
