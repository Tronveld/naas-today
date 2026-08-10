# Approved mocks

## `2026-08-10__the-answer__approved`

**Status: approved.** This is the comp the owner picked for the 2026-08-10
homepage redesign, and it is the composition contract the build was held to.
The matching direction contract lives in the `<body>` of
`src/layouts/BaseLayout.astro` and survives the production build.

- `.html` — the comp source. Renders four mobile panels (empty Monday, six-event
  Saturday, one-event Tuesday, three-event Friday) plus desktop, from real
  Supabase data pulled on 2026-08-10.
- `.png` — the render the owner actually approved.

### How it was chosen

Two full direction rounds were dealt through Impeccable's browser decision page
and both were re-rolled, so eight worlds are burned and should not be re-offered:

| Seed | Assigned | Challengers dealt |
|---|---|---|
| `0baf9f88` | The Discovery Sheet (OSi 1:50,000 map) | Midnight Phosphor, Attract Screen, Iridescent Edge |
| `92b5df03` | The Street Plate (bilingual enamel nameplate) | The Coupon Book, Information Noise, Alphabet Storm |

The owner's steer after the second re-roll is the reason none of them shipped,
and it is the most important thing in this directory:

> To avoid: the "on now" approach, turning the website into a weekly-view rather
> than a day-view. To keep: that clear, simple, visual design in The Answer that
> has nevertheless a Web 2.0 feel to it with that white on dark green and the
> choice of font. I'm not fully convinced about using the whole first part of the
> webpage to say how many events there are today, but I do like the simplicity of
> it. What happens to the event card data? There isn't much space for it, and I
> wonder if we're losing people if they have to click on an event title to see
> the description.

Plus, on all eight: they were **costumes** (period pastiche), none of them **made
the list better** (the structure had to change, not the skin), and the **register
was wrong** — too clever for a town noticeboard checked on a bus.

So the round that produced this comp was not a fourth roll. It was three
*structures* rendered as real pages — the answer-first band, a day split at
"now", and a week view — of which the second and third are explicitly rejected
above. Do not revive them.

### Known divergences, decided

- **Cards are taller here than in the comp.** The comp did not model the Share
  control or the source-domain link, and the venue carries a 44px touch floor.
  Venue and source were merged onto one row and Share was demoted to a text link
  to close the gap.
- **Long descriptions still clamp at 220 characters** with a "Read more" toggle,
  which the comp does not show. Kept deliberately: one scraped description runs
  past 1,500 characters, and letting it render in full pushes the rest of a
  six-event Saturday off the screen. The owner's stated concern was descriptions
  hidden behind a tap on the *title* — three lines are visible without any tap,
  which meets it.
