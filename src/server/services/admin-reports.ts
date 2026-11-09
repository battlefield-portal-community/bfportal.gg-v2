import { and, desc, eq, isNotNull, isNull, max, sql } from 'drizzle-orm'

import type { ReportSort, ReportState } from '../../shared/admin-search'
import type { Game, ReportType } from '../../shared/content'
import { CHANGED_SINCE_OPENED } from '../../shared/decision'
import type { HealthFlags, ReportsSeen } from '../../shared/reports-seen'
import { type Refusal, refuse } from '../../shared/results'
import type { Actor } from '../auth/actor'
import { db } from '../db'
import { experienceReports, experiences } from '../db/schema'
import { needsStaff } from './access'
import { isUnavailable } from './experience-cards'
import type { Executor } from './shared'

// What players have reported, for the moderators: each experience with its
// reports counted by kind. A report changes nothing by itself. A moderator
// dismisses them, or sets the experience's health flags, and either way they
// are dealt with until someone reports it again.

/** The most rows a list of reports shows. */
const SHOWN = 100

const counted = (type: ReportType) =>
  sql<number>`count(*) filter (where ${experienceReports.type} = ${type})`.mapWith(
    Number,
  )

/**
 * The reported experiences, with how many of each kind of report: those with
 * reports still open, or those whose reports were dealt with. With how many
 * there are of each, for the tabs.
 */
export async function listReports(
  actor: Actor | null,
  options: {
    state?: ReportState
    game?: Game
    kind?: ReportType
    sort?: ReportSort
  } = {},
) {
  const refused = needsStaff(actor)
  if (refused) return refused
  const state = options.state ?? 'open'
  const open = isNull(experienceReports.resolvedAt)
  const dealtWith = isNotNull(experienceReports.resolvedAt)
  const shown = and(
    state === 'open' ? open : dealtWith,
    isNull(experiences.deletedAt),
    options.game ? eq(experiences.game, options.game) : undefined,
  )
  const total = sql<number>`count(*)`.mapWith(Number)
  const last = max(
    state === 'open'
      ? experienceReports.createdAt
      : experienceReports.resolvedAt,
  )

  const tally = (where: ReturnType<typeof and>) =>
    db
      .select({
        value:
          sql<number>`count(distinct ${experienceReports.experienceId})`.mapWith(
            Number,
          ),
      })
      .from(experienceReports)
      .innerJoin(
        experiences,
        eq(experiences.id, experienceReports.experienceId),
      )
      .where(and(where, isNull(experiences.deletedAt)))
  const [rows, [openCount], [dismissedCount]] = await Promise.all([
    db
      .select({
        slug: experiences.slug,
        title: experiences.title,
        game: experiences.game,
        bugged: experiences.bugged,
        broken: experiences.broken,
        xpFarm: experiences.xpFarm,
        portalState: experiences.portalState,
        reports: {
          bugged: counted('bugged'),
          broken: counted('broken'),
          xp_farm: counted('xp_farm'),
        },
        total,
        last,
      })
      .from(experienceReports)
      .innerJoin(
        experiences,
        eq(experiences.id, experienceReports.experienceId),
      )
      .where(shown)
      .groupBy(experiences.id)
      .having(
        options.kind
          ? sql`count(*) filter (where ${experienceReports.type} = ${options.kind}) > 0`
          : undefined,
      )
      .orderBy(
        ...(options.sort === 'latest'
          ? [desc(last)]
          : [desc(total), desc(last)]),
        desc(experiences.id),
      )
      .limit(SHOWN),
    tally(open),
    tally(dealtWith),
  ])

  return {
    ok: true as const,
    state,
    items: rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      game: row.game,
      reports: row.reports,
      last: row.last,
      flags: {
        bugged: row.bugged,
        broken: row.broken,
        xpFarm: row.xpFarm,
        unavailable: isUnavailable(row),
      },
      // What a decision on this row is about. On the "dealt with" tab no
      // open report is shown, so a decision there deals with none.
      seen: {
        flags: { bugged: row.bugged, broken: row.broken, xpFarm: row.xpFarm },
        lastReport: state === 'open' ? row.last : null,
      } satisfies ReportsSeen,
    })),
    counts: { open: openCount.value, dismissed: dismissedCount.value },
    now: new Date(),
  }
}

/**
 * Decides on an experience's reports as the moderator saw them. The
 * experience is held while it is decided, and the decision is refused if its
 * flags have changed since: another moderator acted. Only the reports made
 * by the time the moderator looked are dealt with; one made or made again
 * since stays open, since nobody has seen it.
 */
async function decideReports(
  actor: Actor,
  slug: string,
  seen: ReportsSeen,
  now: Date,
  flags: HealthFlags | null,
): Promise<{ ok: true } | Refusal> {
  return db.transaction(async (tx) => {
    const [found] = await tx
      .select({
        id: experiences.id,
        bugged: experiences.bugged,
        broken: experiences.broken,
        xpFarm: experiences.xpFarm,
      })
      .from(experiences)
      .where(and(eq(experiences.slug, slug), isNull(experiences.deletedAt)))
      .for('update')
    if (!found) return refuse('not-found')
    if (
      found.bugged !== seen.flags.bugged ||
      found.broken !== seen.flags.broken ||
      found.xpFarm !== seen.flags.xpFarm
    ) {
      return refuse('invalid', { form: CHANGED_SINCE_OPENED })
    }
    if (flags) {
      await tx
        .update(experiences)
        .set(flags)
        .where(eq(experiences.id, found.id))
    }
    if (seen.lastReport) {
      await resolveSeen(tx, found.id, seen.lastReport, actor, now)
    }
    return { ok: true as const }
  })
}

/**
 * Marks the open reports on an experience made by `seenUntil` dealt with.
 * The time shown carries milliseconds, the database's more, so it compares
 * to the millisecond.
 */
const resolveSeen = (
  executor: Executor,
  experienceId: number,
  seenUntil: Date,
  actor: Actor,
  now: Date,
) =>
  executor
    .update(experienceReports)
    .set({ resolvedAt: now, resolvedBy: actor.id })
    .where(
      and(
        eq(experienceReports.experienceId, experienceId),
        isNull(experienceReports.resolvedAt),
        sql`date_trunc('milliseconds', ${experienceReports.createdAt}) <= ${seenUntil.toISOString()}::timestamptz`,
      ),
    )

/** Dismisses an experience's open reports: nothing needs changing. */
export async function dismissReports(
  actor: Actor | null,
  slug: string,
  seen: ReportsSeen,
  now = new Date(),
): Promise<{ ok: true } | Refusal> {
  const refused = needsStaff(actor)
  if (refused || !actor) return refused ?? refuse('signed-out')
  return decideReports(actor, slug, seen, now, null)
}

/**
 * Sets an experience's health flags as a moderator finds it, and so deals
 * with its open reports. Featured and trending are not health flags, and are
 * not set here.
 */
export async function setHealthFlags(
  actor: Actor | null,
  slug: string,
  flags: HealthFlags,
  seen: ReportsSeen,
  now = new Date(),
): Promise<{ ok: true } | Refusal> {
  const refused = needsStaff(actor)
  if (refused || !actor) return refused ?? refuse('signed-out')
  return decideReports(actor, slug, seen, now, flags)
}
