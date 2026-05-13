# La Carnicería — Icon Batch Generation Spec

**Version:** 1.0.0
**Total icons:** 28 (× 2 variants = 56 assets)
**Target site:** `index.html` (vanilla HTML/JS, Tailwind CDN)
**Style:** minimalist flat, editorial brutalist, B&W with strict color accents

---

## 0. TL;DR — what your batch tool should produce

```
/output
  ├── manifest.json              ← single source of truth
  ├── icons.svg                  ← <symbol> sprite sheet (all icons)
  ├── icons.ts                   ← TypeScript registry (auto-generated)
  ├── gallery.html               ← visual QA contact sheet
  ├── /svg/
  │   ├── meat-ribeye.svg
  │   ├── meat-ribeye--dark.svg
  │   ├── meat-pollo.svg
  │   ├── meat-pollo--dark.svg
  │   └── ... (56 SVGs total)
  ├── /png/
  │   ├── meat-ribeye-1024.png
  │   ├── meat-ribeye-512.png
  │   └── ... (PNG masters at multiple sizes)
  └── /prompts/
      ├── meat-ribeye.prompt.json   ← sidecar: prompt, seed, model, params
      └── ... (one per icon for reproducibility)
```

---

## 1. Style Preamble (PREPEND to every prompt)

```
Minimalist flat vector icon, editorial brutalist style. Strict rules:
- Pure off-white background (#FAFAF7), subject perfectly centered, square 1:1 composition
- Bold thick black outlines, 3–4px stroke weight, high contrast
- SOLID flat color fills only — NO gradients, NO shadows, NO 3D, NO photorealism, NO textures
- Strict color palette: black (#0A0A0A), off-white (#FAFAF7), plus the accent colors specified
- Geometric simplification, clean shapes, generous padding (subject fills ~70% of frame)
- NO text, letters, numbers, watermarks, or signatures
- Consistent stroke weight across all elements
- Style reference: Saul Bass, Massimo Vignelli, vintage butcher shop signage, Bauhaus pictograms

Subject:
```

---

## 2. Color Palette Tokens

Use these CSS variables in the final SVGs (replace hex literals at post-processing step).

| Token | Hex | Used in |
|---|---|---|
| `--ink` | `#0A0A0A` | All outlines (light variant) |
| `--paper` | `#FAFAF7` | Backgrounds, white fills, outlines (dark variant) |
| `--meat-deep` | `#7A1A1A` | Chorizo, costilla interior |
| `--meat-red` | `#9B3A2A` | Fajita, mixto, sausages |
| `--meat-bright` | `#C45A4A` | Ribeye, sirloin, t-bone meat |
| `--meat-strip` | `#B04535` | NY strip, Aguja |
| `--meat-pollo` | `#D4A566` | Chicken |
| `--meat-marble` | `#F4D2C0` | Marbling dots |
| `--bone-cream` | `#F4ECDC` | T-bone, ribs, fat strip |
| `--cheese-yellow` | `#E8C44A` | Cheddar specks |
| `--sausage-amber` | `#A8602A` | Cheddar/jalapeño sausage |
| `--green-jalapeno` | `#3A8A3A` | Jalapeños, salsa verde, herbs |
| `--green-deep` | `#3A4A1A` | Avocado pit |
| `--green-clara` | `#7A9A3A` | Guacamole, salsa verde clara |
| `--green-herb` | `#3A5A2A` | Onion top, salsa tatemada |
| `--bean-brown` | `#5A3210` | Charro beans |
| `--bean-dark` | `#3A1A08` | Bean shadows |
| `--potato-tan` | `#D8B167` | Papa, chips, fajipapa |
| `--potato-spot` | `#7A4A1A` | Potato spots |
| `--rice-tan` | `#D8C89A` | Rice grains |
| `--tortilla-corn` | `#E8C890` | Corn tortilla |
| `--tortilla-corn-spot` | `#A87A40` | Corn tortilla spots |
| `--tortilla-flour` | `#F4ECDC` | Flour tortilla |
| `--tortilla-flour-spot` | `#C8B890` | Flour tortilla spots |
| `--tomato-red` | `#C43A2A` | Pico, tomato dots, soda red |
| `--soda-amber` | `#7A3A1A` | Cola bottles |
| `--soda-grey` | `#3A3A3A` | 2L bottle body |
| `--soda-grey-light` | `#9A9A9A` | Diet variants |
| `--garnish-stem` | `#5A4A2A` | Pepper stems |

