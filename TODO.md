# What is left to do

Written 2026-11-09. Each item comes from `PLAN.md` and was checked against the code
that day. `PLAN.md` stays the record of decisions and of what is built; this is the
list of what is not. Remove items here as they land, and keep `PLAN.md` in step.

The order below is the order to work in: settle what blocks building, then build.

## 1. Decisions needed

### Blocking work below

| Decision | What waits on it |
|---|---|
| The Battlefield 6 categories: whether Multiplayer, Co-op and Solo are right, and whether Style sits beside them | The Library's category tabs, the import's category mapping |
| Snippet size limit; 400 lines is a placeholder | Snippet submit, the column's own limit |
| Collaborators: whether a newly added account must accept before it is shown, and that ownership changes only through an admin | Inviting collaborators, the accept page |
| Who can delist: whether an owner can delist their own and list it again | The owner's delist button, drawn in the mockup |
| Withdrawing from review: whether an owner can pull something back to a draft | "Your submissions" actions |
| Playtesting something live: how the copy's changes reach the live page, whether the copy needs its own code, what discarding keeps | The playtest copy |
| What creates a playtest's Discord thread: a forum-channel webhook or a bot | Playtest announcements |
| Several requests at once (an edit and an update post in review together): what the "Your submissions" row shows | "Your submissions" once update posts exist |
| A live page with a health mark, and a request to clear it: how "Your submissions" shows them | Owner flags and clear requests |
| What a legacy "rejected" becomes at import: `changes_requested` or `removed` | The import |
| SDK release: whether an owner confirms a page still works on a newer release, and how a page shows one not confirmed | The "still works?" prompt |
| Flagging experiences no longer published: the page stays with a banner, listings hide it, a template with files stays listed. Proposed, not agreed | The nightly check's effect on listings |
| Who creates events and banners: moderators and admins. Not confirmed | The events and banners admin screen |
| Whether profiles are indexed; they carry `noindex` for now | The sitemap |

### Not blocking yet

- **Account email:** whether to require a real one, and what happens to accounts
  without one.
- **Artwork:** what EA's Fansite Agreement allows. The hero artwork waits on it.
- **EA's content policy:** three points for whoever holds the Fansite Agreement (the
  Patreon link, game art implying endorsement, trademarks in the domain).
