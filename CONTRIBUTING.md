# Contributing

Thanks for helping build the new bfportal.gg. This page says how to find something to
do and how to see it through. To get the site running, see the
[README](README.md); for how to write the code, see [AGENTS.md](AGENTS.md).

Questions go to the community [Discord](https://discord.bfportal.gg/).

## Where things are written

| What | Where |
|---|---|
| How the site works, and what was decided | [PLAN.md](PLAN.md) |
| What is left to do, and what is still to decide | The [issues](https://github.com/battlefield-portal-community/bfportal.gg-v2/issues) |
| How to write code here: words, components, rules, checks | [AGENTS.md](AGENTS.md) |
| What was done, and when | Git |

The issues are mirrored to the maintainers' Kaneo board both ways, so an issue opened,
labeled or closed here shows there too.

## Picking up work

1. **Find a card.** Each piece of work is an issue. Filter by label for an area:

   | Label | Covers |
   |---|---|
   | `public` | Pages anyone sees |
   | `writes` | Forms, and what they change |
   | `admin` | The moderators' and admins' screens |
   | `accounts` | Profiles, settings, the header menu |
   | `import` | Moving the old site's data across |
   | `edges` | The API, feeds, sitemap, redirects and scheduled jobs |
   | `ops` | Building, hosting and backups |
   | `tests` | Tests the suite is missing |
   | `design` | Mockups to draw, and pages to check against them |

   New here? Start with
   [`good first issue`](https://github.com/battlefield-portal-community/bfportal.gg-v2/labels/good%20first%20issue).
   `next` marks what matters most now. A card with sub-cards is a whole feature; take
   one sub-card at a time.
2. **Check it is not blocked.** Cards labeled `decision` are questions still to
   settle, and each says which cards it blocks. Leave a blocked card until its
   decision is closed. If you have a view on the question, say so on the decision's
   card.
3. **Claim it.** Comment on the issue before you start, so two people do not build
   the same thing. A card someone has claimed and not touched for two weeks is free
   again.
4. **Read before you build.** Each card names the part of `PLAN.md` it comes from.
   Read that, and `AGENTS.md`, which has the project's words (a "template", a
   "snippet", a "playtest") and its rules for components, writes and tests.

## Sending it

- **One card, one pull request,** that says `Closes #<number>`.
- **The four checks pass:** `pnpm lint:fix`, `pnpm typecheck`, `pnpm test` and
  `pnpm build`. CI runs them too.
- **Say what you checked,** and what you did not. For a page, add screenshots at a
  phone width and a desktop one.
- **Commit messages** follow the history: `feat(admin): …`, `fix(ui): …`, `docs: …`.
- **Write American English,** in code and in the site's text. `AGENTS.md` has the
  rest of how the site's text is written.

## Finding more work, or a question

- **More work found while building** becomes a new issue, not a note in the plan.
- **A question the plan does not answer** becomes an issue labeled `decision`, saying
  what it blocks. Once it is settled, the answer goes into `PLAN.md` and the issue is
  closed.

## The mockups

The pages are built from mockups that are not in this repository, since their artwork
is not ours to publish. Ask on Discord for a copy.
