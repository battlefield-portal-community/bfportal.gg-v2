import { afterEach, describe, expect, it, vi } from 'vitest'

import { answerForError, UNEXPECTED } from './unexpected'

describe('what a server function that threw answers with', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends an answer as it is', () => {
    // The redirect a form gets, as `redirectTo` makes it.
    const answer = new Response(null, {
      status: 303,
      headers: { Location: '/submit' },
    })
    expect(answerForError(answer, true)).toBe(answer)
  })

  it('tells a visitor in production only that something went wrong', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fault = new Error(
      'Failed query: select "id" from "held_files" where "id" in ($1, $2)',
    )
    const answer = answerForError(fault, true)
    expect(answer).toBeInstanceOf(Error)
    expect((answer as Error).message).toBe(UNEXPECTED)
    expect(String(answer)).not.toContain('held_files')
    // The server keeps the whole of it.
    expect(logged).toHaveBeenCalledWith(fault)
  })

  it('shows the error itself while developing', () => {
    const fault = new Error('Failed query')
    expect(answerForError(fault, false)).toBe(fault)
  })
})
