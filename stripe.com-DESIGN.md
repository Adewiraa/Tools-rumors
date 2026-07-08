# Design System Inspired by Stripe

## 1. Visual Theme & Atmosphere

Stripe's design system embodies modern fintech sophistication with a bold, confident personality. The visual language balances corporate trust through deep navy tones and clean typography with vibrant energy via electric purple accents and striking gradient overlays. The atmosphere is progressive yet professional—designed to inspire confidence in financial transactions while maintaining accessibility and clarity. The use of generous whitespace, refined geometric shapes, and a striking purple-to-orange gradient treatment creates a premium, tech-forward aesthetic that appeals to both enterprises and emerging businesses. This design language communicates reliability, innovation, and growth potential through its color relationships and purposeful restraint.

**Key Characteristics**
- Bold, gradient-driven hero compositions with diagonal, organic sweeps
- High-contrast text hierarchies favoring legibility and visual impact
- Purple as the primary signal color, anchoring trust and action
- Deep navy and dark tones for serious content; clean whites for clarity
- Refined, geometric component styling with minimal ornamentation
- Motion and depth suggested through subtle elevation and strategic color layering
- Accessible color relationships prioritizing readability over decoration

## 2. Color Palette & Roles

### Primary
- **Stripe Purple** (`#533AFD`): Primary brand color used for CTAs, interactive elements, active states, and brand identity. Most frequently used across the system for maximum recognition and action emphasis.
- **Deep Navy** (`#061B31`): Primary text color for headings and critical content. Conveys trust, professionalism, and financial gravitas. Used in hero sections and primary messaging.

### Accent Colors
- **Vibrant Orange** (`#FF6118`): Secondary accent for highlights, gradient endpoints, and supporting visual interest. Creates energy and draws attention to secondary actions and design flourishes.
- **Slate Blue** (`#273951`): Muted secondary color for subheadings, secondary text, and layered content. Bridges the gap between deep navy and neutral tones.
- **Dark Blue** (`#0D1738`): Darkest interactive tone, used in footer regions and supplementary navigation backgrounds.
- **Navy Slate** (`#1A2C44`): Intermediate dark tone for secondary surface treatments and reduced-emphasis sections.

### Interactive
- **Interactive Slate** (`#50617A`): Interactive element text and hover states. Provides visual feedback for interactive components while maintaining sophistication.

### Neutral Scale
- **Pure Black** (`#000000`): Primary text, borders, and structural elements. High-contrast element for maximum readability in standard body text and critical UI components.
- **Pure White** (`#FFFFFF`): Primary background, card surfaces, and content areas. Ensures legibility and creates visual hierarchy through clean separation.
- **Light Slate** (`#64748D`): Secondary text, metadata, and lower-emphasis content. Used for supporting information and contextual details.

### Surface & Borders
- **Subtle Border Light** (`#D4DEE9`): Soft border divisions and subtle separators. Creates visual structure without overwhelming the composition.
- **Light Background** (`#E5EDF5`): Soft background fills for secondary containers and deemphasized surfaces.
- **Lavender Tint** (`#E8E9FF`): Ultra-light purple tint for highlighted code blocks, technical callouts, or premium feature highlights.

## 3. Typography Rules

### Font Family
- **Primary Font**: `sohne-var`, system fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`
- **Secondary Font**: Monospace for code/technical content: `"SF Mono", Monaco, "Cascadia Code", Roboto Mono, Courier New, monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display / H1 | sohne-var | 48px | 300 | 55.2px | 0px | Hero headlines, major section titles. High impact, open letterforms. |
| Heading 2 / H2 | sohne-var | 32px | 300 | 35.2px | 0px | Section headings, feature callouts. Prominent but subordinate to H1. |
| Heading 3 / H3 | sohne-var | 26px | 300 | 29.12px | 0px | Subsection titles, card headers. Establishes tertiary hierarchy. |
| Heading 4 / H4 | sohne-var | 16px | 400 | 22.4px | 0px | Component labels, button text, smaller callouts. Increased weight for prominence. |
| Body / Paragraph | sohne-var | 14px | 400 | 21px | 0px | Standard body text, form labels, metadata. Baseline reading size. |
| Caption / Small | sohne-var | 12px | 400 | 16.8px | 0px | Footnotes, timestamps, secondary metadata. De-emphasized but readable. |
| Code / Monospace | SF Mono | 13px | 400 | 18.2px | 0px | Code snippets, technical identifiers, API references. |

