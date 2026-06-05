---
name: styling-changes
description: "Skip typecheck for pure CSS and styling-only changes to avoid unnecessary overhead"
applyTo: ["**/*.css", "**/*.tsx:style", "**/styles/**/*"]
---

# Styling Changes - Skip Typecheck

When making **pure styling changes** (CSS, Tailwind classes, inline styles), **do not run `npm run typecheck`** at the end.

## When to Skip Typecheck

- Changes only to CSS files or `styles.css`
- Changes only to inline `style={}` objects in React components
- Changes only to Tailwind className strings
- Changes only to visual styling with no logic modifications

## When to Include Typecheck

- If TypeScript code logic changes (even if there are also styling changes)
- If component structure or props change
- If imports or dependencies change
- If any non-visual code is modified

## Rationale

Styling-only changes don't affect TypeScript compilation. Running typecheck on pure styling changes is unnecessary overhead and slows down the feedback loop.
