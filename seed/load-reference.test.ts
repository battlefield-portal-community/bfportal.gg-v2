import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Actor } from '../src/server/auth/actor'
import { db, sql } from '../src/server/db'
import { categories, tagGroups, tags } from '../src/server/db/schema'
import {
  saveCategory,
  saveTag,
  saveTagGroup,
} from '../src/server/services/admin-taxonomy'
import { loadReference } from './load-reference'
import { seed } from './seed'

const NOW = new Date('2026-10-18T12:00:00Z')
const admin: Actor = { id: 'seed-gala', role: 'admin' }

const groupBySlug = async (slug: string) => {
  const [row] = await db
    .select()
    .from(tagGroups)
    .where(and(eq(tagGroups.game, 'bf6'), eq(tagGroups.slug, slug)))
  return row
}

describe('loading the reference rows again', () => {
  beforeAll(async () => {
    await seed(db, NOW)
  })

  afterAll(async () => {
    await sql.end()
  })

  // Every deploy loads them after migrating, so an admin's rename must not
  // stop it, nor be undone by it.
  it('keeps what an admin renamed, and adds nothing beside it', async () => {
    const rules = await groupBySlug('rules')
    const style = await groupBySlug('style')
    const [casual] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.groupId, style.id), eq(tags.slug, 'casual')))
    const [multiplayer] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.kind, 'experience_main'),
          eq(categories.slug, 'multiplayer'),
        ),
      )

    expect(
      await saveTagGroup(
        admin,
        { id: rules.id },
        {
          name: 'Gameplay rules',
          description: rules.description,
          filter: rules.filter,
          pick: rules.pick,
          creatorSelectable: rules.creatorSelectable,
          showOnCard: rules.showOnCard,
        },
      ),
    ).toEqual({ ok: true })
    expect(
      await saveTag(
        admin,
        { id: casual.id },
        { name: 'Laid back', visible: casual.visible, groupId: style.id },
      ),
    ).toEqual({ ok: true })
    expect(
      await saveCategory(
        admin,
        { id: multiplayer.id },
        {
          name: 'Versus',
          visible: multiplayer.visible,
          selectableOnForm: multiplayer.selectableOnForm,
          marksTemplate: multiplayer.marksTemplate,
        },
      ),
    ).toEqual({ ok: true })

    const counts = async () => ({
      groups: (await db.select().from(tagGroups)).length,
      tags: (await db.select().from(tags)).length,
      categories: (await db.select().from(categories)).length,
    })
    const before = await counts()

    await db.transaction((tx) => loadReference(tx))
    await db.transaction((tx) => loadReference(tx))

    expect(await counts()).toEqual(before)
    const renamed = await groupBySlug('rules')
    expect(renamed).toMatchObject({ id: rules.id, name: 'Gameplay rules' })
    // Portal's tags are still in the renamed group.
    const portalTags = await db
      .select()
      .from(tags)
      .where(eq(tags.groupId, rules.id))
    expect(portalTags.length).toBeGreaterThan(0)
    const [tag] = await db.select().from(tags).where(eq(tags.id, casual.id))
    expect(tag).toMatchObject({ name: 'Laid back', slug: 'casual' })
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, multiplayer.id))
    expect(category).toMatchObject({ name: 'Versus', slug: 'multiplayer' })
  })
})