### Principles
- **Lightness as Hierarchy**: Display and heading typography uses weight 300 (light) to create visual distinction while maintaining sophistication; body content uses weight 400 for readability.
- **Generous Line Height**: All sizes employ line-height 1.15–1.3× of font size to ensure comfortable reading, especially on screens and in financial interfaces where clarity is paramount.
- **Semantic Sizing**: Each size increment represents a distinct narrative role; avoid intermediate sizes to maintain system coherence.
- **System Fallbacks**: The sans-serif stack prioritizes system fonts for performance; sohne-var loads as the primary for brand consistency.
- **Variable Font Optimization**: sohne-var supports optical sizing and weight variations; leverage intermediate weights (350–450) for emphasis without introducing new sizes.

## 4. Component Stylings

### Buttons

#### Primary Button
- **Background**: `#533AFD`
- **Text Color**: `#FFFFFF`
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Padding**: `15.5px 24px 16.5px 24px`
- **Border Radius**: `4px`
- **Border**: `none`
- **Height**: `fit-content` (typically `48px` with padding)
- **Line Height**: `16px`
- **Hover State**: Background `#4329E8`, slight opacity shift to `0.95`
- **Active State**: Background `#3720D4`, scale `0.98`
- **Disabled State**: Background `#C9C3F0`, color `#FFFFFF`, cursor `not-allowed`

#### Secondary Button
- **Background**: `#FFFFFF`
- **Text Color**: `#533AFD`
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Padding**: `15.5px 24px 16.5px 24px`
- **Border Radius**: `4px`
- **Border**: `1px solid #533AFD`
- **Height**: `fit-content`
- **Line Height**: `16px`
- **Hover State**: Background `#F3F0FF`, border color `#4329E8`
- **Active State**: Background `#E8E9FF`, border color `#3720D4`

#### Ghost Button (Text Only)
- **Background**: `transparent`
- **Text Color**: `#533AFD`
- **Font Size**: `14px`
- **Font Weight**: `400`
- **Padding**: `12px 0px 12px 0px`
- **Border Radius**: `4px`
- **Border**: `none`
- **Height**: `40px`
- **Line Height**: `14px`
- **Hover State**: Background `rgba(83, 58, 253, 0.08)`, text color `#4329E8`
- **Active State**: Background `rgba(83, 58, 253, 0.12)`, text color `#3720D4`
- **Underline**: Optional on hover; text-decoration `underline` for semantic links

### Cards & Containers

#### Standard Card
- **Background**: `#FFFFFF`
- **Text Color**: `#000000`
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Padding**: `32px` (internal content padding)
- **Border Radius**: `5px`
- **Border**: `1px solid #D4DEE9`
- **Box Shadow**: `0px 1px 2px rgba(0, 0, 0, 0.04)`
- **Line Height**: `normal`
- **Hover State**: Border color `#B8CCDB`, shadow `0px 4px 12px rgba(0, 0, 0, 0.08)`

#### Feature Highlight Card
- **Background**: Linear gradient `180deg, rgba(83, 58, 253, 0.05) 0%, rgba(255, 97, 24, 0.03) 100%)`
- **Text Color**: `#000000`
- **Padding**: `36px`
- **Border Radius**: `5px`
- **Border**: `1px solid #E5EDF5`
- **Box Shadow**: `none`

#### Gradient Overlay Container (Hero)
- **Background**: Diagonal linear gradient `135deg, #533AFD 0%, #FF6118 100%)`
- **Opacity**: Layer as `rgba(..., 0.15)` over white background for subtle effect
- **Text Color**: `#FFFFFF` or `#061B31` depending on overlay contrast

### Inputs & Forms

#### Text Input
- **Background**: `#FFFFFF`
- **Text Color**: `#000000`
- **Font Size**: `14px`
- **Font Weight**: `400`
- **Padding**: `12px 16px`
- **Border Radius**: `4px`
- **Border**: `1px solid #D4DEE9`
- **Height**: `40px`
- **Line Height**: `14px`
- **Focus State**: Border `2px solid #533AFD`, box-shadow `0px 0px 0px 3px rgba(83, 58, 253, 0.1)`
- **Error State**: Border `1px solid #EF4444`, color `#DC2626`
- **Placeholder Text**: Color `#64748D`, opacity `0.7`

#### Form Label
- **Font Size**: `14px`
- **Font Weight**: `400`
- **Color**: `#061B31`
- **Margin Bottom**: `8px`
- **Display**: `block`

