// @vitest-environment happy-dom
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SubmitPageData } from '../functions/submit'
import { SubmitPage } from './submit-page'

const fns = vi.hoisted(() => {
  const fn = (url: string) => Object.assign(vi.fn(), { url })
  return {
    deleteDraft: fn('/delete'),
    readProjectFiles: fn('/read'),
    saveDraft: fn('/save'),
    startFromCode: fn('/start'),
    submitForReview: fn('/submit'),
  }
})
const navigate = vi.hoisted(() => vi.fn(() => Promise.resolve()))
vi.mock('../functions/submit', () => fns)
vi.mock('../functions/people', () => ({ searchPeople: vi.fn() }))
vi.mock('../functions/likes', () => ({
  likeExperience: Object.assign(vi.fn(), { url: '/like' }),
  likeSnippet: Object.assign(vi.fn(), { url: '/like-snippet' }),
}))
vi.mock('@tanstack/solid-router', () => ({
  useNavigate: () => navigate,
  useRouter: () => ({ invalidate: () => Promise.resolve() }),
  useLocation: () => () => ({ href: '/', pathname: '/' }),
  Link: (props: { children?: unknown }) => props.children,
}))

/** The form for one of the owner's Battlefield 6 drafts. */
const pageFor = (slug: string) =>
  ({
    state: 'ok',
    game: 'bf6',
    code: '',
    link: '',
    lookup: null,
    found: null,
    unreadable: false,
    options: {
      categories: [
        { slug: 'multiplayer', name: 'Multiplayer', marksTemplate: false },
      ],
      tagGroups: [],
      currentSdk: null,
    },
    draft: {
      fields: { title: slug, category: 'multiplayer', editing: slug },
      errors: {},
    },
    editing: {
      slug,
      title: slug,
      status: 'draft',
      reviewNote: null,
      editWaiting: false,
      savedAt: null,
      submittedFiles: [],
    },
    held: [],
    credited: [],
    tally: null,
    now: '2026-10-18T12:00:00.000Z',
  }) as unknown as SubmitPageData

/** A promise and the means to settle it, for an answer held back. */
function later<T>() {
  let settle: (value: T) => void = () => {}
  const promise = new Promise<T>((resolve) => {
    settle = resolve
  })
  return { promise, settle }
}

/** Chooses a file in the export's slot, as a visitor does. */
function chooseExport(host: HTMLElement, name: string) {
  const input = host.querySelector<HTMLInputElement>(
    'input[type=file][aria-label="Upload export"]',
  )
  if (!input) throw new Error('expected the export input')
  Object.defineProperty(input, 'files', {
    value: [new File(['{}'], name)],
    configurable: true,
  })
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

const submitButton = (host: HTMLElement) => {
  const button = host.querySelector<HTMLButtonElement>(
    'button[type=submit]:not([formaction]):not([hidden])',
  )
  if (!button) throw new Error('expected the Submit button')
  return button
}

/** Lets the page's awaits run. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('SubmitPage while a file is uploading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('sends nothing else until the upload is done', async () => {
    const upload = later<{ ok: true }>()
    fns.readProjectFiles.mockReturnValue(upload.promise)
    const host = document.createElement('div')
    document.body.append(host)
    render(() => <SubmitPage data={pageFor('first-draft')} />, host)

    chooseExport(host, 'new.json')
    await settled()
    expect(fns.readProjectFiles).toHaveBeenCalledTimes(1)
    expect(submitButton(host).disabled).toBe(true)
    // Pressed anyway, as Enter in a field would: nothing is sent.
    host.querySelector('form')?.requestSubmit()
    await settled()
    expect(fns.submitForReview).not.toHaveBeenCalled()
    // A second file waits for the first.
    chooseExport(host, 'another.json')
    await settled()
    expect(fns.readProjectFiles).toHaveBeenCalledTimes(1)

    upload.settle({ ok: true })
    await settled()
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(submitButton(host).disabled).toBe(false)
  })

  it('drops an answer that comes after the page went to another form', async () => {
    const upload = later<{ ok: true }>()
    fns.readProjectFiles.mockReturnValue(upload.promise)
    const [data, setData] = createSignal(pageFor('first-draft'))
    const host = document.createElement('div')
    document.body.append(host)
    render(() => <SubmitPage data={data()} />, host)

    chooseExport(host, 'new.json')
    await settled()
    setData(pageFor('second-draft'))
    upload.settle({ ok: true })
    await settled()

    // The second draft's form stays as it is, and can be sent.
    expect(navigate).not.toHaveBeenCalled()
    expect(submitButton(host).disabled).toBe(false)
  })
})
