# Type scale — Dock Posted + On This Water

Last rewrite: 1 September 2026.

Do not change the faces. Lock the sizes. The words got warmer; the type should get quieter and more even.

## Faces

| Role | Live site | Print / PDF | Why |
|---|---|---|---|
| Display / home line / dock name | **Newsreader** (`font-heading`) | Libre Baskerville | A newspaper face. Already on both sites. |
| UI / body / nav / buttons | **Geist** (`font-sans`) | Inter | Clean, not startup-cute. Already the body. |
| Pump numbers / hours / scores | **Geist Mono** (`font-mono`) | Inter Medium, tabular | A price is a figure, not a slogan. |
| Wordmark | Newsreader + waterline SVG | Same | Never set the wordmark in Geist. Never all-caps. |

Both sites already load the same three Google faces via `next/font`. Keep them. Do not add a fourth.

Print stand-ins exist only because Newsreader and Geist are not in the booklet sandbox. When a printer asks, send Newsreader + Geist. Baskerville / Inter are the closest licensed pair we already used in the pamphlets.

## The scale

Sizes are the thing a thumb hits at 6 a.m. on a phone, then the same hierarchy on a letter page.

| Token | Role | Screen | Print | Face | Weight | Tracking | Leading | Example |
|---|---|---|---|---|---|---|---|---|
| `kicker` | Eyebrow | 11px | 8 pt | Geist | 600 | 0.20em | 1 | MARINA FUEL |
| `nav` | Header links | 13px → 14px | 9 pt | Geist | 400 | 0 | 1 | Today |
| `wordmark` | Site title in the bar | 18px | 14 pt | Newsreader | 400 | −0.01em | 1 | Dock Posted |
| `geo-lockup` | Sabine line next to wordmark | 10px | 7 pt | Geist | 500 | 0.22em | 1 | SABINE TO KEY WEST |
| `home` | Landing headline | 48px → **72px** | 36–42 pt | Newsreader | 400 | 0 | **1.05** | What they wrote on the pump. |
| `page` | Interior page title | 32–40px | 22–28 pt | Newsreader | 400 | 0 | 1.1 | This morning on Galveston |
| `section` | Card / water name | 18–20px | 13–14 pt | Newsreader | 400 | 0 | 1.15 | Marina Bay Harbor |
| `deck` | Sentence under the home line | 16–18px | 11–12 pt | Geist | 400 | 0 | 1.75 | Diesel and gas from the dock. |
| `body` | Running copy | 15–16px | 10.5 pt | Geist | 400 | 0 | 1.6 | We don’t sell fuel. |
| `button` | Primary / ghost CTA | 14px | 9.5 pt | Geist | 500 | 0 | 1 · tap 48px | See today’s docks |
| `price` | Dollars on the hose | **22–24px** | 16–18 pt | Geist Mono | 500 | 0 | 1 | $4.89 |
| `price-sm` | Card quote (current live) | 15px | 11 pt | Geist Mono | 500 | 0 | 1 | $4.89 |
| `blank` | No price up | 15px | 11 pt | Geist Mono | 500 | 0 | 1 | No price up |
| `meta` | City, date, source | 12–13px | 8–8.5 pt | Geist | 400 | 0.01em | 1.4 | Seabrook, TX |
| `caption` | Fine print / footer | 11–12px | 8 pt | Geist | 400 | 0.02em | 1.35 | Six docks wrote a number this week. |
| `score` | 1–10 on This Water | 28–36px | 20–24 pt | Geist Mono | 500 | 0 | 1 | 8.4 |

Screen numbers are CSS pixels at 16px root. Tailwind map:

- 11px = `text-[11px]`
- 13px = `text-[13px]`
- 14px = `text-sm`
- 15px = `text-[15px]`
- 16px = `text-base`
- 18px = `text-lg`
- 20px = `text-xl`
- 24px = `text-2xl`
- 32px = `text-3xl`
- 40px = `text-4xl`
- 48px = `text-5xl`
- 72px = `text-7xl`

