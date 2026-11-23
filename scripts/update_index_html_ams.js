/**
 * scripts/update_index_html_ams.js
 *
 * Updates index.html to:
 * 1. Add "🔬 Advanced Medical Solutions (AMS)" brand tab as the primary active tab.
 * 2. Create "#brand-ams" panel with the exact 6 Roman numeral categories I to VI in order:
 *    I) MEDICAL ADHESIVES (IFABOND, LiquiBand-FIX8, LiquiBand-Exceed, LiquiBand-Optima)
 *    II) SUTURES (Natural, Synthetic, Non-Absorbable, Barbed Sutures)
 *    III) SURGICAL KITS (Surgical Kit - Obstetrics, Surgical Kit - Hernia)
 *    IV) HAEMOSTASIS (Titanium Clips)
 *    V) WOUND DRESSINGS (Genta-Coll resorb)
 *    VI) TROCAR (YelloPort® Elite — Reposable Laparoscopic Port Access System)
 * 3. Replace all "Sterilene Mesh" references with "Surgical Kit - Hernia" (preserving layout, styling, and technical hernia mesh features).
 * 4. Replace "Peters C-Section Kit" with "Surgical Kit - Obstetrics".
 * 5. Add "yelloport_elite" product data and SKU matrix into PRODUCTS dictionary.
 * 6. Add dynamic SKU Matrix table rendering inside openDetail modal.
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '../index.html');

// Create backup
const timestamp = Date.now();
fs.copyFileSync(INDEX_PATH, INDEX_PATH.replace('.html', `.backup-${timestamp}.html`));
console.log(`[Backup] Backed up index.html with timestamp ${timestamp}`);

let html = fs.readFileSync(INDEX_PATH, 'utf8');

// 1. Replace brand-tabs section
const oldTabsStart = html.indexOf('<div class="brand-tabs" role="tablist"');
const oldTabsEnd = html.indexOf('</div>', oldTabsStart) + 6;

const newTabs = `<div class="brand-tabs" role="tablist" aria-label="Product Brand Selection">
                        <button class="brand-tab active" data-brand="ams" onclick="switchBrand('ams')">🔬 Advanced Medical Solutions (AMS)</button>
                        <button class="brand-tab" data-brand="peters" onclick="switchBrand('peters')">🔬 Peters Surgical</button>
                        <button class="brand-tab" data-brand="liquiband" onclick="switchBrand('liquiband')">💉 LiquiBand®</button>
                        <button class="brand-tab" data-brand="cutimed" onclick="switchBrand('cutimed')">🩹 Cutimed® Sorbact®</button>
                        <button class="brand-tab" data-brand="gentacoll" onclick="switchBrand('gentacoll')">🧬 Genta-Coll® resorb</button>
                        <button class="brand-tab" data-brand="gore" onclick="switchBrand('gore')">🧪 W.L. Gore &amp; Associates</button>
                    </div>`;

html = html.substring(0, oldTabsStart) + newTabs + html.substring(oldTabsEnd);

// 2. Ensure brand-peters is not active by default (brand-ams will be active)
html = html.replace('<div class="brand-panel active" id="brand-peters">', '<div class="brand-panel" id="brand-peters">');

// 3. Replace Sterilene Mesh card and header in brand-peters
html = html.replace(/<h3>Sterilene Mesh<\/h3>/g, '<h3>Surgical Kit - Hernia</h3>');
html = html.replace(/onclick="openDetail\('sterilene_mesh'\)"/g, 'onclick="openDetail(\'surgical_kit_hernia\')"');
html = html.replace(/alt="Sterilene Mesh"/g, 'alt="Surgical Kit - Hernia"');
html = html.replace(/<div class="prod-card-name">Sterilene&#8482; Mesh<\/div>/g, '<div class="prod-card-name">Surgical Kit - Hernia</div>');
html = html.replace(/Light \/ Regular \/ Heavy variants<br>Open &amp;\s*Laparoscopic Hernia<\/div>/g, 'Light / Regular / Heavy variants<br>Open &amp; Laparoscopic Hernia Kit</div>');

// 4. Replace C-Section Kit card and header
html = html.replace(/<h3>C-Section Kit<\/h3>/g, '<h3>Surgical Kit - Obstetrics</h3>');
html = html.replace(/<div class="prod-card-name">Peters C-Section Kit<\/div>/g, '<div class="prod-card-name">Surgical Kit - Obstetrics</div>');

// 5. Build brand-ams panel with the exact 6 Roman numeral categories
const brandAmsPanel = `
                    <!-- ══════════════════════════════════════════════════════════════════════════════ -->
                    <!-- ADVANCED MEDICAL SOLUTIONS (AMS) PORTFOLIO — CATEGORIES I THROUGH VI           -->
                    <!-- ══════════════════════════════════════════════════════════════════════════════ -->
                    <div class="brand-panel active" id="brand-ams">

                        <!-- I) MEDICAL ADHESIVES -->
                        <div class="cat-section" id="ams-sec-medical-adhesives">
                            <div class="cat-hero" style="background:linear-gradient(135deg,#1b3a4b,#2c6e80);">
                                <div class="cat-hero-text">
                                    <h3>I) MEDICAL ADHESIVES</h3>
                                    <p>Advanced tissue adhesives and fixation solutions for open, laparoscopic, and bariatric procedures.</p>
                                </div>
                            </div>
                            <div class="prod-grid">
                                <!-- 1. IFABOND -->
                                <div class="prod-card" onclick="openDetail('ifabond')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048289/sriyas-healthcare/products/peters-surgical/ifabond-1.jpg" alt="IFABOND" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Surgical Adhesive · Cyanoacrylate</div>
                                        <div class="prod-card-name">IFABOND®</div>
                                        <div class="prod-card-spec">Pure n-hexyl cyanoacrylate<br>Class III Implantable &amp; Biodegradable</div>
                                    </div>
                                </div>
                                <!-- 2. LiquiBand-FIX8 -->
                                <div class="prod-card" onclick="openDetail('fix8')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048332/sriyas-healthcare/products/liquiband/fix8-1.jpg" alt="LiquiBand FIX8" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Laparoscopic Hernia Fixation</div>
                                        <div class="prod-card-name">LiquiBand® FIX8®</div>
                                        <div class="prod-card-spec">Precision droplet mesh fixation<br>33 &amp; 44 dose liquid anchors</div>
                                    </div>
                                </div>
                                <!-- 3. LiquiBand-Exceed -->
                                <div class="prod-card" onclick="openDetail('lb_exceed')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048327/sriyas-healthcare/products/liquiband/lb_exceed-1.jpg" alt="LiquiBand Exceed" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Topical Skin Adhesive</div>
                                        <div class="prod-card-name">LiquiBand® Exceed™</div>
                                        <div class="prod-card-spec">Felt applicator tip · 0.8g<br>High-viscosity octyl blend</div>
                                    </div>
                                </div>
                                <!-- 4. LiquiBand-Optima -->
                                <div class="prod-card" onclick="openDetail('lb_optima')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048319/sriyas-healthcare/products/liquiband/lb_optima-1.jpg" alt="LiquiBand Optima" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Topical Skin Adhesive</div>
                                        <div class="prod-card-name">LiquiBand® Optima</div>
                                        <div class="prod-card-spec">Winged actuator · 0.5g<br>Fast setting 10–30s seal</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- II) SUTURES -->
                        <div class="cat-section" id="ams-sec-sutures">
                            <div class="cat-hero" style="background:linear-gradient(135deg,#14213d,#284b63);">
                                <div class="cat-hero-text">
                                    <h3>II) SUTURES</h3>
                                    <p>Comprehensive surgical suture portfolio: Natural Absorbable, Synthetic Absorbable, Non-Absorbable, and FILBLOC Knotless Barbed Sutures.</p>
                                </div>
                            </div>
                            
                            <!-- Subcategory 1: Natural Absorbable Sutures -->
                            <div class="prod-cat-header" style="font-weight:700;color:var(--ink);margin:18px 0 10px;font-size:1.05rem;">1. Natural Absorbable Sutures</div>
                            <div class="prod-grid">
                                <div class="prod-card" onclick="openDetail('catgut')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048271/sriyas-healthcare/products/peters-surgical/catgut-1.jpg" alt="Catgut Chromic" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Natural Absorbable</div>
                                        <div class="prod-card-name">Catgut Chromic™</div>
                                        <div class="prod-card-spec">Chromic treatment · Predictable absorption</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Subcategory 2: Synthetic Absorbable Sutures -->
                            <div class="prod-cat-header" style="font-weight:700;color:var(--ink);margin:18px 0 10px;font-size:1.05rem;">2. Synthetic Absorbable Sutures</div>
                            <div class="prod-grid">
                                <div class="prod-card" onclick="openDetail('icol')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048286/sriyas-healthcare/products/peters-surgical/icol-1.jpg" alt="I-Col" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Braided Polyglactin 910</div>
                                        <div class="prod-card-name">I-Col™</div>
                                        <div class="prod-card-spec">Mid-term absorption (56–70 days)</div>
                                    </div>
                                </div>
                                <div class="prod-card" onclick="openDetail('icol_fast')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048287/sriyas-healthcare/products/peters-surgical/icol_fast-1.jpg" alt="I-Col Fast" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Fast Absorbable Polyglactin 910</div>
                                        <div class="prod-card-name">I-Col™ Fast</div>
                                        <div class="prod-card-spec">Rapid absorption (42 days)</div>
                                    </div>
                                </div>
                                <div class="prod-card" onclick="openDetail('polycol')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048297/sriyas-healthcare/products/peters-surgical/polycol-1.jpg" alt="Polycol" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Braided Polyglactin 910</div>
                                        <div class="prod-card-name">Polycol™</div>
                                        <div class="prod-card-spec">Premium European needle steel</div>
                                    </div>
                                </div>
                                <div class="prod-card" onclick="openDetail('stericryl')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048299/sriyas-healthcare/products/peters-surgical/stericryl-1.jpg" alt="Stericryl" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Monofilament Polyglecaprone 25</div>
                                        <div class="prod-card-name">Stericryl™</div>
                                        <div class="prod-card-spec">Ultra smooth tissue glide · 90–120 days</div>
                                    </div>
                                </div>
                                <div class="prod-card" onclick="openDetail('monocol')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048295/sriyas-healthcare/products/peters-surgical/monocol-1.jpg" alt="Monocol" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Monofilament Polydioxanone (PDO)</div>
                                        <div class="prod-card-name">Monocol™</div>
                                        <div class="prod-card-spec">Long-term tensile support (180–210 days)</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Subcategory 3: Non-Absorbable Sutures -->
                            <div class="prod-cat-header" style="font-weight:700;color:var(--ink);margin:18px 0 10px;font-size:1.05rem;">3. Non-Absorbable Sutures</div>
                            <div class="prod-grid">
                                <div class="prod-card" onclick="openDetail('sterisil')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048310/sriyas-healthcare/products/peters-surgical/sterisil-1.jpg" alt="Sterisil" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Braided Black Silk</div>
                                        <div class="prod-card-name">Sterisil™</div>
                                        <div class="prod-card-spec">Natural protein filament · Wax coated</div>
                                    </div>
                                </div>
                                <div class="prod-card" onclick="openDetail('sterilon')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048309/sriyas-healthcare/products/peters-surgical/sterilon-1.jpg" alt="Sterilon" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Monofilament Polyamide (Nylon)</div>
                                        <div class="prod-card-name">Sterilon™</div>
                                        <div class="prod-card-spec">Smooth passage · Skin &amp; plastic closure</div>
                                    </div>
                                </div>
                                <div class="prod-card" onclick="openDetail('sterilene_suture')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048308/sriyas-healthcare/products/peters-surgical/sterilene_suture-1.jpg" alt="Sterilene Suture" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Monofilament Polypropylene</div>
                                        <div class="prod-card-name">Sterilene™ Suture</div>
                                        <div class="prod-card-spec">Cardiovascular &amp; hernia fixation</div>
                                    </div>
                                </div>
                                <div class="prod-card" onclick="openDetail('steribon')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048298/sriyas-healthcare/products/peters-surgical/steribon-1.jpg" alt="Steribon" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Braided Polyester</div>
                                        <div class="prod-card-name">Steribon™</div>
                                        <div class="prod-card-spec">Silicone coated · High tensile retention</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Subcategory 4: Barbed Sutures - Knotless -->
                            <div class="prod-cat-header" style="font-weight:700;color:var(--ink);margin:18px 0 10px;font-size:1.05rem;">4. Barbed Sutures - Knotless</div>
                            <div class="prod-grid">
                                <div class="prod-card" onclick="openDetail('filbloc90')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048279/sriyas-healthcare/products/peters-surgical/filbloc90-1.jpg" alt="FILBLOC 90" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Knotless Barbed · PGCL</div>
                                        <div class="prod-card-name">FILBLOC® 90</div>
                                        <div class="prod-card-spec">Short-term absorption (90–120 days)</div>
                                    </div>
                                </div>
                                <div class="prod-card" onclick="openDetail('filbloc')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048275/sriyas-healthcare/products/peters-surgical/filbloc-1.png" alt="FILBLOC" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Knotless Barbed · PDO</div>
                                        <div class="prod-card-name">FILBLOC®</div>
                                        <div class="prod-card-spec">Long-term absorption (180–210 days)</div>
                                    </div>
                                </div>
                                <div class="prod-card" onclick="openDetail('filbloc_perm')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048281/sriyas-healthcare/products/peters-surgical/filbloc_perm-1.png" alt="FILBLOC Permanent" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Knotless Barbed · Polypropylene</div>
                                        <div class="prod-card-name">FILBLOC® Permanent</div>
                                        <div class="prod-card-spec">Permanent tension-free tissue closure</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- III) SURGICAL KITS -->
                        <div class="cat-section" id="ams-sec-surgical-kits">
                            <div class="cat-hero" style="background:linear-gradient(135deg,#1a2f42,#355070);">
                                <div class="cat-hero-text">
                                    <h3>III) SURGICAL KITS</h3>
                                    <p>Pre-assembled procedural kits: specialized obstetrics solutions and comprehensive hernia repair systems.</p>
                                </div>
                            </div>
                            <div class="prod-grid">
                                <!-- 1. Surgical Kit - Obstetrics -->
                                <div class="prod-card" onclick="openDetail('csection')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048273/sriyas-healthcare/products/peters-surgical/csection-1.jpg" alt="Surgical Kit - Obstetrics" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Pre-assembled Sterile Kit</div>
                                        <div class="prod-card-name">Surgical Kit - Obstetrics</div>
                                        <div class="prod-card-spec">Polycol™ + Stericryl™<br>All C-Section Layers</div>
                                    </div>
                                </div>
                                <!-- 2. Surgical Kit - Hernia -->
                                <div class="prod-card" onclick="openDetail('surgical_kit_hernia')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048303/sriyas-healthcare/products/peters-surgical/sterilene_mesh-1.jpg" alt="Surgical Kit - Hernia" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Flat Knitted · Polypropylene</div>
                                        <div class="prod-card-name">Surgical Kit - Hernia</div>
                                        <div class="prod-card-spec">Light / Regular / Heavy variants<br>Open &amp; Laparoscopic Hernia Kit</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- IV) HAEMOSTASIS -->
                        <div class="cat-section" id="ams-sec-haemostasis">
                            <div class="cat-hero" style="background:linear-gradient(135deg,#1c2541,#3a506b);">
                                <div class="cat-hero-text">
                                    <h3>IV) HAEMOSTASIS</h3>
                                    <p>High-grade surgical haemostasis: titanium ligation clips for precise vascular occlusion in open and endoscopic surgery.</p>
                                </div>
                            </div>
                            <div class="prod-grid">
                                <!-- 1. Titanium Clips -->
                                <div class="prod-card" onclick="openDetail('titanium')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048312/sriyas-healthcare/products/peters-surgical/titanium-1.jpg" alt="Titanium Clips" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Titanium Ligation Clips</div>
                                        <div class="prod-card-name">Titanium Clips</div>
                                        <div class="prod-card-spec">Chevron V-shape &amp; heart cross-section<br>Zero slippage · MRI compatible</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- V) WOUND DRESSINGS -->
                        <div class="cat-section" id="ams-sec-wound-dressings">
                            <div class="cat-hero" style="background:linear-gradient(135deg,#22223b,#4a4e69);">
                                <div class="cat-hero-text">
                                    <h3>V) WOUND DRESSINGS</h3>
                                    <p>Advanced collagen sponge and antibiotic wound dressing solutions including Genta-Coll resorb by Resorba / AMS.</p>
                                </div>
                            </div>
                            <div class="prod-grid">
                                <!-- 1. Genta-Coll resorb -->
                                <div class="prod-card" onclick="openDetail('gentacoll')">
                                    <div class="prod-card-img"><img src="https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048338/sriyas-healthcare/products/gentacoll/gentacoll-1.jpg" alt="Genta-Coll resorb" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Antibiotic Collagen Sponge</div>
                                        <div class="prod-card-name">Genta-Coll resorb</div>
                                        <div class="prod-card-spec">Equine collagen + Gentamicin<br>Dual haemostasis &amp; local infection prophylaxis</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- VI) TROCAR -->
                        <div class="cat-section" id="ams-sec-trocar">
                            <div class="cat-hero" style="background:linear-gradient(135deg,#0d1b2a,#1b263b);">
                                <div class="cat-hero-text">
                                    <h3>VI) TROCAR</h3>
                                    <p>YelloPort® Elite — Reposable Laparoscopic Port Access System by Microline Surgical. Universal Seal (5–12mm) and premium reusable cannula &amp; obturators.</p>
                                </div>
                            </div>
                            <div class="prod-grid">
                                <!-- 1. YelloPort® Elite -->
                                <div class="prod-card" onclick="openDetail('yelloport_elite')">
                                    <div class="prod-card-img"><img src="/assets/products/yelloport_elite-1.svg" alt="YelloPort Elite Trocar System" loading="lazy" /></div>
                                    <div class="prod-card-body">
                                        <div class="prod-card-cat">Laparoscopic Port Access System</div>
                                        <div class="prod-card-name">YelloPort® Elite — Reposable Laparoscopic Port Access System</div>
                                        <div class="prod-card-spec">Universal Seal (5–12mm) | Reposable Product<br>Microline Surgical / AMS</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
`;

// Insert brand-ams panel right before brand-peters
html = html.replace('<div class="brand-panel" id="brand-peters">', brandAmsPanel + '\n                    <div class="brand-panel" id="brand-peters">');

// 6. Update getBrandLabel in JavaScript
html = html.replace("return {", "return {\n                        ams: 'Advanced Medical Solutions (AMS) Products',");

// 7. Update PRODUCTS dictionary
// A. Update sterilene_mesh to surgical_kit_hernia
const sterileneSearch = "sterilene_mesh: {";
const sterileneIdx = html.indexOf(sterileneSearch);
if (sterileneIdx >= 0) {
  const sterileneEnd = html.indexOf("},", sterileneIdx) + 2;
  const surgicalKitHerniaCode = `surgical_kit_hernia: {
                    id: 'surgical_kit_hernia', brand: 'ams', cat: 'III) SURGICAL KITS · Hernia Repair System',
                    name: 'Surgical Kit - Hernia',
                    images: ['https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048303/sriyas-healthcare/products/peters-surgical/sterilene_mesh-1.jpg', 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048307/sriyas-healthcare/products/peters-surgical/sterilene_mesh-2.jpg'],
                    desc: 'Surgical Kit - Hernia provides a complete, flat knitted polypropylene mesh and fixation system for open and laparoscopic hernia repairs. Available in Light, Regular and Heavy variants to suit the specific clinical requirements of inguinal, ventral, umbilical, and incisional hernia procedures.',
                    features: ['Surgical Kit - Hernia Light: 56% lighter than regular mesh — better compatibility and fast tissue integration', 'Surgical Kit - Hernia Regular: Good shape memory and perfect fitment against cavity wall', 'Surgical Kit - Hernia Heavy: Highest tensile and burst strength — ideal for open hernia repair', 'Monofilament polypropylene — excellent biological inertness', 'Laser cutting for precise, fray-free edges', 'Complete Hernia Kit and Hernia Kit Plus procedural configurations available'],
                    specs: ['Material: Monofilament Polypropylene', 'Cutting Type: Laser', 'Sterilization: Ethylene Oxide (EO)', 'Colour: Clear — Undyed', 'Variants: Light (SPM611L), Regular (SFN842), Heavy (SFN841)', 'Hernia Kit: SPM611L/SPM715L + SFN842 + SFN841 + SFN3336 + SPL2341'],
                    apps: ['Laparoscopic inguinal hernia repair (TAPP/TEP)', 'Open inguinal hernia repair', 'Incisional hernia repair', 'Ventral hernia repair', 'Umbilical hernia repair', 'Complete procedural hernia repair kit']
                },
                sterilene_mesh: {
                    id: 'surgical_kit_hernia', brand: 'ams', cat: 'III) SURGICAL KITS · Hernia Repair System',
                    name: 'Surgical Kit - Hernia',
                    images: ['https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048303/sriyas-healthcare/products/peters-surgical/sterilene_mesh-1.jpg', 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048307/sriyas-healthcare/products/peters-surgical/sterilene_mesh-2.jpg'],
                    desc: 'Surgical Kit - Hernia provides a complete, flat knitted polypropylene mesh and fixation system for open and laparoscopic hernia repairs. Available in Light, Regular and Heavy variants to suit the specific clinical requirements of inguinal, ventral, umbilical, and incisional hernia procedures.',
                    features: ['Surgical Kit - Hernia Light: 56% lighter than regular mesh — better compatibility and fast tissue integration', 'Surgical Kit - Hernia Regular: Good shape memory and perfect fitment against cavity wall', 'Surgical Kit - Hernia Heavy: Highest tensile and burst strength — ideal for open hernia repair', 'Monofilament polypropylene — excellent biological inertness', 'Laser cutting for precise, fray-free edges', 'Complete Hernia Kit and Hernia Kit Plus procedural configurations available'],
                    specs: ['Material: Monofilament Polypropylene', 'Cutting Type: Laser', 'Sterilization: Ethylene Oxide (EO)', 'Colour: Clear — Undyed', 'Variants: Light (SPM611L), Regular (SFN842), Heavy (SFN841)', 'Hernia Kit: SPM611L/SPM715L + SFN842 + SFN841 + SFN3336 + SPL2341'],
                    apps: ['Laparoscopic inguinal hernia repair (TAPP/TEP)', 'Open inguinal hernia repair', 'Incisional hernia repair', 'Ventral hernia repair', 'Umbilical hernia repair', 'Complete procedural hernia repair kit']
                },`;
  html = html.substring(0, sterileneIdx) + surgicalKitHerniaCode + html.substring(sterileneEnd);
}

// B. Update csection to Surgical Kit - Obstetrics
html = html.replace(
  "cat: 'Surgical Kits · Obstetrics · Caesarean Section',\n                    name: 'Peters C-Section Kit',",
  "cat: 'III) SURGICAL KITS · Obstetrics · Caesarean Section',\n                    name: 'Surgical Kit - Obstetrics',"
);

// C. Add yelloport_elite to PRODUCTS
const yelloportCode = `yelloport_elite: {
                    id: 'yelloport_elite', brand: 'ams', cat: 'VI) TROCAR · Laparoscopic Port Access System',
                    name: 'YelloPort® Elite — Reposable Laparoscopic Port Access System',
                    images: ['/assets/products/yelloport_elite-1.svg'],
                    desc: 'YelloPort® Elite is a reposable laparoscopic port access system by Microline Surgical (an Advanced Medical Solutions company). Featuring a universal seal accommodating 5–12mm instruments without separate reducers, YelloPort® Elite combines single-use universal seals with high-grade reusable cannulas and obturators to deliver maximum clinical precision, cost-effectiveness, and low-profile ergonomics.',
                    features: [
                        'Accommodates 5–12mm instruments with zero reducer caps required',
                        'Reposable, cost-effective port access system combining single-use seals with reusable cannulas',
                        'Lightweight and low-profile design minimizes abdominal footprint and prevents instrument clash',
                        'Micro-ribbed cannula design ensures excellent abdominal wall retention during instrument exchanges',
                        'Available in multiple working lengths (75mm, 105mm, 150mm) and diameters (10mm, 12mm)',
                        'Four obturator styles available: Pencil Point, Blunt, Dilating Pyramidal, and Locking Shielded',
                        'Hasson adaptor and dedicated seals available for open cut-down access'
                    ],
                    specs: [
                        'Product Line: YelloPort® Elite — Reposable Laparoscopic Port Access System',
                        'Subtitle / Tagline: Universal Seal | Reposable Product',
                        'Instrument Range: 5mm to 12mm universal instrument entry',
                        'Cannula Options: Micro-Ribbed Reusable (10mm & 12mm; 75mm, 105mm, 150mm)',
                        'Obturator Styles: Pencil Point (Style 03), Blunt (Style 04), Dilating Pyramidal (Style 07), Locking Shielded (Style 09)',
                        'Universal Seal: Single-Use 5–12mm (Code: EA512US, Qty: 5)',
                        'Hasson Options: 10mm (EA10NH + EA10HS05) & 12mm (EA12NH + EA12HS05)',
                        'Manufacturer: Microline Surgical / Advanced Medical Solutions (AMS)'
                    ],
                    apps: [
                        'Laparoscopic general surgery (cholecystectomy, appendectomy, hernia repair)',
                        'Laparoscopic gynaecology (hysterectomy, cystectomy, diagnostic laparoscopy)',
                        'Laparoscopic bariatric surgery (150mm extended cannula options)',
                        'Laparoscopic urology (nephrectomy, prostatectomy)',
                        'Open cut-down Hasson primary access'
                    ],
                    skuMatrix: {
                        universalSeal: [
                            { component: 'Single-Use Universal Seal', diameter: '5–12mm', qty: 5, productCode: 'EA512US' }
                        ],
                        cannula: [
                            { diameter: '10mm', workingLength: '75mm', productCode: 'EC1007520' },
                            { diameter: '10mm', workingLength: '105mm', productCode: 'EC1010520' },
                            { diameter: '10mm', workingLength: '150mm', productCode: 'EC1015020' },
                            { diameter: '12mm', workingLength: '75mm', productCode: 'EC1207520' },
                            { diameter: '12mm', workingLength: '105mm', productCode: 'EC1210520' },
                            { diameter: '12mm', workingLength: '150mm', productCode: 'EC1215020' }
                        ],
                        obturator: [
                            { style: 'Pencil Point (Style 03)', diameter: '10mm', length75: 'ET1007503', length105: 'ET1010503', length150: 'ET1015003' },
                            { style: 'Pencil Point (Style 03)', diameter: '12mm', length75: 'ET1207503', length105: 'ET1210503', length150: 'ET1215003' },
                            { style: 'Blunt (Style 04)', diameter: '10mm', length75: 'ET1007504', length105: 'ET1010504', length150: 'ET1015004' },
                            { style: 'Blunt (Style 04)', diameter: '12mm', length75: 'ET1207504', length105: 'ET1210504', length150: 'ET1215004' },
                            { style: 'Dilating Pyramidal (Style 07)', diameter: '10mm', length75: 'ET1007507', length105: 'ET1010507', length150: 'ET1015007' },
                            { style: 'Dilating Pyramidal (Style 07)', diameter: '12mm', length75: 'ET1207507', length105: 'ET1210507', length150: 'ET1215007' },
                            { style: 'Locking Shielded (Style 09)', diameter: '10mm', length75: 'ET1007509', length105: 'ET1010509', length150: 'ET1015009' },
                            { style: 'Locking Shielded (Style 09)', diameter: '12mm', length75: 'ET1207509', length105: 'ET1210509', length150: 'ET1215009' }
                        ],
                        hasson: [
                            { component: '10mm Hasson Adaptor', diameter: '10mm', adaptorCode: 'EA10NH', sealsQty5Code: 'EA10HS05' },
                            { component: '12mm Hasson Adaptor', diameter: '12mm', adaptorCode: 'EA12NH', sealsQty5Code: 'EA12HS05' }
                        ]
                    }
                },\n                `;

const prodObjStart = html.indexOf('const PRODUCTS = {');
html = html.substring(0, prodObjStart + 18) + '\n                ' + yelloportCode + html.substring(prodObjStart + 18);

// 8. Add #ud-sku-matrix-wrap div inside universal product detail modal
const appsWrapEnd = html.indexOf('</ul>\n                        </div>', html.indexOf('id="ud-apps-wrap"')) + 36;
const skuWrapDiv = `\n                        <div id="ud-sku-matrix-wrap" style="display:none;margin-top:24px;"></div>`;
html = html.substring(0, appsWrapEnd) + skuWrapDiv + html.substring(appsWrapEnd);

// 9. Add SKU Matrix rendering into openDetail function
const openDetailFillLists = html.indexOf("fillList('ud-apps', p.apps);");
const skuMatrixRenderCode = `
                    // Render SKU Matrix tables if present
                    const skuWrap = document.getElementById('ud-sku-matrix-wrap');
                    if (skuWrap) {
                        if (p.skuMatrix) {
                            skuWrap.style.display = 'block';
                            let mHtml = '<div class="detail-sec-lbl" style="color:var(--gold,#c5a059);margin-bottom:12px;">System Components Breakdown &amp; SKU Matrix</div>';
                            
                            // 1. Universal Seal
                            if (p.skuMatrix.universalSeal) {
                                mHtml += '<div style="margin-bottom:14px;"><div style="font-size:0.86rem;font-weight:700;color:var(--ink);margin-bottom:6px;">1. Single-Use Universal Seal (Single-use only component)</div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.82rem;"><tr style="background:#f5f0e6;border-bottom:1px solid #dfba66;"><th style="padding:6px 8px;text-align:left;">Component</th><th style="padding:6px 8px;text-align:left;">Diameter</th><th style="padding:6px 8px;text-align:left;">Qty</th><th style="padding:6px 8px;text-align:left;">Code</th></tr>';
                                p.skuMatrix.universalSeal.forEach(u => {
                                    mHtml += '<tr style="border-bottom:1px solid #ede5d3;"><td style="padding:6px 8px;">' + (u.component || 'Universal Seal') + '</td><td style="padding:6px 8px;">' + u.diameter + '</td><td style="padding:6px 8px;">' + u.qty + '</td><td style="padding:6px 8px;font-weight:700;color:#9a762e;">' + u.productCode + '</td></tr>';
                                });
                                mHtml += '</table></div></div>';
                            }

                            // 2. Cannula
                            if (p.skuMatrix.cannula) {
                                mHtml += '<div style="margin-bottom:14px;"><div style="font-size:0.86rem;font-weight:700;color:var(--ink);margin-bottom:6px;">2. Reusable Cannula (Micro-Ribbed)</div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.82rem;"><tr style="background:#f5f0e6;border-bottom:1px solid #dfba66;"><th style="padding:6px 8px;text-align:left;">Diameter</th><th style="padding:6px 8px;text-align:left;">Working Length</th><th style="padding:6px 8px;text-align:left;">Code</th></tr>';
                                p.skuMatrix.cannula.forEach(c => {
                                    mHtml += '<tr style="border-bottom:1px solid #ede5d3;"><td style="padding:6px 8px;">' + c.diameter + '</td><td style="padding:6px 8px;">' + c.workingLength + '</td><td style="padding:6px 8px;font-weight:700;color:#9a762e;">' + c.productCode + '</td></tr>';
                                });
                                mHtml += '</table></div></div>';
                            }

                            // 3. Obturator
                            if (p.skuMatrix.obturator) {
                                mHtml += '<div style="margin-bottom:14px;"><div style="font-size:0.86rem;font-weight:700;color:var(--ink);margin-bottom:6px;">3. Reusable Trocar Obturator</div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.82rem;"><tr style="background:#f5f0e6;border-bottom:1px solid #dfba66;"><th style="padding:6px 8px;text-align:left;">Style</th><th style="padding:6px 8px;text-align:left;">Diameter</th><th style="padding:6px 8px;text-align:left;">75mm</th><th style="padding:6px 8px;text-align:left;">105mm</th><th style="padding:6px 8px;text-align:left;">150mm</th></tr>';
                                p.skuMatrix.obturator.forEach(o => {
                                    mHtml += '<tr style="border-bottom:1px solid #ede5d3;"><td style="padding:6px 8px;">' + o.style + '</td><td style="padding:6px 8px;">' + o.diameter + '</td><td style="padding:6px 8px;font-weight:700;color:#9a762e;">' + o.length75 + '</td><td style="padding:6px 8px;font-weight:700;color:#9a762e;">' + o.length105 + '</td><td style="padding:6px 8px;font-weight:700;color:#9a762e;">' + o.length150 + '</td></tr>';
                                });
                                mHtml += '</table></div></div>';
                            }

                            // 4. Hasson Adaptor
                            if (p.skuMatrix.hasson) {
                                mHtml += '<div style="margin-bottom:14px;"><div style="font-size:0.86rem;font-weight:700;color:var(--ink);margin-bottom:6px;">4. Reusable Hasson Adaptor &amp; Seals</div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.82rem;"><tr style="background:#f5f0e6;border-bottom:1px solid #dfba66;"><th style="padding:6px 8px;text-align:left;">Component</th><th style="padding:6px 8px;text-align:left;">Diameter</th><th style="padding:6px 8px;text-align:left;">Adaptor Code</th><th style="padding:6px 8px;text-align:left;">Seals (Qty 5) Code</th></tr>';
                                p.skuMatrix.hasson.forEach(h => {
                                    mHtml += '<tr style="border-bottom:1px solid #ede5d3;"><td style="padding:6px 8px;">' + h.component + '</td><td style="padding:6px 8px;">' + h.diameter + '</td><td style="padding:6px 8px;font-weight:700;color:#9a762e;">' + h.adaptorCode + '</td><td style="padding:6px 8px;font-weight:700;color:#9a762e;">' + h.sealsQty5Code + '</td></tr>';
                                });
                                mHtml += '</table></div></div>';
                            }

                            skuWrap.innerHTML = mHtml;
                        } else {
                            skuWrap.style.display = 'none';
                            skuWrap.innerHTML = '';
                        }
                    }
`;

html = html.substring(0, openDetailFillLists + 30) + skuMatrixRenderCode + html.substring(openDetailFillLists + 30);

fs.writeFileSync(INDEX_PATH, html, 'utf8');
console.log('[Update] index.html updated successfully with AMS portfolio categories I-VI and YelloPort Elite.');