---

## 3. Output Format & Naming

### Filename convention

```
{category}-{id}.svg          ← light variant (black outlines)
{category}-{id}--dark.svg    ← dark variant (white outlines, transparent bg)
{category}-{id}-{size}.png   ← raster fallbacks
```

### Categories
- `meat` — packages with grilled meat
- `sausage` — chorizo variants
- `side` — grilled sides
- `sauce` — sauces, salsas, tortillas, extras
- `drink` — bebidas

### File sizes to emit
- SVG (primary, vectorized + optimized)
- PNG @ 1024px (master, kept for re-vectorization)
- PNG @ 512px (raster fallback)
- WebP @ 512px (optimized fallback)

---

## 4. Pipeline Steps

```
1. For each icon spec:
   a. Render PROMPT (light variant) → Gemini → PNG 1024×1024
   b. Render PROMPT (dark variant) → Gemini → PNG 1024×1024 transparent bg
   c. Save PNG masters + sidecar .prompt.json (prompt, seed, model, timestamp)
2. Vectorize each PNG → SVG using vtracer (or potrace)
3. Run SVGO with these plugins:
   - removeMetadata
   - removeComments
   - cleanupNumericValues (precision: 2)
   - mergePaths
   - convertColors (currentColor where applicable)
4. Token replacement pass: substitute hex literals with CSS variables (var(--token))
5. Generate /icons.svg sprite (all SVGs as <symbol> elements)
6. Generate /manifest.json (see section 5)
7. Generate /icons.ts (TypeScript registry, see section 9)
8. Generate /gallery.html (contact sheet for visual QA)
9. Validate:
   - All 56 files present
   - Each SVG only uses palette tokens
   - Each manifest entry has alt text in ES + EN
10. Output ZIP or folder for delivery
```

---

## 5. Manifest Schema

```json
{
  "$schema": "https://schemas.lacarniceria/icons-1.0.json",
  "version": "1.0.0",
  "generated": "2026-05-05T12:00:00Z",
  "model": "gemini-2.5-flash-image",
  "total": 28,
  "icons": [
    {
      "id": "ribeye",
      "category": "meat",
      "files": {
        "svg": "svg/meat-ribeye.svg",
        "svg_dark": "svg/meat-ribeye--dark.svg",
        "png_1024": "png/meat-ribeye-1024.png",
        "png_512": "png/meat-ribeye-512.png",
        "webp_512": "png/meat-ribeye-512.webp"
      },
      "colors": ["--ink", "--paper", "--meat-bright", "--meat-marble"],
      "alt": {
        "es": "Corte ribeye ovalado visto desde arriba con marmoleo",
        "en": "Oval ribeye cut viewed from above with marbling"
      },
      "used_by": ["sr2", "sr4"],
      "prompt": "<full prompt text>",
      "prompt_dark": "<full prompt text>",
      "seed": 12345,
      "size_px": 1024
    }
  ]
}
```

---

## 6. Icon Specifications (28 entries)

> **Note:** Prepend the **Style Preamble** (section 1) to every Prompt before sending to the model.
> For variants of the same silhouette (e.g., the 5 salsa bottles, 3 chorizos), generate the base ONCE then re-prompt with `"same exact silhouette and composition, change [X] color to #YYYYYY"` for color consistency.

---

### 🥩 MEAT / PACKAGES (8)

