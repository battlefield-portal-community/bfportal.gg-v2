import { createServerFn } from '@tanstack/solid-start'
import { z } from 'zod'

import { currentActor } from '../server/auth/actor'
import { getFileView, getProposedFileView } from '../server/services/file-view'
import { FILE_ID } from '../shared/project-files'

/** One project file to read on a page, or null if the visitor may not. */
export const fetchFileView = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().regex(FILE_ID) }))
  .handler(async ({ data }) => getFileView(data.id, await currentActor()))

/**
 * A file an edit waiting for review would store, to read on a page: for a
 * moderator, or null. The service checks who is asking.
 */
export const fetchProposedFileView = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      edit: z.number().int().positive(),
      file: z.string().uuid(),
      /** A file inside an export, by its place. */
      part: z.number().int().min(0).max(999).optional(),
    }),
  )
  .handler(async ({ data }) =>
    getProposedFileView(await currentActor(), data.edit, data.file, data.part),
  )

export type FileView = NonNullable<Awaited<ReturnType<typeof fetchFileView>>>
