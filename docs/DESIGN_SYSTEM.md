# 🎨 Design System & Visual Guidelines

This document details the visual components, typography rules, color palettes, and interactive standards used to provide a premium design across the platform.

---

## 🎨 Color Palette & HSL Variables

The platform uses a dark-themed space interface accented by vibrant gradients. Default styling avoids flat primaries in favor of cohesive tones:

```css
:root {
  /* HSL Tailored Palettes */
  --bg-primary: 220 25% 6%;      /* Deep space black */
  --bg-secondary: 220 20% 10%;   /* Steel gray container */
  --accent-neon: 260 90% 65%;    /* Purple glow */
  --accent-cyan: 190 90% 50%;    /* Tech cyan highlight */
  --text-primary: 210 40% 98%;   /* Pure white */
  --text-secondary: 215 20% 65%; /* Muted slate */
}
```

---

## 💎 Glassmorphism Tokens

Glassmorphism cards establish visual depth. Use standard styles to prevent layouts from flickering or shifting under background elements:

```css
.card-glass {
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

---

## 🔤 Typography & Font Hierarchy

The platform uses two main font styles:
* **Inter**: Highly readable body text, form fields, inputs, and listings.
* **Outfit**: Clean, geometric headlines, metric values, and logo branding.

```css
h1, h2, h3 {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
}

body, button, input {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
}
```

---

## 🏎️ Interaction & Micro-Animations

All interactive buttons, sidebar links, list elements, and form inputs must trigger subtle micro-animations on hover or focus to keep the UI feeling responsive and alive:

* **Button Hover**:
  - `scale: 1.02`
  - `transition: cubic-bezier(0.4, 0, 0.2, 1) 150ms`
  - Text shifts color towards neon accent.
* **Focus States**:
  - Ring glow using target colors (`outline-none ring-2 ring-accent-cyan`).
