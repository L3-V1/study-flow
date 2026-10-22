import { z } from 'zod'

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'deve ser um slug (ex.: tcp-ip)')

const idNotaSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*-[a-z0-9]{8}$/,
    'deve ser <slug>-<8 caracteres base36> (ex.: tcp-ip-k3j9x2ab)',
  )

const textoSchema = z.string().min(1)

export const notaPerguntaRespostaSchema = z.strictObject({
  id: idNotaSchema,
  tipo: z.literal('pergunta-resposta'),
  frente: textoSchema,
  verso: textoSchema,
  extra: textoSchema.optional(),
})

export const notaLacunaSchema = z.strictObject({
  id: idNotaSchema,
  tipo: z.literal('lacuna'),
  texto: textoSchema,
  extra: textoSchema.optional(),
})

export const notaSchema = z.discriminatedUnion('tipo', [
  notaPerguntaRespostaSchema,
  notaLacunaSchema,
])

export const baralhoSchema = z.strictObject({
  id: slugSchema,
  tema: z.strictObject({ slug: slugSchema, nome: textoSchema }),
  nome: textoSchema,
  descricao: textoSchema.optional(),
  notas: z.array(notaSchema).min(1),
})

export type NotaPerguntaResposta = z.infer<typeof notaPerguntaRespostaSchema>
export type NotaLacuna = z.infer<typeof notaLacunaSchema>
export type Nota = z.infer<typeof notaSchema>
export type Baralho = z.infer<typeof baralhoSchema>
