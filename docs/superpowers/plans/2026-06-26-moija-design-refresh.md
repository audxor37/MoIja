# MoIja Design Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the MVP dashboard and meeting creation screen according to `docs/DESIGN.md`.

**Architecture:** Keep the existing Next.js App Router structure and update only presentational components, sample data, global CSS, and Tailwind design tokens. No backend, data model, or auth behavior changes are included.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, lucide-react.

---

### Task 1: Align Design Tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace old olive/lime tokens with DESIGN.md tokens**

Add colors for `background`, `surface`, `surfaceAlt`, `border`, `ink`, `muted`, `primary`, `strategy`, `navy`, `success`, `warning`, and `danger`.

- [ ] **Step 2: Update global body styling**

Use `#F8FAFC`, Korean-first font fallbacks, tabular numeric defaults, and remove decorative radial gradients.

### Task 2: Redesign Home Dashboard

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update sample dashboard data**

Represent attendance status as structured metrics with semantic tones.

- [ ] **Step 2: Replace the dark olive shell**

Use a light app shell with a compact white sidebar on desktop and a clean top navigation on mobile.

- [ ] **Step 3: Improve operator hierarchy**

Show the next action, attendance status cards, meeting list, selected meeting panel, and a dark navy tactical insight card.

### Task 3: Redesign New Meeting Screen

**Files:**
- Modify: `src/app/meetings/new/page.tsx`

- [ ] **Step 1: Apply shared card, input, badge, and button styles**

Use DESIGN.md radius, spacing, colors, and focus behavior.

- [ ] **Step 2: Improve no-show prevention sidebar**

Show reminder automation, attendance method, deadline, and reliability impact as operational setup guidance.

### Task 4: Verify

**Files:**
- No source changes.

- [ ] **Step 1: Typecheck**

Run `npm run typecheck` and confirm it completes successfully.

- [ ] **Step 2: Build**

Run `npm run build` and confirm it completes successfully.
