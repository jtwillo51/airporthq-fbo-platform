# Public data sources to wire into the Ridgeline Aviation site

The instinct behind this — pull from live public sources instead of hand-maintained content — is the same fix as the fuel-price problem, applied everywhere it's applicable. Anything below that's sourced from a public feed can't go stale the way the March 2024 fuel prices did, because nobody has to remember to update it.

**What stays manual, deliberately:** fuel pricing itself. That's private business data (their pricing, their margin) — no public API has it, and it shouldn't come from one. That's what the AirportHQ upload flow is for. Everything below is publicly available aviation data that's safe and useful to pull in live.

## Live weather (METAR/TAF) for KXRG

**Source:** NOAA's Aviation Weather Center Data API — free, no key required, official government source. Docs: [aviationweather.gov/data/api](https://aviationweather.gov/data/api/).

Example pattern (verify exact query params against the current docs before building — I confirmed the API exists and is live, but didn't pull the full parameter reference):

```
https://aviationweather.gov/api/data/metar?ids=KXRG&format=json
https://aviationweather.gov/api/data/taf?ids=KXRG&format=json
```

Use on the Airport Info / Flight Planning page: current conditions (wind, visibility, ceiling) rendered from this feed, refreshed on page load or via a short cache (5–10 min) rather than typed in by hand. This is a small, genuinely useful feature for transient pilots checking conditions before a fuel stop.

## Airport / runway / frequency data

**Source:** AviationAPI — free public API covering airport info, runways, and frequencies. Docs: [docs.aviationapi.com](https://docs.aviationapi.com/).

Likely pattern (confirm against current docs before building — same caveat as above):

```
https://api.aviationapi.com/v1/airports?apt=KXRG
```

Use for the static-ish facts (runway length/surface, field elevation, CTAF/Unicom frequency, lighting) so that if any of it changes, it updates from the source of record instead of a developer needing to edit copy on the site.

## Keep linking to, don't try to rebuild

The current site already does this reasonably well — worth keeping, not replacing:

- [FlightAware](https://www.flightaware.com) — flight tracking, their own FBO listing (worth confirming it's current, per the earlier fuel-price finding)
- [AirNav](http://www.airnav.com) — the de facto pilot reference for airport/FBO data
- [LiveATC](https://www.liveatc.org) — live ATC audio where available
- [GlobalAir's fuel map](https://www.globalair.com/airport/fuelmap.aspx) — useful for the competitor-price comparison mentioned in the Plan 2 dashboard concept

Don't try to replicate flight tracking or ATC audio in-house — link out. The site's job is to be the fast, accurate front door (fuel price, hours, "call us"), not to compete with tools pilots already trust and have open.

## Sources consulted

- [aviationweather.gov Data API](https://aviationweather.gov/data/api/)
- [AviationAPI Documentation](https://docs.aviationapi.com/)
