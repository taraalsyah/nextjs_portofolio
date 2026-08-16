---
name: enterprise-ui
description: Global UI/UX design system for the entire web application. Applies to all pages, routes, components, layouts, forms, tables, navigation, dashboards, authentication, settings, and future UI work.
---

# Enterprise UI — Global Design System

## Scope

This skill applies to the ENTIRE web application.

It is not limited to a specific feature, module, page, or dashboard.

Apply these rules consistently to:

- Login
- Register
- Authentication
- Dashboard
- Tasks
- Projects
- Users
- Roles
- Permissions
- Settings
- Profile
- Notifications
- Reports
- Search
- Forms
- Tables
- Modals
- Dialogs
- Dropdowns
- Navigation
- Sidebar
- Navbar
- Footer
- Error pages
- Empty states
- Loading states
- Mobile layouts
- Responsive layouts
- All shared components
- All future UI components

Whenever creating, modifying, refactoring, or redesigning UI, follow this skill unless the user explicitly requests a different visual direction.

---

# Design Goal

The entire application must feel like ONE coherent product.

The UI should look:

- Mature
- Professional
- Production-grade
- Consistent
- Practical
- Human-designed
- Functional
- Easy to scan
- Appropriate for long-term daily use

The UI should NOT look like a collection of individually AI-generated pages.

A new page must feel like it belongs to the same application as every existing page.

---

# Global Consistency Rule

Before implementing any UI:

1. Inspect existing global styles.
2. Inspect existing design tokens.
3. Inspect existing components.
4. Inspect navigation.
5. Inspect typography.
6. Inspect colors.
7. Inspect spacing.
8. Inspect buttons.
9. Inspect forms.
10. Inspect tables.
11. Inspect dialogs/modals.

Reuse existing patterns whenever possible.

Do not create a new visual language for a single page.

---

# Visual Identity

Maintain a consistent:

- Color system
- Typography system
- Spacing system
- Border radius system
- Shadow system
- Button hierarchy
- Form styling
- Table styling
- Badge/status styling
- Navigation styling
- Modal styling
- Interaction patterns

All pages must feel related.

---

# Anti-AI / Anti-Template Rule

Do not automatically generate generic SaaS aesthetics.

Avoid:

- Excessive rounded cards
- Excessive gradients
- Glassmorphism
- Excessive shadows
- Huge headings
- Excessive whitespace
- Excessive icons
- Decorative illustrations
- Random colorful cards
- Pill-shaped controls everywhere
- Generic "Welcome back" sections
- Generic dashboard templates
- Decorative statistics with no functional purpose
- Excessive animations
- Excessive hover effects
- Purple/blue gradient aesthetics
- Random design patterns
- Different styles on different pages

Do not add visual decoration simply to make a page appear "modern".

---

# Product-Level Thinking

Do not design pages independently.

Think in terms of the entire product.

For example:

If the application uses a particular button style on the User Management page, the same button hierarchy should be used on:

- Task
- Project
- Role Management
- Settings
- Forms
- Modals

If the application uses a specific status badge style, reuse it everywhere.

If the sidebar has a specific active-state pattern, all navigation must follow it.

---

# Simplicity Rule

When two designs communicate the same information:

Prefer the simpler design.

Prefer:

border + spacing

over:

shadow + gradient + card + animation

Prefer:

clear typography

over:

large decorative headings

Prefer:

functional table

over:

multiple decorative cards

Prefer:

simple empty state

over:

large illustration

---

# Enterprise UX

Optimize for users who use the application frequently.

Prioritize:

- Fast scanning
- Predictable navigation
- Clear actions
- Compact information density
- Consistent interaction
- Minimal unnecessary clicks
- Clear feedback
- Good keyboard usability

Do not sacrifice usability for visual novelty.

---

# Responsive Behavior

The design system applies to:

- Desktop
- Laptop
- Tablet
- Mobile

Do not create a completely different visual identity on mobile.

Maintain the same:

- Colors
- Typography
- Components
- Status meanings
- Interaction patterns

Adapt layout, not product identity.

---

# Existing UI Preservation

When improving an existing page:

DO NOT automatically redesign the entire page.

First determine:

- What already works?
- Which components are reusable?
- Which visual patterns are already established?
- Which parts are inconsistent?
- Which parts actually need improvement?

Then make targeted improvements.

Avoid unnecessary visual churn.

---

# New Components

Before creating a new component:

1. Search the project for an existing equivalent.
2. Reuse it if possible.
3. Extend it if appropriate.
4. Only create a new component if necessary.

Do not create duplicate components with slightly different styling.

---

# Final Quality Check

Before completing any UI work, verify:

### Product consistency
- Does this page look like part of the same application?
- Does it follow the existing design system?

### Visual hierarchy
- Is the most important information visually obvious?
- Is the page easy to scan?

### UX
- Are actions clear?
- Are states understandable?
- Are errors recoverable?

### Visual restraint
- Did I add unnecessary cards?
- Did I add unnecessary shadows?
- Did I add unnecessary gradients?
- Did I add unnecessary animations?
- Did I add unnecessary icons?

If yes, simplify.

### Maintainability
- Are existing components reused?
- Are styles consistent?
- Did I avoid unnecessary dependencies?

---

# Core Principle

The goal is NOT to make every page visually impressive.

The goal is to make the ENTIRE APPLICATION feel intentional, coherent, mature, and production-ready.

When uncertain:

Choose consistency over novelty.

Choose usability over decoration.

Choose simplicity over visual complexity.

Choose product-specific design over generic AI-generated patterns.