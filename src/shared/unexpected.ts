/** What a visitor is told when a server function fails in a way not foreseen. */
export const UNEXPECTED = 'Something went wrong on the server. Try again.'

/**
 * What a server function that threw answers with. A response, such as the
 * redirect a form gets, is an answer, and goes as it is; the router's own
 * redirects are responses too. Anything else is a fault: in production the
 * visitor is told only that something went wrong, since the error itself can
 * carry a query and what was sent in it, and the server's log keeps the whole
 * of it.
 */
export function answerForError(error: unknown, production: boolean) {
  if (error instanceof Response || !production) return error
  console.error(error)
  return new Error(UNEXPECTED)
}