#### 01 · `special-plate`
- **Category:** meat
- **Used by:** `special` (Wed & Thu Special)
- **Colors:** `--ink`, `--paper`, `--meat-red`, `--meat-deep`, `--cheese-yellow`
- **Alt ES:** Plato cuadrado con dos tiras de fajita y una salchicha curva
- **Alt EN:** Square plate with two fajita strips and one curved sausage
- **Prompt (light):**
  > A square white plate viewed from directly above with two horizontal strips of charcoal-grilled fajita meat in deep red-brown (#9B3A2A) and one curled segment of smoked sausage in dark red (#7A1A1A) neatly arranged. Small yellow garnish dot (#E8C44A) in the corner. Bold black plate outline.
- **Prompt (dark):** *Same subject, but render with off-white (#FAFAF7) outlines instead of black, and transparent background. All fill colors stay the same.*

#### 02 · `pollo`
- **Category:** meat
- **Used by:** `cf2`, `cf4` (Chicken Fajita)
- **Colors:** `--ink`, `--meat-pollo`, `--potato-spot`
- **Alt ES:** Muslo de pollo asado dorado con marcas de parrilla
- **Alt EN:** Golden grilled chicken thigh with grill marks
- **Prompt (light):**
  > A whole grilled chicken thigh viewed front-on, warm golden color (#D4A566), rounded compact silhouette, two subtle dark brown grill marks (#7A4A20) across the surface, one small black eye dot. Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 03 · `arrachera`
- **Category:** meat
- **Used by:** `bf2`, `bf4` (Beef Fajita)
- **Colors:** `--ink`, `--meat-red`, `--paper`
- **Alt ES:** Corte de arrachera alargado con marcas de parrilla
- **Alt EN:** Long skirt steak with diagonal grill marks
- **Prompt (light):**
  > A long elongated skirt steak (arrachera cut), gentle horizontal S-curve, deep red-brown (#9B3A2A), with five thin diagonal off-white grill-mark stripes (#FAFAF7). Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 04 · `mixto`
- **Category:** meat
- **Used by:** `mg5`, `mm5`, `mn` (Mixto Ganadera, Mixto Meat, Mixto Norteño)
- **Colors:** `--ink`, `--paper`, `--meat-red`, `--meat-deep`, `--meat-pollo`, `--green-jalapeno`
- **Alt ES:** Plato redondo con tres tipos de carne mixta y guarnición
- **Alt EN:** Round plate with three mixed meats and a garnish
- **Prompt (light):**
  > A round white plate viewed from directly above containing three pieces arranged: a red beef strip (#9B3A2A), a curled sausage (#7A1A1A), and a chicken piece (#D4A566), with a small green herb dot (#3A8A3A) for garnish. Bold black plate rim.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 05 · `costilla`
- **Category:** meat
- **Used by:** `co2`, `co4` (Costillitas)
- **Colors:** `--ink`, `--meat-deep`, `--bone-cream`
- **Alt ES:** Costillas de cerdo con tres huesos visibles
- **Alt EN:** Pork ribs slab with three visible bones
- **Prompt (light):**
  > A rectangular slab of pork ribs viewed front-on, deep brown meat base (#7A2A18), with three horizontal cream-white rib bones (#F4ECDC) cutting across the slab. Bold black outline, slight rounded corners.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 06 · `newyork`
- **Category:** meat
- **Used by:** `an2`, `an4` (Aguja Norteña)
- **Colors:** `--ink`, `--meat-strip`, `--bone-cream`
- **Alt ES:** Corte rectangular de aguja con tira de grasa
- **Alt EN:** Rectangular strip cut with fat strip on one side
- **Prompt (light):**
  > A rectangular New York strip / aguja steak viewed from above, deep red color (#B04535), with a vertical strip of cream-colored fat (#F4ECDC) along the left side. Bold black border, slightly rounded corners.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 07 · `ribeye`
- **Category:** meat
- **Used by:** `sr2`, `sr4` (Sirloin)
- **Colors:** `--ink`, `--meat-bright`, `--meat-marble`
- **Alt ES:** Corte ovalado de ribeye con marmoleo visible
- **Alt EN:** Oval ribeye cut with visible marbling
- **Prompt (light):**
  > An oval ribeye steak viewed from directly above, marbled deep red (#C45A4A), with three small pale circular marbling dots (#F4D2C0) scattered across the surface. Bold thick black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 08 · `tbone`
- **Category:** meat
- **Used by:** `ll2`, `ll4` (Laminita de León)
- **Colors:** `--ink`, `--meat-bright`, `--bone-cream`
- **Alt ES:** Corte T-bone con hueso central en forma de T
- **Alt EN:** T-bone steak with distinctive T-shaped center bone
- **Prompt (light):**
  > A T-bone steak viewed from above, distinctive T-shaped cream-white bone (#F4ECDC) dividing two sections of red beef (#C45A4A) — a smaller filet section and a larger strip section. Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

---

### 🌭 SAUSAGES (3)

#### 09 · `chorizo`
- **Category:** sausage
- **Used by:** `ss` (Smoked Sausage)
- **Colors:** `--ink`, `--meat-deep`, `--meat-marble`
- **Alt ES:** Salchicha curva ahumada en color rojo profundo
- **Alt EN:** Curved smoked sausage in deep red
- **Prompt (light):**
  > A curled sausage link in deep red (#7A1A1A), gentle S-curve horizontal shape, with five small vertical tie marks dividing the link into segments. Three tiny pale dots (#F4D2C0) for texture. Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 10 · `chorizo-cheddar`
- **Category:** sausage
- **Used by:** `ssc` (Cheddar Smoked Sausage)
- **Colors:** `--ink`, `--sausage-amber`, `--cheese-yellow`
- **Alt ES:** Salchicha curva color ámbar con trozos de queso cheddar
- **Alt EN:** Curved amber sausage with yellow cheddar specks
- **Prompt (light):**
  > A curled sausage link in caramel-amber color (#A8602A), same S-curve as previous sausage, with three bright yellow cheese specks (#E8C44A) scattered along the link. Vertical tie marks. Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 11 · `chorizo-jalapeno`
- **Category:** sausage
- **Used by:** `ssjc` (Jalapeño & Cheddar Sausage)
- **Colors:** `--ink`, `--sausage-amber`, `--cheese-yellow`, `--green-jalapeno`
- **Alt ES:** Salchicha ámbar con queso amarillo y jalapeño verde
- **Alt EN:** Amber sausage with yellow cheese and green jalapeño bits
- **Prompt (light):**
  > A curled sausage link in caramel-amber (#A8602A), same S-curve silhouette, with three yellow cheese specks (#E8C44A) AND two small bright green jalapeño bits (#3A8A3A). Vertical tie marks. Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

---

### 🌶️ GRILL SIDES (8)

#### 12 · `chili`
- **Category:** side
- **Used by:** `rat` (Ratones / Stuffed Jalapeños)
- **Colors:** `--ink`, `--green-jalapeno`, `--garnish-stem`, `--bone-cream`
- **Alt ES:** Jalapeño relleno verde con queso visible
- **Alt EN:** Green stuffed jalapeño with visible cheese filling
- **Prompt (light):**
  > A bright green stuffed jalapeño pepper (#3A8A3A) standing vertically, brown stem at top (#5A4A2A), with cream-white cheese filling (#F4ECDC) peeking through a vertical slit in the front. Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 13 · `onion`
- **Category:** side
- **Used by:** `on` (Grilled Onion)
- **Colors:** `--ink`, `--paper`, `--potato-tan`, `--green-herb`
- **Alt ES:** Cebolla asada vista desde arriba con anillos concéntricos
- **Alt EN:** Grilled onion ring viewed from above with concentric rings
- **Prompt (light):**
  > A grilled onion viewed from directly above, off-white concentric rings (#FAFAF7) with golden caramelized edges (#D8B167), two small green chive sprigs (#3A5A2A) on top crossing each other. Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 14 · `chips`
- **Category:** side
- **Used by:** `gch`, `gch2` (Ganadera Chips)
- **Colors:** `--ink`, `--potato-tan`, `--potato-spot`
- **Alt ES:** Bolsa trapezoidal de chips de tortilla doradas
- **Alt EN:** Trapezoidal bag of golden tortilla chips
- **Prompt (light):**
  > A trapezoidal bag of tortilla chips, golden-tan body (#D8B167), with five visible brown chip-triangle shapes inside (#7A4A1A). Sealed top edge with crimped detail. Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 15 · `side-frijol`
- **Category:** side
- **Used by:** `cb`, `cb2`, `cb-add` (Charro Beans)
- **Colors:** `--ink`, `--bean-brown`, `--bean-dark`
- **Alt ES:** Tazón ovalado con frijoles charros oscuros
- **Alt EN:** Oval bowl filled with dark charro beans
- **Prompt (light):**
  > A wide oval bowl viewed front-on, filled with dark brown beans (#5A3210), with four darker bean shapes visible inside (#3A1A08). Bold black bowl outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 16 · `chicharron`
- **Category:** side
- **Used by:** `chsv` (Chicharrón en Salsa Verde)
- **Colors:** `--ink`, `--soda-amber`, `--green-jalapeno`
- **Alt ES:** Chicharrón irregular con drizzle de salsa verde
- **Alt EN:** Puffy fried pork rind with green salsa drizzle
- **Prompt (light):**
  > A puffy fried pork rind in caramel-brown (#7A3A1A), irregular cloud-like organic shape, with three bright green salsa verde drizzle lines on top (#3A8A3A). Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 17 · `side-papa`
- **Category:** side
- **Used by:** `pa` (Papa Asada)
- **Colors:** `--ink`, `--potato-tan`, `--potato-spot`
- **Alt ES:** Papa asada ovalada con piel dorada y manchas
- **Alt EN:** Oval baked potato with golden skin and spots
- **Prompt (light):**
  > An oval baked potato horizontal orientation, golden-tan skin (#D8B167) with three darker brown spots (#7A4A1A), slightly cracked top showing texture. Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 18 · `fajipapa`
- **Category:** side
- **Used by:** `fp` (Fajipapa)
- **Colors:** `--ink`, `--potato-tan`, `--meat-red`, `--paper`
- **Alt ES:** Papa asada coronada con fajita y crema
- **Alt EN:** Baked potato topped with fajita meat and cream
- **Prompt (light):**
  > An oval baked potato horizontal orientation (golden-tan #D8B167) topped with three chunks of red-brown fajita meat (#9B3A2A) and two small white cream/cheese dots (#FAFAF7). Bold black potato outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 19 · `rice`
- **Category:** side
- **Used by:** `ar8`, `ar16`, `ar32` (Arroz Caliente, all sizes)
- **Colors:** `--ink`, `--paper`, `--rice-tan`
- **Alt ES:** Tazón ancho con arroz blanco y vapor
- **Alt EN:** Wide bowl with white rice and steam curl
- **Prompt (light):**
  > A wide trapezoidal rice bowl viewed front-on, filled with off-white rice (#FAFAF7), with eight small tan grain dots (#D8C89A) visible. A thin steam curl line rising above the bowl. Bold black bowl outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

---

### 🌶️ SAUCES & MORE (5)

#### 20 · `side-tortilla`
- **Category:** sauce
- **Used by:** `ct`, `ct-add` (Corn Tortillas)
- **Colors:** `--ink`, `--tortilla-corn`, `--tortilla-corn-spot`
- **Alt ES:** Tortilla de maíz circular amarilla con manchas
- **Alt EN:** Round yellow corn tortilla with dark specks
- **Prompt (light):**
  > A perfect circle representing a stack of corn tortillas viewed from directly above, warm yellow-tan color (#E8C890) with six small darker brown speckles (#A87A40) randomly distributed. Bold black circular outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 21 · `tortilla-flour`
- **Category:** sauce
- **Used by:** `ft`, `ft-add` (Flour Tortillas)
- **Colors:** `--ink`, `--tortilla-flour`, `--tortilla-flour-spot`
- **Alt ES:** Tortilla de harina circular color crema con manchas suaves
- **Alt EN:** Round cream-colored flour tortilla with subtle specks
- **Prompt (light):**
  > A perfect circle representing a stack of flour tortillas viewed from directly above, pale cream color (#F4ECDC) with six subtle tan specks (#C8B890) randomly distributed. Bold black circular outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 22 · `salsa-bottle`
- **Category:** sauce
- **Used by:** `av`, `srl`, `sn`, `svt`, `svc`, `sr-add`, `av-add` (all 5 bottle salsas)
- **Colors:** `--ink`, `--paper`, `--meat-red` (default; varies per salsa)
- **Alt ES:** Botella geométrica de salsa con etiqueta blanca
- **Alt EN:** Geometric salsa bottle silhouette with white label
- **Prompt (light) — base (Salsa Roja):**
  > A tall geometric salsa bottle silhouette with narrow neck and rounded shoulders, deep red body (#9B3A2A), with a rectangular white label (#FAFAF7) across the middle showing two thin black horizontal lines (no actual text). Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*
- **Color variants** (regenerate with `"same exact bottle silhouette and composition, change body color to #X"`):
  - Salsa Roja: `#9B3A2A` *(base)*
  - Avocado Salsa: `#7A9A3A`
  - Salsa Naranja: `#C25A1A`
  - Salsa Verde Tatemada: `#3A5A2A`
  - Salsa Verde Clara: `#7A9A3A` (lighter, slightly brighter)

#### 23 · `pico`
- **Category:** sauce
- **Used by:** `pg` (Pico de Gallo)
- **Colors:** `--ink`, `--paper`, `--tomato-red`, `--green-jalapeno`
- **Alt ES:** Tazón redondo con pico de gallo en cubitos
- **Alt EN:** Round bowl with diced pico de gallo
- **Prompt (light):**
  > A round bowl viewed from directly above, filled with diced pico de gallo: four small red tomato squares (#C43A2A), three small white onion squares (#FAFAF7 with thin black outline), three small green cilantro squares (#3A8A3A), all evenly distributed. Bold black bowl outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 24 · `side-guaca`
- **Category:** sauce
- **Used by:** `gua`, `gua-add` (Guacamole)
- **Colors:** `--ink`, `--green-clara`, `--green-deep`, `--tomato-red`, `--paper`
- **Alt ES:** Tazón redondo con guacamole verde y hueso oscuro
- **Alt EN:** Round bowl with bright green guacamole and dark pit
- **Prompt (light):**
  > A round bowl viewed from directly above, filled with bright green guacamole (#7A9A3A), a dark green avocado pit shape at the center (#3A4A1A), with two small red tomato dots (#C43A2A) and two tiny white onion specks (#FAFAF7). Bold black bowl outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

---

### 🥤 DRINKS (4)

#### 25 · `soda-can`
- **Category:** drink
- **Used by:** `jfp`, `jdz`, `jmz` (Joya cans)
- **Colors:** `--ink`, `--paper`, `--tomato-red`, `--soda-grey-light`
- **Alt ES:** Lata vertical de aluminio con etiqueta blanca y tapa
- **Alt EN:** Vertical aluminum soda can with white label band
- **Prompt (light):**
  > A vertical aluminum soda can, deep red body (#C43A2A), with a horizontal off-white label band across the middle (#FAFAF7) showing two thin black horizontal lines (no actual text). Dark grey pull tab on top (#9A9A9A). Bold black can outline with rounded top and bottom rims.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 26 · `soda-bottle`
- **Category:** drink
- **Used by:** `ccm`, `sp20`, `cc20`, `dp20`, `cz20`, `cd20` (20oz bottles + Coca Mexicana)
- **Colors:** `--ink`, `--paper`, `--soda-amber`, `--tomato-red`
- **Alt ES:** Botella plástica de refresco 20oz con tapa rosca y etiqueta
- **Alt EN:** 20oz plastic soda bottle with screw cap and label
- **Prompt (light):**
  > A 20oz plastic soda bottle silhouette with screw cap on top, amber-brown body (#7A3A1A), narrow neck transitioning to wider body, rectangular off-white label (#FAFAF7) across the middle with one thin red horizontal stripe (#C43A2A) and two thin black lines below. Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 27 · `soda-2l`
- **Category:** drink
- **Used by:** `ms2`, `cz2`, `dp2`, `cc25`, `jp25`, `fr25`, `jm25` (2L + 2.5L bottles)
- **Colors:** `--ink`, `--paper`, `--soda-grey`, `--tomato-red`
- **Alt ES:** Botella plástica grande de 2 litros con etiqueta amplia
- **Alt EN:** Tall 2-liter plastic soda bottle with wide label
- **Prompt (light):**
  > A tall 2-liter plastic soda bottle with screw cap on top, dark grey body (#3A3A3A), narrow neck flaring to wider body, large off-white rectangular label (#FAFAF7) across the middle with a thin red horizontal accent stripe (#C43A2A) and two thin black lines. Taller proportions than 20oz bottle. Bold black outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

#### 28 · `soda-pack`
- **Category:** drink
- **Used by:** `pcdc`, `pcsp`, `pccc` (12-Packs)
- **Colors:** `--ink`, `--paper`, `--tomato-red`
- **Alt ES:** Caja rectangular de 12-pack con asa en la parte superior
- **Alt EN:** Rectangular 12-pack box with handle on top
- **Prompt (light):**
  > A rectangular 12-pack soda box viewed from front, deep red color (#C43A2A), with a 4×3 grid pattern (vertical and horizontal black divider lines) showing 12 small white circles (#FAFAF7) representing can tops. A black carry handle arch on top of the box. Bold black box outline.
- **Prompt (dark):** *Same subject with off-white outlines (#FAFAF7), transparent background.*

---

## 7. Variant Generation — automation pattern

For maximum consistency across the 56 outputs:

```python
# Pseudo-code for the batch tool
for icon in spec.icons:
    light_png = generate(
        prompt=STYLE_PREAMBLE + icon.prompt,
        size=1024,
        seed=icon.seed,  # deterministic
    )

    dark_png = generate(
        prompt=STYLE_PREAMBLE + icon.prompt
               + "\n\nVARIANT: Replace black outline color (#0A0A0A) with off-white (#FAFAF7). "
               + "Render on TRANSPARENT background instead of white. "
               + "Keep all fill colors and composition IDENTICAL.",
        size=1024,
        seed=icon.seed,  # SAME seed = same composition
    )

    save(light_png, f"png/{icon.category}-{icon.id}-1024.png")
    save(dark_png, f"png/{icon.category}-{icon.id}--dark-1024.png")
    save_sidecar(icon, f"prompts/{icon.id}.prompt.json")
```

**Color variants** (e.g., 5 salsas sharing `salsa-bottle`): generate the base ONCE, then chain follow-ups in the same conversation:
```
Same exact bottle silhouette and composition. Change body color from #9B3A2A to #7A9A3A.
```

---

## 8. Validation Rules (run after batch)

The tool should auto-fail and re-prompt if any icon fails these checks:

| Rule | Pass condition |
|---|---|
| **Palette compliance** | All non-transparent pixels match a token in section 2 (within 5% tolerance) |
| **Outline weight** | Black outline thickness between 3–5px at 1024×1024 |
| **Padding** | At least 12% blank padding on all sides at 1024×1024 |
| **Background (light variant)** | Solid `#FAFAF7` ±2 |
| **Background (dark variant)** | Fully transparent (alpha = 0) |
| **No text** | OCR pass returns empty / no recognized characters |
| **Centering** | Subject bounding box center within 5% of canvas center |
| **Both variants present** | Light + dark + at least one PNG size + sidecar |
| **Alt text** | Both `alt.es` and `alt.en` non-empty in manifest |

---

## 9. Code Generator — emit `icons.ts`

After the manifest is built, emit a TypeScript file your app imports directly:

```typescript
// AUTO-GENERATED by icon batch tool — do not edit by hand
// Source: manifest.json @ 2026-05-05T12:00:00Z

export const ICON_REGISTRY = {
  ribeye: {
    svg: '/icons/svg/meat-ribeye.svg',
    svgDark: '/icons/svg/meat-ribeye--dark.svg',
    alt: { es: 'Corte ribeye ovalado visto desde arriba', en: 'Oval ribeye cut from above' },
    usedBy: ['sr2', 'sr4'],
  },
  pollo: {
    svg: '/icons/svg/meat-pollo.svg',
    svgDark: '/icons/svg/meat-pollo--dark.svg',
    alt: { es: 'Muslo de pollo asado', en: 'Grilled chicken thigh' },
    usedBy: ['cf2', 'cf4'],
  },
  // ... 26 more
} as const;

export type IconId = keyof typeof ICON_REGISTRY;

export function getIcon(id: IconId, variant: 'light' | 'dark' = 'light'): string {
  const entry = ICON_REGISTRY[id];
  return variant === 'dark' ? entry.svgDark : entry.svg;
}

export function getIconAlt(id: IconId, lang: 'es' | 'en'): string {
  return ICON_REGISTRY[id].alt[lang];
}
```

This replaces the 600-line inline `svgIcon()` switch statement currently in `index.html`.

---

## 10. Gallery / QA Sheet

The batch tool should also emit `gallery.html` — a contact sheet showing every icon in its real contexts. Layout:

```
┌─────────────────────────────────────────────────┐
│  ribeye                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ 32px │  │ 64px │  │ 128px│  │ 256px│         │
│  └──────┘  └──────┘  └──────┘  └──────┘         │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ on white │  │ on black │  │ on cream │       │
│  │ (light)  │  │ (dark)   │  │ (light)  │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                 │
│  Used by: Sirloin (sr2, sr4)                    │
│  Colors: --ink, --meat-bright, --meat-marble    │
│  Prompt: [collapsible]                          │
└─────────────────────────────────────────────────┘
```

Open in browser → scan all 28 in 30 seconds → spot inconsistencies → flag for regeneration.

---

## 11. Regeneration workflow

If one icon comes out wrong:

```bash
# Single-icon regeneration with same seed
batch-tool regen --id ribeye --reason "marbling too small"

# Or with a tweaked prompt
batch-tool regen --id ribeye --prompt-suffix "with bigger more visible marbling dots"

# Or with a new seed (if you want a different composition)
batch-tool regen --id ribeye --new-seed
```

The sidecar `.prompt.json` always preserves the LAST successful prompt + seed so the rest of the set stays untouched.

---

## 12. Final Deliverables Checklist

Before shipping the batch:

- [ ] 28 SVGs (light variant) in `/svg/`
- [ ] 28 SVGs (dark variant) in `/svg/`
- [ ] 28 PNG @ 1024px in `/png/`
- [ ] 28 PNG @ 512px in `/png/`
- [ ] 28 WebP @ 512px in `/png/`
- [ ] 28 sidecar `.prompt.json` files in `/prompts/`
- [ ] `manifest.json` (root)
- [ ] `icons.svg` sprite sheet (root)
- [ ] `icons.ts` TypeScript registry (root)
- [ ] `gallery.html` contact sheet (root)
- [ ] All 28 entries pass the 9 validation rules in section 8
- [ ] Salsa bottle generated in 5 color variants (already covered)
- [ ] Chorizo generated in 3 variants (already covered)

Total assets: **56 SVGs + 84 raster files + 28 sidecars + 4 root files = 172 files**.

---

**End of spec.** Hand this entire document to your batch tool. Every prompt, color, alt text, and validation rule it needs is here.
