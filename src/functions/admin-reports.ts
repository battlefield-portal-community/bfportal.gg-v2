import { createServerFn } from '@tanstack/solid-start'
import { z } from 'zod'

import { assertFromThisSite, currentActor } from '../server/auth/actor'
import {
  dismissReports,
  listReports,
  setHealthFlags,
} from '../server/services/admin-reports'
import { reportsSearchSchema } from '../shared/admin-search'
import { formCheckbox, formOr } from '../shared/form-input'
import { reportsSeenFields, seenFromFields } from '../shared/reports-seen'
import { refuse } from '../shared/results'
import { formAnswer } from './answer'

// What players have reported, for the moderators. The services refuse anyone
// who is not staff.

/** The reported experiences, as the screen's address filters them. */
export const fetchReports = createServerFn({ method: 'GET' })
  .validator(reportsSearchSchema)
  .handler(async ({ data }) =>
    listReports(await currentActor(), {
      state: data.state ?? 'open',
      game: data.game,
      kind: data.kind,
      sort: data.sort ?? 'most',
    }),
  )

/** The experience decided on, and what the moderator was shown of it. */
const decisionSchema = z.object({
  slug: z.string().min(1).max(200),
  ...reportsSeenFields,
})

/** Dismisses an experience's open reports. */
export const dismiss = createServerFn({ method: 'POST' })
  .validator(formOr(decisionSchema))
  .handler(async ({ data }) => {
    assertFromThisSite()
    const { input } = data
    const result = input
      ? await dismissReports(
          await currentActor(),
          input.slug,
          seenFromFields(input),
        )
      : refuse('invalid', data.errors)
    if (data.viaForm) throw formAnswer(result, data.back)
    return result
  })

/** Sets an experience's health flags, which deals with its reports. */
export const setFlags = createServerFn({ method: 'POST' })
  .validator(
    formOr(
      decisionSchema.extend({
        bugged: formCheckbox,
        broken: formCheckbox,
        xpFarm: formCheckbox,
      }),
    ),
  )
  .handler(async ({ data }) => {
    assertFromThisSite()
    const { input } = data
    const result = input
      ? await setHealthFlags(
          await currentActor(),
          input.slug,
          { bugged: input.bugged, broken: input.broken, xpFarm: input.xpFarm },
          seenFromFields(input),
        )
      : refuse('invalid', data.errors)
    if (data.viaForm) throw formAnswer(result, data.back)
    return result
  })

export type Reports = Extract<
  Awaited<ReturnType<typeof fetchReports>>,
  { ok: true }
>
