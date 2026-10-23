import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { db } from '../progress/db.ts'

// O jsdom não implementa o modal do `<dialog>`.
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
  this.open = false
  this.dispatchEvent(new Event('close'))
}

afterEach(async () => {
  cleanup()
  await Promise.all(db.tables.map((t) => t.clear()))
})
