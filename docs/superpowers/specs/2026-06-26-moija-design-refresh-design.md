# MoIja Design Refresh Design

## Goal

Apply `docs/DESIGN.md` to the current MVP screens so MoIja reads as a clean mobile-first operations dashboard with light football strategy cues.

## Approved Direction

Use option A: an operations dashboard redesign.

- Use the design system background `#F8FAFC`, white surfaces, subtle borders, and compact information hierarchy.
- Use Primary Green only for confirmed attendance, success states, and the main call to action.
- Use Strategy Blue only for analysis, recommendations, links, and supporting calls to action.
- Keep football/tactical feeling restrained: use dark navy only in focused insight panels, not as a full-page theme.
- Remove the current olive/lime-heavy visual treatment.

## Screens In Scope

- Home operator dashboard at `/`
- New meeting form at `/meetings/new`
- Shared global styling and Tailwind tokens

## Component Rules

- Cards use white backgrounds, 16px radius, 20px padding, and subtle shadows or borders.
- Buttons follow the DESIGN.md hierarchy: one primary action per section, secondary actions in blue-tinted surfaces, tertiary actions neutral.
- Inputs use white surfaces, 14px radius, `#E5E8EB` borders, and blue focus rings.
- Badges use semantic color roles: success green, warning orange, danger red, info blue, neutral gray.
- Numbers and operational stats are visually prominent and use tabular figures where useful.

## UX Shape

The dashboard must show what the operator should do now: review attendance, remind non-responders, and open the next meeting. The new meeting screen must make attendance rules, deadline, reminder logic, and no-show prevention visible during setup.

## Verification

Run:

```bash
npm run typecheck
npm run build
```