- **What the mockups show beyond the schema** (the table at the end of "Visual
  direction" in `PLAN.md`): add it or take it off the screen, for each of the weekly
  showcase, a record of job runs, a moderation log, download counts, "Used in" on a
  snippet, follow, notifications, event slots, a custom maps count on home, popular
  search chips, and rule and line counts from the export.
- **`allow_editing`:** what the column means. The checkbox stays hidden until then.

### Only production can answer

- The permissions of the "Moderators" group.
- Whether any redirects exist in `wagtailredirects_redirect`.
- How the two home pages are mounted, and the address the 2042 home has today.
- Row counts, users without Discord or email, duplicate emails, pending revisions, and
  likes that differ between the two like tables.
- Who uses the public API.
- Which tags exist and how many experiences use each.
- How the validation job is scheduled.
- Which snippet (`script_main`) categories exist.

## 2. Build

### Writes for creators (step 5)

- **Update posts:** post, edit and delete on one's own published project; held for
  a moderator. Nothing of this is built; the feed and pages show seed data.
- **Playtests:** the form at `/playtests/new/`; starting one for a draft or for
  something with no page, rate-limited; the "Playtest" button that copies a live
  experience; closing one, and discarding the copy; results posted as an update.
- **Events:** the "Interested" button. The count is shown already.
- **Snippet drafts:** Save on the snippet form, as experiences have.
- **Collaborators:** the edit access switch on the form; the page where an account
  accepts, declines or leaves; collaborators editing, posting updates and starting
  playtests. Only owners can edit today.
- **Health marks:** the owner marking their own experience bugged or broken, and
  asking a moderator to clear a mark (`revisions.kind = 'clear_flags'`).
- **Moderator notes at their fields:** the review screen writes them to
  `review_field_notes`, and the reopened form shows each at its field. Today there is
  one note, shown at the top.
- **Editing something delisted,** and withdrawing an edit other than the template
  offer.
- **SDK "still works on 1.4.3.0?"** for owners after a release, once decided.
- **Discord webhooks:** the approval request on submit and edit, the announcement on
  first approval, and playtest posts with the Tester roles for their regions.
- **Smaller:** flag Portal's default description ("Experience description.") read from
  an export; link "Your submissions" from the profile and from a new snippet's form;
  its filters; the panel beside the submit forms with counts of what is waiting.

### Moderation and admin (step 6)

- **Screens not built:** the overview (what is waiting and for how long, reports,
  site health, recent decisions), update posts, playtests, events and banners, and
  settings (`need_login_to_view_profile`, the home page's Markdown block, the list of
  familiar picture hosts, now a constant in `src/server/services/moderation.ts`).
- **The review queue's other kinds:** update posts, playtest briefs and requests to
  clear a flag.
- **The review screen:** notes against fields; Remove as a third decision; what was
  asked for last time; the featured and trending switches.
- **The experience list:** filters by category and tag, and the full edit (owner,
  creators, report lists) that the mockup's "Edit" button opens.
- **Categories and tags:** merging tags into aliases, the `script_sub` kind, and
  marking tags newly arrived from Portal.
- **A count beside the header's Review link,** and a record of decisions.
- **Snippet authoring with `exp_json` validation** shown per field.

### Public pages (left over from step 3)

- **Library:** the SDK season filter and "current season only"; a date range filter;
  the featured listing and category pages with their descriptions and embed overrides,
  with "coming soon" for categories not ready. The site search finds experiences only;
  the plan has snippets too.
- **Experience page:** the share pop-up; the code's roll-in; an admin link for staff;
  `meta_title`, `meta_description` and `meta_image` overrides in the head; each map
  in a 2042 rotation marked with its era.
- **Home:** the weekly showcase and the popular search chips, once decided; hero
  artwork.
- **Updates:** one post's own page; grouping by day; "only projects I liked"; the
  projects with the most updates this month.
- **Events:** one event's page, and the countdown. "Live now" and the capacity are
  shown already.
- **Banners:** shown on every page when a banner says so. Only the home page shows
  one today.
- **Playtests:** filters by region, game and what it is built with; a row's picture,
  author and what it is built with.
- **Snippets:** the featured listing; the export download for snippets from the old
  site; "Used in", once decided.
- **Footer pages:** Privacy, Content rules, the cover image template and the API's
  description, none written yet; and the row of links to them.

### Accounts

- The account settings page, for `hide_username`, linked from the profile and the
  header's menu.
- A link to one's own profile in the header's menu.
- The profile's updates tab and its count of updates posted.
- The owner badge from `OWNERS`, which `src/server/env.ts` does not read yet.

### The import (step 4)

Not started. `tools/import/` does not exist.

- Restore the old schema into a `legacy` database: first the test legacy database
  generated from the old repository, later a production dump.
- Introspect it with Drizzle; transform and check each row with the site's Zod
  schemas; quarantine what fails (`import_quarantine`) and import it as delisted.
- Every row in the table under "Data migration": users with their Discord account
  links, experiences with their playground ids read from `exp_url`, pending
  submissions and edits, subcategories as Style tags, creators as accepted credits
  without edit access, tags with the 2022 spellings merged into aliases, likes from
  both tables, reports, categories with their SVG icons and `marks_template` on
  Prefab, snippets, and the site setting.
- The system owner at `/users/admin/` for experiences with no Discord user.
- Reset each id sequence to the highest imported id.
- Checks after each run: row counts, per-experience counts, and a crawl of the old
  sitemap expecting 200s.
- Spot-check the longest and most-viewed descriptions in the new Markdown renderer.
- At the rehearsal with production-sized data: the trending sort, the home page's
  fifteen or so queries and the experience page's ten, all uncached; loosen the
  service tests' exact counts against the seed.

### Edges (step 7)

Not started, but for the `/scripts/` redirects.

- **Public API:** `/api/experiences/` and `/api/users/` in the agreed shape, with
  five-minute cache headers; `/api/tags/` and `/api/categories/`.
- **Atom feeds:** `/updates/feed.xml`, and one per project.
- **`/sitemap.xml` and `/robots.txt`,** honoring `include_in_sitemap` and hidden
  names.
- **Redirects:** `/experiences/` and `/experiences/featured/` with their query
  parameters (`?tag=` above all), `/category/<name>/`, `/tutorials/`, the profile's
  `…/experiences/` and `…/liked/`, the 2042 home page, and any rows production has.
- **Scheduled jobs**, as CLI entry points in `jobs/`:
  - the nightly check of every code: `portal_state`, `xp_mode`,
    `requires_full_game`, the rotation and Portal's tags, with a second look before
    recording "missing";
  - the tag sync from gametools, adding new tags to "New from Portal", and the
    per-map paid-game list;
  - the latest SDK release from `versions.json`;
  - posting playtests and play-together reminders;
  - the Cloudflare purge of the autocomplete endpoints.
- **Integrations** with timeouts and a failure path: Discord webhooks and Cloudflare.

### Deployment and operations

- CI builds the image and publishes it to GHCR; a staging host runs it.
- Run the real container behind the tunnel with the production environment, cookie
  domain and Discord callback.
- Backups of the database, files included, and a restore that has been tried.
- Confirm the origin cannot be reached except through the tunnel, and that the tunnel
  sets `cf-connecting-ip`.
- Deferred: caching HTML at Cloudflare for requests with no session cookie.

### Tests

- Playwright flows: browse and filter, submit, approve and like, one with scripts
  off, none logging a hydration mismatch.
- Server-HTML tests: each indexed page's title, description, canonical address and
  main content, without running scripts.
- A build check that the admin's code stays out of the shared chunk.
- The moderation transitions not covered yet, as each is built.
- Check in a browser, signed in: the submit form while an upload or a send is out,
  the reports screen's Dismiss and flags, and an edit's files inside a new export.
  So far they have component and service tests only.

### Design

- **Mockups to draw:** the edit page; the review screen with notes against fields,
  Remove, and requesting changes on an edit or a playtest brief; a row with two
  requests at once; account settings; search results; one update post; one event;
  the admin screens for snippets, update posts, playtests, events and banners,
  categories and tags, users and roles, and settings; the error pages.
- **Mockups to bring in line:** the scripts list and script page still say Scripts
  and show the old export details.
- **Checks not made:** the submit form and the moderators' screens in a signed-in
  browser; the 2042 library and a single playtest in detail; widths between 390px and
  1440px, and above.
- **Hero and page head artwork,** once it is settled what the site may use.

### Seed data

- The four Battlefield 6 tag names that were guessed.
- Real 2042 experiences, once the import exists.

## 3. Cutover (step 8)

- Rehearse the import until a run is clean.
- Make the old site read-only, take a final dump, run the import, check, switch.
- Keep the old container and the dump for rolling back.

## Later, by choice

Out of scope for now, as `PLAN.md` says:

- Checking a project's files against an SDK release.
- Maps, Tools & Plugins, Guides & Docs and Forum, which stay placeholders.
- Follow and notifications.
- Moving old snippets' `exp_json` into `project_files`.
- Stars or the latest commit from GitHub on the repository link.
- The project stage label (work in progress, released, discontinued).