#### Checkbox / Radio
- **Size**: `18px × 18px`
- **Border Radius**: `3px` (checkbox), `50%` (radio)
- **Border**: `1px solid #D4DEE9`
- **Checked Background**: `#533AFD`
- **Checked Checkmark**: `#FFFFFF`
- **Hover Border**: `#B8CCDB`

### Navigation

#### Top Navigation Bar
- **Background**: `#FFFFFF`
- **Height**: `64px`
- **Padding**: `10px 16px`
- **Border Bottom**: `1px solid #E5EDF5`
- **Text Color**: `#061B31`
- **Font Size**: `14px` (nav items), `16px` (logo/primary)
- **Font Weight**: `400`
- **Display**: `flex`, align-items `center`, justify-content `space-between`

#### Navigation Link
- **Color**: `#061B31`
- **Font Size**: `14px`
- **Font Weight**: `400`
- **Padding**: `8px 12px`
- **Border Radius**: `4px`
- **Hover State**: Background `#F3F3F3`, color `#533AFD`
- **Active State**: Color `#533AFD`, border-bottom `2px solid #533AFD`

#### Dropdown Menu
- **Background**: `#FFFFFF`
- **Border**: `1px solid #D4DEE9`
- **Border Radius**: `6px`
- **Box Shadow**: `0px 10px 40px rgba(0, 0, 0, 0.1)`
- **Padding**: `8px 0px`
- **Min Width**: `200px`

### Links

#### Standard Link
- **Color**: `#533AFD`
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Text Decoration**: `none`
- **Hover State**: Color `#4329E8`, text-decoration `underline`
- **Visited State**: Color `#7060F5` (slightly lighter purple)
- **Line Height**: `normal`

#### Secondary Link
- **Color**: `#061B31`
- **Font Size**: `14px`
- **Font Weight**: `400`
- **Padding**: `12px 0px`
- **Hover State**: Color `#533AFD`, text-decoration `underline`

### Badges

#### Status Badge (Success)
- **Background**: `#D1FAE5`
- **Text Color**: `#065F46`
- **Font Size**: `12px`
- **Font Weight**: `500`
- **Padding**: `4px 8px`
- **Border Radius**: `3px`
- **Border**: `1px solid #A7F3D0`

#### Status Badge (Alert)
- **Background**: `#FEE2E2`
- **Text Color**: `#991B1B`
- **Font Size**: `12px`
- **Font Weight**: `500`
- **Padding**: `4px 8px`
- **Border Radius**: `3px`
- **Border**: `1px solid #FECACA`

#### Status Badge (Info)
- **Background**: `#E8E9FF`
- **Text Color**: `#533AFD`
- **Font Size**: `12px`
- **Font Weight**: `500`
- **Padding**: `4px 8px`
- **Border Radius**: `3px`
- **Border**: `1px solid #C9C3F0`

## 5. Layout Principles

### Spacing System
- **Base Unit**: `4px`
- **Scale**: `4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px, 36px, 40px, 52px, 60px`
- **Usage Context**:
  - `4px`: Micro spacing (icon-to-label, badge padding)
  - `8px`: Tight spacing (button padding, list item gutters)
  - `12px`: Compact spacing (form field padding, inline elements)
  - `16px`: Standard spacing (navigation padding, component padding)
  - `20px`: Comfortable spacing (section gaps, card margins)
  - `24px`: Rhythm spacing (content block separation, grid gutters)
  - `28px`: Major spacing (feature sections)
  - `32px–52px`: Large sections and hero padding
  - `60px`: Full-section bottom padding before major content shift

### Grid & Container
- **Max Width**: `1280px` (content container at `1262px` observed in nav)
- **Columns**: 12-column grid for responsive alignment
- **Gutter**: `24px` between columns
- **Section Padding**: `60px` top/bottom for major sections, `40px` for subsections
- **Asymmetric Layout**: Feature cards often occupy 3–4 columns with 2–3 column text companion; allows for gradient overlays and media positioning

### Whitespace Philosophy
Stripe employs **generous, purposeful whitespace** to:
- Establish visual hierarchy and reduce cognitive load
- Create breathing room around high-impact imagery and gradients
- Support the premium, confident tone
- Enable content scanning and fast comprehension
- Separate product showcase cards from contextual text
- Use diagonal white space and organic gradient shapes to suggest motion and modernity

