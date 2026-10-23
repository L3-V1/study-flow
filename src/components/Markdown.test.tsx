import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Markdown } from './Markdown.tsx'

describe('Markdown', () => {
  it('colore blocos de código com highlight.js', () => {
    const { container } = render(<Markdown texto={'```ts\nconst x = 1\n```'} />)
    expect(container.querySelector('pre code.hljs')).not.toBeNull()
  })

  it('renderiza $...$ com KaTeX', () => {
    const { container } = render(<Markdown texto="Custa $O(\log n)$." />)
    expect(container.querySelector('.katex')).not.toBeNull()
  })

  it('renderiza tabelas GFM', () => {
    const { container } = render(
      <Markdown texto={'| a | b |\n| - | - |\n| 1 | 2 |'} />,
    )
    expect(container.querySelector('table td')?.textContent).toBe('1')
  })
})
