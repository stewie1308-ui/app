# Inkling: visual design notes

The user picked the "Paper & Ink" direction from the Higgsfield concepts. Cream paper with a serif is a common default, so the identity here comes from the field-notebook idea rather than the colours alone.

## Tokens
| Name | Hex | Use |
|---|---|---|
| paper | `#F6F0E4` | background |
| card | `#FBF7EE` | raised paper (cards, sheets) |
| ink | `#2B2620` | text, line art |
| faded ink | `#6B6358` | secondary text |
| rule | `#DDD2BE` | hairlines, the notebook margin |
| sage `#7A9471`, terracotta `#B8613E`, ochre `#C4932F`, slate `#5C7185` | | topic colours (science, history, how, words) |
| right `#4F7A4A`, wrong `#A8432F` | | answer feedback |

- **Type (chosen by the user, option 4):** Literata (variable, optical size) for everything you read and tap. Caveat handwriting in blue-grey ink (`#5C7185`) only for margin notes: the right/wrong verdict and the one-line 'why'. Sentence case everywhere.
- **Layout:** a single left-aligned column, max 34rem wide. Every card has a **notebook margin line** in its topic colour running down the left. Primary actions sit in a bottom bar within thumb reach.

```
 ┌───────────────────────────┐
 │ ✕                 2 of 5  │
 │ ┃ ✎ History & oddities    │
 │ ┃ Which is older?         │  ← Fraunces, large
 │ ┃ ┌─────────────────────┐ │
 │ ┃ │ Oxford University   │ │
 │ ┃ └─────────────────────┘ │
 │ ┃ ┌─────────────────────┐ │
 │ ┃ │ The Aztec capital   │ │
 │ ┃ └─────────────────────┘ │
 │ ┃ [ I'm sure ]            │
 └───────────────────────────┘
```

## The one bold thing
When the answer is revealed, an **ink stroke draws itself under the right answer**. A wrong pick gets a hand-drawn strike-through instead. This is the only animation not triggered by a tap, and it is turned off when the phone's reduce-motion setting is on. Everything else stays quiet: no shadows except a faint paper lift on sheets, and no gradients.

## Illustrations
The illustrations are slightly wobbly single-stroke ink SVGs: a planet, an hourglass, a gear, a quill and a sprig (for the streak). Visuals inside cards (timelines and bar comparisons) are drawn in the same ink style and only appear when they explain the fact.

## Avoided on purpose
- The `#D97757` accent.
- All-caps eyebrow labels.
- Middle-dot meta strings.
- Arrows appended to buttons.
- Identical card grids with soft shadows.
- Monospace labels.
