# CLAUDE.md — Terruno Wine & Spirits Website

## Project Overview

**Client:** Terruno Wine & Spirits  
**Founded:** 2023 by Daniel Miranda  
**Mission:** Import and showcase fine Mexican wines, mezcals, and traditional spirits to the United States market, spotlighting regions with rich but little-known winemaking heritage.  
**Language:** English  
**Brand tagline direction:** Terroir-driven, heritage-first, discovery-oriented

---

## Project Brief (Client Intake)

### Site Goals
- Establish online presence and credibility
- Generate leads from restaurants and liquor stores (primary conversion)
- Showcase wine portfolio with vineyard map by region
- Educational blog content focused on Mexican wines

### Success Metrics
Contact form submissions, client conversions, SEO ranking for "Mexican wine" related searches.

### Target Audience
- **Age:** 25–35 and 50+ (two distinct segments; tone and content should bridge both)
- **Location:** Hauppauge, NY area (initial); New York and Texas markets
- **Income level:** Upper-middle to high
- **Discovery channel:** Currently in-person/direct; site will support cold discovery via Google

### Design Direction
- Style: Elegant / Luxurious
- First impressions matter — wine is a premium product
- No e-commerce; this is a brand and lead-generation site

### Competitor Reference Sites
- https://www.besoimports.com/ — main benchmark (include vineyard map feature)
- https://www.lacompetenciaimports.com/
- https://primosimports.com/

### Pages (MVP Scope)
- Home / Landing

### Key Functionality
- **Contact form** (lead capture for restaurants & liquor stores)
  - Fields: First Name, Last Name, Email, Phone, Company Name, Message (open text)

### Differentiator
Boutique importer focused on artisanal, hard-to-find wines — hidden gems over mainstream labels.

---

## Brand Identity

### Name & Meaning
- **Terruno** derives from *"Terra"* (Land/Soil in Spanish) — a nod to the concept of terroir in winemaking: soil, climate, and the human tradition behind every bottle.
- The brand honors the stories, old vines, and craftsmanship of Mexican and other underrepresented wine and spirits regions.

### Brand Personality
- **Refined** but not pretentious — approachable luxury
- **Storytelling-first** — every product has a heritage and a narrative
- **Discovery-oriented** — introducing the US market to hidden gems
- **Culturally grounded** — deeply connected to Mexican winemaking tradition
- **Confident** — championing quality that deserves global recognition

### Tone of Voice
- Warm, knowledgeable, and passionate
- Evocative without being flowery
- Invites curiosity and appreciation
- Never corporate or cold
- Use words like: *terroir, heritage, craft, tradition, discovery, provenance, story, land, culture*

---

## Visual Design System

### Color Palette

```css
:root {
  --color-cream:      #f1edde; /* Primary background — warm parchment */
  --color-sage:       #797853; /* Secondary — muted olive/sage, body text accents */
  --color-forest:     #454411; /* Primary dark — deep olive green, headings, CTAs */

  /* Derived / utility tokens */
  --color-bg:         #f1edde;
  --color-text:       #454411;
  --color-text-muted: #797853;
  --color-border:     rgba(69, 68, 17, 0.15);
  --color-overlay:    rgba(69, 68, 17, 0.6);
}
```

**Usage rules:**
- `#f1edde` (cream) — backgrounds, cards, negative space; the dominant canvas
- `#797853` (sage) — subheadings, captions, muted body copy, decorative accents
- `#454411` (forest) — headings, primary buttons, borders, logo color, strong emphasis
- Avoid introducing new brand colors; use opacity/tint variations of the three above

### Typography

```css
/* Display / Headlines */
font-family: 'Playfair Display', Georgia, serif;
/* Use for: H1, H2, section titles, pull quotes, hero text */
/* Weight range: 400 (italic for elegance), 700 (bold for impact) */

/* UI / Navigation / Labels */
font-family: 'Montserrat', sans-serif;
/* Use for: navigation, buttons, form labels, metadata, small caps labels */
/* Weight range: 300, 400, 600 */
/* Often used in uppercase letter-spacing for a refined look */

/* Body / Descriptions */
font-family: 'Aileron', 'Montserrat', sans-serif;
/* Use for: body copy, product descriptions, long-form text */
/* Weight: 300 (light) or 400 (regular) */
/* Aileron is a free humanist sans-serif — load via @font-face if needed */
```

**Typography rules:**
- Headlines (Playfair Display) should feel editorial — generous sizing, occasional italics
- Navigation and labels (Montserrat) in uppercase with `letter-spacing: 0.12em`
- Body text (Aileron) at comfortable line-height (1.7–1.8) for readability
- Avoid mixing all three fonts in a single element — assign each a clear role

### Logo

- The logo mark is a wine glass icon on a **#454411** (forest green) rectangle
- Wordmark: `TERRUNO-WS` in spaced uppercase, same forest green color
- Minimal and geometric — use with generous white/cream space around it
- Do not add drop shadows or modify the logo colors
- Primary logo: horizontal lockup (icon + wordmark side by side)

---

## Layout & Aesthetic Direction

### Overall Aesthetic
**Editorial Wine Magazine meets Mexican Heritage** — think warm parchment tones, refined serif headlines, generous white space, and photography that evokes sun-drenched vineyards and artisanal craft. The feel should be like a beautifully printed catalog or wine journal, not a flashy e-commerce site.

