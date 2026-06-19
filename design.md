---
version: "alpha"
name: "Premium SaaS Dashboard Experience"
description: "Premium SaaS Dashboard Section is designed for demonstrating application workflows and interface hierarchy. Key features include clear information density, modular panels, and interface rhythm. It is suitable for product showcases, admin panels, and analytics experiences."
colors:
  primary: "#3B82F6"
  secondary: "#10B981"
  tertiary: "#8B5CF6"
  neutral: "#3A3A3C"
  background: "#3A3A3C"
  surface: "#1A1A1C"
  text-primary: "#FFFFFF"
  text-secondary: "#34D399"
  border: "#FFFFFF"
  accent: "#3B82F6"
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: "72px"
    fontWeight: 500
    lineHeight: "72px"
    letterSpacing: "0.1em"
    textTransform: "uppercase"
  body-md:
    fontFamily: "Inter"
    fontSize: "13px"
    fontWeight: 300
    lineHeight: "19.5px"
spacing:
  base: "4px"
  sm: "2px"
  md: "4px"
  lg: "6px"
  xl: "8px"
  gap: "2px"
  card-padding: "10px"
  section-padding: "28px"
---

# SOP Task Manager Design

> [!important]
> This is the canonical visual design reference for `sop-task-manager` only. Do not apply this system to other vault projects unless explicitly requested.

## Overview

- **Composition cues:**
  - Layout: Flex
  - Content Width: Full Bleed
  - Framing: Open
  - Grid: Minimal

## Colors

The color system uses dark mode with `#3B82F6` as the main accent and `#3A3A3C` as the neutral foundation.

- **Primary (`#3B82F6`):** Main accent and emphasis color.
- **Secondary (`#10B981`):** Supporting accent for secondary emphasis.
- **Tertiary (`#8B5CF6`):** Reserved accent for supporting contrast moments.
- **Neutral (`#3A3A3C`):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: `#3A3A3C`; Surface: `#1A1A1C`; Text Primary: `#FFFFFF`; Text Secondary: `#34D399`; Border: `#FFFFFF`; Accent: `#3B82F6`.
- **Gradients:** `bg-gradient-to-t from-[#0a0a0c] to-transparent via-[#0a0a0c]/80`.

## Typography

Typography relies on Inter across display, body, and utility text.

- **Display (`display-lg`):** Inter, 72px, weight 500, line-height 72px, letter-spacing 0.1em, uppercase.
- **Body (`body-md`):** Inter, 13px, weight 300, line-height 19.5px.

## Layout

Layout follows a flex composition with reusable spacing tokens. Preserve the flex, full-bleed structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

- **Layout type:** Flex
- **Content width:** Full Bleed
- **Base unit:** 4px
- **Scale:** 2px, 4px, 6px, 8px, 10px, 12px, 16px, 20px
- **Section padding:** 28px, 64px
- **Card padding:** 10px, 20px
- **Gaps:** 2px, 6px, 12px, 24px

## Elevation And Depth

Depth is communicated through elevated surfaces, border contrast, and reusable shadow or blur treatments. Keep the recipes consistent across cards and controls.

- **Surface style:** Elevated
- **Borders:** 1px `#FFFFFF`; 1px `#10B981`
- **Shadows:** `rgba(0, 0, 0, 0.05) 0px 2px 4px 0px inset`, `rgba(0, 0, 0, 0.8) -20px 30px 60px 0px`, `rgba(255, 255, 255, 0.2) -2px 0px 4px 0px inset`, `rgba(255, 255, 255, 0.1) 2px 0px 10px 0px inset`, `rgba(255, 255, 255, 0.05) 0px 0px 0px 1px`.

### Techniques

- **Gradient border shell:** Use a thin gradient border shell around main cards. Wrap the surface in an outer shell with 10px padding and a 55px radius. Inset the content surface with a slightly smaller radius so the gradient reads as a hairline frame.

## Shapes

Use the radius family intentionally. Larger surfaces can open up; controls and badges should remain in the same rounded family.

- **Corner radii:** 24px, 45px, 55px, 9999px
- **Icon treatment:** Linear
- **Icon set:** Solar

## Components

Component styling should inherit the shared button, icon, spacing, and surface rules. Favor a small, repeatable family of actions, content containers, and fields.

### Iconography

- **Treatment:** Linear
- **Set:** Solar

## Do And Don't

### Do

- Use the primary palette as the main accent for emphasis and action states.
- Keep spacing aligned to the 4px rhythm.
- Reuse the elevated surface treatment across cards and controls.
- Keep corner radii within the 24px, 45px, 55px, and 9999px family.

### Don't

- Do not introduce extra accent colors outside the core palette roles unless a new semantic state requires it.
- Do not mix unrelated shadow or blur recipes that break the depth system.
- Do not exceed moderate motion intensity without a deliberate reason.

## Motion

Motion is controlled and interface-led across text, layout, and section transitions.

- **Motion level:** Moderate
- **Duration:** 150ms
- **Easing:** `ease`, `cubic-bezier(0.4, 0, 0.2, 1)`
- **Hover pattern:** Color
- **Scroll patterns:** GSAP ScrollTrigger and parallax are optional for intentional section reveals only; operational pages should remain restrained.

