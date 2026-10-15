(function () {
  var COLOURS = ["sage", "peach", "sky", "lavender", "butter", "mint", "rose", "sand"];

  // ---------- CSV ----------
  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function toRecords(rows) {
    var head = (rows.shift() || []).map(function (h) { return h.trim().toLowerCase(); });
    function col(name) { for (var i = 0; i < head.length; i++) if (head[i].indexOf(name) === 0) return i; return -1; }
    var c = { section: col("section"), title: col("title"), desc: col("description"), link: col("video"), photo: col("photo"), colour: col("colo") };
    if (c.link < 0) c.link = col("link");
    return rows.map(function (r) {
      function g(k) { return c[k] >= 0 && r[c[k]] ? String(r[c[k]]).trim() : ""; }
      return { section: g("section"), title: g("title"), desc: g("desc"), link: g("link"), photo: g("photo"), colour: g("colour").toLowerCase() };
    }).filter(function (r) { return r.section; });
  }

  // ---------- links ----------
  function driveId(u) {
    var m = u.match(/\/d\/([\w-]{20,})/) || u.match(/[?&]id=([\w-]{20,})/);
    return m && /drive\.google|docs\.google|googleusercontent/.test(u) ? m[1] : null;
  }
  function imageUrl(u) {
    if (!u) return "";
    var id = driveId(u);
    return id ? "https://drive.google.com/thumbnail?id=" + id + "&sz=w1600" : u;
  }
  function youTubeId(u) {
    var m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    return m ? m[1] : null;
  }
  function playerUrl(u) {
    if (!u) return null;
    var y = youTubeId(u);
    if (y) return "https://www.youtube.com/embed/" + y + "?autoplay=1&rel=0";
    var id = driveId(u);
    if (id && /\/file\//.test(u)) return "https://drive.google.com/file/d/" + id + "/preview";
    return null;
  }
  function colourVar(name, i) {
    var n = COLOURS.indexOf(name) >= 0 ? name : COLOURS[i % COLOURS.length];
    return "var(--" + n + ")";
  }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "style") e.style.cssText = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (html) e.innerHTML = html;
    return e;
  }
  function safeHref(u) { return /^https?:\/\//i.test(u) ? u : null; }

  // ---------- render ----------
  function render(records) {
    var sections = [], bySec = {};
    records.forEach(function (r) {
      var key = r.section.toLowerCase();
      if (key === "intro") {
        if (r.title) document.getElementById("name").textContent = r.title;
        if (r.title) document.title = r.title + " Portfolio";
        if (r.title) document.getElementById("foot").textContent = r.title;
        var box = document.getElementById("introText"); box.innerHTML = "";
        r.desc.split(/\n+/).forEach(function (p) { if (p.trim()) box.appendChild(el("p", { text: p.trim() })); });
        if (r.photo) {
          var pt = document.getElementById("portrait"); pt.innerHTML = "";
          pt.appendChild(el("img", { src: imageUrl(r.photo), alt: "Portrait of " + (r.title || "Yoana") }));
        }
        return;
      }
      if (key === "background") {
        if (r.photo) document.getElementById("land").style.backgroundImage = 'url("' + imageUrl(r.photo) + '")';
        return;
      }
      if (!bySec[key]) { bySec[key] = { name: r.section, items: [], colour: "", photo: "" }; sections.push(bySec[key]); }
      var s = bySec[key];
      if (!s.colour && r.colour) s.colour = r.colour;
      if (!s.photo && r.photo) s.photo = r.photo;
      if (r.title || r.desc || r.link || r.photo) s.items.push(r);
    });

    var tiles = document.getElementById("tiles"); tiles.innerHTML = "";
    sections.forEach(function (s, i) {
      s.bg = colourVar(s.colour, i);
      var b = el("button", { type: "button", class: "tile", "data-i": i });
      var pic = el("span", { class: "pic", style: "--c:" + s.bg });
      if (s.photo) pic.style.backgroundImage = 'url("' + imageUrl(s.photo) + '")';
      b.appendChild(pic);
      b.appendChild(el("b", { text: s.name }));
      var n = s.items.length;
      b.appendChild(el("i", { text: n ? n + (n === 1 ? " piece" : " pieces") : "Coming soon" }));
      b.addEventListener("click", function () { open(i, true); });
      tiles.appendChild(b);
    });

    var cur = 0;
    function open(i, scroll) {
      cur = i;
      var s = sections[i], view = document.getElementById("sectionView");
      view.innerHTML = "";
      Array.prototype.forEach.call(tiles.children, function (t, j) { t.setAttribute("aria-pressed", j === i ? "true" : "false"); });
      var head = el("div", { class: "panel-head" }); head.appendChild(el("h2", { text: s.name })); view.appendChild(head);

      if (!s.items.length) { view.appendChild(el("div", { class: "soon", text: "New work coming soon." })); }
      else if (s.items.every(function (r) { return r.photo && !r.desc && !playerUrl(r.link); })) {
        var g = el("div", { class: "gallery" });
        s.items.forEach(function (r) {
          var f = el("figure");
          f.appendChild(el("img", { src: imageUrl(r.photo), alt: r.title || "Photograph by Yoana", loading: "lazy" }));
          if (r.title) f.appendChild(el("figcaption", { text: r.title }));
          g.appendChild(f);
        });
        view.appendChild(g);
      } else {
        var list = null;
        s.items.forEach(function (r, k) {
          var player = playerUrl(r.link), href = safeHref(r.link);
          var simple = !r.photo && !player && r.desc.length < 80;
          if (simple && href) {
            if (!list) { list = el("ul", { class: "links" }); view.appendChild(list); }
            var li = el("li"), a = el("a", { href: href, target: "_blank", rel: "noopener" });
            a.appendChild(el("span", { text: r.desc || "Read" }));
            a.appendChild(document.createTextNode(r.title || href));
            li.appendChild(a); list.appendChild(li);
            return;
          }
          list = null;
          var art = el("article", { class: "item" });
          var media;
          if (player) {
            media = el("button", { type: "button", class: "media", "aria-label": "Play " + r.title, style: "--c:" + colourVar(r.colour, k) });
            media.appendChild(el("span", { class: "play" }));
            media.addEventListener("click", function () {
              var box = el("div", { class: "media", style: "--c:" + colourVar(r.colour, k) });
              box.appendChild(el("iframe", { src: player, allow: "autoplay; encrypted-media; fullscreen", allowfullscreen: "", title: r.title }));
              media.replaceWith(box);
            }, { once: true });
          } else media = el("div", { class: "media", style: "--c:" + colourVar(r.colour, k) });
          if (r.photo) media.style.backgroundImage = 'url("' + imageUrl(r.photo) + '")';
          art.appendChild(media);
          var txt = el("div");
          if (r.title) txt.appendChild(el("h3", { text: r.title }));
          if (r.desc) txt.appendChild(el("p", { text: r.desc }));
          if (href) txt.appendChild(el("a", { class: "link", href: href, target: "_blank", rel: "noopener", text: player ? "Open in a new tab →" : "Open →" }));
          art.appendChild(txt);
          view.appendChild(art);
        });
      }
      var nb = document.getElementById("nextBtn");
      if (sections.length > 1) {
        nb.hidden = false;
        nb.textContent = "Next: " + sections[(i + 1) % sections.length].name + " →";
      } else nb.hidden = true;
      if (scroll) document.getElementById("panel").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    document.getElementById("nextBtn").onclick = function () { open((cur + 1) % sections.length, true); };
    if (sections.length) open(0, false);
  }

  // ---------- load: live sheet first, saved copy if that fails ----------
  function load(url) { return fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.text(); }); }
  var id = window.PORTFOLIO_SHEET_ID;
  var live = id ? "https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv&headers=1" : null;
  (live ? load(live) : Promise.reject())
    .then(function (t) { if (!/section/i.test(t.slice(0, 200))) throw 0; return t; })
    .catch(function () { return load("content.csv"); })
    .then(function (t) { render(toRecords(parseCSV(t))); })
    .catch(function () { document.getElementById("sectionView").textContent = "The portfolio could not load. Please refresh the page."; });
})();
