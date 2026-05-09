// Motion Medical — navigation + form behavior + i18n (EN / FI)
(function () {

  // ============================================================
  // i18n — language switcher (EN / FI)
  // Mark translatable elements with data-i18n="key.path".
  // Translations dictionary is below; per-page <body> can also
  // carry data-title-i18n="key" to translate the document title.
  // Choice persists in localStorage as "mm-lang".
  // ============================================================
  const translations = {
    en: {
      // Top bar
      'tb.locations': 'Helsinki HQ',

      // Nav
      'nav.home': 'Home',
      'nav.solutions': 'Clinical Solutions',
      'nav.packs': 'Procedure Packs',
      'nav.quality': 'Quality &amp; Compliance',
      'nav.contact': 'Contact',

      // Footer
      'footer.blurb': 'Nordic Integrity. Interventional Excellence. Validated surgical access solutions designed under Finnish quality control and CE-marked under MDR (EU) 2017/745.',
      'footer.locations': '<strong>Helsinki HQ</strong> · Strategy &amp; Quality Control<br><strong>Ankara Hub</strong> · Production &amp; Global Shipping',
      'footer.col.solutions': 'Clinical Solutions',
      'footer.col.company': 'Company',
      'footer.col.certs': 'Certifications',
      'footer.link.inflator': 'Inflator',
      'footer.link.manifold': 'Manifold',
      'footer.link.boneCement': 'Bone Cement',
      'footer.link.viewAll': 'View all',
      'footer.link.home': 'Home',
      'footer.copyright': '© 2026 Motion Medical · Helsinki, Finland',

      // Homepage hero
      'home.hero.eyebrow': 'Motion Medical · Helsinki, Finland',
      'home.hero.h1': 'Nordic integrity —<br><span>interventional excellence.</span>',
      'home.hero.lead': "Providing the world's clinics with validated surgical access solutions — designed under Finnish quality control and CE-marked under MDR (EU) 2017/745.",
      'home.hero.cred1': 'CE-Certified MDR',
      'home.hero.cred2': 'Trusted in 50+ Countries',
      'home.hero.cred3': '100,000+ procedures',
      'home.hero.cta': 'Clinical Solutions',

      // Trust strip
      'home.trust.eyebrow': 'Trusted across Europe and the Mediterranean',
      'country.finland': 'Finland',
      'country.france': 'France',
      'country.italy': 'Italy',
      'country.germany': 'Germany',
      'country.denmark': 'Denmark',
      'country.switzerland': 'Switzerland',

      // Bridge — Finnish Connection
      'home.bridge.eyebrow': 'The Finnish Connection',
      'home.bridge.h2': 'A bridge between Nordic quality and high-capacity manufacturing.',
      'home.bridge.p1': 'Motion Medical gives procurement teams one accountable partner for CE-marked interventional devices — with tender-ready documentation, traceable manufacturing, and EU-adjacent dispatch.',
      'home.bridge.p2': 'Our Finnish team owns design control, the technical file, post-market surveillance, and Notified Body interface. Our Ankara facility handles clean-room production, EO sterilisation, and global dispatch. One quality system. Every device accountable end-to-end.',
      'home.bridge.meta1.label': 'Regulatory HQ',
      'home.bridge.meta1.name': 'Helsinki, Finland',
      'home.bridge.meta1.desc': 'Quality system · MDR file · PMS',
      'home.bridge.meta2.label': 'Manufacturing',
      'home.bridge.meta2.name': 'Ankara, Türkiye',
      'home.bridge.meta2.desc': 'ISO 13485 facility · EO sterile',
      'home.bridge.meta3.label': 'Logistics',
      'home.bridge.meta3.name': 'Ex-Works Ankara',
      'home.bridge.meta3.desc': 'Container &amp; air freight ready',

      // Features row
      'home.features.title': 'Built for the cath-lab and the spine theatre',
      'home.features.sub': 'Two clinical pillars. Five product families. Every device validated under the same Helsinki-owned quality system.',
      'home.feat1.h3': 'MDR &amp; ISO certified',
      'home.feat1.p': 'Every product is CE-marked under MDR (EU) 2017/745 and manufactured under ISO 13485:2016.',
      'home.feat2.h3': 'Precision at 1 200 PSI',
      'home.feat2.p': 'Burst-rated manifolds, 0–30 atm indeflators and colour-coded pressure gauges — calibrated for the procedure.',
      'home.feat3.h3': 'Atraumatic by design',
      'home.feat3.p': 'Ergonomic bodies, secure Luer-lock connections and EO-sterilised single-use delivery for patient safety.',

      // Product range cards
      'home.range.title': 'Our product range',
      'home.range.sub': 'Two clinical pillars and a dedicated bone cement line.',
      'home.range.card1.h3': 'Inflator',
      'home.range.card2.h3': 'Manifold',
      'home.range.card3.h3': 'Bone Cement',
      'home.range.explore': 'Explore',
      'home.range.seeAll': 'See all products',

      // CTA band
      'home.cta.h2': 'Need a quote or a sample?',
      'home.cta.p': 'Our team responds to procurement and technical inquiries within one business day.',
      'home.cta.btn': 'Contact Us',

      // WhatsApp FAB tooltip
      'wa.tooltip': 'Chat with us',

      // Page titles
      'title.home': 'Motion Medical — Nordic Integrity. Interventional Excellence.',
      'title.products': 'Clinical Solutions — Motion Medical',
      'title.packs': 'Procedure Packs — Motion Medical',
      'title.quality': 'Quality & Compliance — Motion Medical',
      'title.contact': 'Contact — Motion Medical',
      'title.manifold': 'Manifold — Motion Medical',
      'title.manifoldKit': 'Manifold Kit Set — Motion Medical',
      'title.coronary': 'Coronary Injector — Motion Medical',
      'title.inflator20': 'Inflator 20 cc — Motion Medical',
      'title.inflator30': 'Inflator 30 cc — Motion Medical',
      'title.radial': 'Trans Radial Band — Motion Medical',
      'title.kyphoplasty': 'Kyphoplasty Inflator — Motion Medical',
      'title.boneMixer': 'Bone Cement Delivery System — Motion Medical',
      'title.orthoCement': 'Orthopedic Bone Cement — Motion Medical',
      'title.vertCement': 'Vertebroplasty Bone Cement — Motion Medical',

      // Common (shared across multiple pages)
      'common.included': "What's included",
      'common.features': 'Features & specifications',
      'common.indications': 'Indications',
      'common.variants': 'Available variants',
      'common.contactUs': 'Contact Us',
      'common.cert.ce': '✓ CE Certified (MDR 2017/745)',
      'common.cert.iso': '✓ ISO 13485 Compliant',
      'common.cert.en': '✓ EN ISO 5833 Tested',
      'common.viewDetails': 'View details →',

      // Sub-family headings (used on products.html and indirectly elsewhere)
      'subfam.fluid': 'Fluid Management',
      'subfam.inflation': 'Inflation Systems',
      'subfam.hemostasis': 'Hemostasis',
      'subfam.kyphoplasty': 'Kyphoplasty',
      'subfam.boneManagement': 'Bone Management',

      // Product card names + taglines (used on products.html)
      'prod.manifold.name': 'Manifold',
      'prod.manifold.tag': '3-way high-pressure manifold for contrast management',
      'prod.manifoldKit.name': 'Manifold Kit Set',
      'prod.manifoldKit.tag': 'Complete kit for contrast and pressurized fluid control',
      'prod.coronary.name': 'Coronary Injector',
      'prod.coronary.tag': '12 cc precision injector for angiography',
      'prod.inflator20.name': 'Inflator 20 cc',
      'prod.inflator20.tag': 'High-pressure 0–30 atm balloon inflation device',
      'prod.inflator30.name': 'Inflator 30 cc',
      'prod.inflator30.tag': 'Higher-volume 0–30 atm inflator with rotatable handle',
      'prod.radial.name': 'Trans Radial Band',
      'prod.radial.tag': 'Atraumatic radial arm band for post-procedure hemostasis',
      'prod.kyphoplasty.name': 'Kyphoplasty Inflator',
      'prod.kyphoplasty.tag': 'Dedicated 0–30 atm inflator for vertebral body balloons',
      'prod.boneCementMixer.name': 'Bone Cement Delivery System',
      'prod.boneCementMixer.tag': 'Closed-system rotary mixer & cement delivery',
      'prod.orthoCement.name': 'Orthopedic Bone Cement',
      'prod.orthoCement.tag': 'PMMA radiopaque cement for joint prosthesis fixation — with or without antibiotic',
      'prod.vertCement.name': 'Vertebroplasty Bone Cement',
      'prod.vertCement.tag': 'Sterile radiopaque PMMA for stabilizing vertebral compression fractures',

      // products.html
      'products.h1': 'Clinical Solutions',
      'products.intro': 'Two clinical pillars. Five product families. Every device CE-marked under MDR (EU) 2017/745, manufactured under ISO 13485:2016, EO-sterilised and supplied for single use.',
      'products.pillar1.h2': 'Interventional Access',
      'products.pillar1.p': 'For coronary, peripheral and radiological intervention. Fluid Management · Inflation Systems · Hemostasis.',
      'products.pillar2.h2': 'Vertebral Augmentation',
      'products.pillar2.p': 'For percutaneous spinal procedures. Kyphoplasty Kits · Bone Management.',
      'products.pillar3.h2': 'Bone Cement',
      'products.pillar3.p': 'PMMA-based radiopaque surgical bone cements — for joint prosthesis fixation and vertebroplasty.',
      'products.cta.h2': 'Need pricing, lead times, or samples?',
      'products.cta.p': 'Distribution enquiries are handled directly by our Helsinki team. Most quotations are returned within two working days.',
      'products.cta.btn': 'Open Distribution Inquiry',

      // packs (procedure-packs.html)
      'packs.h1': 'Procedure Packs',
      'packs.intro': 'One SKU. One sterile pouch. One procedure ready to begin. Pre-assembled bundles that reduce SKU count, simplify tender response and remove connector-mismatch risk at the bedside.',
      'packs.pack1.eyebrow': 'Pack 01 — Cardiology',
      'packs.pack1.h3': 'The Cath-Lab Essentials',
      'packs.pack1.p': 'A pre-configured bundle of manifolds, a 12 cc coronary injector, a calibrated indeflator and a radial hemostasis band — the four items most consistently opened in sequence during a trans-radial PCI.',
      'packs.pack2.eyebrow': 'Pack 02 — Spine',
      'packs.pack2.h3': 'The Spine-Restore Kit',
      'packs.pack2.p': 'The complete consumable set for a percutaneous balloon kyphoplasty procedure. Pairs the dedicated Kyphoplasty Indeflator with a closed-system Bone Cement Mixer — eliminating the contamination risk of open-bowl mixing.',
      'packs.custom.h2': 'Custom configurations',
      'packs.custom.sub': 'Most national tenders specify a configuration that does not match a standard SKU. We assemble custom procedure packs from the catalog — single private-label SKU, unified Declaration of Conformity.',
      'packs.moq.h3': 'Minimum order',
      'packs.moq.p': 'From 100 packs per SKU. Lower quantities considered on a per-tender basis.',
      'packs.lead.h3': 'Lead time',
      'packs.lead.p': '4–6 weeks Ex-Works Istanbul for custom packs. Standard packs ship from stock.',
      'packs.private.h3': 'Private label',
      'packs.private.p': 'Available under your distributor brand, subject to Notified Body review of the technical file.',
      'packs.custom.btn': 'Open a custom-pack enquiry →',
      'packs.cta.h2': 'Procurement teams: we answer within one business day.',
      'packs.cta.p': 'Distribution enquiries are handled directly by our Helsinki team. Samples, quotations and technical documentation on request.',

      // quality.html
      'quality.h1': 'Quality & Compliance',
      'quality.intro': 'Motion Medical utilizes a strategic manufacturing partnership in Türkiye, operating under strict Finnish quality oversight. Our manufacturing partner is fully MDR (EU) 2017/745 compliant — ensuring European safety standards with Mediterranean logistics agility.',
      'quality.tab.protocol': 'The Helsinki Protocol',
      'quality.tab.mdr': 'MDR & Certification',
      'quality.tab.sustain': 'Sustainability',
      'quality.s1.eyebrow': '01 — The Helsinki Protocol',
      'quality.s1.h2': 'A strategic partnership, declared in plain language.',
      'quality.s1.sub': 'How our Finnish team audits the Ankara manufacturing site against the full requirements of MDR (EU) 2017/745.',
      'quality.split.helsinki.eyebrow': 'Helsinki HQ',
      'quality.split.helsinki.h3': 'Strategy & Quality Control',
      'quality.split.helsinki.li1': 'CE technical file update & control',
      'quality.split.helsinki.li2': 'Person Responsible for Regulatory Compliance (PRRC)',
      'quality.split.helsinki.li3': 'Risk management file (ISO 14971)',
      'quality.split.helsinki.li4': 'Post-market surveillance & vigilance reporting',
      'quality.split.helsinki.li5': 'Notified Body & distributor interface',
      'quality.split.ankara.eyebrow': 'Ankara Hub',
      'quality.split.ankara.h3': 'Production & Global Shipping',
      'quality.split.ankara.li1': 'ISO 13485:2016 certified production facility',
      'quality.split.ankara.li2': 'Injection moulding, assembly and packaging',
      'quality.split.ankara.li3': 'Validated EO sterilisation',
      'quality.split.ankara.li4': 'Incoming and finished-goods quality control',
      'quality.split.ankara.li5': 'Lot release and traceability records',
      'quality.split.ankara.li6': 'Ex-Works dispatch to global distributors',
      'quality.gates.h3': 'A device leaves our facilities only after passing four checkpoints.',
      'quality.gate1.h3': 'Design Lock',
      'quality.gate1.p': 'Every device is fixed against a controlled technical file held in Helsinki. Drawings, materials, biocompatibility data and risk analyses cannot be changed at the production line.',
      'quality.gate1.owner': 'Owned by — Helsinki',
      'quality.gate2.h3': 'In-Process Audit',
      'quality.gate2.p': 'Annual scheduled audits and unannounced visits to the Ankara site cover clean-room discipline, calibration records, operator training files and incoming-material traceability.',
      'quality.gate2.owner': 'Owned by — Helsinki QA',
      'quality.gate3.h3': 'EO Validation',
      'quality.gate3.p': 'Every sterilisation lot is released against validated cycle parameters and biological indicator results. No lot ships without a signed Certificate of Sterility.',
      'quality.gate3.owner': 'Owned by — Ankara QC',
      'quality.gate4.h3': 'Post-Market Loop',
      'quality.gate4.p': "Complaints, field reports and trending data flow back into Helsinki's PMS system within 48 hours — and into a quarterly review with the Ankara production team.",
      'quality.gate4.owner': 'Owned by — Helsinki PMS',
      'quality.s2.eyebrow': '02 — MDR & Certification',
      'quality.s2.h2': 'European safety standards. Verifiable, not asserted.',
      'quality.s2.sub': 'We do not manufacture in Finland; we do not pretend to. The certificates that authorise the product to be placed on the EU market are real, current, and named below. Available on request to qualified distributors and tender authorities.',
      'quality.cert1.eyebrow': 'Regulatory',
      'quality.cert1.h4': 'CE Certificate',
      'quality.cert1.p': 'Issued by Notified Body under MDR Annex IX. Lists product families, classification and the manufacturing site.',
      'quality.cert2.eyebrow': 'Quality',
      'quality.cert2.h4': 'ISO 13485:2016',
      'quality.cert2.p': 'Issued for the Ankara manufacturing site. Covers design transfer, production, sterilisation and post-market.',
      'quality.cert3.eyebrow': 'Per-lot',
      'quality.cert3.h4': 'Certificate of Sterility',
      'quality.cert3.p': 'Issued for each EO sterilisation lot — cycle parameters, dwell time and biological indicator results.',
      'quality.cert4.eyebrow': 'Per-shipment',
      'quality.cert4.h4': 'Finnish Free Sales Certificate',
      'quality.cert4.p': 'Signed by the PRRC in Helsinki.',
      'quality.trans.badge': 'Transparency policy',
      'quality.trans.h3': 'We name the Motion Medical on every commercial document.',
      'quality.trans.p': 'Quotations, invoices, authorization letters and product labels all identify Motion Medical (Helsinki) brand and the Ankara facility as the production site. Distributors, hospital procurement and Notified Bodies see the same information.',
      'quality.s3.eyebrow': '03 — Sustainability',
      'quality.s3.h2': 'Smart Packaging. Less waste at the bedside.',
      'quality.s3.sub': 'Single-use medical devices generate a real volume of clinical waste. As a Finnish company, we hold ourselves to the Nordic standard on environmental impact — without compromising sterility or shelf life.',
      'quality.stat1.h3': 'Reduced packaging mass',
      'quality.stat1.p': 'Across the indeflator and manifold lines, switching to a right-sized carton and thinner recyclable pouch removed more than a third of the packaging weight per unit.',
      'quality.stat2.h3': 'Less paper in the pouch',
      'quality.stat2.p': 'Multi-language paper IFUs replaced with a QR-linked eIFU library — per MDR Article 5(3). Distributor-language inserts only where required by national law.',
      'quality.stat3.h3': 'Recyclable secondary',
      'quality.stat3.p': 'Outer cartons and dividers are FSC-certified mono-material board, printed with soy-based ink. Recyclable in standard hospital and municipal streams.',
      'quality.road.badge': 'Roadmap',
      'quality.road.h3': 'Per-SKU CO₂e disclosure by 2027',
      'quality.road.p': 'We are working on a per-SKU carbon footprint to be published alongside each Declaration of Conformity from 2027 onwards, aligned with the EU Corporate Sustainability Reporting Directive.',
      'quality.cta.h2': 'Need the full quality dossier?',
      'quality.cta.p': 'CE certificate, ISO 13485 site certificate, technical file summary and PMS report — issued under NDA to qualified distributor partners and tender authorities.',
      'quality.cta.btn': 'Request Documentation',

      // contact.html
      'contact.h1': 'Contact',
      'contact.intro': 'Questions, quotations, or a sample request — reach our sales team directly.',
      'contact.sidebar.h2': 'Get in touch',
      'contact.sidebar.intro': "Whether you're evaluating a single device or planning a multi-site rollout, we'd like to hear from you.",
      'contact.office.helsinki': 'Helsinki HQ',
      'contact.office.ankara': 'Ankara Office',
      'contact.success.h3': 'Message received',
      'contact.success.p': "We'll get back to you within one business day.",
      'form.name': 'Full name<span class="req" aria-hidden="true">*</span>',
      'form.email': 'Work email<span class="req" aria-hidden="true">*</span>',
      'form.company': 'Company / hospital',
      'form.country': 'Country',
      'form.phone': 'Phone',
      'form.inquiry': 'Inquiry type',
      'form.inquiry.quote': 'Request a quote',
      'form.inquiry.product': 'Product question',
      'form.inquiry.partnership': 'Partnership',
      'form.inquiry.other': 'Other',
      'form.message': 'Message<span class="req" aria-hidden="true">*</span>',
      'form.required': 'Fields marked <span class="req">*</span> are required.',
      'form.send': 'Send message',
      'form.reassurance': "We reply within one business day. Your information stays with our sales team — we don't share or resell data.",

      // Product page eyebrows
      'title.manifold.eyebrow': 'Interventional Fluid Management',
      'title.manifoldKit.eyebrow': 'Interventional Fluid Management',
      'title.coronary.eyebrow': 'Interventional Fluid Management',
      'title.inflator20.eyebrow': 'Balloon Catheter Inflation',
      'title.inflator30.eyebrow': 'Balloon Catheter Inflation',
      'title.radial.eyebrow': 'Hemostasis · Radial Compression',
      'title.kyphoplasty.eyebrow': 'Vertebral Augmentation · Dedicated Inflation',
      'title.boneMixer.eyebrow': 'Bone Management · PMMA Mix & Delivery',
      'title.orthoCement.eyebrow': 'Bone Cement · Orthopedic',
      'title.vertCement.eyebrow': 'Bone Cement · Vertebroplasty',

      // 404
      'title.notfound': 'Page not found — Motion Medical',
      'notfound.code': 'Error 404',
      'notfound.h1': 'Page not found',
      'notfound.p': "The page you're looking for doesn't exist or has moved. Try the navigation above, or head back to the homepage.",
      'notfound.btn': 'Back to homepage',
    },

    // ────────────── FINNISH ──────────────
    // Note: translations done by Claude — please review with a native
    // Finnish speaker (especially marketing copy nuance) before launch.
    fi: {
      'tb.locations': 'Helsingin pääkonttori',

      'nav.home': 'Etusivu',
      'nav.solutions': 'Kliiniset ratkaisut',
      'nav.packs': 'Toimenpidepakkaukset',
      'nav.quality': 'Laatu &amp; vaatimustenmukaisuus',
      'nav.contact': 'Yhteystiedot',

      'footer.blurb': 'Pohjoismainen integriteetti. Interventiotoimenpiteiden huippuosaamista. Validoituja kirurgisia pääsyratkaisuja, jotka on suunniteltu suomalaisen laadunvalvonnan alaisena ja CE-merkitty MDR (EU) 2017/745 -asetuksen mukaisesti.',
      'footer.locations': '<strong>Helsingin pääkonttori</strong> · Strategia ja laadunvalvonta<br><strong>Ankaran tehdas</strong> · Tuotanto ja maailmanlaajuiset toimitukset',
      'footer.col.solutions': 'Kliiniset ratkaisut',
      'footer.col.company': 'Yritys',
      'footer.col.certs': 'Sertifioinnit',
      'footer.link.inflator': 'Inflaattori',
      'footer.link.manifold': 'Jakotukki',
      'footer.link.boneCement': 'Luusementti',
      'footer.link.viewAll': 'Katso kaikki',
      'footer.link.home': 'Etusivu',
      'footer.copyright': '© 2026 Motion Medical · Helsinki, Suomi',

      'home.hero.eyebrow': 'Motion Medical · Helsinki, Suomi',
      'home.hero.h1': 'Pohjoismainen integriteetti —<br><span>interventiotoimenpiteiden huippuosaamista.</span>',
      'home.hero.lead': 'Tarjoamme maailman klinikoille validoituja kirurgisia pääsyratkaisuja — suunniteltu suomalaisen laadunvalvonnan alaisena ja CE-merkitty MDR (EU) 2017/745 -asetuksen mukaisesti.',
      'home.hero.cred1': 'CE-merkitty MDR',
      'home.hero.cred2': 'Luotettu yli 50 maassa',
      'home.hero.cred3': '100 000+ toimenpidettä',
      'home.hero.cta': 'Kliiniset ratkaisut',

      'home.trust.eyebrow': 'Luotettu koko Euroopassa ja Välimeren alueella',
      'country.finland': 'Suomi',
      'country.france': 'Ranska',
      'country.italy': 'Italia',
      'country.germany': 'Saksa',
      'country.denmark': 'Tanska',
      'country.switzerland': 'Sveitsi',

      'home.bridge.eyebrow': 'Suomalainen yhteys',
      'home.bridge.h2': 'Silta pohjoismaisen laadun ja korkean kapasiteetin valmistuksen välillä.',
      'home.bridge.p1': 'Motion Medical tarjoaa hankintatiimeille yhden vastuullisen kumppanin CE-merkityille interventiolaitteille — tarjouspyyntövalmiilla dokumentaatiolla, jäljitettävällä valmistuksella ja EU:n läheisellä lähetyksellä.',
      'home.bridge.p2': 'Suomalainen tiimimme vastaa suunnittelusta, teknisestä asiakirjasta, markkinoille tulon jälkeisestä valvonnasta ja ilmoitetun laitoksen rajapinnasta. Ankaran tehtaamme hoitaa puhdastilatuotannon, EO-sterilisaation ja maailmanlaajuiset toimitukset. Yksi laatujärjestelmä. Jokainen laite vastuullisesti seurattu päästä päähän.',
      'home.bridge.meta1.label': 'Sääntelypääkonttori',
      'home.bridge.meta1.name': 'Helsinki, Suomi',
      'home.bridge.meta1.desc': 'Laatujärjestelmä · MDR-tiedosto · PMS',
      'home.bridge.meta2.label': 'Valmistus',
      'home.bridge.meta2.name': 'Ankara, Turkki',
      'home.bridge.meta2.desc': 'ISO 13485 -tehdas · EO-steriili',
      'home.bridge.meta3.label': 'Logistiikka',
      'home.bridge.meta3.name': 'Ex-Works Ankara',
      'home.bridge.meta3.desc': 'Konttirahti ja lentorahti valmiina',

      'home.features.title': 'Suunniteltu sydänlaboratorioon ja selkäteatteriin',
      'home.features.sub': 'Kaksi kliinistä pilaria. Viisi tuoteperhettä. Jokainen laite validoitu samalla Helsinki-omistuksellisella laatujärjestelmällä.',
      'home.feat1.h3': 'MDR- ja ISO-sertifioitu',
      'home.feat1.p': 'Jokainen tuote on CE-merkitty MDR (EU) 2017/745 -asetuksen mukaisesti ja valmistettu ISO 13485:2016 -standardin mukaisesti.',
      'home.feat2.h3': 'Tarkkuus 1 200 PSI:ssä',
      'home.feat2.p': 'Murtopaineluokitellut jakotukit, 0–30 atm indeflaattorit ja värikoodatut painemittarit — kalibroitu toimenpidettä varten.',
      'home.feat3.h3': 'Atraumaattisesti suunniteltu',
      'home.feat3.p': 'Ergonomiset rungot, turvalliset Luer-lock-liitännät ja EO-steriloitu kertakäyttöinen toimitus potilasturvallisuuden takaamiseksi.',

      'home.range.title': 'Tuotevalikoimamme',
      'home.range.sub': 'Kaksi kliinistä pilaria ja oma luusementtilinja.',
      'home.range.card1.h3': 'Inflaattori',
      'home.range.card2.h3': 'Jakotukki',
      'home.range.card3.h3': 'Luusementti',
      'home.range.explore': 'Tutustu',
      'home.range.seeAll': 'Katso kaikki tuotteet',

      'home.cta.h2': 'Tarvitsetko tarjouksen tai näytteen?',
      'home.cta.p': 'Tiimimme vastaa hankinta- ja teknisiin kyselyihin yhden työpäivän sisällä.',
      'home.cta.btn': 'Ota yhteyttä',

      'wa.tooltip': 'Jutellaan',

      // Page titles
      'title.home': 'Motion Medical — Pohjoismainen integriteetti. Interventiotoimenpiteiden huippuosaamista.',
      'title.products': 'Kliiniset ratkaisut — Motion Medical',
      'title.packs': 'Toimenpidepakkaukset — Motion Medical',
      'title.quality': 'Laatu ja vaatimustenmukaisuus — Motion Medical',
      'title.contact': 'Yhteystiedot — Motion Medical',
      'title.manifold': 'Jakotukki — Motion Medical',
      'title.manifoldKit': 'Jakotukkisarja — Motion Medical',
      'title.coronary': 'Sepelvaltimoinjektori — Motion Medical',
      'title.inflator20': 'Inflaattori 20 cc — Motion Medical',
      'title.inflator30': 'Inflaattori 30 cc — Motion Medical',
      'title.radial': 'Radiaalipuristusside — Motion Medical',
      'title.kyphoplasty': 'Kyfoplastia-inflaattori — Motion Medical',
      'title.boneMixer': 'Luusementin annostelujärjestelmä — Motion Medical',
      'title.orthoCement': 'Ortopedinen luusementti — Motion Medical',
      'title.vertCement': 'Vertebroplastia-luusementti — Motion Medical',

      // Common
      'common.included': 'Sisältö',
      'common.features': 'Ominaisuudet ja tekniset tiedot',
      'common.indications': 'Käyttöaiheet',
      'common.variants': 'Saatavilla olevat versiot',
      'common.contactUs': 'Ota yhteyttä',
      'common.cert.ce': '✓ CE-sertifioitu (MDR 2017/745)',
      'common.cert.iso': '✓ ISO 13485 -yhteensopiva',
      'common.cert.en': '✓ EN ISO 5833 -testattu',
      'common.viewDetails': 'Lue lisää →',

      // Sub-family headings
      'subfam.fluid': 'Nesteenhallinta',
      'subfam.inflation': 'Inflaatiojärjestelmät',
      'subfam.hemostasis': 'Hemostaasi',
      'subfam.kyphoplasty': 'Kyfoplastia',
      'subfam.boneManagement': 'Luunhallinta',

      // Product names + taglines
      'prod.manifold.name': 'Jakotukki',
      'prod.manifold.tag': '3-tieinen korkeapaineinen jakotukki kontrastinesteen hallintaan',
      'prod.manifoldKit.name': 'Jakotukkisarja',
      'prod.manifoldKit.tag': 'Täydellinen sarja kontrasti- ja paineistettujen nesteiden hallintaan',
      'prod.coronary.name': 'Sepelvaltimoinjektori',
      'prod.coronary.tag': '12 cc:n tarkkuusinjektori angiografiaan',
      'prod.inflator20.name': 'Inflaattori 20 cc',
      'prod.inflator20.tag': 'Korkeapaineinen 0–30 atm pallokatetri-inflaattori',
      'prod.inflator30.name': 'Inflaattori 30 cc',
      'prod.inflator30.tag': 'Suuremman tilavuuden 0–30 atm inflaattori käännettävällä kahvalla',
      'prod.radial.name': 'Radiaalipuristusside',
      'prod.radial.tag': 'Atraumaattinen radiaalipuristusside toimenpiteen jälkeiseen hemostaasiin',
      'prod.kyphoplasty.name': 'Kyfoplastia-inflaattori',
      'prod.kyphoplasty.tag': 'Erikoistunut 0–30 atm inflaattori nikamarungon palloille',
      'prod.boneCementMixer.name': 'Luusementin annostelujärjestelmä',
      'prod.boneCementMixer.tag': 'Suljetun järjestelmän roottorisekoitin ja sementin annostelu',
      'prod.orthoCement.name': 'Ortopedinen luusementti',
      'prod.orthoCement.tag': 'PMMA-pohjainen radiopaakki sementti nivelproteesien kiinnitykseen — antibiootilla tai ilman',
      'prod.vertCement.name': 'Vertebroplastia-luusementti',
      'prod.vertCement.tag': 'Steriili radiopaakki PMMA nikamamurtumien stabilointiin',

      // products.html
      'products.h1': 'Kliiniset ratkaisut',
      'products.intro': 'Kaksi kliinistä pilaria. Viisi tuoteperhettä. Jokainen laite CE-merkitty MDR (EU) 2017/745 -asetuksen mukaisesti, valmistettu ISO 13485:2016 -standardin mukaisesti, EO-steriloitu ja toimitettu kertakäyttöön.',
      'products.pillar1.h2': 'Interventiopääsy',
      'products.pillar1.p': 'Sepelvaltimo-, perifeerisiin ja radiologisiin toimenpiteisiin. Nesteenhallinta · Inflaatiojärjestelmät · Hemostaasi.',
      'products.pillar2.h2': 'Nikamatuki',
      'products.pillar2.p': 'Perkutaanisiin selkärankatoimenpiteisiin. Kyfoplastiasarjat · Luunhallinta.',
      'products.pillar3.h2': 'Luusementti',
      'products.pillar3.p': 'PMMA-pohjaiset radiopaakit kirurgiset luusementit — nivelproteesien kiinnitykseen ja vertebroplastiaan.',
      'products.cta.h2': 'Hintatietoja, toimitusaikoja vai näytteitä?',
      'products.cta.p': 'Helsingin tiimimme käsittelee jakelukyselyt suoraan. Useimmat tarjoukset palautetaan kahden työpäivän sisällä.',
      'products.cta.btn': 'Avaa jakelutiedustelu',

      // packs
      'packs.h1': 'Toimenpidepakkaukset',
      'packs.intro': 'Yksi SKU. Yksi steriili pussi. Yksi toimenpide valmiina alkamaan. Esivalmistetut paketit, jotka vähentävät SKU-määrää, yksinkertaistavat tarjouspyyntöjä ja poistavat liitinten yhteensopimattomuusriskin potilaan vierellä.',
      'packs.pack1.eyebrow': 'Pakkaus 01 — Kardiologia',
      'packs.pack1.h3': 'Cath-Lab Essentials',
      'packs.pack1.p': 'Esikonfiguroitu paketti, joka sisältää jakotukit, 12 cc:n sepelvaltimoinjektorin, kalibroidun inflaattorin ja radiaalisen hemostaasisiteen — neljä eniten peräkkäin avattua tuotetta trans-radiaalisessa PCI:ssä.',
      'packs.pack2.eyebrow': 'Pakkaus 02 — Selkäranka',
      'packs.pack2.h3': 'Spine-Restore Kit',
      'packs.pack2.p': 'Täydellinen kulutustarvikesarja perkutaaniseen pallokyfoplastiatoimenpiteeseen. Yhdistää erikoistuneen kyfoplastia-inflaattorin suljetun järjestelmän luusementtisekoittimeen — eliminoi avoimen sekoituksen kontaminaatioriskin.',
      'packs.custom.h2': 'Mukautetut konfiguraatiot',
      'packs.custom.sub': 'Useimmat kansalliset tarjouspyynnöt määrittelevät konfiguraation, joka ei vastaa standardi-SKU:ta. Kokoamme mukautetut toimenpidepakkaukset luettelosta — yksi private label -SKU, yhtenäinen vaatimustenmukaisuusvakuutus.',
      'packs.moq.h3': 'Vähimmäistilaus',
      'packs.moq.p': 'Alkaen 100 pakkausta per SKU. Pienemmät määrät harkitaan tarjouspyyntökohtaisesti.',
      'packs.lead.h3': 'Toimitusaika',
      'packs.lead.p': '4–6 viikkoa Ex-Works Istanbul mukautetuille pakkauksille. Standardipakkaukset toimitetaan varastosta.',
      'packs.private.h3': 'Private label',
      'packs.private.p': 'Saatavilla jakelijabrändillä, edellyttää ilmoitetun laitoksen teknisen asiakirjan tarkastusta.',
      'packs.custom.btn': 'Avaa mukautetun pakkauksen tiedustelu →',
      'packs.cta.h2': 'Hankintatiimit: vastaamme yhden työpäivän sisällä.',
      'packs.cta.p': 'Helsingin tiimimme käsittelee jakelukyselyt suoraan. Näytteet, tarjoukset ja tekninen dokumentaatio pyynnöstä.',

      // quality.html
      'quality.h1': 'Laatu ja vaatimustenmukaisuus',
      'quality.intro': 'Motion Medical hyödyntää strategista valmistuskumppanuutta Turkissa, joka toimii tiukan suomalaisen laadunvalvonnan alaisena. Valmistuskumppanimme noudattaa täysin MDR (EU) 2017/745 -asetusta — taaten eurooppalaiset turvallisuusstandardit Välimeren logistisella ketteryydellä.',
      'quality.tab.protocol': 'Helsingin protokolla',
      'quality.tab.mdr': 'MDR ja sertifiointi',
      'quality.tab.sustain': 'Kestävyys',
      'quality.s1.eyebrow': '01 — Helsingin protokolla',
      'quality.s1.h2': 'Strateginen kumppanuus, julkilausuttuna selvällä kielellä.',
      'quality.s1.sub': 'Miten suomalainen tiimimme auditoi Ankaran valmistuspaikan MDR (EU) 2017/745 -asetuksen täydellisten vaatimusten mukaisesti.',
      'quality.split.helsinki.eyebrow': 'Helsingin pääkonttori',
      'quality.split.helsinki.h3': 'Strategia ja laadunvalvonta',
      'quality.split.helsinki.li1': 'CE-teknisen asiakirjan päivitys ja valvonta',
      'quality.split.helsinki.li2': 'Sääntelyvaatimusten noudattamisesta vastaava henkilö (PRRC)',
      'quality.split.helsinki.li3': 'Riskinhallinta-asiakirja (ISO 14971)',
      'quality.split.helsinki.li4': 'Markkinoille tulon jälkeinen valvonta ja vaaratilanneraportointi',
      'quality.split.helsinki.li5': 'Ilmoitetun laitoksen ja jakelijan rajapinta',
      'quality.split.ankara.eyebrow': 'Ankaran tehdas',
      'quality.split.ankara.h3': 'Tuotanto ja maailmanlaajuiset toimitukset',
      'quality.split.ankara.li1': 'ISO 13485:2016 -sertifioitu tuotantolaitos',
      'quality.split.ankara.li2': 'Ruiskuvalu, kokoonpano ja pakkaus',
      'quality.split.ankara.li3': 'Validoitu EO-sterilointi',
      'quality.split.ankara.li4': 'Saapuvan ja valmiin tavaran laadunvalvonta',
      'quality.split.ankara.li5': 'Erän vapautus ja jäljitettävyystiedot',
      'quality.split.ankara.li6': 'Ex-Works-lähetys maailmanlaajuisille jakelijoille',
      'quality.gates.h3': 'Laite poistuu tehtaaltamme vasta neljän tarkastuspisteen jälkeen.',
      'quality.gate1.h3': 'Suunnittelun lukitus',
      'quality.gate1.p': 'Jokainen laite kiinnitetään Helsingissä pidettyyn valvottuun tekniseen asiakirjaan. Piirustuksia, materiaaleja, biotyhteensopivuustietoja ja riskianalyysejä ei voi muuttaa tuotantolinjalla.',
      'quality.gate1.owner': 'Vastuussa — Helsinki',
      'quality.gate2.h3': 'Prosessin aikainen auditointi',
      'quality.gate2.p': 'Vuosittain aikataulutetut auditoinnit ja yllätysvierailut Ankaran tehtaalle kattavat puhdastiladisipliinin, kalibrointitiedot, käyttäjäkoulutustiedot ja saapuvien materiaalien jäljitettävyyden.',
      'quality.gate2.owner': 'Vastuussa — Helsingin laadunvarmistus',
      'quality.gate3.h3': 'EO-validointi',
      'quality.gate3.p': 'Jokainen sterilointierä vapautetaan validoitujen syklin parametrien ja biologisten indikaattoritulosten perusteella. Yksikään erä ei lähde ilman allekirjoitettua steriliteettitodistusta.',
      'quality.gate3.owner': 'Vastuussa — Ankaran laadunvalvonta',
      'quality.gate4.h3': 'Markkinoille tulon jälkeinen silmukka',
      'quality.gate4.p': 'Valitukset, kenttäraportit ja trenditiedot palautuvat Helsingin PMS-järjestelmään 48 tunnin sisällä — ja neljännesvuosittaiseen tarkasteluun Ankaran tuotantotiimin kanssa.',
      'quality.gate4.owner': 'Vastuussa — Helsingin PMS',
      'quality.s2.eyebrow': '02 — MDR ja sertifiointi',
      'quality.s2.h2': 'Eurooppalaiset turvallisuusstandardit. Todennettavissa, ei vain väittäen.',
      'quality.s2.sub': 'Emme valmista Suomessa; emme teeskentele tekevämme niin. Sertifikaatit, jotka valtuuttavat tuotteen EU-markkinoille, ovat aitoja, voimassa olevia ja nimettyinä alla. Saatavilla pyynnöstä päteville jakelijoille ja tarjousviranomaisille.',
      'quality.cert1.eyebrow': 'Sääntely',
      'quality.cert1.h4': 'CE-sertifikaatti',
      'quality.cert1.p': 'Ilmoitetun laitoksen myöntämä MDR-liitteen IX mukaisesti. Listaa tuoteperheet, luokituksen ja valmistuspaikan.',
      'quality.cert2.eyebrow': 'Laatu',
      'quality.cert2.h4': 'ISO 13485:2016',
      'quality.cert2.p': 'Myönnetty Ankaran valmistuspaikalle. Kattaa suunnittelun siirron, tuotannon, steriloinnin ja markkinoille tulon jälkeisen seurannan.',
      'quality.cert3.eyebrow': 'Eräkohtainen',
      'quality.cert3.h4': 'Steriliteettitodistus',
      'quality.cert3.p': 'Myönnetty jokaiselle EO-sterilointierälle — sykliparametrit, viipymäaika ja biologisten indikaattorien tulokset.',
      'quality.cert4.eyebrow': 'Lähetyskohtainen',
      'quality.cert4.h4': 'Suomen vapaa myyntitodistus',
      'quality.cert4.p': 'Allekirjoittanut PRRC Helsingissä.',
      'quality.trans.badge': 'Avoimuusperiaate',
      'quality.trans.h3': 'Nimeämme Motion Medicalin jokaisessa kaupallisessa asiakirjassa.',
      'quality.trans.p': 'Tarjoukset, laskut, valtakirjat ja tuotemerkinnät kaikki tunnistavat Motion Medicalin (Helsinki) brändin ja Ankaran tehtaan tuotantopaikkana. Jakelijat, sairaalan hankinta ja ilmoitetut laitokset näkevät samat tiedot.',
      'quality.s3.eyebrow': '03 — Kestävyys',
      'quality.s3.h2': 'Älypakkaus. Vähemmän jätettä potilaan vierellä.',
      'quality.s3.sub': 'Kertakäyttöiset lääkinnälliset laitteet tuottavat todellisen määrän kliinistä jätettä. Suomalaisena yrityksenä pidämme itsemme pohjoismaisten standardien mukaisina ympäristövaikutuksissa — ilman steriiliyden tai säilyvyyden tinkimistä.',
      'quality.stat1.h3': 'Pakkausmassan vähennys',
      'quality.stat1.p': 'Inflaattori- ja jakotukkilinjojen siirtyminen oikeankokoiseen koteloon ja ohuempaan kierrätettävään pussiin poisti yli kolmanneksen pakkauspainosta yksikköä kohden.',
      'quality.stat2.h3': 'Vähemmän paperia pussissa',
      'quality.stat2.p': 'Monikieliset paperiset käyttöohjeet on korvattu QR-linkitetyllä eIFU-kirjastolla — MDR-asetuksen artiklan 5(3) mukaisesti. Jakelijakieliset liitteet vain kansallisen lain vaatimuksesta.',
      'quality.stat3.h3': 'Kierrätettävä toissijainen',
      'quality.stat3.p': 'Ulkopakkaukset ja erottimet ovat FSC-sertifioitua yksimateriaalista pahvia, painettu soijapohjaisella musteella. Kierrätettävissä standardoiduissa sairaala- ja kunnallisissa kierrätysvirroissa.',
      'quality.road.badge': 'Tiekartta',
      'quality.road.h3': 'SKU-kohtainen CO₂e-julkistus vuoteen 2027 mennessä',
      'quality.road.p': 'Työskentelemme SKU-kohtaisen hiilijalanjäljen parissa, joka julkaistaan jokaisen vaatimustenmukaisuusvakuutuksen yhteydessä vuodesta 2027 alkaen, EU:n yritysten kestävyysraportointidirektiivin mukaisesti.',
      'quality.cta.h2': 'Tarvitsetko täydellisen laatuasiakirjan?',
      'quality.cta.p': 'CE-sertifikaatti, ISO 13485 -laitospaikkasertifikaatti, teknisen asiakirjan tiivistelmä ja PMS-raportti — myönnetään NDA:n alaisena päteville jakelukumppaneille ja tarjousviranomaisille.',
      'quality.cta.btn': 'Pyydä dokumentaatiota',

      // contact.html
      'contact.h1': 'Yhteystiedot',
      'contact.intro': 'Kysymykset, tarjoukset tai näytepyyntö — ota suoraan yhteyttä myyntitiimiimme.',
      'contact.sidebar.h2': 'Ota yhteyttä',
      'contact.sidebar.intro': 'Olitpa arvioimassa yhtä laitetta tai suunnittelemassa monisivuista käyttöönottoa, haluamme kuulla sinusta.',
      'contact.office.helsinki': 'Helsingin pääkonttori',
      'contact.office.ankara': 'Ankaran toimisto',
      'contact.success.h3': 'Viesti vastaanotettu',
      'contact.success.p': 'Otamme sinuun yhteyttä yhden työpäivän sisällä.',
      'form.name': 'Koko nimi<span class="req" aria-hidden="true">*</span>',
      'form.email': 'Työsähköposti<span class="req" aria-hidden="true">*</span>',
      'form.company': 'Yritys / sairaala',
      'form.country': 'Maa',
      'form.phone': 'Puhelin',
      'form.inquiry': 'Tiedustelun tyyppi',
      'form.inquiry.quote': 'Pyydä tarjous',
      'form.inquiry.product': 'Tuotekysymys',
      'form.inquiry.partnership': 'Kumppanuus',
      'form.inquiry.other': 'Muu',
      'form.message': 'Viesti<span class="req" aria-hidden="true">*</span>',
      'form.required': 'Tähdellä <span class="req">*</span> merkityt kentät ovat pakollisia.',
      'form.send': 'Lähetä viesti',
      'form.reassurance': 'Vastaamme yhden työpäivän sisällä. Tietosi pysyvät myyntitiimissämme — emme jaa tai myy tietoja.',

      // Product page eyebrows
      'title.manifold.eyebrow': 'Interventionaalinen nesteenhallinta',
      'title.manifoldKit.eyebrow': 'Interventionaalinen nesteenhallinta',
      'title.coronary.eyebrow': 'Interventionaalinen nesteenhallinta',
      'title.inflator20.eyebrow': 'Pallokatetrin inflaatio',
      'title.inflator30.eyebrow': 'Pallokatetrin inflaatio',
      'title.radial.eyebrow': 'Hemostaasi · Radiaalipuristus',
      'title.kyphoplasty.eyebrow': 'Nikamatuki · Erikoistunut inflaatio',
      'title.boneMixer.eyebrow': 'Luunhallinta · PMMA-sekoitus ja annostelu',
      'title.orthoCement.eyebrow': 'Luusementti · Ortopedinen',
      'title.vertCement.eyebrow': 'Luusementti · Vertebroplastia',

      // 404
      'title.notfound': 'Sivua ei löytynyt — Motion Medical',
      'notfound.code': 'Virhe 404',
      'notfound.h1': 'Sivua ei löytynyt',
      'notfound.p': 'Etsimääsi sivua ei ole olemassa tai se on siirretty. Käytä yllä olevaa navigointia tai palaa etusivulle.',
      'notfound.btn': 'Takaisin etusivulle',
    },
  };

  const SUPPORTED_LANGS = ['en', 'fi'];
  const STORAGE_KEY = 'mm-lang';

  function getInitialLang() {
    let saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    return SUPPORTED_LANGS.includes(saved) ? saved : 'en';
  }

  function applyLang(lang) {
    const dict = translations[lang] || translations.en;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined) {
        el.innerHTML = dict[key];
      }
    });

    // Translate aria-label / placeholder / title via data-i18n-attr="attr:key,attr:key"
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.dataset.i18nAttr.split(',').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (attr && key && dict[key] !== undefined) el.setAttribute(attr, dict[key]);
      });
    });

    // Document title
    const titleKey = document.body.dataset.titleI18n;
    if (titleKey && dict[titleKey]) document.title = dict[titleKey];

    // Highlight active language switch
    document.querySelectorAll('[data-lang]').forEach(el => {
      el.classList.toggle('current', el.dataset.lang === lang);
    });
  }

  // Wire up the EN/FI switcher links
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const lang = el.dataset.lang;
      if (!SUPPORTED_LANGS.includes(lang)) return;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
      applyLang(lang);
    });
  });

  // Apply on initial load (after DOM is parsed; this script runs at end of body)
  applyLang(getInitialLang());

  // ============================================================
  // Original site behavior (mobile menu, dropdown, contact form)
  // ============================================================

  // Mobile menu toggle
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // Products dropdown — desktop: click navigates to products.html; mobile: click toggles dropdown.
  const productsItem = document.querySelector('.nav-item-products');
  const productsTrigger = productsItem ? productsItem.querySelector('a.has-dropdown, button.has-dropdown') : null;
  if (productsItem && productsTrigger) {
    const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

    productsTrigger.addEventListener('click', (e) => {
      // On mobile, intercept and toggle the dropdown rather than navigate.
      if (isMobile()) {
        e.preventDefault();
        const open = productsItem.getAttribute('aria-expanded') === 'true';
        productsItem.setAttribute('aria-expanded', (!open).toString());
      }
      // On desktop, do nothing — let the link navigate to products.html.
    });

    // Close when clicking outside (mobile only — desktop relies on hover)
    document.addEventListener('click', (e) => {
      if (!productsItem.contains(e.target)) {
        productsItem.setAttribute('aria-expanded', 'false');
      }
    });
    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        productsItem.setAttribute('aria-expanded', 'false');
        productsTrigger.focus();
      }
    });
  }

  // Contact form — client-side validation + Formspree submission.
  // Submissions are sent to https://formspree.io/f/mlgzpkrw and forwarded
  // by Formspree to the email address on the form's Formspree dashboard.
  // To use a different endpoint or service, change FORM_ENDPOINT below.
  const FORM_ENDPOINT = 'https://formspree.io/f/mlgzpkrw';
  const form = document.getElementById('contact-form');
  const success = document.getElementById('contact-success');
  if (form) {
    const emailRe = /^\S+@\S+\.\S+$/;
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitLabel = submitBtn ? submitBtn.querySelector('[data-i18n="form.send"]') : null;
    const originalLabel = submitLabel ? submitLabel.textContent : 'Send message';

    // Inject a status row right above the submit button so we can show
    // a clear error message if Formspree (or the network) refuses the
    // submission. Re-uses the existing form-error styling.
    let statusEl = form.querySelector('.form-status');
    if (!statusEl) {
      statusEl = document.createElement('p');
      statusEl.className = 'form-status field-error';
      statusEl.setAttribute('role', 'alert');
      statusEl.setAttribute('aria-live', 'assertive');
      statusEl.style.marginTop = '4px';
      const submitRow = form.querySelector('.submit-row');
      if (submitRow) submitRow.parentNode.insertBefore(statusEl, submitRow);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Clear previous errors
      form.querySelectorAll('.form-field.is-error').forEach(f => f.classList.remove('is-error'));
      form.querySelectorAll('.field-error:not(.form-status)').forEach(p => { p.textContent = ''; });
      statusEl.textContent = '';

      let firstInvalid = null;
      form.querySelectorAll('[required]').forEach(field => {
        const value = (field.value || '').trim();
        const wrapper = field.closest('.form-field');
        if (!wrapper) return;
        const errEl = wrapper.querySelector('.field-error');

        let message = '';
        if (!value) {
          message = 'This field is required.';
        } else if (field.type === 'email' && !emailRe.test(value)) {
          message = 'Please enter a valid email address.';
        }
        if (message) {
          wrapper.classList.add('is-error');
          if (errEl) errEl.textContent = message;
          if (!firstInvalid) firstInvalid = field;
        }
      });

      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Disable the submit button + show in-progress label
      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Sending…';

      try {
        const data = new FormData(form);
        // Friendly subject line that lands in the email
        const inquiry = (data.get('inquiry') || 'general').toString();
        data.set('_subject', `Motion Medical website — new ${inquiry} inquiry`);

        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' },
        });

        if (res.ok) {
          // Success — swap form with success card
          form.hidden = true;
          if (success) {
            success.hidden = false;
            success.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          form.reset();
        } else {
          let detail = 'Sorry — something went wrong sending your message. Please try again, or email us directly.';
          try {
            const json = await res.json();
            if (json && Array.isArray(json.errors) && json.errors.length) {
              detail = json.errors.map(er => er.message).join(' ');
            }
          } catch (_) { /* response wasn't JSON */ }
          statusEl.textContent = detail;
        }
      } catch (err) {
        statusEl.textContent = 'Network error — please check your connection and try again.';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = originalLabel;
      }
    });
  }
})();
