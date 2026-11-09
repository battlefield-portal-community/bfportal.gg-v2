import { z } from 'zod'

// What a moderator was shown when deciding on an experience's reports, sent
// with the decision so one made on a page another moderator has since acted
// on is refused. The reports screen writes it, the server function reads it,
// and the service decides on it.

/** The flags people set on an experience, which reports point at. */
export const healthFlagNames = ['bugged', 'broken', 'xpFarm'] as const
export type HealthFlags = Record<(typeof healthFlagNames)[number], boolean>

/**
 * The flags as they were, and when the newest open report shown was made,
 * or null if none was.
 */
export type ReportsSeen = { flags: HealthFlags; lastReport: Date | null }

/** The fields a decision sends: the flags set, by name, and the time. */
export const reportsSeenFields = {
  seenFlags: z.string().max(40).default(''),
  seenReport: z.union([z.literal(''), z.iso.datetime()]).default(''),
}

/** What a form shown `seen` sends. */
export function seenAsFields(seen: ReportsSeen) {
  return {
    seenFlags: healthFlagNames.filter((name) => seen.flags[name]).join(','),
    seenReport: seen.lastReport ? seen.lastReport.toISOString() : '',
  }
}

/** What a decision's fields say was shown. */
export function seenFromFields(fields: {
  seenFlags: string
  seenReport: string
}): ReportsSeen {
  const set = fields.seenFlags.split(',')
  return {
    flags: {
      bugged: set.includes('bugged'),
      broken: set.includes('broken'),
      xpFarm: set.includes('xpFarm'),
    },
    lastReport: fields.seenReport ? new Date(fields.seenReport) : null,
  }
}
