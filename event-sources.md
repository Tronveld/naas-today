# Event sources

Input for `scripts/scrape-sources.js`. Any line starting with `http` is treated as
a source URL; everything else is ignored, so headings and notes are safe to add.

Keep URLs bare — no `?` query strings. Tracking parameters (`aff=`, `_gl=`) add
nothing for the scraper and can carry personal analytics identifiers.

Individual event pages are scraped via JSON-LD; listing pages use
`parseListingPage`. Past events are skipped automatically, so stale entries are
harmless — but prune them when convenient.

## Eventbrite (individual events)

https://www.eventbrite.ie/e/festa-de-pascoa-brasileira-tickets-1985003223075
https://www.eventbrite.com/e/pure-gas-comedy-club-tickets-1984557566103
https://www.eventbrite.ie/e/gpconsult-live-educational-study-day-2026-tickets-1982510510304
https://www.eventbrite.ie/e/fashion-on-a-human-level-tickets-1984187790093
https://www.eventbrite.com/e/jetset-meet-mixer-naas-tickets-1984672514918
https://www.eventbrite.com/e/the-highstool-prophets-live-in-concert-at-lawlors-hotel-naas-tickets-1979974180072
https://www.eventbrite.ie/e/the-good-the-bad-and-the-business-tickets-1985064269667
https://www.eventbrite.ie/e/irbeas-25th-national-bioenergy-conference-solid-biomass-tickets-1983876147963
https://www.eventbrite.ie/e/avcon-racetrack-day-afterburner-networking-event-tickets-1979759502967

## AllEvents.in (individual events)

https://allevents.in/kildare/japfest-2026/200029678528446
https://allevents.in/kildare/red-bull-drift-masters-2026%E3%83%BBround-3%E3%83%BBireland/200029327388943
https://allevents.in/kildare/bimmerfest-26-mondello-park-bank-holiday-monday-3rd-august-irelands-largest-event-for-bmw-and-mini/200029504217934
https://allevents.in/kildare/mondello-action-day-bank-holiday-monday-1st-june/200029504218843
https://allevents.in/kildare/idhba-kildare-branch-show/200029612415504
https://allevents.in/kildare/nuffield-ireland-2026-agri-summit/200029804000742
https://allevents.in/kildare/retrostock-2026/200029422025928
https://allevents.in/kildare/bathrooms4u-naas-showroom-open-day/200029788923219
https://allevents.in/kildare/pete-kavanagh-and-band/200029627555632
https://allevents.in/kildare/irbeas-25th-national-bioenergy-conference-solid-biomass/200029744365300
https://allevents.in/kildare/discovery-playtime-easter-camp/200029638946523
https://allevents.in/kildare/ice-expo/200029744364857
https://allevents.in/kildare/kwwspca-easter-egg-hunt-and-dog-walk/200029696289757
https://allevents.in/kildare/quid-games-fundraising-event/200029596671728
https://allevents.in/kildare/unbeatable-coaching-workshop-2/200029696290804
https://allevents.in/kildare/drive-out-and-grease-movie-experience/200029596674644

## Listing pages

https://whatsontonight.ie/events/Kildare/Naas
https://intokildare.ie/event/read-in-company-naas-march-edition/
https://www.moattheatre.com/shows