### Border Radius Scale
- `4px`: Buttons, inputs, small interactive elements (tight, minimal softness)
- `5px`: Cards and standard containers (balanced, accessible corners)
- `6px`: Navigation elements, dropdown menus, larger surfaces (slightly more pronounced)
- `0px`: Hero sections, full-width overlays, and typography-forward areas (sharp, angular)

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (z-0) | No shadow; border `1px solid #D4DEE9` | Cards at rest, button backgrounds, default containers |
| Raised (z-1) | `0px 1px 2px rgba(0, 0, 0, 0.04)` | Standard cards, interactive states, subtle lift |
| Elevated (z-2) | `0px 4px 12px rgba(0, 0, 0, 0.08)` | Hover card states, focused inputs, modals entry |
| High (z-3) | `0px 10px 40px rgba(0, 0, 0, 0.1)` | Dropdown menus, popups, floating panels |
| Modal (z-4) | `0px 20px 60px rgba(0, 0, 0, 0.15)` with backdrop `rgba(0, 0, 0, 0.5)` | Dialogs, overlay content, full-page modals |

**Shadow Philosophy**: Stripe uses subtle, soft shadows to suggest depth without dominance. Shadows employ low opacity black (`rgba(0, 0, 0, 0.04–0.15)`) and scale from tight (`2px` blur) to diffuse (`40px` blur) as elevation increases. Shadows reinforce the fintech brand's trust through restraint—they clarify layer relationships without theatrical effects. Gradient overlays in hero sections replace traditional shadows; they create depth through color interaction rather than blur.

## 7. Do's and Don'ts

### Do
- **Use Stripe Purple (`#533AFD`) for all primary CTAs** — this is the system's action signal and is immediately recognizable to Stripe users
- **Maintain 1.15–1.3× line-height for all body text** — ensures readability at any size and accessibility compliance
- **Apply gradient overlays to hero/showcase sections** — use diagonal 135° from purple to orange with 10–15% opacity over white for depth
- **Group related content into cards with consistent `5px` border-radius and `#D4DEE9` borders** — establishes visual coherence
- **Employ generous whitespace (`24px`–`60px`) between major sections** — supports the premium, confident aesthetic
- **Use Deep Navy (`#061B31`) for primary headings and crucial text** — high contrast ensures legibility and gravitas
- **Stack form fields vertically with `8px` gaps and consistent `40px` heights** — ensures usability and visual rhythm
- **Reserve the Vibrant Orange (`#FF6118`) for accents and gradient endpoints only** — overuse diminishes impact
- **Implement focus states with `2px` purple border + subtle shadow** — meets accessibility standards and provides clear interaction feedback
- **Test all color combinations for 4.5:1 contrast ratio minimum** — ensures WCAG AA compliance for financial content

### Don't
- **Don't use purple for passive elements** — it's reserved for interactive and primary-importance content only
- **Don't apply shadows to hero sections or gradient overlays** — use color layering instead; shadows create visual noise
- **Don't mix serif and sans-serif typefaces in the same interface** — sohne-var is the only font family; maintain consistency
- **Don't create custom spacing values outside the scale** — always use multiples of `4px` to maintain rhythm
- **Don't set line-height below `1.15×` font size** — risks accessibility and readability issues in financial contexts
- **Don't forget to disable buttons** — always include disabled state with `#C9C3F0` background and `cursor: not-allowed`
- **Don't overuse borders** — use subtle `#D4DEE9` or `#E5EDF5` only; reserve bold borders for interactive focus states
- **Don't nest more than two levels of dropdown menus** — keeps navigation simple and mobile-friendly
- **Don't apply color to text smaller than `14px` without sufficient contrast** — metadata at `12px` must maintain `#000000` or `#061B31`
- **Don't forget gradient direction** — always use `135deg` (top-left to bottom-right) for consistency with Stripe's brand motion

## 8. Responsive Behavior

### Breakpoints

| Breakpoint Name | Width | Key Changes |
|---|---|---|
| Mobile (Small) | 320px–479px | Single-column layout, `16px` padding, font size -2px, button full-width, nav collapsed to hamburger |
| Mobile (Large) | 480px–767px | Single-column, `20px` padding, standard font sizes, card padding `20px`, hero text `32px` (H2 size) |
| Tablet | 768px–1023px | Two-column grid, feature cards + text side-by-side, `24px` padding, nav horizontal but condensed, `12px` gap |
| Desktop (Standard) | 1024px–1279px | Three-column grid, full feature showcase, `32px` padding, max-width `1024px`, nav full with dropdowns |
| Desktop (Large) | 1280px+ | Full 12-column grid, max-width `1280px`, asymmetric layouts, gradient full-bleed backgrounds, `60px` padding |

