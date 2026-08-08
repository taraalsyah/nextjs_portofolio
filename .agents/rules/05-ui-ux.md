# UI & UX Design Rules

## 1. Design System & Aesthetics
- **Theme**: Enterprise Dark Glassmorphism system utilizing scoped CSS Modules:
  - `src/app/dashboard/task-management/task.module.css`
  - `src/components/project/project.module.css`
  - `src/app/dashboard/activity-history/activity.module.css`
  - `src/app/dashboard/layout.module.css`
  - `src/app/dashboard/dashboard.module.css`
- **Color Tokens**: Use HSL CSS variables (`var(--primary-glow)`, `var(--glass-border)`, `var(--secondary)`, `var(--fg-color)`, `var(--bg-glass)`).
- **Typography & Icons**: Google Fonts / System UI fonts with `lucide-react` icons.
- **UI Notifications**: Use the standardized safe Toast system (`src/components/ui/Toast.tsx` via `useSafeToast()`).

---

## 2. Responsive Mobile Design Rules (`@media (max-width: 768px)`)
- **Full Viewport Modals on Mobile**:
  - Set `.modalOverlay` to `padding: 0 !important`, `align-items: flex-end !important`, `height: 100dvh !important`.
  - Set `.modalCard` to `width: 100vw !important`, `height: 100dvh !important`, `max-height: 100dvh !important`, `margin: 0 !important`, `border-radius: 16px 16px 0 0 !important` (or `0 !important` for `<= 480px`).
  - Eliminate awkward side margin gaps or floating boxes on mobile viewports.
- **Touch Scrollable Controls**:
  - Horizontal scrolling for tabs (`.tabsList`) and wide data tables (`.tableWrapper`, `.tableContainer`) with `-webkit-overflow-scrolling: touch`.
  - Full-width stacked action buttons in `.modalFooter` on mobile screens.