### Layout Principles
- **Generous spacing** — let content breathe; padding should feel luxurious
- **Asymmetric compositions** — avoid rigid symmetrical layouts; stagger text and images
- **Full-width imagery** — vineyard photography should span edge to edge in hero sections
- **Rounded image containers** (as seen in the deck) — use `border-radius: 24px` on photo cards
- **Horizontal rule dividers** — thin `1px` lines in `--color-forest` at low opacity for section breaks
- **Max content width:** `1200px`, centered

### Spacing Scale (CSS)
```css
--space-xs:  0.5rem;   /*  8px */
--space-sm:  1rem;     /* 16px */
--space-md:  2rem;     /* 32px */
--space-lg:  4rem;     /* 64px */
--space-xl:  7rem;     /* 112px */
--space-2xl: 10rem;    /* 160px */
```

### Border Radius
```css
--radius-sm:   8px;
--radius-md:   16px;
--radius-lg:   24px;   /* Image containers */
--radius-full:  9999px; /* Pills, tags */
```

---

## Component Patterns

### Navigation
- Fixed or sticky top nav
- Logo left, links right
- Links in Montserrat uppercase, `letter-spacing: 0.1em`, `font-size: 0.75rem`
- Subtle border-bottom `1px solid var(--color-border)` on scroll
- CTA button (e.g., "Our Portfolio") with `background: var(--color-forest)` and white text

### Hero Section
- Large Playfair Display headline — 60–80px on desktop
- Subtitle in Montserrat or Aileron, muted
- Full-width or large offset vineyard photography
- Subtle fade-in animation on load (stagger headline, then subtext, then CTA)

### Section Headers
```html
<!-- Pattern: label + headline -->
<p class="section-label">Who We Are</p>   <!-- Montserrat, uppercase, --color-sage -->
<h2 class="section-title">...</h2>         <!-- Playfair Display, --color-forest -->
```

### Cards (Products / Team)
- Cream background (`#f1edde`) or slightly off-white
- Rounded corners (`border-radius: var(--radius-lg)`)
- Minimal border: `1px solid var(--color-border)`
- Subtle hover lift: `transform: translateY(-4px)` + `box-shadow`
- Team member photos use circular or oval crop (as in the deck)

### Buttons
```css
/* Primary */
.btn-primary {
  background: var(--color-forest);
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.875rem 2rem;
  border-radius: var(--radius-full);
  border: none;
}

/* Secondary / Ghost */
.btn-secondary {
  background: transparent;
  color: var(--color-forest);
  border: 1.5px solid var(--color-forest);
  /* same font/padding as primary */
}
```

### Decorative Elements
- Thin horizontal dividers: `border-top: 1px solid rgba(69, 68, 17, 0.2)`
- Quotation marks or pull quotes in large italic Playfair Display, `--color-sage`
- Subtle background texture (optional): a very light noise/grain overlay at 3–5% opacity to evoke paper
- Vine or leaf SVG ornaments sparingly — only if fitting the section context

---

## Page Structure (Suggested)

1. **Hero** — Full-width vineyard image, tagline, brief intro CTA
2. **About / Our Story** — Who we are, the Terruno name explained, founder's passion
3. **Mission** — Spotlight on Mexico & underrepresented regions
4. **Portfolio** — Featured wines, mezcals, spirits (product cards)
5. **The Experience** — Fine dining & retail channel story
6. **Our Team** — Founder + board members with photos and bios
7. **Market & Availability** — NY, Texas, expansion roadmap
8. **Contact / Inquiries** — For restaurants, distributors, retailers

---

## Content Guidelines

### Key Messages
- Terruno shines a spotlight on Mexico's exceptional but underappreciated wines and spirits
- Every product has a story — heritage, terroir, tradition
- Curated for the US palate; introduced to premium restaurants and liquor stores in NY and TX
- The team brings deep executive, sales, and cultural expertise

### Company Facts (use throughout)
- Founded: 2023
- Founder: Daniel Miranda — WSET Level 2, Sales & Marketing background, deep Mexico cultural ties
- Chairman: Carlos Miranda — 20+ years CEO experience, wine & tequila aficionado
- Initial markets: New York and Texas
- Expansion: Northeast Corridor, Florida, Midwest
- Target: 25,000 bottles in 2025, aggressive growth through 2030
- Channels: Fine dining restaurants + premium liquor stores

### Do Not
- Do not use generic wine clichés ("bold and robust," "notes of oak")
- Do not make the brand feel like a mass-market importer
- Do not use stock-photo vineyard imagery that could be from anywhere — favor images that evoke Baja California or specific Mexican regions
- Do not position as budget or discount — this is premium, curated, artisanal

---

## Technical Notes

- **Fonts to load:** Playfair Display & Montserrat via Google Fonts; Aileron via CDN or self-hosted `@font-face`
- **Framework:** TBD — adapt patterns above to whichever stack is used (HTML/CSS, React, Next.js, etc.)
- **Images:** Use `object-fit: cover` with the rounded container pattern; always include meaningful `alt` text
- **Accessibility:** Maintain WCAG AA contrast — `#454411` on `#f1edde` passes; verify `#797853` for body text sizing
- **Animations:** CSS transitions preferred; keep subtle (200–400ms ease); no aggressive motion
- **Responsive:** Mobile-first; collapse navigation to hamburger; stack hero content vertically on mobile

---

## Asset Reference

- **Logo file:** `Terruno_Wine___Spirits.png` — horizontal lockup, icon + wordmark
- **Brand colors extracted from logo:** forest `#454411`, cream `#f1edde`
- **Presentation deck:** `Terruno_Official_pptx.pdf` — reference for layout feel, photo style, team bios

---

*Last updated: May 2026 — Webika Studio*
