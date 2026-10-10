(function () {
  var SHADES = [
    { name: "Anar", word: "after sunset", c: "#8e2347", note: "Pomegranate red with a blue-leaning base. Brightens medium and deep skin." },
    { name: "Mehendi", word: "at mehendi", c: "#8a5a2b", note: "A warm brown with a touch of olive. The everyday neutral." },
    { name: "Gulkand", word: "in gulkand", c: "#c2587a", note: "Soft rose pink. Sheer when dabbed, full when layered." },
    { name: "Kesar", word: "with kesar", c: "#c4552b", note: "Burnt saffron orange. Warm and bold on wheatish skin." },
    { name: "Jamun", word: "like jamun", c: "#5b1f45", note: "Deep plum for evenings. Wears well on dark skin tones." },
    { name: "Chai", word: "over chai", c: "#a4604a", note: "Milky tea brown. A clean nude for light to medium skin." }
  ];

  var IMGS = {
    bow: "images/bow.webp",
    clips: "images/clips.webp",
    scrunchie: "images/scrunchie.webp",
    kit: "images/kit.jpg",
    brush: "images/brush.jpg",
    cleanser: "images/cleanser.jpg",
    serum: "images/serum.jpg"
  };

  var P = [
    { id: 1, n: "Matte Lip Crayon", s: "Anar", p: 649, cat: "Lips", t: "pencil", c: "#8e2347" },
    { id: 2, n: "Matte Lip Crayon", s: "Mehendi", p: 649, cat: "Lips", t: "pencil", c: "#8a5a2b" },
    { id: 3, n: "Satin Lipstick", s: "Gulkand", p: 749, cat: "Lips", t: "lipstick", c: "#c2587a" },
    { id: 4, n: "Tinted Lip Balm", s: "Kesar", p: 399, cat: "Lips", t: "lipstick", c: "#c4552b", tag: "New" },
    { id: 5, n: "Smudge-Proof Kajal", s: "Jet black, 12 hour wear", p: 349, cat: "Eyes", t: "pencil", c: "#2b2226", tag: "Bestseller" },
    { id: 6, n: "Lengthening Mascara", s: "Black", p: 599, cat: "Eyes", t: "bottle", c: "#3a2c33" },
    { id: 7, n: "Eyeshadow Quad", s: "Dusk, four shades", p: 899, cat: "Eyes", t: "palette", c: "#7a4a6a" },
    { id: 8, n: "Skin Tint SPF 30", s: "24 shades, N and W undertones", p: 1099, cat: "Face", t: "bottle", c: "#b7825c" },
    { id: 9, n: "Cream Blush", s: "Gulabi", p: 549, cat: "Face", t: "compact", c: "#d9718a", tag: "New" },
    { id: 10, n: "Pressed Powder", s: "Translucent, oil control", p: 699, cat: "Face", t: "compact", c: "#c9a68a" },
    { id: 11, n: "Vitamin C Serum", s: "10%, 30 ml", p: 799, cat: "Skincare", t: "bottle", c: "#d98a2b" },
    { id: 12, n: "Sunscreen SPF 50", s: "No white cast, 50 ml", p: 599, cat: "Skincare", t: "bottle", c: "#e0b25a", tag: "Bestseller" },
    { id: 13, n: "Satin Hair Bow", s: "Blush pink, clip-on", p: 299, cat: "Hair", t: "bottle", c: "#e8a0b4", img: IMGS.bow, tag: "New" },
    { id: 14, n: "Matte Claw Clip Set", s: "Set of 4: mocha, sand, mauve, rose", p: 449, cat: "Hair", t: "bottle", c: "#a98a86", img: IMGS.clips },
    { id: 15, n: "Satin Scrunchie", s: "Lilac, oversized", p: 249, cat: "Hair", t: "bottle", c: "#b9a0c6", img: IMGS.scrunchie },
    { id: 16, n: "Makeup Essentials Kit", s: "Lips, eyes, nails and brushes", p: 2499, cat: "Kits & Tools", t: "palette", c: "#c2587a", img: IMGS.kit, fit: "contain", tag: "Bestseller" },
    { id: 17, n: "Blush Powder Brush", s: "Soft bristles, rose blush", p: 499, cat: "Kits & Tools", t: "pencil", c: "#e08aa4", img: IMGS.brush },
    { id: 18, n: "Cherry Cleansing Gel", s: "Gentle face wash, 150 ml", p: 699, cat: "Skincare", t: "bottle", c: "#a3262e", img: IMGS.cleanser, tag: "New" },
    { id: 19, n: "Glow Face Serum", s: "Dropper bottle, 15 ml", p: 1299, cat: "Skincare", t: "bottle", c: "#d9a47a", img: IMGS.serum }
  ];
  var CATS = ["All", "Lips", "Eyes", "Face", "Skincare", "Hair", "Kits & Tools"];

  function el(id) { return document.getElementById(id); }
  function inr(n) { return "₹" + n.toLocaleString("en-IN"); }

  var ICONS = {
    lipstick: '<svg viewBox="0 0 60 100" fill="none"><ellipse cx="30" cy="95" rx="22" ry="3.5" fill="#000" opacity="0.16"/><rect x="14" y="54" width="32" height="40" rx="3" fill="#2a1a22"/><rect x="14" y="54" width="32" height="40" rx="3" fill="url(#hl)"/><rect x="17" y="40" width="26" height="15" rx="1" fill="#c9b3bb"/><rect x="17" y="40" width="26" height="15" rx="1" fill="url(#hl)"/><path d="M19.5 40 L19.5 20 Q30 6 40.5 22 L40.5 40 Z" fill="var(--c)"/><path d="M19.5 40 L19.5 20 Q30 6 40.5 22 L40.5 40 Z" fill="url(#hl)"/></svg>',
    pencil: '<svg viewBox="0 0 60 100" fill="none"><ellipse cx="30" cy="95" rx="18" ry="3" fill="#000" opacity="0.16"/><rect x="19" y="30" width="22" height="64" rx="3" fill="var(--c)"/><rect x="19" y="30" width="22" height="64" rx="3" fill="url(#hl)"/><path d="M19 30 L30 6 L41 30 Z" fill="#ead8c6"/><path d="M25.8 17 L30 6 L34.2 17 Z" fill="var(--c)"/><rect x="19" y="76" width="22" height="7" fill="#2a1a22" opacity="0.28"/></svg>',
    bottle: '<svg viewBox="0 0 60 100" fill="none"><ellipse cx="30" cy="95" rx="20" ry="3.5" fill="#000" opacity="0.16"/><rect x="21" y="5" width="18" height="18" rx="3" fill="#2a1a22"/><rect x="21" y="5" width="18" height="18" rx="3" fill="url(#hl)"/><rect x="15" y="23" width="30" height="70" rx="7" fill="var(--c)"/><rect x="15" y="23" width="30" height="70" rx="7" fill="url(#hl)"/><rect x="21" y="44" width="18" height="26" rx="2" fill="#fff" opacity="0.78"/><rect x="24" y="50" width="12" height="2" fill="#2a1a22" opacity="0.5"/><rect x="24" y="56" width="9" height="2" fill="#2a1a22" opacity="0.35"/></svg>',
    compact: '<svg viewBox="0 0 100 100" fill="none"><ellipse cx="50" cy="90" rx="34" ry="5" fill="#000" opacity="0.16"/><circle cx="50" cy="48" r="38" fill="#2a1a22"/><circle cx="50" cy="48" r="38" fill="url(#gl)"/><circle cx="50" cy="48" r="30" fill="var(--c)"/><circle cx="50" cy="48" r="30" fill="url(#gl)"/></svg>',
    palette: '<svg viewBox="0 0 100 100" fill="none"><ellipse cx="50" cy="86" rx="40" ry="5" fill="#000" opacity="0.16"/><rect x="8" y="20" width="84" height="62" rx="7" fill="#2a1a22"/><rect x="8" y="20" width="84" height="62" rx="7" fill="url(#hl)"/><rect x="16" y="28" width="32" height="20" rx="3" fill="var(--c)"/><rect x="52" y="28" width="32" height="20" rx="3" fill="#b98a9f"/><rect x="16" y="52" width="32" height="22" rx="3" fill="#4a2a3e"/><rect x="52" y="52" width="32" height="22" rx="3" fill="#d6b6a4"/></svg>'
  };
  /* One distinct drawing for each product that has no photograph yet */
  function svg(inner) {
    return '<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><ellipse cx="50" cy="93" rx="30" ry="3.5" fill="#000" opacity="0.14"/>' + inner + '</svg>';
  }
  function ticks(x, y0, y1, step, len) {
    var s = "";
    for (var y = y0; y <= y1; y += step) {
      s += '<path d="M' + x + ' ' + y + ' h' + len + '" stroke="#1c1519" stroke-width="1.4" stroke-linecap="round"/>';
    }
    return s;
  }
  function rays(cx, cy, r1, r2, color) {
    var s = "";
    for (var k = 0; k < 8; k++) {
      var a = k * Math.PI / 4, c = Math.cos(a), n = Math.sin(a);
      s += '<path d="M' + (cx + r1 * c).toFixed(1) + ' ' + (cy + r1 * n).toFixed(1) + ' L' + (cx + r2 * c).toFixed(1) + ' ' + (cy + r2 * n).toFixed(1) + '" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round"/>';
    }
    return s;
  }
  var ART = {
    /* 1 Matte Lip Crayon, Anar: standing crayon, cap beside it, lip swatch */
    1: function () {
      return svg(
        '<rect x="38" y="36" width="16" height="52" rx="3" fill="#2a1a22"/><rect x="38" y="36" width="16" height="52" rx="3" fill="url(#hl)"/>' +
        '<rect x="38" y="33" width="16" height="5" fill="#c9a24a"/>' +
        '<path d="M40 33 V19 L52 11 V33 Z" fill="#8e2347"/><path d="M40 33 V19 L52 11 V33 Z" fill="url(#hl)"/>' +
        '<rect x="62" y="46" width="14" height="42" rx="3" fill="#2a1a22"/><rect x="62" y="46" width="14" height="42" rx="3" fill="url(#hl)"/>' +
        '<rect x="62" y="46" width="14" height="5" fill="#c9a24a"/>' +
        '<path d="M64 22 Q72 14 80 22 Q72 30 64 22 Z" fill="#8e2347"/>' +
        '<path d="M65 22 Q72 20 79 22" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5"/>');
    },
    /* 2 Matte Lip Crayon, Mehendi: tilted crayon with a henna motif */
    2: function () {
      return svg(
        '<g transform="rotate(35 50 40)">' +
        '<rect x="14" y="32" width="54" height="16" rx="3" fill="#2a1a22"/><rect x="14" y="32" width="54" height="16" rx="3" fill="url(#hl)"/>' +
        '<rect x="64" y="32" width="5" height="16" fill="#c9a24a"/>' +
        '<path d="M69 34 H78 L88 40 L78 46 H69 Z" fill="#8a5a2b"/></g>' +
        '<path d="M18 84 C10 74 22 62 32 70 C40 76 34 88 22 88 Z" fill="#8a5a2b"/>' +
        '<circle cx="27" cy="77" r="2.6" fill="#e8c9a4"/>' +
        '<circle cx="46" cy="82" r="2.2" fill="#8a5a2b"/><circle cx="54" cy="76" r="2.2" fill="#8a5a2b"/>' +
        '<circle cx="62" cy="82" r="2.2" fill="#8a5a2b"/><circle cx="70" cy="76" r="2.2" fill="#8a5a2b"/>');
    },
    /* 3 Satin Lipstick, Gulkand: classic tube with rose petals */
    3: function () {
      return svg(
        '<ellipse cx="24" cy="82" rx="9" ry="5" transform="rotate(-28 24 82)" fill="#e7a2b9"/>' +
        '<ellipse cx="76" cy="84" rx="9" ry="5" transform="rotate(24 76 84)" fill="#d97b9f"/>' +
        '<ellipse cx="68" cy="76" rx="6" ry="3.5" transform="rotate(-40 68 76)" fill="#efb6c8"/>' +
        '<rect x="36" y="56" width="28" height="32" rx="3" fill="#2a1a22"/><rect x="36" y="56" width="28" height="32" rx="3" fill="url(#hl)"/>' +
        '<rect x="36" y="51" width="28" height="6" fill="#c9a24a"/>' +
        '<rect x="39" y="38" width="22" height="14" fill="#c9b3bb"/><rect x="39" y="38" width="22" height="14" fill="url(#hl)"/>' +
        '<path d="M40 38 V24 L60 12 V38 Z" fill="#c2587a"/><path d="M40 38 V24 L60 12 V38 Z" fill="url(#hl)"/>');
    },
    /* 4 Tinted Lip Balm, Kesar: round balm with saffron threads */
    4: function () {
      return svg(
        '<rect x="28" y="58" width="40" height="30" rx="7" fill="#f3e2c3"/><rect x="28" y="58" width="40" height="30" rx="7" fill="url(#hl)"/>' +
        '<rect x="28" y="58" width="40" height="7" rx="3" fill="#c9a24a"/>' +
        '<rect x="33" y="32" width="30" height="30" rx="13" fill="#c4552b"/><rect x="33" y="32" width="30" height="30" rx="13" fill="url(#hl)"/>' +
        '<path d="M40 40 Q44 36 50 37" stroke="#fff" stroke-opacity="0.4" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M74 30 Q82 22 90 24" stroke="#d63a1f" stroke-width="2" stroke-linecap="round"/><circle cx="90" cy="24" r="1.9" fill="#d63a1f"/>' +
        '<path d="M74 42 Q84 38 92 42" stroke="#d63a1f" stroke-width="2" stroke-linecap="round"/><circle cx="92" cy="42" r="1.9" fill="#d63a1f"/>' +
        '<path d="M73 54 Q81 54 87 60" stroke="#d63a1f" stroke-width="2" stroke-linecap="round"/><circle cx="87" cy="60" r="1.9" fill="#d63a1f"/>');
    },
    /* 5 Smudge-Proof Kajal: black pencil with a winged eye */
    5: function () {
      return svg(
        '<rect x="22" y="32" width="12" height="56" rx="2" fill="#1c1519"/><rect x="22" y="32" width="12" height="56" rx="2" fill="url(#hl)"/>' +
        '<rect x="22" y="28" width="12" height="6" fill="#b9bec5"/>' +
        '<path d="M22 28 L28 12 L34 28 Z" fill="#3a2f35"/><path d="M25.6 18 L28 12 L30.4 18 Z" fill="#1c1519"/>' +
        '<path d="M46 62 Q64 44 84 62 Q64 78 46 62 Z" fill="#fff" stroke="#1c1519" stroke-width="1.5"/>' +
        '<circle cx="65" cy="62" r="8" fill="#5a3b2e"/><circle cx="65" cy="62" r="3.6" fill="#1c1519"/><circle cx="62.5" cy="59.5" r="1.4" fill="#fff"/>' +
        '<path d="M44 62 Q64 44 86 62 L95 55" stroke="#1c1519" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>');
    },
    /* 6 Lengthening Mascara: tube plus a bristle wand */
    6: function () {
      return svg(
        '<rect x="22" y="42" width="24" height="46" rx="5" fill="#3a2c33"/><rect x="22" y="42" width="24" height="46" rx="5" fill="url(#hl)"/>' +
        '<rect x="22" y="60" width="24" height="8" fill="#d9718a"/>' +
        '<rect x="26" y="16" width="16" height="28" rx="3" fill="#1c1519"/><rect x="26" y="16" width="16" height="28" rx="3" fill="url(#hl)"/>' +
        '<rect x="66" y="52" width="3.4" height="36" rx="1.7" fill="#1c1519"/>' +
        '<rect x="63" y="24" width="9.4" height="30" rx="4.7" fill="#1c1519"/>' +
        ticks(63, 27, 51, 4, -4) + ticks(72.4, 27, 51, 4, 4));
    },
    /* 7 Eyeshadow Quad, Dusk: open palette with four pans and a mirror */
    7: function () {
      return svg(
        '<rect x="14" y="10" width="72" height="28" rx="5" fill="#2a1a22"/><rect x="14" y="10" width="72" height="28" rx="5" fill="url(#hl)"/>' +
        '<rect x="19" y="14" width="62" height="20" rx="3" fill="#cfd8e3"/><path d="M26 34 L40 14 H50 L36 34 Z" fill="#fff" opacity="0.45"/>' +
        '<rect x="10" y="42" width="80" height="46" rx="6" fill="#2a1a22"/><rect x="10" y="42" width="80" height="46" rx="6" fill="url(#hl)"/>' +
        '<rect x="16" y="48" width="34" height="18" rx="3" fill="#6b3a5e"/><rect x="52" y="48" width="32" height="18" rx="3" fill="#b98a9f"/>' +
        '<rect x="16" y="68" width="34" height="16" rx="3" fill="#d6a58a"/><rect x="52" y="68" width="32" height="16" rx="3" fill="#7c6a73"/>');
    },
    /* 8 Skin Tint SPF 30: pump bottle with a row of skin tones */
    8: function () {
      var tones = ["#f1d2b6", "#e3b48d", "#c68b60", "#9a643e", "#d8a07a", "#b57a52", "#7a4a2c", "#5a3320"], dots = "";
      for (var i = 0; i < 8; i++) {
        dots += '<circle cx="' + (68 + (i % 2) * 17) + '" cy="' + (40 + Math.floor(i / 2) * 14) + '" r="6.2" fill="' + tones[i] + '"/>';
      }
      return svg(
        '<rect x="18" y="36" width="32" height="52" rx="7" fill="#d9b08c"/><rect x="18" y="36" width="32" height="52" rx="7" fill="url(#hl)"/>' +
        '<rect x="25" y="56" width="18" height="14" rx="2" fill="#fff" opacity="0.6"/>' +
        '<rect x="28" y="28" width="12" height="8" fill="#2a1a22"/>' +
        '<rect x="22" y="20" width="24" height="8" rx="2" fill="#2a1a22"/><rect x="46" y="21" width="9" height="3.5" rx="1.5" fill="#2a1a22"/>' + dots);
    },
    /* 9 Cream Blush, Gulabi: open round compact with a pink swirl */
    9: function () {
      return svg(
        '<rect x="24" y="8" width="52" height="22" rx="7" fill="#2a1a22"/><rect x="24" y="8" width="52" height="22" rx="7" fill="url(#hl)"/>' +
        '<rect x="28" y="12" width="44" height="14" rx="3" fill="#cfd8e3"/>' +
        '<circle cx="50" cy="62" r="29" fill="#2a1a22"/><circle cx="50" cy="62" r="29" fill="url(#gl)"/>' +
        '<circle cx="50" cy="62" r="22" fill="#d9718a"/><circle cx="50" cy="62" r="22" fill="url(#gl)"/>' +
        '<path d="M36 62 C40 50 60 50 63 60 C65 71 48 74 46 65" stroke="#f6b5c6" stroke-width="3.6" stroke-linecap="round"/>');
    },
    /* 10 Pressed Powder, Translucent: gold case with a powder puff */
    10: function () {
      return svg(
        '<circle cx="44" cy="52" r="34" fill="#c9a24a"/><circle cx="44" cy="52" r="34" fill="url(#gl)"/>' +
        '<circle cx="44" cy="52" r="28" fill="#efe0cf"/>' +
        '<circle cx="44" cy="52" r="20" stroke="#d6c0a8" stroke-width="1.6"/><circle cx="44" cy="52" r="12" stroke="#d6c0a8" stroke-width="1.6"/>' +
        '<circle cx="44" cy="52" r="4" fill="#d6c0a8"/>' +
        '<circle cx="80" cy="76" r="14" fill="#f7efe4" stroke="#d9c3ab" stroke-width="1.6"/>' +
        '<path d="M80 62 Q76 54 83 51" stroke="#c9a24a" stroke-width="2.6" stroke-linecap="round"/>' +
        '<circle cx="76" cy="73" r="1.4" fill="#d9c3ab"/><circle cx="84" cy="79" r="1.4" fill="#d9c3ab"/><circle cx="79" cy="82" r="1.4" fill="#d9c3ab"/>');
    },
    /* 11 Vitamin C Serum: amber dropper bottle with an orange slice */
    11: function () {
      return svg(
        '<rect x="18" y="44" width="30" height="44" rx="7" fill="#b86a1f"/><rect x="18" y="44" width="30" height="44" rx="7" fill="url(#hl)"/>' +
        '<rect x="23" y="58" width="20" height="18" rx="2" fill="#fff" opacity="0.85"/>' +
        '<rect x="27" y="34" width="12" height="10" fill="#2a1a22"/><rect x="25" y="30" width="16" height="6" fill="#c9a24a"/>' +
        '<rect x="28" y="8" width="10" height="24" rx="5" fill="#1c1519"/>' +
        '<circle cx="72" cy="66" r="17" fill="#f4a21c"/><circle cx="72" cy="66" r="14" fill="#ffd27a"/>' +
        '<path d="M58 66 H86 M65 53.9 L79 78.1 M65 78.1 L79 53.9" stroke="#f4a21c" stroke-width="1.6" stroke-linecap="round"/>');
    },
    /* 12 Sunscreen SPF 50: squeeze tube standing on its cap, with a sun */
    12: function () {
      return svg(
        '<rect x="28" y="10" width="36" height="8" rx="1" fill="#e6dccb"/>' +
        '<path d="M28 18 H64 L68 78 H24 Z" fill="#f8f2e8"/><path d="M28 18 H64 L68 78 H24 Z" fill="url(#hl)"/>' +
        '<path d="M26 54 H66 L67 64 H25 Z" fill="#f4a21c"/>' +
        '<circle cx="46" cy="36" r="7" fill="#f4a21c"/>' + rays(46, 36, 10, 14, "#f4a21c") +
        '<rect x="28" y="78" width="36" height="11" rx="3" fill="#e0b25a"/><rect x="28" y="78" width="36" height="11" rx="3" fill="url(#hl)"/>');
    }
  };

  /* hero shade picker */
  var sw = el("swatches");
  SHADES.forEach(function (s, i) {
    var b = document.createElement("button");
    b.className = "sw";
    b.style.setProperty("--c", s.c);
    b.setAttribute("aria-label", s.name);
    b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    b.addEventListener("click", function () { pick(i); });
    sw.appendChild(b);
  });
  function pick(i) {
    var s = SHADES[i];
    document.documentElement.style.setProperty("--shade", s.c);
    el("shade-name").textContent = s.name;
    el("hero-word").textContent = s.word;
    el("shade-meta").textContent = s.note;
    Array.prototype.forEach.call(sw.children, function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
  }
  pick(0);

  /* filters + grid */
  var current = "All";
  var f = el("filters");
  CATS.forEach(function (c) {
    var b = document.createElement("button");
    b.className = "chip"; b.textContent = c;
    b.setAttribute("aria-pressed", c === "All" ? "true" : "false");
    b.addEventListener("click", function () {
      current = c;
      Array.prototype.forEach.call(f.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      render();
    });
    f.appendChild(b);
  });

  function render() {
    var g = el("grid");
    g.innerHTML = "";
    P.filter(function (p) { return current === "All" || p.cat === current; }).forEach(function (p) {
      var d = document.createElement("article");
      d.className = "card";
      d.style.setProperty("--c", p.c);
      d.innerHTML =
        '<div class="tile">' + (p.tag ? '<span class="tag">' + p.tag + '</span>' : '') + (p.img ? '<img src="' + p.img + '" alt=""' + (p.fit ? ' style="object-fit:contain;background:#fff"' : '') + ' loading="lazy">' : (ART[p.id] ? ART[p.id]() : ICONS[p.t])) + '</div>' +
        '<div class="info"><h3></h3><span class="shade"></span>' +
        '<div class="buy"><span class="price">' + inr(p.p) + '</span><button class="add">Add to cart</button></div></div>';
      d.querySelector("h3").textContent = p.n;
      d.querySelector(".shade").textContent = p.s;
      d.querySelector(".add").addEventListener("click", function () { add(p.id); });
      g.appendChild(d);
    });
  }
  render();

  /* cart (kept in the page only) */
  var CART_KEY = "saanjh-cart";
  var cart = {};
  try {
    var savedCart = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
    if (savedCart && typeof savedCart === "object" && !Array.isArray(savedCart)) {
      Object.keys(savedCart).forEach(function (id) {
        var quantity = Number(savedCart[id]);
        if (find(+id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 20) cart[id] = quantity;
      });
    }
  } catch (error) {
    cart = {};
  }
  function find(id) { return P.filter(function (p) { return p.id === id; })[0]; }
  function add(id) { cart[id] = (cart[id] || 0) + 1; update(); toast(find(id).n + " added to cart"); }
  function change(id, d) { cart[id] = (cart[id] || 0) + d; if (cart[id] <= 0) delete cart[id]; update(); }
  function update() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (error) { toast("Your browser could not save the cart. Keep this tab open."); }
    var ids = Object.keys(cart), n = 0, total = 0, box = el("lines");
    box.innerHTML = "";
    if (!ids.length) { box.innerHTML = '<div class="empty">Your cart is empty. Add a lip crayon or a kajal to start.</div>'; }
    ids.forEach(function (k) {
      var id = +k, p = find(id), q = cart[id];
      n += q; total += q * p.p;
      var row = document.createElement("div");
      row.className = "line";
      row.style.setProperty("--c", p.c);
      row.innerHTML = '<div class="dot"></div><div><b></b><small></small><div class="qty"><button aria-label="Remove one">−</button><span>' + q + '</span><button aria-label="Add one">+</button></div></div><span class="price">' + inr(p.p * q) + '</span>';
      row.querySelector("b").textContent = p.n;
      if (p.img) { row.querySelector(".dot").style.background = "url(" + p.img + ") center / cover"; }
      row.querySelector("small").textContent = p.s;
      var btns = row.querySelectorAll(".qty button");
      btns[0].addEventListener("click", function () { change(id, -1); });
      btns[1].addEventListener("click", function () { change(id, 1); });
      box.appendChild(row);
    });
    el("count").textContent = n;
    el("total").textContent = inr(total);
  }
  update();

  function openCart() { el("drawer").hidden = false; el("scrim").hidden = false; el("close-cart").focus(); }
  function closeCart() { el("drawer").hidden = true; el("scrim").hidden = true; el("open-cart").focus(); }
  el("open-cart").addEventListener("click", openCart);
  el("close-cart").addEventListener("click", closeCart);
  el("scrim").addEventListener("click", closeCart);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !el("drawer").hidden) closeCart(); });
  el("checkout").addEventListener("click", function () {
    if (!Object.keys(cart).length) { toast("Add something to your cart first."); return; }
    window.location.href = "checkout.html";
  });

  var tt;
  function toast(m) {
    var t = el("toast"); t.textContent = m; t.hidden = false;
    clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 2200);
  }

  /* Classroom-only account and session demonstrations; none of this is server authentication. */
  var DEMO_ACCOUNTS_KEY = "saanjh-security-demo-accounts";
  var DEMO_ATTEMPTS_KEY = "saanjh-security-demo-attempts";
  var DEMO_ITERATIONS = 150000;
  var DEMO_LOCK_MS = 30000;
  var DEMO_SESSION_MS = 120000;
  var DEMO_WARNING_MS = 15000;
  var authDialog = el("auth-dialog");
  var demoDialog = el("security-dialog");
  var signinForm = el("signin-form");
  var signupForm = el("signup-form");
  var signinMessage = el("signin-message");
  var signupMessage = el("signup-message");
  var attemptStatus = el("attempt-status");
  var signinSubmit = el("signin-submit");
  var sessionWarning = el("session-warning");
  var currentSession = null;
  var sessionDeadline = 0;
  var sessionTimer = null;
  var lockTimer = null;
  var activityThrottle = 0;

  function readDemoAccounts() {
    try {
      var value = JSON.parse(localStorage.getItem(DEMO_ACCOUNTS_KEY) || "[]");
      if (!Array.isArray(value)) return [];
      return value.filter(function (account) {
        return account && typeof account.email === "string"
          && typeof account.salt === "string" && typeof account.hash === "string"
          && account.iterations === DEMO_ITERATIONS;
      });
    } catch (error) {
      signupMessage.textContent = "Demo account storage could not be read in this browser.";
      return [];
    }
  }

  function readFailedAttempts() {
    try {
      var value = JSON.parse(localStorage.getItem(DEMO_ATTEMPTS_KEY) || '{"count":0,"lockUntil":0}');
      var count = Number(value && value.count);
      var lockUntil = Number(value && value.lockUntil);
      return {
        count: Number.isInteger(count) && count >= 0 && count <= 3 ? count : 0,
        lockUntil: Number.isFinite(lockUntil) && lockUntil > 0 ? lockUntil : 0
      };
    } catch (error) {
      return { count: 0, lockUntil: 0 };
    }
  }

  function saveFailedAttempts(value) {
    try {
      localStorage.setItem(DEMO_ATTEMPTS_KEY, JSON.stringify(value));
      return true;
    } catch (error) {
      attemptStatus.textContent = "This browser could not save demo attempt state.";
      return false;
    }
  }

  function bytesToBase64(bytes) {
    var binary = "";
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function base64ToBytes(value) {
    var binary = atob(value);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function deriveDemoHash(password, salt) {
    var encoder = new TextEncoder();
    return window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"])
      .then(function (key) {
        return window.crypto.subtle.deriveBits({
          name: "PBKDF2",
          salt: salt,
          iterations: DEMO_ITERATIONS,
          hash: "SHA-256"
        }, key, 256);
      })
      .then(function (bits) { return new Uint8Array(bits); });
  }

  function sameBytes(left, right) {
    if (left.length !== right.length) return false;
    var difference = 0;
    for (var i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
    return difference === 0;
  }

  function passwordRules(password) {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password)
    };
  }

  function updateStrength() {
    var password = el("signup-password").value;
    var rules = passwordRules(password);
    var score = 0;
    Object.keys(rules).forEach(function (rule) {
      if (rules[rule]) score += 1;
      var row = document.querySelector('.password-rules [data-rule="' + rule + '"]');
      row.setAttribute("data-valid", rules[rule] ? "true" : "false");
    });
    var fill = el("strength-fill");
    fill.style.width = (score * 20) + "%";
    fill.style.background = score < 3 ? "#bb263b" : score < 5 ? "#c18b2c" : "#32804a";
    document.querySelector(".strength-meter").setAttribute("aria-valuenow", String(score));
    document.querySelector(".strength-meter").setAttribute("aria-valuetext", score + " of 5 password rules met");
  }

  function validDemoEmail(email) {
    return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setAuthTab(tab) {
    var signingIn = tab === "signin";
    el("signin-tab").setAttribute("aria-selected", signingIn ? "true" : "false");
    el("signup-tab").setAttribute("aria-selected", signingIn ? "false" : "true");
    el("signin-tab").tabIndex = signingIn ? 0 : -1;
    el("signup-tab").tabIndex = signingIn ? -1 : 0;
    el("signin-panel").hidden = !signingIn;
    el("signup-panel").hidden = signingIn;
    el("auth-title").textContent = signingIn ? "Sign in" : "Sign up";
    signinMessage.textContent = "";
    signupMessage.textContent = "";
    (signingIn ? el("signin-email") : el("signup-email")).focus();
    if (signingIn) updateAttemptStatus();
  }

  function openAuth(tab) {
    setAuthTab(tab || "signin");
    if (!authDialog.open) authDialog.showModal();
  }

  el("security-signin").addEventListener("click", function () { openAuth("signin"); });
  el("security-demo-link").addEventListener("click", function (event) {
    event.preventDefault();
    if (!demoDialog.open) demoDialog.showModal();
  });
  document.querySelectorAll("[data-close-dialog]").forEach(function (button) {
    button.addEventListener("click", function () {
      var dialog = el(button.getAttribute("data-close-dialog"));
      if (dialog && dialog.open) dialog.close();
    });
  });
  el("signin-tab").addEventListener("click", function () { setAuthTab("signin"); });
  el("signup-tab").addEventListener("click", function () { setAuthTab("signup"); });
  [el("signin-tab"), el("signup-tab")].forEach(function (tab) {
    tab.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setAuthTab(tab === el("signin-tab") ? "signup" : "signin");
        (tab === el("signin-tab") ? el("signup-tab") : el("signin-tab")).focus();
      }
    });
  });
  document.querySelectorAll("[data-password-target]").forEach(function (button) {
    button.addEventListener("click", function () {
      var input = el(button.getAttribute("data-password-target"));
      var visible = input.type === "password";
      input.type = visible ? "text" : "password";
      button.textContent = visible ? "Hide" : "Show";
      button.setAttribute("aria-pressed", visible ? "true" : "false");
    });
  });
  el("signup-password").addEventListener("input", updateStrength);

  function updateAttemptStatus() {
    var attempt = readFailedAttempts();
    var left = Math.max(0, attempt.lockUntil - Date.now());
    if (left > 0) {
      var seconds = Math.ceil(left / 1000);
      attemptStatus.textContent = "Failed attempts: " + attempt.count + " of 3. Sign-in locked for " + seconds + " seconds.";
      signinSubmit.disabled = true;
      return;
    }
    if (attempt.lockUntil) {
      attempt.count = 0;
      attempt.lockUntil = 0;
      saveFailedAttempts(attempt);
    }
    signinSubmit.disabled = false;
    attemptStatus.textContent = "Failed attempts: " + attempt.count + " of 3.";
  }

  function startLockCountdown() {
    clearInterval(lockTimer);
    updateAttemptStatus();
    lockTimer = setInterval(function () {
      updateAttemptStatus();
      if (!signinSubmit.disabled) {
        clearInterval(lockTimer);
        lockTimer = null;
      }
    }, 250);
  }

  function recordFailedAttempt() {
    var attempt = readFailedAttempts();
    attempt.count = Math.min(3, attempt.count + 1);
    if (attempt.count >= 3) attempt.lockUntil = Date.now() + DEMO_LOCK_MS;
    saveFailedAttempts(attempt);
    signinMessage.textContent = "Incorrect email or password";
    startLockCountdown();
  }

  signupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    signupMessage.textContent = "";
    var email = el("signup-email").value.trim().toLowerCase();
    var password = el("signup-password").value;
    var rules = passwordRules(password);
    if (!validDemoEmail(email)) {
      signupMessage.textContent = "Enter a valid email address.";
      el("signup-email").focus();
      return;
    }
    if (password.length > 256) {
      signupMessage.textContent = "Password must be 256 characters or fewer.";
      return;
    }
    if (!Object.keys(rules).every(function (rule) { return rules[rule]; })) {
      signupMessage.textContent = "Meet all five password rules before creating an account.";
      return;
    }
    var accounts = readDemoAccounts();
    if (accounts.some(function (account) { return account.email === email; })) {
      signupMessage.textContent = "A demo account with this email already exists in this browser.";
      return;
    }
    var submit = el("signup-submit");
    submit.disabled = true;
    signupMessage.textContent = "Creating a salted demo password hash…";
    if (!window.crypto || !window.crypto.subtle || !window.crypto.getRandomValues) {
      signupMessage.textContent = "Web Crypto is unavailable. Open this demo on localhost or HTTPS.";
      submit.disabled = false;
      return;
    }
    var salt = window.crypto.getRandomValues(new Uint8Array(16));
    deriveDemoHash(password, salt).then(function (hash) {
      accounts.push({
        email: email,
        salt: bytesToBase64(salt),
        hash: bytesToBase64(hash),
        iterations: DEMO_ITERATIONS
      });
      try {
        localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
      } catch (error) {
        signupMessage.textContent = "This browser could not save the demo account.";
        return;
      }
      signupForm.reset();
      updateStrength();
      signupMessage.textContent = "";
      if (authDialog.open) authDialog.close();
      setDemoSession(email);
    }).catch(function () {
      signupMessage.textContent = "The browser could not derive a secure demo hash.";
    }).finally(function () {
      submit.disabled = false;
    });
  });

  signinForm.addEventListener("submit", function (event) {
    event.preventDefault();
    signinMessage.textContent = "";
    var attempt = readFailedAttempts();
    if (attempt.lockUntil > Date.now()) {
      updateAttemptStatus();
      return;
    }
    var email = el("signin-email").value.trim().toLowerCase();
    var password = el("signin-password").value;
    var submit = signinSubmit;
    if (!window.crypto || !window.crypto.subtle) {
      signinMessage.textContent = "Web Crypto is unavailable. Open this demo on localhost or HTTPS.";
      return;
    }
    submit.disabled = true;
    var accounts = readDemoAccounts();
    var account = validDemoEmail(email) && password.length <= 256
      ? accounts.filter(function (candidate) { return candidate.email === email; })[0]
      : null;
    var salt;
    try {
      salt = account ? base64ToBytes(account.salt) : new Uint8Array(16);
    } catch (error) {
      recordFailedAttempt();
      updateAttemptStatus();
      return;
    }
    deriveDemoHash(password.slice(0, 256), salt).then(function (hash) {
      var matches = false;
      if (account) {
        try { matches = sameBytes(hash, base64ToBytes(account.hash)); }
        catch (error) { matches = false; }
      }
      if (!matches) {
        el("signin-password").value = "";
        recordFailedAttempt();
        return;
      }
      saveFailedAttempts({ count: 0, lockUntil: 0 });
      signinForm.reset();
      if (authDialog.open) authDialog.close();
      setDemoSession(account.email);
    }).catch(function () {
      signinMessage.textContent = "The browser could not check the demo password. Please retry.";
      updateAttemptStatus();
    }).finally(function () {
      updateAttemptStatus();
    });
  });
  updateAttemptStatus();

  function updateSessionDisplay() {
    var signedIn = Boolean(currentSession);
    el("security-signin").hidden = signedIn;
    el("security-signout").hidden = !signedIn;
    el("signed-in-label").hidden = !signedIn;
    el("signed-in-label").textContent = signedIn ? "Signed in as " + currentSession : "";
  }

  function signOut(message) {
    clearInterval(sessionTimer);
    sessionTimer = null;
    currentSession = null;
    sessionDeadline = 0;
    sessionWarning.hidden = true;
    updateSessionDisplay();
    if (message) toast(message);
  }

  function setDemoSession(email) {
    currentSession = email;
    sessionDeadline = Date.now() + DEMO_SESSION_MS;
    sessionWarning.hidden = true;
    updateSessionDisplay();
    clearInterval(sessionTimer);
    sessionTimer = setInterval(checkSession, 1000);
    toast("Demo sign-in successful");
  }

  function checkSession() {
    if (!currentSession) return;
    var remaining = sessionDeadline - Date.now();
    if (remaining <= 0) {
      signOut("Signed out after 2 minutes of inactivity");
      return;
    }
    if (remaining <= DEMO_WARNING_MS) {
      sessionWarning.hidden = false;
      sessionWarning.textContent = "You will be signed out for inactivity in " + Math.ceil(remaining / 1000) + " seconds. Interact with the page to stay signed in.";
    } else {
      sessionWarning.hidden = true;
    }
  }

  function recordActivity(event) {
    if (!currentSession) return;
    if (event && event.type === "mousemove") {
      var now = Date.now();
      if (now - activityThrottle < 1000) return;
      activityThrottle = now;
    }
    sessionDeadline = Date.now() + DEMO_SESSION_MS;
    sessionWarning.hidden = true;
  }

  ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"].forEach(function (eventName) {
    document.addEventListener(eventName, recordActivity, { passive: true });
  });
  document.addEventListener("visibilitychange", checkSession);
  el("security-signout").addEventListener("click", function () { signOut("Signed out"); });

  el("submit-review").addEventListener("click", function () {
    var review = el("review-text").value.trim();
    el("review-output").textContent = review || "Please write a review before posting.";
    if (review) el("review-text").value = "";
  });
})();
