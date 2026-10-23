// O dia de estudo vai de meia-noite a meia-noite no fuso local.
export function inicioDoDia(agora: Date): Date {
  const inicio = new Date(agora)
  inicio.setHours(0, 0, 0, 0)
  return inicio
}

export function fimDoDia(agora: Date): Date {
  const fim = inicioDoDia(agora)
  fim.setDate(fim.getDate() + 1)
  return fim
}