### Touch Targets
- **Minimum Height**: `44px` (buttons, nav items, form fields on mobile)
- **Minimum Width**: `44px` (clickable icons, badges)
- **Minimum Spacing Between Targets**: `8px` (prevents accidental overlapping touches)
- **Link Padding**: `12px` on all sides when target is text-only
- **Icon Size**: `24px × 24px` minimum, `32px × 32px` recommended for touch

### Collapsing Strategy
- **Navigation**: At `<768px`, collapse menu to hamburger icon with vertical slide-out drawer; use full-width background `#FFFFFF` with `#E5EDF5` separator lines
- **Feature Cards**: At `<1024px`, stack cards vertically; maintain `32px` gap between cards; gradient overlays adjust to portrait orientation
- **Typography**: Reduce heading sizes by one level at `<768px` (H1: 48px → 32px, H2: 32px → 26px, H3: 26px → 20px)
- **Padding**: Reduce section padding from `60px` to `40px` at tablet, `20px` at mobile
- **Forms**: Single-column layout at all breakpoints; full-width inputs with `12px` padding
- **Spacing Scale**: Use `20px` gaps at tablet, `16px` at mobile instead of `24px`–`28px`

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA**: Stripe Purple (`#533AFD`)
- **Primary Text / Headings**: Deep Navy (`#061B31`)
- **Secondary Text**: Light Slate (`#64748D`)
- **Background**: Pure White (`#FFFFFF`)
- **Borders**: Subtle Border Light (`#D4DEE9`)
- **Accents / Highlights**: Vibrant Orange (`#FF6118`)
- **Focus States**: Stripe Purple (`#533AFD`) with `0px 0px 0px 3px rgba(83, 58, 253, 0.1)` ring
- **Disabled / Muted**: `#C9C3F0`

### Iteration Guide

1. **All interactive elements default to Stripe Purple (`#533AFD`)** — buttons, links, form focus states, and checkboxes use this color as the primary signal. Secondary actions use white backgrounds with purple borders/text.

2. **Typography always uses sohne-var at specific sizes: H1 `48px`/300, H2 `32px`/300, H3 `26px`/300, H4 `16px`/400, body `14px`/400.** Never use intermediate sizes; line-height is always 1.15–1.3× of font size.

3. **Spacing adheres to the `4px` base unit scale: `4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px, 36px, 40px, 52px, 60px`.** All padding, margin, and gap values must be from this scale.

4. **Border radius follows three values: `4px` (buttons/inputs), `5px` (cards), `6px` (nav/dropdowns).** Never use other radii; use `0px` for sharp hero sections.

5. **Cards have `1px solid #D4DEE9` borders, `5px` border-radius, and `32px` padding.** Hover state adds shadow `0px 4px 12px rgba(0, 0, 0, 0.08)` and border color shifts to `#B8CCDB`.

6. **Buttons are always `40px` tall minimum with `15.5px 24px 16.5px 24px` padding.** Primary buttons use `#533AFD` background + white text; secondary use white background + purple border + purple text; ghost buttons are transparent with purple text.

7. **Form inputs are `40px` tall, `12px 16px` padding, `1px solid #D4DEE9` border, `4px` radius.** Focus adds `2px solid #533AFD` border and `0px 0px 0px 3px rgba(83, 58, 253, 0.1)` shadow.

8. **Navigation bars are `64px` tall with `10px 16px` padding, white background, `1px solid #E5EDF5` bottom border.** Nav links are `14px` with `8px 12px` padding; hover background `#F3F3F3`, active text color `#533AFD`.

9. **Shadows are subtle and graduated: z-1 `0px 1px 2px rgba(0, 0, 0, 0.04)`, z-2 `0px 4px 12px rgba(0, 0, 0, 0.08)`, z-3 `0px 10px 40px rgba(0, 0, 0, 0.1)`, z-4 `0px 20px 60px rgba(0, 0, 0, 0.15)`.** Use shadows to indicate elevation, never for emphasis on flat surfaces.

10. **Gradient overlays on hero sections use `135deg` direction from `#533AFD` (top-left) to `#FF6118` (bottom-right) at `10–15%` opacity over white.** Apply as background-image, not as overlaid element, for performance.

11. **Mobile layouts collapse to single column at `<768px` with hamburger navigation, full-width inputs, and `20px` padding.** Reduce heading sizes by one level; maintain all spacing scale values.

12. **All text must meet 4.5:1 contrast ratio minimum.** Primary text (`#000000`, `#061B31`) on white achieves this; metadata uses `#64748D` on white (4.53:1).