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

   The [milestones](https://github.com/battlefield-portal-community/bfportal.gg-v2/milestones)
   group the same cards by stage; see "The milestones" below. New here? Start with a
   [`good first issue`](https://github.com/battlefield-portal-community/bfportal.gg-v2/labels/good%20first%20issue)
   in milestones 1 to 7. `next` marks what matters most now. A card with sub-cards is
   a whole feature; take one sub-card at a time.
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

## The milestones

The new site replaces the old one when it does what the old one does. Milestones 1
to 7 hold that work. Milestone 8, "After cutover", holds what the old site has
nothing like: update posts, playtests, events, collaborators with edit access, and
the rest. It is built once the site has switched over. Work in 1 to 7 first.

The numbers are an order of priority, not a chain. Only the cutover waits for the
others. Everywhere else, a card waits only on the particular cards it names, most
often a decision.

| Milestone | Waits on | Free to start now |
|---|---|---|
| 1 Decisions | Nothing | All of it. Each card says what it blocks |
| 2 Writes | #32 on #98; #59 on #104 | The Discord posts (#23, #62), the cover template link (#116) |
| 3 Moderation and admin | Clearing a flag in the queue (#18) on owners asking for it (#59) | Settings, the full edit, tags and aliases, snippet `exp_json`, the record of decisions, the tests |
| 4 Public pages and accounts | Category pages (#72) on #57; the server-HTML tests (#49) on #109 | The rest, and most of the good first issues |
| 5 Import | #57 and #105; the production-sized rehearsal (#36) also on a staging host (#43) and a production dump (#96) | Restoring the test legacy database, reading and checking rows, quarantine |
| 6 Edges and operations | The sitemap (#40) on #109; the nightly code check (#41) on #107; who calls the API (#38) on #96 | The image, a staging host and backups (#43); the API (#37); the redirects; the other jobs |
| 7 Cutover | All of 1 to 6 | Nothing |

So three tracks can run side by side, each by different people:

1. **Decisions.** Settle #57 and #105 first: together they unblock the import.
2. **The import and operations** (5 and 6), the longest road to the switch: the
   import is where migration problems show up, and its rehearsal needs a staging
   host.
3. **The site itself** (2, 3 and 4), where most of the smaller cards and the good
   first issues are.

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
