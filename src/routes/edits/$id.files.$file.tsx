import { createFileRoute, notFound } from '@tanstack/solid-router'
import { z } from 'zod'

import { FilePage } from '../../components/file-page'
import { fetchProposedFileView } from '../../functions/files'
import { pageTitle } from '../../shared/page-title'

const UUID = /^[0-9a-f-]{36}$/i

// A file an edit waiting for review would store, read on a page by the
// moderator deciding on it. Its function says who may.
export const Route = createFileRoute('/edits/$id/files/$file')({
  // A file inside an export, by its place, which approving stores by itself.
  validateSearch: z.object({
    part: z.coerce.number().int().min(0).max(999).optional().catch(undefined),
  }),
  loaderDeps: ({ search }) => ({ part: search.part }),
  loader: async ({ params, deps }) => {
    const view =
      /^\d{1,9}$/.test(params.id) && UUID.test(params.file)
        ? await fetchProposedFileView({
            data: {
              edit: Number(params.id),
              file: params.file,
              part: deps.part,
            },
          })
        : null
    if (!view) throw notFound()
    return view
  },
  head: ({ loaderData }) => ({
    meta: [
      ...pageTitle(loaderData?.file.filename ?? 'A file').meta,
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: Page,
})

function Page() {
  const data = Route.useLoaderData()
  const params = Route.useParams()
  return <FilePage data={data()} back={`/admin/edits/${params().id}`} />
}
