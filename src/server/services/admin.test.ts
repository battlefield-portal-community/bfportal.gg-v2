import { and, asc, eq, isNotNull, isNull, ne } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { seed } from '../../../seed/seed'
import { CHANGED_SINCE_OPENED } from '../../shared/decision'
import type { ReportsSeen } from '../../shared/reports-seen'
import type { Actor } from '../auth/actor'
import { db, sql } from '../db'
import {
  categories,
  experienceReports,
  experiences,
  tagGroups,
  tags,
  user,
} from '../db/schema'
import {
  listAdminExperiences,
  listAdminSnippets,
  setListed,
  setSpotlight,
} from './admin-content'
import { dismissReports, listReports, setHealthFlags } from './admin-reports'
import {
  type CategoryChange,
  getTaxonomy,
  moveInList,
  saveCategory,
  saveTag,
  saveTagGroup,
  type TagChange,
  type TagGroupChange,
} from './admin-taxonomy'
import { listUsers, setRole } from './admin-users'
import { getExperience } from './experience'
import { getAdminMenu } from './moderation'
import { reportExperience } from './reports'

const NOW = new Date('2026-10-18T12:00:00Z')
const moderator: Actor = { id: 'seed-kestrel', role: 'moderator' }
const admin: Actor = { id: 'seed-gala', role: 'admin' }
const someone: Actor = { id: 'seed-recruit-05', role: 'user' }
const REPORTED = 'spearhead-extraction'

const reportsOn = async (slug: string) =>
  db
    .select({
      type: experienceReports.type,
      resolvedAt: experienceReports.resolvedAt,
    })
    .from(experienceReports)
    .innerJoin(experiences, eq(experiences.id, experienceReports.experienceId))
    .where(eq(experiences.slug, slug))

const nothingSeen: ReportsSeen = {
  flags: { bugged: false, broken: false, xpFarm: false },
  lastReport: null,
}

/** What the open reports list shows a moderator of an experience. */
const seenOn = async (slug: string) => {
  const list = await listReports(moderator)
  const row = list.ok ? list.items.find((item) => item.slug === slug) : null
  if (!row) throw new Error(`expected ${slug} in the open reports`)
  return row.seen
}

