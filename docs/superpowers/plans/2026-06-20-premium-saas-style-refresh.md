# Premium SaaS Style Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Premium SaaS Dashboard design system to the SOP Task Manager without changing its routes, page structure, data, or workflow behavior.

**Architecture:** Keep React components and Tailwind utility structure intact. Replace the theme token layer in `tailwind.config.js`, then update shared CSS material treatments and the few shared component classes that encode the previous white/olive action style. Existing class names remain stable so every page inherits the new styling without layout changes.

**Tech Stack:** React, Vite, Tailwind CSS, existing CSS-only motion, Node test runner.

---

### Task 1: Lock the Premium SaaS Token Contract

**Files:**
- Create: `client/src/theme.test.js`
- Modify: `client/tailwind.config.js`

- [ ] **Step 1: Write the failing theme contract test**

```js
test("uses the Premium SaaS blue and emerald design tokens", () => {
  assert.match(configSource, /primary:\s*\{[\s\S]*500:\s*"#3B82F6"/);
  assert.match(configSource, /secondary:\s*\{[\s\S]*500:\s*"#10B981"/);
  assert.match(configSource, /appbg:\s*"#3A3A3C"/);
  assert.match(configSource, /panel:\s*"#1A1A1C"/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test --workspace client -- src/theme.test.js`

Expected: FAIL because the current theme uses olive `#A8B09C` and charcoal `#171717` tokens.

- [ ] **Step 3: Update the Tailwind colors, shadows, and radius family**

```js
primary: { 500: "#3B82F6" },
secondary: { 500: "#10B981" },
appbg: "#3A3A3C",
panel: "#1A1A1C",
action: "#3B82F6",
good: "#10B981"
```

Keep `warn` and `danger` as semantic states. Set shared radii to `24px`, `45px`, and `55px`; use the documented inset/elevated shadow recipes.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test --workspace client -- src/theme.test.js`

Expected: PASS.

### Task 2: Refresh Shared Surface, Focus, and Motion Treatments

**Files:**
- Modify: `client/src/styles.css`
- Modify: `client/src/motion.test.js`

- [ ] **Step 1: Extend the style contract test**

```js
test("uses the Premium SaaS motion timing and elevated surfaces", () => {
  assert.match(styles, /--motion-fast:\s*150ms/);
  assert.match(styles, /#1A1A1C/);
  assert.match(styles, /#3B82F6/);
  assert.match(styles, /#10B981/);
});
```

- [ ] **Step 2: Run the focused style tests to verify failure**

Run: `npm test --workspace client -- src/motion.test.js`

Expected: FAIL because the existing motion timing is 160ms and surfaces use the prior charcoal/olive palette.

- [ ] **Step 3: Update CSS tokens without altering layout rules**

```css
body {
  background: #3a3a3c;
  --motion-fast: 150ms;
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

Replace old glass/olive visual recipes with elevated `#1A1A1C` surfaces, blue focus treatment, emerald secondary detail, restrained gradient border shells, and the existing reduced-motion override. Preserve selectors and sizing rules.

- [ ] **Step 4: Run focused style tests**

Run: `npm test --workspace client -- src/motion.test.js src/theme.test.js`

Expected: PASS.

### Task 3: Align Shared Components With the New Action System

**Files:**
- Modify: `client/src/components.jsx`
- Test: `client/src/theme.test.js`

- [ ] **Step 1: Add a failing component-source assertion**

```js
test("uses blue primary actions instead of white Seny actions", () => {
  assert.match(componentSource, /bg-action/);
  assert.doesNotMatch(componentSource, /bg-white px-6 py-3\.5 text-sm font-semibold text-secondary-500/);
});
```

- [ ] **Step 2: Run the theme test to verify failure**

Run: `npm test --workspace client -- src/theme.test.js`

Expected: FAIL because the shared header action still uses the old white button treatment.

- [ ] **Step 3: Update only shared visual classes**

Use `bg-action` for primary actions, blue/emerald borders and states, the documented radius family, and dark elevated inputs. Keep labels, fields, component props, navigation, page layout, and interaction behavior unchanged.

- [ ] **Step 4: Run the theme test to verify it passes**

Run: `npm test --workspace client -- src/theme.test.js`

Expected: PASS.

### Task 4: Verify and Publish

**Files:**
- Verify: `client/src/styles.css`, `client/tailwind.config.js`, `client/src/components.jsx`

- [ ] **Step 1: Run all checks**

Run:

```powershell
npm test
npm run build
npm audit --audit-level=moderate
```

Expected: all tests pass, production build succeeds, audit reports no moderate-or-higher vulnerabilities.

- [ ] **Step 2: Verify the running app in the browser**

Open the dashboard and confirm: blue is the primary action/focus color, emerald is supporting status color, elevated graphite surfaces replace the olive-glass appearance, no text overlaps, responsive layout is unchanged, and reduced-motion behavior remains covered by CSS.

- [ ] **Step 3: Commit and deploy**

```powershell
git add client/tailwind.config.js client/src/styles.css client/src/components.jsx client/src/theme.test.js client/src/motion.test.js design.md AGENTS.md docs/superpowers/plans/2026-06-20-premium-saas-style-refresh.md
git commit -m "Apply premium SaaS dashboard styling"
git push
npx vercel deploy --prod --yes
```

