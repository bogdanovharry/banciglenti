# Product audit — what is still needed to match the new style (20 Nov 2026)

Source: the live Bulgarian shop (356 active products, crawled card by card), the Romanian shop (423 listed), both
databases, and screenshots of every category. "New style" = studio photograph on white with an orange mark
(size, steel or tooth) over it, a name that says what the product is, and a short text that says what it is for.

## 1. Photographs (356 active products, Bulgarian shop)

| Photograph now | Products | Verdict |
|---|---|---|
| Flexback ring + orange width (10mm) | 162 (hobby 163 + carbon CS) | New style. One photo for all. |
| ProCut / SoftCut rings + orange 10/30° / 14° | 48 + 40 | New style (live after the next deploy for the mark) |
| Meat blade + orange width | 9 | New style |
| Planer knife + orange HSS / 100Cr6 | 16 | New style |
| Circular saw OZ / VZ | 14 + 6 | New style (the photo reads 350 × 2,2 while the table says 2,15) |
| **Old dark crop (bohler_fixed)** | **20 bimetal M42 / M51** | **Needs a studio photo + orange mark (M42 / M51)** |
| **Old crop (kodiak.png)** | **10 Vector (vertical)** | **Needs a photo + mark, or the products go** |
| **Old crop (hardback_fixed)** | **1 bread blade** | **Needs the bread-blade photo** |
| **Grey spec tile (no photo)** | **7 carbide-tipped circular saws (HM, WZ)** | **Photo with plates + mark (HM, Z)** |
| **Grey spec tile** | **15 abrasives** (CBN discs, abrasive discs 10/3, 13/3, 8/3, diamond) | **One photo per kind (about 4)** |
| **Grey spec tile** | **4 machines** (ASM-60, ZM150, ZM101, CA130) | **A photo of each** |
| **Grey spec tile** | **4 consumables** (cam sets N and NU, measuring device) | **A photo of each (about 3)** |

So 57 products have no photo in the new style: 20 + 10 + 1 + 7 + 15 + 4 + 4 (and the photo count to shoot is about 20).

## 2. Information

Short description present (database), by category: horizontal 11 of 139 (only the generic ones; none of the 88
ready-cut), knives 0 of 16, abrasives 0 of 15, machines 0 of 4, consumables 0 of 4, carbide saws 0 of 7, bimetal
16 of 20, carbon CS 135 of 162, hobby 185 of 224, vertical 10 of 10, meat and bread 9 of 9. No product has a long
description; the series text appears only on series products. Product pages without it are about 500 characters:
a name, two dimensions, a price.

What to write or give:
- 88 ready-cut horizontal blades: one line each from the line (ProCut universal 10/30°, SoftCut soft wood 14°) — can be generated.
- 16 planer knives: what HSS and 100Cr6 are for, hardness if known.
- 7 carbide saws and the plain saws: number of teeth (Z), tooth type, bore, maximum speed (the photos print it).
- 15 abrasives: what each is for, grit, bore, max speed.
- 4 machines: power, voltage, what it sharpens, size — a buyer of a 6 890 € machine needs a spec sheet.
- 4 consumables: what they fit.
- 27 carbon CS and 39 hobby products without a text.

## 3. Consistency

- Bulgarian shop writes 1.1 and 0.65 (dot) in names and dimensions; the Romanian shop writes 1,1 and 0,65. Bulgarian
  uses the comma too. Decision needed.
- Names mix Latin "x" and Cyrillic "х", "мм" and "mm", "1бр." and "1 бр.".
- 112 retired (inactive) products still sit in the Bulgarian database; they are hidden but add noise to the admin.
- Vertical bandsaws has 10 products, all Vector without a length. The 230 hobby links were removed on 20 Nov.
- The Romanian shop lists 423 products against 356 in Bulgaria: the two catalogues have drifted apart.
- The Romanian texts have no Cyrillic left in names or pages (checked on 10 product kinds).