describe('the admin', () => {
  beforeAll(async () => {
    await seed(db, NOW)
    await db.update(user).set({ role: 'admin' }).where(eq(user.id, admin.id))
  })

  afterAll(async () => {
    await sql.end()
  })

  it('is for staff, and parts of it for admins alone', async () => {
    for (const [actor, reason] of [
      [null, 'signed-out'],
      [someone, 'forbidden'],
    ] as const) {
      expect(await getAdminMenu(actor)).toEqual({ ok: false, reason })
      expect(await listReports(actor)).toEqual({ ok: false, reason })
      expect(await dismissReports(actor, REPORTED, nothingSeen, NOW)).toEqual({
        ok: false,
        reason,
      })
      expect(
        await setHealthFlags(
          actor,
          REPORTED,
          { bugged: true, broken: false, xpFarm: false },
          nothingSeen,
          NOW,
        ),
      ).toEqual({ ok: false, reason })
      expect(await listAdminExperiences(actor)).toEqual({ ok: false, reason })
      expect(await listAdminSnippets(actor)).toEqual({ ok: false, reason })
      expect(await setListed(actor, 'experience', REPORTED, false)).toEqual({
        ok: false,
        reason,
      })
    }
    // Moderators may not.
    for (const actor of [null, someone, moderator]) {
      const reason = actor ? 'forbidden' : 'signed-out'
      expect(
        await setSpotlight(actor, 'experience', REPORTED, { featured: true }),
      ).toEqual({ ok: false, reason })
      expect(await listUsers(actor)).toEqual({ ok: false, reason })
      expect(await setRole(actor, someone.id, 'moderator')).toEqual({
        ok: false,
        reason,
      })
      expect(await getTaxonomy(actor, 'bf6')).toEqual({ ok: false, reason })
      expect(
        await saveCategory(
          actor,
          { kind: 'experience_main', game: 'bf6' },
          {
            name: 'Not theirs',
            visible: true,
            selectableOnForm: true,
            marksTemplate: false,
          },
        ),
      ).toEqual({ ok: false, reason })
      expect(await moveInList(actor, 'category', 1, 'up')).toEqual({
        ok: false,
        reason,
      })
    }
  })

  it('counts what waits and what is reported, for the menu', async () => {
    const menu = await getAdminMenu(moderator)
    if (!menu.ok) throw new Error('expected the menu')
    expect(menu.role).toBe('moderator')
    expect(menu.counts.waiting).toBeGreaterThan(0)
    expect(menu.counts.reports).toBe(2)
  })

  it('lists reports by experience, and deals with them by flags or by dismissing', async () => {
    const open = await listReports(moderator)
    if (!open.ok) throw new Error('expected the reports')
    expect(open.items[0]).toMatchObject({
      slug: REPORTED,
      reports: { bugged: 9, broken: 1, xp_farm: 0 },
    })
    expect(open.counts).toEqual({ open: 2, dismissed: 0 })
    const onlyBroken = await listReports(moderator, { kind: 'broken' })
    expect(onlyBroken.ok && onlyBroken.items.map((row) => row.slug)).toEqual(
      expect.arrayContaining([REPORTED, 'rooftop-gun-game']),
    )

    // Setting the flags deals with its reports.
    expect(
      await setHealthFlags(
        moderator,
        REPORTED,
        { bugged: true, broken: false, xpFarm: false },
        await seenOn(REPORTED),
        NOW,
      ),
    ).toEqual({ ok: true })
    const [row] = await db
      .select({ bugged: experiences.bugged })
      .from(experiences)
      .where(eq(experiences.slug, REPORTED))
    expect(row.bugged).toBe(true)
    expect(
      (await reportsOn(REPORTED)).every((report) => report.resolvedAt),
    ).toBe(true)

    // Dismissing deals with them as well, and they move to the other tab.
    expect(
      await dismissReports(
        moderator,
        'rooftop-gun-game',
        await seenOn('rooftop-gun-game'),
        NOW,
      ),
    ).toEqual({ ok: true })
    const after = await listReports(moderator)
    expect(after.ok && after.counts).toEqual({ open: 0, dismissed: 2 })
    const dismissed = await listReports(moderator, { state: 'dismissed' })
    expect(dismissed.ok && dismissed.items).toHaveLength(2)
  })

  it('opens a report again when it is made again', async () => {
    const [reporter] = await db
      .select({ userId: experienceReports.userId })
      .from(experienceReports)
      .innerJoin(
        experiences,
        eq(experiences.id, experienceReports.experienceId),
      )
      .where(
        and(
          eq(experiences.slug, 'rooftop-gun-game'),
          eq(experienceReports.type, 'broken'),
        ),
      )
      .limit(1)
    const player: Actor = { id: reporter.userId, role: 'user' }
    // Dealt with, so the page offers it again.
    expect(
      (await getExperience('rooftop-gun-game', NOW, player))?.viewer.reported,
    ).toEqual([])
    expect(
      await reportExperience(player, 'rooftop-gun-game', 'broken'),
    ).toEqual({ ok: true })
    const open = await db
      .select({ type: experienceReports.type })
      .from(experienceReports)
      .innerJoin(
        experiences,
        eq(experiences.id, experienceReports.experienceId),
      )
      .where(
        and(
          eq(experiences.slug, 'rooftop-gun-game'),
          isNull(experienceReports.resolvedAt),
        ),
      )
    expect(open).toEqual([{ type: 'broken' }])
  })

  it('refuses a decision on reports another moderator has since acted on', async () => {
    const [target] = await db
      .select({ slug: experiences.slug, ownerId: experiences.ownerId })
      .from(experiences)
      .where(
        and(
          eq(experiences.status, 'published'),
          isNull(experiences.deletedAt),
          eq(experiences.bugged, false),
          eq(experiences.broken, false),
          eq(experiences.xpFarm, false),
          ne(experiences.ownerId, 'seed-recruit-11'),
          ne(experiences.ownerId, 'seed-recruit-12'),
        ),
      )
      .limit(1)
    const { slug } = target
    const first: Actor = { id: 'seed-recruit-11', role: 'user' }
    const second: Actor = { id: 'seed-recruit-12', role: 'user' }
    const aMoment = () => new Promise((resolve) => setTimeout(resolve, 5))
    const flagsOf = async () =>
      (
        await db
          .select({
            bugged: experiences.bugged,
            broken: experiences.broken,
            xpFarm: experiences.xpFarm,
          })
          .from(experiences)
          .where(eq(experiences.slug, slug))
      )[0]
    const openKinds = async () =>
      (await reportsOn(slug))
        .filter((report) => !report.resolvedAt)
        .map((report) => report.type)
        .sort()

    expect(await reportExperience(first, slug, 'bugged')).toEqual({ ok: true })
    // One moderator opens the reports and is slow to decide.
    const seenFirst = await seenOn(slug)
    // Meanwhile another marks it broken, and a player reports an XP farm.
    expect(
      await setHealthFlags(
        admin,
        slug,
        { bugged: false, broken: true, xpFarm: false },
        await seenOn(slug),
        NOW,
      ),
    ).toEqual({ ok: true })
    await aMoment()
    expect(await reportExperience(second, slug, 'xp_farm')).toEqual({
      ok: true,
    })

    // What the first decides from the page as they saw it is refused.
    const stale = {
      ok: false,
      reason: 'invalid',
      errors: { form: CHANGED_SINCE_OPENED },
    }
    expect(
      await setHealthFlags(
        moderator,
        slug,
        { bugged: true, broken: false, xpFarm: false },
        seenFirst,
        NOW,
      ),
    ).toEqual(stale)
    expect(await dismissReports(moderator, slug, seenFirst, NOW)).toEqual(stale)
    expect(await flagsOf()).toEqual({
      bugged: false,
      broken: true,
      xpFarm: false,
    })
    expect(await openKinds()).toEqual(['xp_farm'])

    // Loaded again, it shows what changed. A report made again after that
    // has not been seen, and stays open when the rest are dismissed.
    const seenAgain = await seenOn(slug)
    expect(seenAgain.flags.broken).toBe(true)
    await aMoment()
    expect(await reportExperience(first, slug, 'bugged')).toEqual({ ok: true })
    expect(await dismissReports(moderator, slug, seenAgain, NOW)).toEqual({
      ok: true,
    })
    expect(await openKinds()).toEqual(['bugged'])
  })

  it('lists experiences in every state but draft, and delists and lists them again', async () => {
    const all = await listAdminExperiences(moderator)
    if (!all.ok) throw new Error('expected the list')
    expect(all.items.some((item) => (item.status as string) === 'draft')).toBe(
      false,
    )
    expect(all.counts.all).toBe(
      all.counts.pending +
        all.counts.changes_requested +
        all.counts.published +
        all.counts.unpublished +
        all.counts.removed,
    )
    const found = await listAdminExperiences(moderator, { q: '12qx8' })
    expect(found.ok && found.items.map((item) => item.slug)).toEqual([
      'capture-the-flag-siege-of-cairo',
    ])
    const flagged = await listAdminExperiences(moderator, { flag: 'bugged' })
    expect(flagged.ok && flagged.items.every((item) => item.flags.bugged)).toBe(
      true,
    )

    expect(await setListed(moderator, 'experience', REPORTED, false)).toEqual({
      ok: true,
    })
    expect(await getExperience(REPORTED, NOW)).toBeNull()
    // Only something delisted is listed again; only something live delisted.
    expect(await setListed(moderator, 'experience', REPORTED, false)).toEqual({
      ok: false,
      reason: 'not-found',
    })
    expect(await setListed(moderator, 'experience', REPORTED, true)).toEqual({
      ok: true,
    })
    expect(await getExperience(REPORTED, NOW)).not.toBeNull()
  })

  it('lets an admin feature an experience or a snippet', async () => {
    expect(
      await setSpotlight(admin, 'experience', REPORTED, {
        featured: true,
        trending: true,
      }),
    ).toEqual({ ok: true })
    const listed = await listAdminExperiences(admin, { featured: true })
    expect(
      listed.ok && listed.items.find((item) => item.slug === REPORTED),
    ).toMatchObject({ featured: true, trending: true })
    expect(
      await setSpotlight(admin, 'snippet', 'ai-wave-spawner', {
        featured: true,
      }),
    ).toEqual({ ok: true })
    const snippetList = await listAdminSnippets(moderator, { q: 'wave' })
    expect(snippetList.ok && snippetList.items[0]).toMatchObject({
      slug: 'ai-wave-spawner',
      featured: true,
    })
  })

  it('lets an admin change anyone’s role but their own, and never leaves the site with none', async () => {
    const people = await listUsers(admin, { q: 'recruit' })
    if (!people.ok) throw new Error('expected the list')
    expect(people.items.length).toBeGreaterThan(0)
    // What each has made is their own.
    const made = await db
      .select({ ownerId: experiences.ownerId })
      .from(experiences)
      .where(
        and(isNull(experiences.deletedAt), ne(experiences.status, 'draft')),
      )
    for (const person of people.items) {
      expect(person.made).toBe(
        made.filter((row) => row.ownerId === person.id).length,
      )
    }

    expect(await setRole(admin, someone.id, 'moderator')).toEqual({ ok: true })
    const [row] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, someone.id))
    expect(row.role).toBe('moderator')
    expect(await setRole(admin, admin.id, 'user')).toMatchObject({
      ok: false,
      errors: { form: expect.any(String) },
    })

    // Another admin cannot take the last admin's role away.
    const second: Actor = { id: 'seed-vantage', role: 'admin' }
    await db.update(user).set({ role: 'admin' }).where(eq(user.id, second.id))
    expect(await setRole(second, admin.id, 'user')).toEqual({ ok: true })
    expect(await setRole(admin, second.id, 'user')).toMatchObject({
      ok: false,
      errors: { form: expect.stringContaining('needs an admin') },
    })
  })

  it('changes only what an admin may change, whatever else is sent', async () => {
    const [category] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.kind, 'experience_main'),
          eq(categories.slug, 'multiplayer'),
        ),
      )
    const [group] = await db
      .select()
      .from(tagGroups)
      .where(and(eq(tagGroups.game, 'bf6'), eq(tagGroups.slug, 'rules')))
    const [tag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.groupId, group.id), isNotNull(tags.portalId)))
      .limit(1)
    // What a request may carry besides: the fields that make a new row.
    const extra = {
      kind: 'script_main',
      game: 'bf2042',
      slug: 'taken-over',
      portalId: 'not-portals',
      sortOrder: 99,
    }

    expect(
      await saveCategory(admin, { id: category.id }, {
        name: 'Versus',
        visible: category.visible,
        selectableOnForm: category.selectableOnForm,
        marksTemplate: category.marksTemplate,
        ...extra,
      } as CategoryChange),
    ).toEqual({ ok: true })
    expect(
      await saveTagGroup(admin, { id: group.id }, {
        name: 'Gameplay rules',
        description: group.description,
        filter: group.filter,
        pick: group.pick,
        creatorSelectable: group.creatorSelectable,
        showOnCard: group.showOnCard,
        ...extra,
      } as TagGroupChange),
    ).toEqual({ ok: true })
    expect(
      await saveTag(admin, { id: tag.id }, {
        name: 'Renamed',
        visible: tag.visible,
        groupId: tag.groupId,
        ...extra,
      } as TagChange),
    ).toEqual({ ok: true })

    const [categoryNow] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, category.id))
    expect(categoryNow).toEqual({ ...category, name: 'Versus' })
    const [groupNow] = await db
      .select()
      .from(tagGroups)
      .where(eq(tagGroups.id, group.id))
    expect(groupNow).toEqual({ ...group, name: 'Gameplay rules' })
    const [tagNow] = await db.select().from(tags).where(eq(tags.id, tag.id))
    expect(tagNow).toEqual({ ...tag, name: 'Renamed' })

    // Back as they were, for the tests after this one.
    await saveCategory(admin, { id: category.id }, category)
    await saveTagGroup(admin, { id: group.id }, group)
    await saveTag(admin, { id: tag.id }, tag)
  })

  it('lets an admin add, change and order categories, tag groups and tags', async () => {
    expect(
      await saveCategory(
        admin,
        { kind: 'experience_main', game: 'bf6' },
        {
          name: 'Racing',
          visible: true,
          selectableOnForm: true,
          marksTemplate: false,
        },
      ),
    ).toEqual({ ok: true })
    expect(
      await saveCategory(
        admin,
        { kind: 'experience_main', game: 'bf6' },
        {
          name: 'Racing',
          visible: true,
          selectableOnForm: true,
          marksTemplate: false,
        },
      ),
    ).toMatchObject({ ok: false, errors: { name: expect.any(String) } })
    const taxonomy = await getTaxonomy(admin, 'bf6')
    if (!taxonomy.ok) throw new Error('expected the taxonomy')
    const racing = taxonomy.experienceCategories.find(
      (row) => row.name === 'Racing',
    )
    if (!racing) throw new Error('expected the new category')
    expect(racing).toMatchObject({ slug: 'racing', used: 0 })
    // Each counts its own experiences.
    const counted = await db
      .select({ categoryId: experiences.categoryId })
      .from(experiences)
      .where(and(eq(experiences.game, 'bf6'), isNull(experiences.deletedAt)))
    for (const category of taxonomy.experienceCategories.filter(
      (row) => row.game === 'bf6',
    )) {
      expect(category.used).toBe(
        counted.filter((row) => row.categoryId === category.id).length,
      )
    }
    expect(taxonomy.snippetCategories.length).toBeGreaterThan(0)

    // Renamed, its address stays.
    await saveCategory(
      admin,
      { id: racing.id },
      {
        name: 'Racing and driving',
        visible: false,
        selectableOnForm: false,
        marksTemplate: false,
      },
    )
    const [renamed] = await db
      .select({ slug: categories.slug, visible: categories.visible })
      .from(categories)
      .where(eq(categories.id, racing.id))
    expect(renamed).toEqual({ slug: 'racing', visible: false })

    // Moved up one place in its list.
    const order = async () =>
      (
        await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.kind, 'experience_main'))
          .orderBy(asc(categories.sortOrder), asc(categories.id))
      ).map((row) => row.id)
    const before = await order()
    expect(before.at(-1)).toBe(racing.id)
    expect(await moveInList(admin, 'category', racing.id, 'up')).toEqual({
      ok: true,
    })
    const after = await order()
    expect(after.at(-2)).toBe(racing.id)

    // Moved within the list one game shows, past another game's category.
    const add = (name: string, game: 'bf6' | 'bf2042') =>
      saveCategory(
        admin,
        { kind: 'experience_main', game },
        {
          name,
          visible: true,
          selectableOnForm: true,
          marksTemplate: false,
        },
      )
    await add('Old guard', 'bf2042')
    await add('Parkour', 'bf6')
    const shown = async () => {
      const taxonomy = await getTaxonomy(admin, 'bf6')
      return taxonomy.ok
        ? taxonomy.experienceCategories.map((row) => row.name)
        : []
    }
    const was = await shown()
    expect(was.at(-1)).toBe('Parkour')
    const [parkour] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, 'Parkour'))
    await moveInList(admin, 'category', parkour.id, 'up', 'bf6')
    expect(await shown()).toEqual([...was.slice(0, -2), 'Parkour', was.at(-2)])

    // A group, and a tag in it. A tag goes only in its own game's groups.
    expect(
      await saveTagGroup(
        admin,
        { game: 'bf6' },
        {
          name: 'Pace',
          description: 'How fast it plays.',
          filter: 'own',
          pick: 'one',
          creatorSelectable: true,
          showOnCard: false,
        },
      ),
    ).toEqual({ ok: true })
    const [pace] = await db
      .select({ id: tagGroups.id })
      .from(tagGroups)
      .where(and(eq(tagGroups.game, 'bf6'), eq(tagGroups.name, 'Pace')))
    expect(
      await saveTag(
        admin,
        { game: 'bf6' },
        { name: 'Slow burn', visible: true, groupId: pace.id },
      ),
    ).toEqual({ ok: true })
    expect(
      await saveTag(
        admin,
        { game: 'bf2042' },
        { name: 'Slow burn', visible: true, groupId: pace.id },
      ),
    ).toMatchObject({ ok: false, errors: { groupId: expect.any(String) } })
    const [slowBurn] = await db
      .select({ slug: tags.slug, game: tags.game })
      .from(tags)
      .where(eq(tags.name, 'Slow burn'))
    expect(slowBurn).toEqual({ slug: 'slow-burn', game: 'bf6' })
  })
})
