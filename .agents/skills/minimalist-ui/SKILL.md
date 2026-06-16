---
name: minimalist-ui
description: Premium editorial-style interfaces. Warm monochrome palette, high typographic contrast, flat bento grids, and meticulous thin layered paper-cut aesthetics. 
---

# Protocol: Premium Utilitarian Minimalism & Paper-Cut UI Architect

## 1. Protocol Overview
Name: Premium Utilitarian Minimalism & Editorial Paper-Cut UI
Description: An advanced frontend engineering directive for generating highly refined, ultra-minimalist, "document-style" web interfaces analogous to top-tier workspace platforms. This protocol strictly enforces a high-contrast warm monochrome palette, bespoke typographic hierarchies, meticulous structural macro-whitespace, bento-grid layouts, and a "thin layered paper-cut" component architecture. It actively rejects standard generic SaaS design trends.

## 2. Absolute Negative Constraints (Banned Elements)
The AI must strictly avoid the following generic web development defaults:
- DO NOT use the "Inter", "Roboto", or "Open Sans" typefaces.
- DO NOT use generic, saturated primary colored backgrounds for large elements or sections.
- DO NOT use gradients, neon colors, or 3D glassmorphism.
- DO NOT use `rounded-full` (pill shapes) for large containers, cards, or primary input fields.
- DO NOT use emojis anywhere in code, markup, text content, headings, or alt text. Replace with proper SVG primitives.
- DO NOT use generic placeholder names like "John Doe", "Acme Corp", or "Lorem Ipsum". Use realistic, contextual content.
- DO NOT use AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "Game-changer", "Delve". Write plain, specific language.

## 3. Typographic Architecture & Hierarchy
The interface must rely on extreme typographic contrast and premium font selection to establish an editorial feel.
- Primary Sans-Serif (Body, UI, Buttons, Inputs): Use clean, geometric, or system-native fonts with character. Target: `font-family: 'SF Pro Display', 'Geist Sans', 'Helvetica Neue', 'Switzer', sans-serif`.
- Editorial Serif (Main Headings & Brand Logos): Target: `font-family: 'Lyon Text', 'Newsreader', 'Playfair Display', 'Instrument Serif', serif`. Apply tight tracking (`letter-spacing: -0.02em` to `-0.03em`) and elegant line-height (`1.1` to `1.2`).
- Text Colors: Main headings and body text must never be absolute black (`#000000`). Use off-black/charcoal (`#111111` or `#1A1A1A`) with a generous `line-height` of `1.6` for body text legibility. Labels and secondary text must use muted charcoal-gray (`#555555` or `#666666`).
- Label Styling: Avoid aggressive, heavy, full-uppercase labels. Use elegant sentence-case or clean, tracked-out small caps (`text-xs font-medium tracking-wider text-neutral-500`).

## 4. Color Palette & Surface System (Warm Monochrome + Spot Pastels)
Color is a scarce resource, utilized only for semantic meaning or subtle accents.
- Canvas / Background: Premium soft off-white or warm bone (`#F9FAFB`, `#F8F9FA`, or `#FBFBFA`).
- Primary Surface (Cards, Forms, Containers): Pure White `#FFFFFF` to create a stark, layered contrast against the warm canvas background.
- Structural Borders / Dividers: Ultra-thin, crisp gray (` border-neutral-100` / `#F0F0F0` or `rgba(0,0,0,0.04)`).
- Accent Colors (Muted Pastels for status, tags, and validation alerts):
  - Pale Red (Errors): `#FDEBEC` (Text: `#9F2F2D`)
  - Pale Blue (Info): `#E1F3FE` (Text: `#1F6C9F`)
  - Pale Green (Approved): `#EDF3EC` (Text: `#346538`)
  - Pale Yellow (Pending): `#FBF3DB` (Text: `#956400`)

## 5. Thin Layered Paper-Cut Component Specifications
Components must feel like physical, precision-cut sheets of premium textured paper layered cleanly on top of each other.
- Auth & Feature Cards:
  - Background must be pure white (`#FFFFFF`).
  - Must use a razor-thin, crisp border: `border: 1px solid #F0F0F0` or Tailwind v4 `border-neutral-100`.
  - Must feature an ultra-subtle, highly diffused, realistic multi-layered depth shadow to lift the paper layer slightly off the canvas: `box-shadow: 0 4px 20px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)`.
  - Border-radius must be crisp: exactly `8px` or `12px`. Internal padding must be generous (`p-8` to `p-10` / `32px` to `40px`).
- Input Fields & Select Dropdowns:
  - Never use heavy default gray borders. Use ultra-thin `border border-neutral-200`.
  - Background should be flat white or an extremely subtle gray tint (`bg-neutral-50/50`).
  - Add smooth transitions on focus state: `focus:border-neutral-900 focus:ring-0 transition-all duration-300`.
- Primary Call-To-Action (Buttons):
  - Solid off-black background `#111111`, text `#FFFFFF`.
  - Crisp border-radius (`6px` to `8px`). No heavy shadow.
  - Interactive states: Micro-scale down on click (`active:scale-[0.98] transition-transform duration-200`), and subtle opacity or brightness shift on hover (`hover:bg-neutral-800`).
- Tags & Status Badges:
  - Clean border-radius (`4px` to `6px`), very small typography (`text-xs`), uppercase with wide tracking (`letter-spacing: 0.05em`).
  - Background must strictly use the defined Muted Pastels based on entity state (e.g., `PENDING` uses Pale Yellow, `APPROVED` uses Pale Green).

## 6. Iconography Directives
- System Icons: Since `lucide-react` is an established project dependency, use Lucide icons but strictly style them to match the technical aesthetic: enforce thin stroke-widths (`strokeWidth={1.5}` or `strokeWidth={1.25}`) and explicit, consistent sizing (`size={18}` or `size={16}`). Never use default thick icon strokes.

## 7. Subtle Motion & Tactile Micro-Animations
Motion should feel organic and invisible — present but never distracting.
- Scroll & Page Entry: Elements fade and lift gently as they mount. Use `translateY(8px)` + `opacity: 0` resolving over `500ms` with a clean ease-out curve (`cubic-bezier(0.16, 1, 0.3, 1)`).
- Tactile Hover States: Cards or structural components respond to user interaction with an ultra-subtle shadow or positional shift, giving the feedback of pressing onto a soft paper surface.

## 8. Execution Protocol
When generating or refactoring frontend code (React, TailwindCSS v4):
1. Establish macro-whitespace first using substantial padding (`py-16` to `py-24`).
2. Constrain form layouts and core content blocks to clean, editorial dimensions (`max-w-md` for auth/login forms, `max-w-5xl` for dashboard bento grids).
3. Apply the custom typographic hierarchy (Serif for brand header, clean geometric Sans-Serif for inputs and text) immediately.
4. Ensure every card container strictly obeys the White Surface + Thin Neutral Border + Diffused Multi-layered Shadow rules.
5. Provide code that reflects this clean, high-end, uncluttered, editorial paper-cut aesthetic natively without requiring manual adjustments.