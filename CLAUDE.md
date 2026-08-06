# Instructions for Claude Code

# Behavioral guidelines

Guidelines to reduce common LLM coding mistakes. Merge with the project-specific instructions above as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Readability over comments
- Prefer specific, descriptive names for variables, functions, and components over explanatory comments. Code should read clearly on its own.
- Reserve comments for explaining *why* something is done, not *what* the code does.

## 6. Application of SOLID principles
- **Single responsibility:** each module, component, and function should do one thing.
- **Open/closed:** extend behavior through composition and props rather than modifying existing units.
- **Liskov substitution:** implementations should be interchangeable behind their shared interface.
- **Interface segregation:** keep props and interfaces focused; avoid forcing consumers to depend on things they don't use.
- **Dependency inversion:** depend on abstractions (hooks, interfaces) rather than concrete implementations.

> **SOLID vs. Simplicity First:** these are sequenced, not contradictory. Reach for a SOLID abstraction in response to *real, present* need — genuine duplication (rule of three), a second concrete case that exists today, or a boundary the code already crosses — not anticipated need. Until then, prefer the simplest thing that works ([Behavioral guidelines §2](#2-simplicity-first)). When you *do* introduce an abstraction, shape it along SOLID lines. In short: **don't add abstractions speculatively, but when one is warranted, make it a good one.**

## 7. File length
- Avoid overly long files. If a file exceeds **250 lines of code**, split it.
- Extract constants and configuration into `src/config/` and reusable logic into helpers/hooks, then import them back.

## 8. Testing
- Add or update a co-located `*.test.ts(x)` for any non-trivial change; every substantive module here has one.
- Stack: Vitest + Testing Library + jsdom. Shared helpers and doubles live in `src/test/`.
- Run `npm test` before considering a change complete.



**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# repository overview


## Directory conventions
Place new code in the directory that matches its role:
- `components/` — React UI components (with co-located `*.test.tsx`).
- `hooks/` — reusable stateful React logic (`useX`).
- `interactions/` — pointer/canvas interaction hooks (draw, pan, select).
- `lib/` — pure, framework-free logic. **No React imports here** — keep it deterministic and unit-testable in isolation.
- `config/` — static data and constants (icons, controls, editor defaults).
- `styles/` — shared style objects.
- `types/` — shared TypeScript types.
- `test/` — test helpers, doubles, and setup.

## Commands
- `npm run dev` — start the Vite dev server.
- `npm run build` — type-check (`tsc`) **and** build; use it as the typecheck gate.
- `npm test` — run the Vitest suite once (`npm run test:watch` to watch).

## Styling
- Tailwind v4 (via `@tailwindcss/vite`) for utility classes; shared style objects live in `src/styles/ui.ts`. Follow the existing approach rather than introducing a new styling method.