## What is live today (do not invent)

Dock Posted landing, from `src/app/page.tsx`:

- Kicker `text-[11px] uppercase tracking-[0.20em]`
- Home line `font-heading text-5xl leading-[1.05] md:text-7xl`
- Deck `text-base leading-7 md:text-lg` at 70% cream
- Geo / covenant / tally `text-sm leading-6` at 55% cream
- Buttons `h-12 text-sm font-medium`
- Nav `text-[13px] sm:text-sm`
- Wordmark `font-heading text-lg tracking-tight`
- Dock name `font-heading text-lg`
- Pump quote `font-mono text-[15px] font-medium tabular-nums`

On This Water loads the same three faces. Scores and tide figures should stay Geist Mono. Water names stay Newsreader.

## The one size that should move

The product is the number on the hose. On the dock card that number is **15px** and the marina name is **18px**. Flip it.

- Posted dollars: `font-mono text-[22px] md:text-2xl tabular-nums` (22–24px)
- “No price up”: stay 15px. A blank should not shout.
- Dock name stays 18px Newsreader.

Do not make Call / No price up the same size as $4.89. The blank is a fact. The dollar is the prize.

## Word sizes (how long the line may be)

Type size is useless if the sentence is a paragraph.

| Surface | Max words | Max lines on a phone | Why |
|---|---|---|---|
| Home line | 10 | 2 | One breath. “What they wrote on the pump.” = 7. |
| Kicker | 3 | 1 | MARINA FUEL. THIS MORNING. |
| Button | 3 | 1 | “See today’s docks.” Never a sentence with a comma. |
| Nav item | 2 | 1 | Today. Your dock. This trip. Yard seats. |
| Mail subject | 8 | 1 | “They put a number up on Galveston.” |
| Dock card name | — | 2 | Wrap the marina. Do not shrink the type. |
| Deck under home line | 22 | 3 | The whole covenant, not a manifesto. |
| Caption / tally | 16 | 2 | “Six docks wrote a number this week.” |

If a headline needs a comma, it is two headlines.

## Color on type

| Ink | Hex | Use |
|---|---|---|
| Navy | `#0B1F33` | Headlines on cream |
| Cream | `#FBF8F3` | Headlines on navy |
| Ink | `#16324A` | Body on cream |
| Cream 70% | `#FBF8F3` at 0.70 | Deck on navy |
| Cream 55% | `#FBF8F3` at 0.55 | Geo, tally, secondary |
| Signal red | `#E23B3B` | Kicker, Regular, alerts |
| Diesel blue | `#2F8FD6` | Diesel figure, links |
| Slate | `#5C6B76` | Meta, captions |

Never set body copy in signal red. Red is a kicker or a price, not a paragraph.

## Do / don’t

**Do**
- Newsreader for anything a person would say out loud.
- Geist for anything a person would tap.
- Geist Mono for anything a person would write on a pump or a scoreboard.
- Keep `leading-[1.05]` on the home line. Tight is the point.
- Keep `tracking-[0.20em]` on kickers. Wide is the point.
- Put the dollar in tabular lining figures.

**Don’t**
- A fourth face.
- All-caps wordmark.
- Geist for the home line.
- Newsreader for the nav.
- Italic on a price.
- Letter-space a headline.
- Shrink type to fit a long slogan. Cut the slogan.

## This weekend, in CSS

```css
.home-line { font-family: var(--font-newsreader); font-size: 48px; line-height: 1.05; }
@media (min-width: 768px) { .home-line { font-size: 72px; } }

.kicker { font-size: 11px; font-weight: 600; letter-spacing: 0.20em; text-transform: uppercase; }

.price-up { font-family: var(--font-geist-mono); font-size: 22px; font-weight: 500; font-variant-numeric: tabular-nums; }
.price-blank { font-family: var(--font-geist-mono); font-size: 15px; font-weight: 500; }
```

Home lines to set at `home` size:

- Dock Posted — What they wrote on the pump.
- On This Water — This morning on your water.
