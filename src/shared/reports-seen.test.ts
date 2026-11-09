import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  type ReportsSeen,
  reportsSeenFields,
  seenAsFields,
  seenFromFields,
} from './reports-seen'

describe('what a reports decision says was shown', () => {
  const schema = z.object(reportsSeenFields)

  it('reads back as it was written', () => {
    const shown: ReportsSeen[] = [
      {
        flags: { bugged: true, broken: false, xpFarm: true },
        lastReport: new Date('2026-10-18T12:00:00.123Z'),
      },
      {
        flags: { bugged: false, broken: false, xpFarm: false },
        lastReport: null,
      },
    ]
    for (const seen of shown) {
      expect(seenFromFields(schema.parse(seenAsFields(seen)))).toEqual(seen)
    }
  })

  it('takes nothing sent as nothing seen, and refuses a time that does not read', () => {
    expect(seenFromFields(schema.parse({}))).toEqual({
      flags: { bugged: false, broken: false, xpFarm: false },
      lastReport: null,
    })
    expect(schema.safeParse({ seenReport: 'yesterday' }).success).toBe(false)
  })
})
