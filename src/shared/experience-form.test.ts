import { describe, expect, it } from 'vitest'

import {
  experienceFormInput,
  experienceFormSchema,
  formErrors,
} from './experience-form'
import { formFields, formOr } from './form-input'
import { MAX_FORM_FILES } from './project-files'

const base = {
  game: 'bf6',
  category: 'multiplayer',
  title: 'Gun Master',
}

describe('the submit form', () => {
  it('reads a posted form: strings, blanks, checkboxes and lines', () => {
    const form = new FormData()
    for (const [name, value] of Object.entries({
      ...base,
      code: ' 1264g ',
      link: '',
      description: '',
      isTemplate: 'true',
      media: 'https://i.example/a.png\n\n https://youtu.be/jNQXAC9IVRw ',
      credits: 'Coupe\nByte',
      repoUrl: '',
    })) {
      form.append(name, value)
    }
    form.append('tags', 'gun-game')
    form.append('tags', 'casual')
    form.append('built', 'script')
    // Two teams: 16 people, and 16 people with 4 bots.
    form.append('teamPlayers', '16')
    form.append('teamBots', '0')
    form.append('teamPlayers', '16')
    form.append('teamBots', '4')

    expect(experienceFormSchema.parse(formFields(form))).toEqual({
      game: 'bf6',
      code: ' 1264g ',
      category: 'multiplayer',
      title: 'Gun Master',
      description: '',
      tags: ['gun-game', 'casual'],
      built: ['script'],
      isTemplate: true,
      copyAllowed: false,
      teamPlayers: [16, 16],
      teamBots: [0, 4],
      media: ['https://i.example/a.png', 'https://youtu.be/jNQXAC9IVRw'],
      credits: ['Coupe', 'Byte'],
      creditAccounts: [],
      files: [],
    })
  })

  it('says what is wrong, by field', () => {
    const result = experienceFormSchema.safeParse({
      ...base,
      title: 'x',
      teamPlayers: ['16', '300'],
      coverImgUrl: 'http://plain.example/a.png',
      repoUrl: 'https://evil.example/repo',
      filesUrl: 'https://github.com.evil.example/x',
      media: Array.from({ length: 9 }, (_, n) => `https://i.example/${n}.png`),
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(Object.keys(formErrors(result.error)).sort()).toEqual([
      'coverImgUrl',
      'filesUrl',
      'media',
      'repoUrl',
      'teamPlayers',
      'title',
    ])
  })

  it('says what is missing in words, not as what Zod would say', () => {
    // A radio button nobody chose is not sent at all.
    const result = experienceFormSchema.safeParse({ game: 'bf6' })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(formErrors(result.error)).toMatchObject({
      category: 'Choose a category.',
      title: 'Give it a title of at least three characters.',
    })
  })

  it('takes a repository and files only from the hosts it knows', () => {
    const ok = experienceFormSchema.parse({
      ...base,
      repoUrl: 'https://github.com/someone/project',
      filesUrl: 'https://www.dropbox.com/s/abc/files.zip',
    })
    expect(ok.repoUrl).toBe('https://github.com/someone/project')
    expect(ok.filesUrl).toMatch(/dropbox/)
  })

  it('takes pictures, and videos only from YouTube, and says why not', () => {
    const problem = (link: string) => {
      const result = experienceFormSchema.safeParse({ ...base, media: link })
      return result.success ? null : formErrors(result.error).media
    }
    expect(problem('https://i.example/a.png')).toBeNull()
    expect(problem('https://www.youtube.com/watch?v=jNQXAC9IVRw')).toBeNull()
    expect(problem('https://youtube.com/shorts/jNQXAC9IVRw')).toBeNull()
    expect(problem('http://i.example/a.png')).toBe(
      'Each link must be an https:// address.',
    )
    expect(problem('https://www.youtube.com/@battlefield')).toBe(
      'A YouTube link must be to one video.',
    )
    expect(problem('https://clips.twitch.tv/abc')).toBe(
      'Videos must be on YouTube.',
    )
  })
})

describe('the file ids a form names', () => {
  const ids = (count: number) =>
    Array.from(
      { length: count },
      (_, n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    )
  const read = formOr(experienceFormInput)

  it('takes as many as a form holds, sent either way', () => {
    expect(read({ ...base, files: ids(MAX_FORM_FILES) }).input).not.toBeNull()
    const form = new FormData()
    for (const id of ids(MAX_FORM_FILES)) form.append('shownFiles', id)
    expect(read(form as never).input).not.toBeNull()
  })

  it('refuses more before anything looks them up', () => {
    for (const name of ['files', 'shownFiles']) {
      expect(read({ ...base, [name]: ids(MAX_FORM_FILES + 1) })).toMatchObject({
        input: null,
        errors: { files: 'The form names more files than it can hold.' },
      })
      const form = new FormData()
      for (const id of ids(MAX_FORM_FILES + 1)) form.append(name, id)
      expect(read(form as never).input).toBeNull()
    }
    // The review's case: tens of thousands, sent by a script.
    expect(read({ shownFiles: ids(65_536) }).input).toBeNull()
  })
})
