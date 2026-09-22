# 0007 — Category flags come from the source, not the text

**Status:** accepted 2026-08.

## Context

`KIDS_RE` over a full description gets Moat Theatre exactly backwards: an adult stand-up blurb ("Between kids, marriage and…") matches, while the children's panto ("The Panto Legends Return!") does not.

## Decision

`CATEGORY_FLAGS` in `scrape-sources.js` maps a source's own tags onto the flags: `Music` → `is_music`, `Drama`/`Theatre` → `is_theatre`, `Family`/`Children`/`Kids` → `is_for_kids`, and so on. Plain strings and `{name}` objects are accepted; a trailing digit is stripped (Moat's `Drama 2`). When a source supplies categories they are trusted outright and `KIDS_RE` is not consulted. Sources without categories keep text matching.

Unmapped tags (`Comedy`, `Coming Soon`, `This Week`, `Christmas`, `Talks`) set nothing. Comedy is not theatre.
