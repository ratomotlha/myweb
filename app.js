/* Rusty Grand Café: shared script for all pages */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Rustenburg time + open status ---------- */
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function saNow() {
    const p = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Johannesburg", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const g = t => p.find(x => x.type === t)?.value;
    return { day: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[g("weekday")], mins: +g("hour") * 60 + +g("minute"), iso: `${g("year")}-${g("month")}-${g("day")}` };
  }
  const HOURS = { 0: [480, 1560], 1: [480, 1320], 2: [480, 1320], 3: [480, 1320], 4: [480, 1320], 5: [480, 1560], 6: [480, 1560] };
  const hhmm = m => `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  function openState() {
    const { day, mins } = saNow();
    const prev = (day + 6) % 7;
    if (HOURS[prev][1] > 1440 && mins < HOURS[prev][1] - 1440) return { open: true, until: HOURS[prev][1], night: prev };
    const [o, c] = HOURS[day];
    if (mins >= o && mins < c) return { open: true, until: c, night: day };
    if (mins < o) return { open: false, opens: o, night: day };
    return { open: false, opens: HOURS[(day + 1) % 7][0], tomorrow: true, night: day };
  }
  function paintStatus() {
    const s = openState();
    const text = s.open ? `Open now · until ${hhmm(s.until)}` : `Closed · opens ${s.tomorrow ? "tomorrow" : "today"} at ${hhmm(s.opens)}`;
    $$("[data-status]").forEach(el => { el.classList.toggle("is-open", s.open); el.classList.toggle("is-closed", !s.open); $(".status-text", el).textContent = text; });
    const today = saNow().day;
    $$("[data-hours] li").forEach(li => li.classList.toggle("today", +li.dataset.d === today));
    return s;
  }
  const state = paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Mobile sheet ---------- */
  const burger = $("[data-burger]"), sheet = $("[data-sheet]");
  const setSheet = open => { sheet.classList.toggle("open", open); burger.setAttribute("aria-expanded", open); };
  burger.addEventListener("click", () => setSheet(!sheet.classList.contains("open")));
  addEventListener("keydown", e => { if (e.key === "Escape") setSheet(false); });

  /* ---------- Nights + live Google Sheet events (with offline fallback) ---------- */
  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1o_7OcvVgU8Sb9fx_gfzWc0omNTPAvyJLkXmQ45Y7lE8/gviz/tq?tqx=out:csv&sheet=Events&tq=" + encodeURIComponent("select * where B is not null");
  const SHEET_CACHE_KEY = "rgc_sheet_events_v1";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const NIGHTS = [
    { days: [1], label: "Monday", name: "Acoustic Mondays", img: "acoustic.jpg", desc: "Start the week slow, with live acoustic sets up close." },
    { days: [2, 3], label: "Tue & Wed", name: "Midweek Blend", img: "poster-midblend.jpg", desc: "Smooth music and good company to break up the week." },
    { days: [4], label: "Thursday", name: "Ladies Night", img: "poster-ladies.jpg", desc: "Thursday belongs to the ladies. Big sounds, glam crowd." },
    { days: [5], label: "Friday", name: "Feel Good Fridays", img: "poster-fridays.jpg", desc: "The weekend starts here. Rhythm, connection and good energy." },
    { days: [6], label: "Saturday", name: "Ballers Night", img: "poster-ballers.jpg", desc: "Bold, elevated and premium. Dress for it." },
    { days: [0], label: "Sunday", name: "Best Sundays", img: "lounge-navy.jpg", desc: "Close the week with laid-back vibes and warm energy." },
  ];
  const CLEAN_BG = { 0: "lounge-navy.jpg", 1: "acoustic.jpg", 2: "cocktails-2.jpg", 3: "cocktails-2.jpg", 4: "cocktails-2.jpg", 5: "hero-bar.jpg", 6: "hero-new.jpg" };
  const FALLBACK_EVENTS = [
    { date: "2026-11-25", name: "Hip Hop Night", img: "assets/img/anniv-hiphop.jpg", fb: "assets/img/anniv-hiphop.jpg", acts: "Loatinover Pounds, Ntompa, Dizzy Beatz, Ashleigh Wolves, Johmo", series: "8th Anniversary" },
    { date: "2026-11-26", name: "Waterfall Ladies Night", img: "assets/img/anniv-ladies.jpg", fb: "assets/img/anniv-ladies.jpg", acts: "Tman Xpress live, Zinzi Kahnish, Juss Gigi, Big Soul", series: "8th Anniversary" },
    { date: "2026-11-27", name: "Feel Good Fridays", img: "assets/img/anniv-fridays.jpg", fb: "assets/img/anniv-fridays.jpg", acts: "Prince Kaybee, Pearl Thusi, Musa Keys, Ms Williams", series: "8th Anniversary" },
    { date: "2026-11-28", name: "Ballers Night", img: "assets/img/anniv-ballers.jpg", fb: "assets/img/anniv-ballers.jpg", acts: "Emtee, TBO Touch, Cyan Boujee, Babalwa M, King Deetoy", series: "8th Anniversary" },
    { date: "2026-11-29", name: "Best Sunday", img: "assets/img/anniv-sunday.jpg", fb: "assets/img/anniv-sunday.jpg", acts: "Young Stunna, Mörda, DJ Zinhle, Zinzi Kahnish, Presss", series: "8th Anniversary" },
    { date: "2026-11-30", name: "Acoustic Monday", img: "assets/img/acoustic.jpg", fb: "assets/img/acoustic.jpg", acts: "feat. Sjava. Closing the anniversary week.", plain: true, series: "8th Anniversary" },
  ];

  // a night "belongs" to its date until 06:00 the next morning (SA time)
  const nightIso = (() => { const n = saNow(); if (n.mins >= 360) return n.iso; const d = new Date(n.iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); })();
  const tonightNight = NIGHTS.find(n => n.days.includes(state.night));
  const fmt = iso => new Date(iso + "T12:00:00Z").toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  function parseCSV(txt) {
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < txt.length; i++) {
      const c = txt[i];
      if (q) {
        if (c === '"' && txt[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\r") continue;
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  function normDate(raw) {
    const s = String(raw || "").trim();
    let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    const d = new Date(s);
    return isNaN(d) ? "" : d.toISOString().slice(0, 10);
  }

  function resolvePoster(rawLink, iso, styleRaw) {
    const dow = new Date(iso + "T12:00:00Z").getUTCDay();
    const fb = `assets/img/${CLEAN_BG[dow] || "hero-new.jpg"}`;
    const link = String(rawLink || "").trim();
    const wantPlain = /^(photo|text|plain)/i.test(String(styleRaw || "").trim()) || !link;
    if (!link) return { img: fb, fb, plain: true };
    const dm = link.match(/(?:\/d\/|[?&]id=)([-\w]{20,})/) || (link.match(/^[-\w]{25,}$/) ? [null, link] : null);
    if (dm) return { img: `https://lh3.googleusercontent.com/d/${dm[1]}=w1600`, fb, plain: wantPlain };
    if (/^https?:\/\//i.test(link)) return { img: link, fb, plain: wantPlain };
    const local = link.startsWith("assets/") ? link : `assets/img/${link}`;
    return { img: local, fb, plain: wantPlain };
  }

  function rowsToEvents(rows) {
    return rows.slice(1).map(r => {
      const showVal = String(r[0] ?? "").trim().toLowerCase();
      if (showVal === "false" || showVal === "no" || showVal === "0") return null;
      const date = normDate(r[1]);
      const name = String(r[2] ?? "").trim();
      if (!date || !name) return null;
      const acts = String(r[3] ?? "").trim();
      const series = String(r[6] ?? "").trim();
      const { img, fb, plain } = resolvePoster(r[5], date, r[4]);
      return { date, name, acts, img, fb, plain, series };
    }).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
  }

  let specialEvents = (() => {
    try { const cached = JSON.parse(sessionStorage.getItem(SHEET_CACHE_KEY) || "null"); if (Array.isArray(cached)) return cached; } catch {}
    return FALLBACK_EVENTS;
  })();
  let userPickedTab = null;

  /* ---------- Sliding pill helper for segmented tabs ---------- */
  function syncSegPill(segEl) {
    if (!segEl || segEl.hidden) return;
    let pill = $(".seg-pill", segEl);
    if (!pill) {
      pill = document.createElement("span");
      pill.className = "seg-pill";
      pill.setAttribute("aria-hidden", "true");
      segEl.prepend(pill);
    }
    const active = $('button[aria-selected="true"]', segEl);
    if (!active || !active.offsetWidth) return;
    segEl.classList.add("has-pill");
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
  }
  addEventListener("resize", () => $$(".seg").forEach(syncSegPill), { passive: true });

  /* ---------- Slideshows (home) ---------- */
  $$("[data-slides]").forEach((box, k) => {
    const imgs = $$(":scope > img", box), dots = $("[data-dots]", box);
    if (imgs.length < 2) return;
    const ms = 5000 + k * 900;
    box.style.setProperty("--slide-ms", `${ms}ms`);
    let i = 0, timer;
    dots.innerHTML = imgs.map((_, j) => `<button type="button" aria-label="Photo ${j + 1}"${j ? "" : ' class="on"'}></button>`).join("");
    const go = n => { i = (n + imgs.length) % imgs.length; imgs.forEach((im, j) => im.classList.toggle("on", j === i)); $$("button", dots).forEach((d, j) => d.classList.toggle("on", j === i)); };
    const play = () => { if (!reduce) timer = setInterval(() => go(i + 1), ms); };
    dots.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; e.preventDefault(); e.stopPropagation(); clearInterval(timer); go($$("button", dots).indexOf(b)); play(); });
    imgs.forEach(im => { if (im.loading === "lazy") im.loading = "eager"; });
    play();
  });

  /* ---------- What's on + Tonight + Booking sync ---------- */
  const grid = $("[data-events]"), seg = $("[data-ev-seg]"), evCopy = $("[data-ev-copy]");
  if (seg) {
    seg.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      userPickedTab = b.dataset.ev;
      renderEventsUI();
    });
  }

  let syncBookNote = null;

  function renderEventsUI() {
    const upcoming = specialEvents.filter(a => a.date >= nightIso);
    const tonightAnniv = specialEvents.find(a => a.date === nightIso);
    const tonight = tonightAnniv
      ? { name: tonightAnniv.name, img: tonightAnniv.img, fb: tonightAnniv.fb || `assets/img/${tonightNight.img}`, alt: `${tonightAnniv.name} tonight${tonightAnniv.acts ? ": " + tonightAnniv.acts : ""}` }
      : { name: tonightNight.name, img: `assets/img/${tonightNight.img}`, fb: `assets/img/${tonightNight.img}`, alt: `${tonightNight.name} at Rusty Grand Café` };

    $$("[data-tonight-name]").forEach(el => { el.textContent = tonight.name; });
    $$("[data-tonight-img]").forEach(el => {
      el.referrerPolicy = "no-referrer";
      el.onerror = () => { el.onerror = null; el.src = tonight.fb; };
      el.src = tonight.img;
      el.alt = tonight.alt;
    });

    if (grid) {
      const seriesLabel = upcoming.find(a => a.series)?.series || "Special Events";
      const annivBtn = seg ? $('[data-ev="anniv"]', seg) : null;
      if (annivBtn) annivBtn.textContent = seriesLabel;

      const weeklyHTML = () => NIGHTS.map((n, idx) => `
        <article class="ev${n === tonightNight && !tonightAnniv ? " tonight" : ""}" style="--i:${idx}">
          <img src="assets/img/${n.img}" alt="${esc(n.name)} at Rusty Grand Café" loading="lazy" />
          <div class="ev-body"><span class="ev-day">${n === tonightNight && !tonightAnniv ? "Tonight" : esc(n.label)}</span><h3>${esc(n.name)}</h3><p>${esc(n.desc)}</p></div>
        </article>`).join("");

      const specialHTML = () => upcoming.map((a, idx) => a.plain ? `
        <article class="ev${a.date === nightIso ? " tonight" : ""}" style="--i:${idx}">
          <img src="${esc(a.img)}" data-fb="${esc(a.fb || "")}" referrerpolicy="no-referrer" alt="${esc(a.name)} ${esc(a.acts)}" loading="lazy" />
          <div class="ev-body"><span class="ev-day">${a.date === nightIso ? "Tonight" : esc(fmt(a.date))}</span><h3>${esc(a.name)}</h3>${a.acts ? `<p>${esc(a.acts)}</p>` : ""}</div>
        </article>` : `
        <article class="ev poster${a.date === nightIso ? " tonight" : ""}" style="--i:${idx}">
          <img src="${esc(a.img)}" data-fb="${esc(a.fb || "")}" referrerpolicy="no-referrer" alt="${esc(a.name)}, ${esc(fmt(a.date))}${a.acts ? ": " + esc(a.acts) : ""}" loading="lazy" />
          <div class="ev-body"><span class="ev-day">${a.date === nightIso ? "Tonight" : esc(fmt(a.date))}</span></div>
        </article>`).join("") + `
        <a href="book.html" class="ev cta" style="--i:${upcoming.length}"><span class="pill-label pill-new">${esc(seriesLabel)}</span><h3>Book your table</h3><span class="btn btn-solid btn-sm">Reserve <i class="arrow">↗</i></span></a>`;

      const activeKind = upcoming.length ? (userPickedTab || "anniv") : "weekly";
      if (seg) {
        seg.hidden = !upcoming.length;
        $$("button", seg).forEach(b => b.setAttribute("aria-selected", b.dataset.ev === activeKind));
        requestAnimationFrame(() => syncSegPill(seg));
      }
      const totalCards = activeKind === "anniv" ? upcoming.length + 1 : NIGHTS.length;
      grid.classList.toggle("many", totalCards > 6);
      grid.innerHTML = activeKind === "anniv" ? specialHTML() : weeklyHTML();
      $$("img[data-fb]", grid).forEach(im => {
        im.onerror = () => { if (im.dataset.fb && im.src !== im.dataset.fb) { im.onerror = null; im.src = im.dataset.fb; } };
      });
      if (evCopy) {
        evCopy.textContent = activeKind === "anniv"
          ? (/8th\s*anniv/i.test(seriesLabel)
              ? "Eight years of Rusty, eight years of the culture. A full week of headline acts at Waterfall Value Mart. Tables go fast, so book early."
              : `${seriesLabel} at Rusty Grand Café, Value Mart Rustenburg. Tables go fast, so book early.`)
          : "Every night at RGC has its own sound. Find your night, bring your people.";
      }
    }
    if (syncBookNote) syncBookNote();
  }

  renderEventsUI();

  fetch(`${SHEET_CSV_URL}&_ts=${Date.now()}`, { cache: "no-store" })
    .then(r => r.ok ? r.text() : Promise.reject(r.status))
    .then(txt => {
      if (/^\s*</.test(txt)) throw new Error("non-csv");
      const parsed = rowsToEvents(parseCSV(txt));
      specialEvents = parsed;
      try { sessionStorage.setItem(SHEET_CACHE_KEY, JSON.stringify(parsed)); } catch {}
      renderEventsUI();
    })
    .catch(() => { /* offline or restricted: built-in/cached schedule stays active */ });

  /* ---------- Menu page ---------- */
  const list = $("[data-menu-list]");
  if (list) {
  const MENU = {
    food: [
      { name: "Breakfast", note: "Served from 08:00", items: [
        ["Grand Loaded Breakfast", 140, "2 eggs, bacon, grilled tomato, sausage, caramelised onion, pastrami, savoury beans and toasted bread"],
        ["Traditional American Breakfast", 120, "2 eggs, sausage, bacon and pancakes"],
        ["English Breakfast", 110, ""],
        ["Mushroom & Cheese Omelette", 80, ""],
        ["Veg Omelette", 80, ""],
        ["Cheese Omelette", 75, ""],
        ["High Protein Breakfast", 75, "2 eggs, salad, baby tomatoes and avocado"],
        ["French Toast", 65, "Egg-toasted bread, bacon and honey"],
      ]},
      { name: "Tapas", items: [
        ["Tempura Prawns", 115, "Served with lemon butter sauce"],
        ["Chicken Livers", 75, "Mild or peri-peri"],
        ["Chinese Dumplings", 75, "Served with soy sauce and sriracha mayo"],
        ["Crispy Calamari", 90, "Served with lemon butter sauce"],
        ["Squid Heads", 79],
      ]},
      { name: "Tacos & Street Bits", items: [
        ["Crispy Chicken Tacos (4)", 160],
        ["Chilly Prawn Tacos (4)", 190],
        ["Beef Tacos (4)", 175],
      ]},
      { name: "Salads & Bowls", items: [
        ["Grand Greek Caesar", 80],
        ["Grand Reloaded Salad", 120],
        ["Mediterranean Harvest Bowl", 115],
        ["Sesame Steak Bowl", 128],
        ["Sesame Salmon Bowl", 125],
        ["Roast Veg & Feta Salad", 115],
      ], extras: "<b>Extras:</b> olives R25 · feta R25 · avocado R20 · bacon R25 · chicken R20" },
      { name: "Chicken Wings", note: "Plain, BBQ, peri-peri or lemon herb, with fries", items: [
        ["6 Wings", 120, ""],
        ["10 Wings", 185],
        ["15 Wings", 220],
      ]},
      { name: "Burgers", items: [
        ["Beef Burger", 120],
        ["Chicken Burger", 115],
        ["Bacon, Avo & Cheese Burger", 160],
      ]},
      { name: "Mains", note: "With a side and sauce: fries, veggies, onion rings or salad", items: [
        ["Chicken Schnitzel", 135],
        ["Chicken Strips", 115],
        ["300g Rump Steak", 195],
        ["400g Sirloin Steak", 235],
        ["350g T-Rump", 175],
        ["350g T-Bone", 205],
        ["500g Pork Ribs", 180],
        ["Flame-Grilled Half Chicken", 140],
        ["500g Beef Ribs", 220],
        ["1kg Beef Ribs", 330],
        ["450g Lamb Chops", 270],
        ["500g Tomahawk Steak", 290],
        ["Mixed Grill", 340, "300g rump steak, 150g lamb chops, 100g boerewors"],
      ], extras: "<b>Add-ons:</b> pap &amp; gravy R30 · chunky stir-fry R35 · side salad R35 · salsa R25 · chakalaka R25 · mashed potatoes R25<br><b>Sauces:</b> chimichurri · vodka · lemon butter · creamy mushroom · red wine reduction · tartar" },
      { name: "Combos & Platters", items: [
        ["Ribs & Wings Combo", 230],
        ["Prawns, Calamari & Fries", 240],
        ["Chicken Strips & Ribs 500g", 185],
        ["Basket for 2", 450, "4 wings, 400g pork ribs, 200g wors, chips and dipping sauce"],
        ["Rusty Grand Charcuterie Board for 2", 450, "On request"],
        ["Rusty Grand Meat Platter for 5", 950, "10 wings, 5 drumsticks, 600g pork ribs, 400g wors, samosas and fries"],
        ["Rusty Grand Meat Platter for 10", 1750, "400g sliced chuck, 10 drumsticks, 600g wors, wings, 800g pork ribs, samosas and fries"],
      ]},
      { name: "Seafood", items: [
        ["Hake & Chips", 160],
        ["5 King Prawns", 190, "With rice or chips"],
        ["Grand Fish Platter", 395, "2 hake, prawns, mussels, calamari, squid heads, rice or chips, lemon or garlic sauce"],
      ]},
      { name: "Pizza", cols: ["M", "L"], items: [
        ["Mexican Pizza", [110, 165]],
        ["Hawaiian Pizza", [110, 165]],
        ["Bacon & Feta Pizza", [115, 170]],
        ["Smoked Chicken & Avo Pizza", [115, 170]],
      ]},
      { name: "Pasta & Comfort", items: [
        ["Seafood Pasta", 180],
        ["Prawn & Chilli Pasta", 135],
        ["Beef Pasta", 115],
        ["Stir-Fry Chicken or Beef", 120],
        ["Creamy Chicken Penne", 135],
      ]},
      { name: "Sushi", items: [
        ["Salmon Roses", 130, "Salmon-wrapped rice topped with mayo"],
        ["Rainbow / Salmon California Roll", 145, "California roll topped with salmon and avocado"],
        ["Tempura Roll / Salmon Futomaki", 180, "Salmon, cucumber, avocado, prawn and tuna, deep-fried"],
        ["Sushi Sandwich", 140, "Salmon or trout, avocado, lettuce and cucumber"],
        ["Nigiri", 130, "Sushi rice topped with salmon, tuna or prawn"],
        ["Cucumber Maki", 70], ["Avocado Maki", 70], ["Prawn Maki", 90], ["Salmon Maki", 115], ["Tuna Maki", 120],
      ]},
      { name: "Dessert", items: [
        ["Warm Malva Pudding", 80],
        ["Ice-Cream Bombe", 100],
        ["Cheesecake", 120],
      ]},
    ],
    drinks: [
      { name: "Signature Cocktails", items: [
        ["Pornstar Martini", 75, "Vodka, passion fruit, fresh lemon, vanilla, sparkling wine"],
        ["Foreign Rusty Mule", 65, "Reposado tequila, watermelon, lime and mint, topped with ginger beer"],
        ["Litchi Samba", 65, "Citrus vodka, elderflower, lemon, coconut water and litchi"],
        ["Hibiscus Fizz", 65, "Strawberry gin, Campari, hibiscus, lemon, pink grapefruit and tonic"],
        ["Rusty Grand Henrietta", 120, "Cognac, apple juice, ginger ale and elderflower"],
        ["Signature Rusty Rosé", 100, "Gin, watermelon and grapefruit syrups, Brutal Fruit"],
        ["Rusty Purple Rain", 70, "Grenadine, blue curaçao, vodka, lime, sour mix and egg white"],
        ["Mojito", 65, "Bacardi white rum, mint, lemon and soda"],
        ["Dirty Martini", 70, "Gin or vodka, olive brine, dry vermouth and 3 olives"],
        ["Sex on the Beach", 70, "Orange juice, vodka, grenadine and peach"],
        ["Daiquiri", 65, "Strawberry, vodka or white rum, lime"],
        ["Piña Colada", 65, "White rum, coconut cream, pineapple and lime"],
      ]},
      { name: "Classic Mix", items: [
        ["Cosmopolitan", 55, "Vodka, triple sec, strawberry, rose, lemon and cranberry"],
        ["Whiskey Sour", 65, "Whiskey, lemon, sugar, topped with red wine"],
        ["Long Island Iced Tea", 110, "Vodka, tequila, rum, triple sec, gin, lime sour and cola"],
        ["Rusty Smash", 150, "Cider cocktail with vodka, and a tequila shot on the side"],
        ["Berry Negroni", 65, "Strawberry-infused gin, Campari, sweet vermouth, sun-dried orange"],
        ["Margarita", 60, "Reposado tequila, triple sec, lime and lemon"],
      ]},
      { name: "Gin Jugs", note: "5 tots gin + 2 cans tonic", items: [
        ["Tanqueray London Grapefruit Squeeze", 150, "Rosemary and grapefruit"],
        ["Tanqueray London Strawberry & Lime", 150, "Strawberry and lime"],
        ["Tanqueray Blackcurrant Royale", 180, "Butterfly pea flower"],
        ["Tanqueray Seville Orange & Cinnamon", 150, "Orange slice and cinnamon"],
      ]},
      { name: "Alcohol-Free", items: [
        ["Grapefruit Rose Mojito", 40, "Strawberry & rose syrup, lime, mint, grapefruit soda"],
        ["Tiramisu Piña Colada", 40, "Pineapple, coconut, coconut milk, tiramisu dust"],
        ["Watermelon Fizz", 30, "Watermelon syrup and lemonade"],
        ["Pink Tonic Hibiscus Daiquiri", 30, "Pink tonic, hibiscus and berry"],
        ["Sparkling Sunrise", 35, "Orange, cranberry, lemon, lemongrass and soda"],
        ["Zari Non-Alc (white or red)", 220],
        ["Corona Non-Alc", 35],
      ]},
      { name: "Frozen & Shakes", items: [
        ["Kiwi Daiquiri", 35, "Kiwi, cucumber and lemon"],
        ["Mango Daiquiri", 35, "Mango, lemon and blood orange"],
        ["Strawberry Daiquiri", 35, "Strawberry and rum"],
        ["Pink Tonic Daiquiri", 80, "Grapefruit, cranberry, hibiscus and gin"],
        ["Tiramisu Piña Colada", 75, "Pineapple, coconut, tiramisu and rum"],
        ["Oreo Milkshake", 35], ["Bar One Milkshake", 35], ["Dom Pedro", 55],
      ]},
      { name: "Beers & Ciders", items: [
        ["Draught on Tap", 55, "Castle Lite, Stella or Black Label"],
        ["Black Label", 28], ["Castle Lite", 28], ["Corona", 40], ["Heineken", 35], ["Stella", 32],
        ["Windhoek Lager", 35], ["Windhoek Draught", 35],
        ["Savanna Dry", 35], ["Savanna Angry Lemon", 35],
        ["Belgravia G&T / Dry Lemon", 32], ["Black Crown G&T / Dry Lemon", 32],
        ["Brutal Fruit (Litchi, Ruby, Strawberry)", 32], ["Kix", 30],
        ["Ice Tropez / Ice Tropez Zero", 120],
      ]},
      { name: "Whiskey & Brandy", cols: ["Bottle", "Tot"], items: [
        ["Glenfiddich 12", [1350, 45]], ["Glenfiddich 15", [2500, null]], ["Glenfiddich 21", [6500, null]],
        ["Glenlivet 12", [1350, 45]], ["Glenlivet 15", [1900, null]],
        ["Jameson", [900, 30]], ["Jameson Select", [1200, 40]], ["Jack Daniel’s", [null, 25]],
        ["Johnnie Walker Black", [null, 40]], ["Johnnie Walker Blonde", [null, 25]],
        ["Johnnie Walker Gold", [1400, null]], ["Johnnie Walker Blue", [6000, null]],
        ["Klipdrift", [null, 20]], ["Richelieu", [null, 20]],
      ]},
      { name: "Cognac", cols: ["Bottle", "Tot"], items: [
        ["Dusse VSOP", [2000, null]], ["Martell VS", [1050, 35]], ["Hennessy VS", [1350, 45]],
        ["Hennessy VSOP", [1950, null]], ["Hennessy XO", [6500, null]], ["Rémy Martin VSOP", [2000, null]],
        ["Rémy Martin 1738", [2800, null]], ["Bisquit VS", [1250, null]],
      ]},
      { name: "Champagne & MCC", items: [
        ["Armand de Brignac Ace of Spades", 11500], ["Dom Pérignon", 8000], ["Veuve Clicquot Rich", 2200],
        ["Moët Nectar", 2000], ["Veuve Clicquot Brut", 1900], ["G.H. Mumm Olympe Demi-Sec", 1700],
        ["Moët Brut", 1400], ["Luc Belaire", 1200],
        ["Krone Nectar", 560], ["Krone Brut", 555], ["JC le Roux La Vallée Demi-Sec", 290],
      ]},
      { name: "Gin", cols: ["Bottle", "Tot"], items: [
        ["Beefeater Pink", [850, 30]], ["Beefeater Blood Orange", [850, 30]], ["Bombay Sapphire", [900, null]],
        ["Hendrick’s", [1300, null]], ["Inverroche Amber", [1300, null]], ["Malfy Con Arancia", [1100, null]],
        ["Tanqueray", [900, 30]], ["Tanqueray No. Ten", [1200, null]],
      ]},
      { name: "Vodka", cols: ["Bottle", "Tot"], items: [
        ["Grey Goose", [1200, null]], ["Cîroc", [1100, null]], ["Belvedere", [1100, null]],
        ["Cruz Watermelon", [850, 28]], ["Cruz Vintage Black", [750, 25]], ["Absolut", [750, 25]], ["Skyy Vodka", [650, null]],
      ]},
      { name: "Tequila & Rum", cols: ["Bottle", "Tot"], items: [
        ["Don Julio 1942", [10000, null]], ["Clase Azul", [7500, null]], ["Don Julio Reposado", [2200, null]],
        ["Don Julio Blanco", [1800, null]], ["El Jimador Reposado", [null, 30]], ["Olmeca Blanco", [null, 25]],
        ["Bacardi Blanco", [null, 20]], ["Captain Morgan Spiced Gold", [null, 20]], ["Captain Morgan Dark", [null, 25]],
      ]},
      { name: "Red Wine", cols: ["Bottle", "Glass"], items: [
        ["De Toren Fusion V", [920, null]], ["Springfield Work of Time", [890, null]], ["Meerlust Rubicon", [850, null]],
        ["Vilafonté Old Dirt", [780, null]], ["Meerlust Merlot", [750, null]], ["Optima", [650, null]],
        ["Creation", [640, null]], ["R&R Classique", [550, null]], ["Chocolate Block", [520, null]],
        ["Kanonkop Kadette", [410, null]], ["Warwick First Lady Cab Sauv", [380, null]],
        ["Fat Bastard Cab Sauv", [250, 60]], ["Alto Rouge", [230, 60]],
      ]},
      { name: "Black Wine", note: "By the bottle", items: [
        ["Black Cabernet Sauvignon", 280], ["Black Merlot", 240], ["Black Pinotage", 230],
        ["Black Chardonnay", 300], ["Black Sauvignon Blanc", 230], ["Black Chenin Blanc", 220],
      ]},
      { name: "Liqueurs", cols: ["Bottle", "Tot"], items: [
        ["Jägermeister", [900, 30]], ["Billiato", [900, 30]], ["Amarula", [550, 20]],
        ["Aperol", [null, 20]], ["Campari", [null, 20]], ["Kahlúa", [null, 20]], ["Southern Comfort", [null, 25]],
        ["Triple Sec", [null, 15]], ["Peppermint", [null, 15]], ["Butlers Blue", [null, 15]],
        ["Pimm’s No. 1", [null, 15]], ["Malibu", [null, 15]],
      ]},
      { name: "Soft Drinks", items: [
        ["Coca-Cola / Coke Light", 30], ["Fanta", 30], ["Sprite", 30], ["Stoney Ginger Beer", 30],
        ["Pink Tonic", 30], ["Grapefruit Tonic", 30], ["Red Bull", 45],
        ["Schweppes Soda Water", 30], ["Schweppes Lemonade", 30], ["Schweppes Indian Tonic", 30],
        ["Schweppes Dry Lemon", 30], ["Schweppes Ginger Ale", 30],
      ]},
    ],
  };
  const PDF = {
    food: "https://framerusercontent.com/assets/FlkxUdgjqKcTCfYPoY45xXPY.pdf",
    drinks: "https://framerusercontent.com/assets/IfYiOJ3KWLGhwF8BXmA9L6OODHc.pdf",
  };
  const rand = n => "R" + n.toLocaleString("en-ZA").replace(/[\u00a0\u202f,]/g, "\u2009");
  const priceHTML = (p, cols) => Array.isArray(p)
    ? p.map((v, i) => v == null ? "" : `<span><small>${cols[i]}</small>${rand(v)}</span>`).filter(Boolean).join(" ")
    : rand(p);
  const chips = $("[data-chips]"), pdf = $("[data-pdf]"), more = $("[data-more]");
  let kind = "food", cat = 0;
  const renderChips = () => { chips.innerHTML = MENU[kind].map((c, i) => `<button type="button" class="${i === cat ? "on" : ""}" data-i="${i}">${c.name}</button>`).join(""); };
  const checkMore = () => more.classList.toggle("gone", list.scrollTop + list.clientHeight >= list.scrollHeight - 30);
  function renderList() {
    const c = MENU[kind][cat];
    list.innerHTML = `
      <div class="cat-head"><h3>${c.name}</h3>${c.note ? `<span class="note">${c.note}</span>` : ""}</div>
      <ul class="items">${c.items.map(([n, p, d], idx) => `
        <li class="item" style="--i:${Math.min(idx, 12)}">
          <div><h4>${n}</h4>${d ? `<p>${d}</p>` : ""}</div>
          <span class="price">${priceHTML(p, c.cols)}</span>
        </li>`).join("")}
      </ul>${c.extras ? `<p class="extras">${c.extras}</p>` : ""}`;
    list.scrollTop = 0;
    requestAnimationFrame(checkMore);
  }
  chips.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    cat = +b.dataset.i;
    $$("button", chips).forEach(x => x.classList.toggle("on", x === b));
    chips.scrollTo({ left: b.offsetLeft - chips.clientWidth / 2 + b.offsetWidth / 2, behavior: reduce ? "auto" : "smooth" });
    renderList();
  });
  const menuSeg = $("[data-seg]");
  $$("[data-seg] button").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.kind === kind) return;
    kind = b.dataset.kind; cat = 0;
    $$("[data-seg] button").forEach(x => x.setAttribute("aria-selected", x === b));
    syncSegPill(menuSeg);
    pdf.href = PDF[kind]; chips.scrollLeft = 0;
    renderChips(); renderList();
  }));
  list.addEventListener("scroll", checkMore, { passive: true });
  more.addEventListener("click", () => list.scrollBy({ top: list.clientHeight * .7, behavior: reduce ? "auto" : "smooth" }));
  renderChips(); renderList();
  requestAnimationFrame(() => syncSegPill(menuSeg));
  }

  /* ---------- Booking page (direct send to Bookings@rustygrandcafe.co.za) ---------- */
  const form = $("[data-book]");
  if (form) {
    const BOOK_TO = "Bookings@rustygrandcafe.co.za";
    const F = form.elements, msg = $("[data-msg]"), note = $("[data-night-note]"), submitBtn = $('button[type="submit"]', form);
    const nightFor = iso => {
      const d = new Date(iso + "T12:00:00");
      const a = specialEvents.find(x => x.date === iso);
      return { d, name: a ? `${a.name}${a.series ? ` (${a.series})` : ""}` : NIGHTS.find(n => n.days.includes(d.getDay())).name };
    };
    const paintNote = () => { if (F.date.value) note.textContent = `${DAYS[nightFor(F.date.value).d.getDay()]}: ${nightFor(F.date.value).name}`; };
    syncBookNote = paintNote;
    F.date.min = saNow().iso; F.date.value = saNow().iso; paintNote();
    F.date.addEventListener("change", paintNote);

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (F._honey && F._honey.value) return;
      let ok = true;
      ["name", "phone", "date", "time"].forEach(n => {
        const bad = !F[n].value.trim();
        F[n].closest(".field").classList.toggle("invalid", bad);
        if (bad) ok = false;
      });
      const emailVal = F.email.value.trim();
      if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        F.email.closest(".field").classList.add("invalid");
        ok = false;
      }
      if (!ok) {
        msg.className = "form-msg err";
        msg.textContent = "Please fill in your name, phone number, valid email (if entered), date and time.";
        return;
      }

      const { d, name: nightName } = nightFor(F.date.value);
      const dayLabel = `${DAYS[d.getDay()]} ${F.date.value}`;
      const subject = `Table Booking: ${F.name.value.trim()} (${F.guests.value} guests) — ${dayLabel} at ${F.time.value}`;
      const payload = {
        _subject: subject,
        _template: "table",
        _captcha: "false",
        ...(emailVal ? { _replyto: emailVal } : {}),
        Name: F.name.value.trim(),
        Phone: F.phone.value.trim(),
        Email: emailVal || "—",
        Guests: F.guests.value,
        Date: `${dayLabel} (${nightName})`,
        Time: F.time.value,
        Notes: F.notes.value.trim() || "—",
      };
      const mailtoFallback = () => {
        const body = [
          "Hi Rusty Grand Café, I'd like to book a table.", "",
          `Name: ${payload.Name}`, `Phone: ${payload.Phone}`,
          emailVal ? `Email: ${emailVal}` : "",
          `Date: ${payload.Date}`, `Time: ${payload.Time}`,
          `Guests: ${payload.Guests}`,
          F.notes.value.trim() ? `Notes: ${F.notes.value.trim()}` : "",
        ].filter(Boolean).join("\n");
        return `mailto:${BOOK_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      };

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
      msg.className = "form-msg";
      msg.textContent = "Sending your reservation to Rusty Grand Café…";

      try {
        if (location.protocol === "file:") throw new Error("local-file");
        const r = await fetch(`https://formsubmit.co/ajax/${BOOK_TO}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok && String(data.success) !== "false") {
          msg.className = "form-msg ok";
          msg.textContent = `Reservation sent to ${BOOK_TO}! We’ll confirm your table shortly.`;
          ["name", "phone", "email", "notes"].forEach(k => { F[k].value = ""; });
          submitBtn.textContent = "Reserved ✓";
          setTimeout(() => { submitBtn.disabled = false; submitBtn.textContent = "Reserve now"; }, 3500);
          return;
        }
        if (/activat/i.test(String(data.message || ""))) {
          msg.className = "form-msg ok";
          msg.textContent = `One-time setup sent: check ${BOOK_TO} and click 'Activate Form' to start receiving website bookings.`;
          submitBtn.disabled = false;
          submitBtn.textContent = "Reserve now";
          return;
        }
        throw new Error(data.message || `HTTP ${r.status}`);
      } catch {
        msg.className = "form-msg err";
        msg.innerHTML = `Couldn’t send automatically right now — <a href="${esc(mailtoFallback())}">tap here to email ${BOOK_TO}</a> or call <a href="tel:+27145372058">014 537 2058</a>.`;
        submitBtn.disabled = false;
        submitBtn.textContent = "Reserve now";
      }
    });
    $$("input", form).forEach(i => i.addEventListener("input", () => i.closest(".field").classList.remove("invalid")));
  }

  /* ---------- Liquid-glass specular light + subtle 3D card tilt ---------- */
  const stageEl = $(".stage");
  if (stageEl && !reduce && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let activeCard = null, raf = 0, px = 0, py = 0;
    const resetCard = el => { if (!el) return; el.style.transform = ""; };
    stageEl.addEventListener("pointermove", e => {
      const card = e.target.closest(".tile, .ev");
      if (card !== activeCard) { resetCard(activeCard); activeCard = card; }
      if (!card) return;
      px = e.clientX; py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!activeCard) return;
        const r = activeCard.getBoundingClientRect();
        const x = px - r.left, y = py - r.top;
        activeCard.style.setProperty("--mx", `${x.toFixed(1)}px`);
        activeCard.style.setProperty("--my", `${y.toFixed(1)}px`);
        if (activeCard.matches("a.tile, a.ev, .ev")) {
          const rx = ((0.5 - y / r.height) * 3.0).toFixed(2);
          const ry = ((x / r.width - 0.5) * 3.0).toFixed(2);
          activeCard.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
        }
      });
    }, { passive: true });
    stageEl.addEventListener("pointerleave", () => { resetCard(activeCard); activeCard = null; });
  }

  /* ---------- Terms & Conditions quick-jump chips & scroll ---------- */
  const termsList = $("[data-terms-list]"), termsChips = $("[data-terms-chips]"), termsMore = $("[data-terms-more]");
  if (termsList && termsChips && termsMore) {
    const secs = $$(".term-sec", termsList);
    const btns = $$("button[data-jump]", termsChips);
    const isInnerScroll = () => getComputedStyle(termsList).overflowY !== "visible";
    const syncTerms = () => {
      if (isInnerScroll()) {
        termsMore.classList.toggle("gone", termsList.scrollTop + termsList.clientHeight >= termsList.scrollHeight - 30);
        let activeId = secs[0]?.id;
        for (const s of secs) {
          if (s.offsetTop - termsList.offsetTop <= termsList.scrollTop + 60) activeId = s.id;
        }
        btns.forEach(b => b.classList.toggle("on", b.dataset.jump === activeId));
      } else {
        let activeId = secs[0]?.id;
        for (const s of secs) {
          if (s.getBoundingClientRect().top <= 140) activeId = s.id;
        }
        btns.forEach(b => b.classList.toggle("on", b.dataset.jump === activeId));
      }
    };
    termsChips.addEventListener("click", e => {
      const b = e.target.closest("button[data-jump]");
      if (!b) return;
      const target = document.getElementById(b.dataset.jump);
      if (target) {
        if (isInnerScroll()) {
          termsList.scrollTo({ top: target.offsetTop - termsList.offsetTop - 8, behavior: reduce ? "auto" : "smooth" });
        } else {
          const y = target.getBoundingClientRect().top + scrollY - 84;
          scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
        }
      }
      btns.forEach(x => x.classList.toggle("on", x === b));
      termsChips.scrollTo({ left: b.offsetLeft - termsChips.clientWidth / 2 + b.offsetWidth / 2, behavior: reduce ? "auto" : "smooth" });
    });
    termsList.addEventListener("scroll", syncTerms, { passive: true });
    addEventListener("scroll", syncTerms, { passive: true });
    termsMore.addEventListener("click", () => termsList.scrollBy({ top: termsList.clientHeight * .7, behavior: reduce ? "auto" : "smooth" }));
    requestAnimationFrame(syncTerms);
  }

  /* ---------- 404 missing path chip ---------- */
  const badPathEl = $("[data-bad-path]");
  if (badPathEl) {
    try {
      const p = decodeURIComponent(location.pathname || "");
      if (p && p !== "/" && !/\/404(\.html)?$/i.test(p)) badPathEl.textContent = p;
    } catch {}
  }

  /* ---------- Reel (about) plays only when visible ---------- */
  const reel = $("[data-reel]");
  if (reel) new IntersectionObserver(([e]) => { e.isIntersecting && !reduce ? reel.play().catch(() => {}) : reel.pause(); }, { threshold: .3 }).observe(reel);
})();
