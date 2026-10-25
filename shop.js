/* ORGET Shop - সাইটের রানটাইম + অ্যাডমিনের পেজ-জেনারেটর (একই ফাইল) */
(function (g) {
  'use strict';
  var DEF = {
    name: 'অরগেট এন্টারপ্রাইজ', nameEn: 'ORGET', phone: '01632414646', whatsapp: '8801632414646',
    base: 'https://orgetshop.github.io', orgetUrl: '', logo: 'logo.png',
    categories: ['গেজেট', 'কিচেন আইটেম', 'বাটন ফোন', 'মোবাইল', 'ফার্নিচার', 'ইলেকট্রনিকস', 'গ্যাস স্টোভ সেট'],
    notice: { text: '', image: '' }
  };
  var NOISE = ['price', 'in', 'bangladesh', 'bd', 'taka', 'tk', 'দাম', 'মূল্য', 'কত', 'বাংলাদেশে', 'বাংলাদেশ', 'প্রাইস', 'এর', 'দামে'];

  function S_(x) {
    var o = {}, k; for (k in DEF) o[k] = DEF[k];
    x = x || {};
    for (k in x) if (x[k] !== undefined && x[k] !== null && x[k] !== '') o[k] = x[k];
    if (!o.notice) o.notice = { text: '', image: '' };
    var nl = Array.isArray(o.notices) ? o.notices.slice() : [];
    if (!nl.length && (o.notice.text || o.notice.image)) nl = [o.notice];
    o.notices = nl.filter(function (n) { return n && (n.text || n.image); }).slice(0, 5);
    return o;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return '৳ ' + Number(n || 0).toLocaleString('en-IN'); }
  function slugify(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function asset(root, path) { return /^https?:/.test(path) ? path : root + path; }
  function minPrice(p) {
    var v = (p.variants || []).map(function (x) { return +x.price; }).filter(function (x) { return x > 0; });
    return v.length ? Math.min.apply(null, v) : (+p.price || 0);
  }
  function priceText(p) {
    var ps = (p.variants || []).map(function (x) { return +x.price; });
    var multi = ps.length > 1 && Math.min.apply(null, ps) !== Math.max.apply(null, ps);
    return fmt(minPrice(p)) + (multi ? ' থেকে' : '');
  }
  function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }
  function jsonForScript(o) { return JSON.stringify(o).replace(/</g, '\\u003c').split('\u2028').join('\\u2028').split('\u2029').join('\\u2029'); }

  /* ---------- লগইন চিহ্ন ---------- */
  function isLogged() { try { return localStorage.getItem('orget_in') === '1'; } catch (e) { return false; } }
  function captureLogin() {
    try {
      var u = new URL(location.href);
      if (u.searchParams.get('u') === '1') {
        localStorage.setItem('orget_in', '1');
        u.searchParams.delete('u');
        history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
      }
    } catch (e) { }
  }

  /* ---------- হেডার ---------- */
  function headerHTML(S, root, logged) {
    return '<div class="top"><div class="bar"><a class="brand" href="' + (root || './') + '"><img src="' + esc(asset(root, S.logo)) + '" alt="' + esc(S.nameEn) + '"><span class="bt"><b>' + esc(S.name) + '</b></span></a>' +
      (logged ? '<button class="dots" id="dots" aria-label="মেনু">&#8942;</button>' : '<button class="btn-login" id="login">লগইন</button>') +
      '</div><div class="menu" id="menu"><a href="' + esc(S.orgetUrl || '#') + '">আমার প্রোফাইল</a><button id="logout">বের হন</button></div></div>';
  }
  function mountHeader(S, root) {
    var el = document.getElementById('hd'); if (!el) return;
    el.innerHTML = headerHTML(S, root, isLogged());
    var lg = document.getElementById('login'), ds = document.getElementById('dots'), mn = document.getElementById('menu'), lo = document.getElementById('logout');
    if (lg) lg.onclick = function () { if (!S.orgetUrl) { alert('লগইন লিংক এখনো সেট করা হয়নি'); return; } location.href = S.orgetUrl; };
    if (ds) ds.onclick = function (e) { e.stopPropagation(); mn.classList.toggle('on'); };
    if (lo) lo.onclick = function () { try { localStorage.removeItem('orget_in'); } catch (e) { } mountHeader(S, root); };
    if (!mountHeader.b) { mountHeader.b = 1; document.addEventListener('click', function () { var m = document.getElementById('menu'); if (m) m.classList.remove('on'); }); }
  }

  /* ---------- কার্ড ও সার্চ ---------- */
  function cardHTML(p, root) {
    var im = (p.images && p.images[0]) ? asset(root, p.images[0]) : root + 'logo.png';
    return '<a class="card" href="' + root + 'p/' + esc(p.slug) + '.html"><div class="im"><img loading="lazy" src="' + esc(im) + '" alt="' + esc(p.name) + '"></div><div class="in"><div class="nm">' + esc(p.name) + '</div><div class="pr">' + priceText(p) + '</div>' + (p.inStock === false ? '<div class="oos">স্টক আউট</div>' : '') + (p.sold > 0 ? '<div class="sd">' + p.sold + ' টি বিক্রি হয়েছে</div>' : '') + '</div></a>';
  }
  function tokens(q) { return String(q || '').toLowerCase().split(/[^a-z0-9ঀ-৿]+/).filter(function (t) { return t && NOISE.indexOf(t) < 0; }); }
  function matches(p, toks) {
    var h = (p.name + ' ' + (p.brand || '') + ' ' + (p.code || '') + ' ' + (p.category || '') + ' ' + (p.keywords || '')).toLowerCase();
    return toks.every(function (t) { return h.indexOf(t) > -1; });
  }
  function sorted(list) { return list.slice().sort(function (a, b) { return ((b.soldAt || 0) - (a.soldAt || 0)) || ((b.added || 0) - (a.added || 0)); }); }
  function loadJSON(path, fallback) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : fallback; }).catch(function () { return fallback; });
  }

  /* ---------- নোটিশ স্লাইডার (৫ সেকেন্ড পর পর) ---------- */
  var NT = null;
  function mountNotices(el, list, root) {
    if (NT) { clearInterval(NT); NT = null; }
    if (!list || !list.length) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="nb"><div class="ntrack" id="ntrack">' + list.map(function (n) {
      return '<div class="nslide">' + (n.image ? '<img src="' + esc(asset(root, n.image)) + '" alt="">' : '') + (n.text ? '<div class="nt">' + esc(n.text) + '</div>' : '') + '</div>';
    }).join('') + '</div>' + (list.length > 1 ? '<div class="ndots">' + list.map(function (_, i) { return '<i data-i="' + i + '"></i>'; }).join('') + '</div>' : '') + '</div>';
    var tr = el.querySelector('#ntrack'), dots = el.querySelectorAll('.ndots i'), i = 0;
    function go(k) {
      i = k; tr.style.transform = 'translateX(' + (-100 * i) + '%)';
      [].forEach.call(dots, function (d, j) { d.classList.toggle('on', j === i); });
    }
    go(0);
    if (list.length > 1) {
      NT = setInterval(function () { go((i + 1) % list.length); }, 5000);
      [].forEach.call(dots, function (d) { d.onclick = function () { clearInterval(NT); go(+d.getAttribute('data-i')); NT = setInterval(function () { go((i + 1) % list.length); }, 5000); }; });
    }
  }

  function catHref(root, c) { return (root || './') + 'category.html?c=' + encodeURIComponent(c); }
  function catsOf(S, P) {
    var c = S.categories.slice();
    P.forEach(function (p) { if (p.category && c.indexOf(p.category) < 0) c.push(p.category); });
    return c.filter(function (x) { return P.some(function (p) { return p.category === x; }); });
  }
  function chipsHTML(S, P, active, root) {
    var h = '<a class="chip' + (active ? '' : ' on') + '" href="' + (root || './') + '">সব</a>';
    catsOf(S, P).forEach(function (c) { h += '<a class="chip' + (active === c ? ' on' : '') + '" href="' + esc(catHref(root, c)) + '">' + esc(c) + '</a>'; });
    return h;
  }
  function footHTML(S) {
    return '<p>আমাদের সাথে WhatsApp এ যোগাযোগ করুন</p><div class="row2"><a class="b wa" href="https://wa.me/' + esc(S.whatsapp) + '">WhatsApp করুন</a><a class="b call" href="tel:' + esc(S.phone) + '">কল করুন: ' + esc(S.phone) + '</a></div>';
  }

  /* ---------- হোম পেজ ---------- */
  function home() {
    var root = '', S = S_(g.__SITE), P = [], q = '';
    captureLogin();
    mountHeader(S, root);
    var app = document.getElementById('app');
    app.innerHTML = '<div class="search"><input id="q" type="search" placeholder="পণ্য খুঁজুন… (যেমন: Redmi A5)" autocomplete="off"></div><div class="chips" id="chips"></div><div id="nt"></div><div id="list"></div><div class="foot" id="foot"></div>';
    function renderList() {
      var toks = tokens(q), el = document.getElementById('list'), h = '';
      if (!P.length) { el.innerHTML = '<div class="empty">এখনো কোনো পণ্য যোগ করা হয়নি</div>'; return; }
      if (toks.length) {
        var list = sorted(P.filter(function (p) { return matches(p, toks); }));
        if (!list.length) { el.innerHTML = '<div class="empty">কোনো পণ্য পাওয়া যায়নি</div>'; return; }
        h = '<div class="sec"><div class="sh"><h2>খোঁজার ফল</h2></div><div class="grid">' + list.map(function (p) { return cardHTML(p, root); }).join('') + '</div></div>';
      } else {
        catsOf(S, P).forEach(function (c) {
          var items = sorted(P.filter(function (p) { return p.category === c; }));
          h += '<div class="sec"><div class="sh"><h2>' + esc(c) + '</h2><a class="more" href="' + esc(catHref(root, c)) + '">সব দেখুন ›</a></div><div class="hrow">' + items.map(function (p) { return cardHTML(p, root); }).join('') + '</div></div>';
        });
        var other = sorted(P.filter(function (p) { return !p.category; }));
        if (other.length) h += '<div class="sec"><div class="sh"><h2>অন্যান্য</h2></div><div class="hrow">' + other.map(function (p) { return cardHTML(p, root); }).join('') + '</div></div>';
      }
      el.innerHTML = h;
    }
    document.getElementById('q').oninput = function () { q = this.value; renderList(); };
    function all() {
      mountHeader(S, root);
      document.getElementById('chips').innerHTML = chipsHTML(S, P, '', root);
      mountNotices(document.getElementById('nt'), S.notices, root);
      renderList();
      document.getElementById('foot').innerHTML = footHTML(S);
    }
    all();
    Promise.all([loadJSON('site.json', {}), loadJSON('products.json', [])]).then(function (a) {
      S = S_(a[0]); P = Array.isArray(a[1]) ? a[1] : []; all();
    });
  }

  /* ---------- ক্যাটাগরির আলাদা পেজ ---------- */
  function category() {
    var root = '', S = S_(g.__SITE), P = [], c = '';
    try { c = new URL(location.href).searchParams.get('c') || ''; } catch (e) { }
    captureLogin();
    var app = document.getElementById('app');
    app.innerHTML = '<div class="chips" id="chips"></div><h1 id="ct"></h1><div id="list"></div><div class="foot" id="foot"></div>';
    function all() {
      mountHeader(S, root);
      document.title = c + ' এর দাম ও ছবি | ' + S.name;
      document.getElementById('chips').innerHTML = chipsHTML(S, P, c, root);
      document.getElementById('ct').textContent = c;
      var list = sorted(P.filter(function (p) { return p.category === c; }));
      document.getElementById('list').innerHTML = list.length ? '<div class="grid">' + list.map(function (p) { return cardHTML(p, root); }).join('') + '</div>' : '<div class="empty">এই ক্যাটাগরিতে এখনো কোনো পণ্য নেই</div>';
      document.getElementById('foot').innerHTML = footHTML(S);
    }
    all();
    Promise.all([loadJSON('site.json', {}), loadJSON('products.json', [])]).then(function (a) {
      S = S_(a[0]); P = Array.isArray(a[1]) ? a[1] : []; all();
    });
  }

  /* ---------- পণ্যের পেজের জন্য লিংক ---------- */
  function links(p, S, sel) {
    var v = (sel.vi >= 0 && p.variants) ? p.variants[sel.vi] : null;
    var url = S.base.replace(/\/$/, '') + '/p/' + p.slug + '.html';
    var msg = 'আসসালামু আলাইকুম, আমি "' + p.name + '"' + (v ? ' (' + v.label + ')' : '') + (sel.color ? ' (' + sel.color + ' কালার)' : '') + ' সম্পর্কে জানতে চাই। পণ্য কোড: ' + (p.code || '') + '\n' + url;
    return {
      wa: 'https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent(msg),
      sms: 'sms:' + S.phone + '?body=' + encodeURIComponent(msg),
      tel: 'tel:' + S.phone
    };
  }

  /* ---------- পণ্যের পেজ (স্ট্যাটিক পেজের ওপর জাভাস্ক্রিপ্ট) ---------- */
  function product() {
    var p = g.__P, S = S_(g.__SITE), root = '../';
    var sel = { color: '', vi: (p.variants && p.variants.length) ? 0 : -1 };
    captureLogin();
    mountHeader(S, root);
    function mark() {
      [].forEach.call(document.querySelectorAll('[data-color]'), function (b) { b.classList.toggle('on', b.getAttribute('data-color') === sel.color); });
      [].forEach.call(document.querySelectorAll('[data-var]'), function (b) { b.classList.toggle('on', +b.getAttribute('data-var') === sel.vi); });
    }
    function upd() {
      var pr = document.getElementById('price');
      if (pr && sel.vi >= 0) pr.textContent = fmt(p.variants[sel.vi].price);
      var l = links(p, S, sel);
      var a = document.getElementById('wa'), b = document.getElementById('sms'), c = document.getElementById('call');
      if (a) a.href = l.wa; if (b) b.href = l.sms; if (c) { c.href = l.tel; c.textContent = 'কল করুন: ' + S.phone; }
    }
    [].forEach.call(document.querySelectorAll('[data-color]'), function (b) {
      b.onclick = function () { var v = b.getAttribute('data-color'); sel.color = (sel.color === v) ? '' : v; mark(); upd(); };
    });
    [].forEach.call(document.querySelectorAll('[data-var]'), function (b) {
      b.onclick = function () { sel.vi = +b.getAttribute('data-var'); mark(); upd(); };
    });
    [].forEach.call(document.querySelectorAll('[data-th]'), function (im) {
      im.onclick = function () { var gal = document.getElementById('gal'); gal.scrollTo({ left: (+im.getAttribute('data-th')) * gal.clientWidth, behavior: 'smooth' }); };
    });
    mark(); upd();
    Promise.all([loadJSON('../site.json', {}), loadJSON('../products.json', [])]).then(function (a) {
      S = S_(a[0]); mountHeader(S, root); upd();
      var all = Array.isArray(a[1]) ? a[1] : [];
      var me = all.filter(function (x) { return x.id === p.id; })[0];
      if (me) {
        var st = document.getElementById('stock');
        if (st) { var ok = me.inStock !== false; st.className = 'stk ' + (ok ? 'ok' : 'no'); st.textContent = ok ? 'স্টকে আছে' : 'স্টক আউট'; }
        var sd = document.getElementById('sold'); if (sd) sd.textContent = me.sold > 0 ? me.sold + ' টি বিক্রি হয়েছে' : '';
      }
      var rel = sorted(all.filter(function (x) { return x.category === p.category && x.id !== p.id; })).slice(0, 12);
      var sec = document.getElementById('relsec');
      if (rel.length) { document.getElementById('rel').innerHTML = rel.map(function (x) { return cardHTML(x, root); }).join(''); if (sec) sec.style.display = ''; }
    });
  }

  /* ---------- অ্যাডমিন যা ব্যবহার করে: স্ট্যাটিক পণ্য-পেজ ---------- */
  function pageHTML(p, S0) {
    var S = S_(S0), base = S.base.replace(/\/$/, ''), url = base + '/p/' + p.slug + '.html';
    var imgs = (p.images && p.images.length) ? p.images : [S.logo];
    var vs = p.variants || [], mp = minPrice(p), inst = p.inStock !== false;
    var first = vs.length ? +vs[0].price : +p.price;
    var av = inst ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
    var plain = (p.desc || '').replace(/\s+/g, ' ').trim();
    var title = p.name + ' Price in Bangladesh | ' + S.name;
    var desc = (p.name + ' price in Bangladesh ' + fmt(mp) + '. ' + p.name + ' এর দাম, ছবি ও স্পেসিফিকেশন দেখুন ' + S.name + '-এ। ক্যাশ ও কিস্তিতে কেনার সুযোগ। ' + plain).slice(0, 250);
    var abs = function (x) { return /^https?:/.test(x) ? x : base + '/' + x; };
    var offer = vs.length > 1 ? {
      '@type': 'AggregateOffer', priceCurrency: 'BDT', lowPrice: mp,
      highPrice: Math.max.apply(null, vs.map(function (v) { return +v.price; })), offerCount: vs.length, availability: av
    } : { '@type': 'Offer', url: url, priceCurrency: 'BDT', price: mp, availability: av };
    var ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, image: imgs.map(abs), description: plain || desc, sku: p.code, category: p.category, offers: offer };
    if (p.brand) ld.brand = { '@type': 'Brand', name: p.brand };
    var kw = [p.name, p.name + ' price in Bangladesh', p.name + ' price in BD', p.name + ' দাম', p.name + ' এর দাম বাংলাদেশে', (p.brand || '') + ' ' + (p.category || ''), p.keywords || ''].join(', ');
    var sel0 = { color: '', vi: vs.length ? 0 : -1 };
    var l = links(p, S, sel0);
    var h = [];
    h.push('<!doctype html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">');
    h.push('<title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '"><meta name="keywords" content="' + esc(kw) + '">');
    h.push('<link rel="canonical" href="' + esc(url) + '"><link rel="icon" href="../' + esc(S.logo) + '">');
    h.push('<meta property="og:type" content="product"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:image" content="' + esc(abs(imgs[0])) + '"><meta property="og:url" content="' + esc(url) + '">');
    h.push('<link rel="stylesheet" href="../shop.css"><script type="application/ld+json">' + jsonForScript(ld) + '</script></head><body>');
    h.push('<div id="hd"></div><div class="wrap pd">');
    h.push('<nav class="crumb"><a href="../">হোম</a>' + (p.category ? ' › ' + esc(p.category) : '') + '</nav>');
    h.push('<div class="gal" id="gal">' + imgs.map(function (x) { return '<img src="' + esc(asset('../', x)) + '" alt="' + esc(p.name) + '">'; }).join('') + '</div>');
    if (imgs.length > 1) h.push('<div class="thumbs">' + imgs.map(function (x, i) { return '<img data-th="' + i + '" src="' + esc(asset('../', x)) + '" alt="">'; }).join('') + '</div>');
    h.push('<h1>' + esc(p.name) + '</h1><div class="meta">' + (p.brand ? 'ব্র্যান্ড: ' + esc(p.brand) + ' · ' : '') + 'কোড: ' + esc(p.code || '') + '</div>');
    h.push('<div class="price" id="price">' + fmt(first) + '</div><div class="stk ' + (inst ? 'ok' : 'no') + '" id="stock">' + (inst ? 'স্টকে আছে' : 'স্টক আউট') + '</div><div class="sold" id="sold">' + (p.sold > 0 ? p.sold + ' টি বিক্রি হয়েছে' : '') + '</div>');
    if (p.colors && p.colors.length) h.push('<div class="lbl">কালার</div><div class="opts">' + p.colors.map(function (c) { return '<button class="opt" data-color="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>');
    if (vs.length) h.push('<div class="lbl">ভেরিয়েন্ট</div><div class="opts">' + vs.map(function (v, i) { return '<button class="opt" data-var="' + i + '">' + esc(v.label) + '<small>' + fmt(v.price) + '</small></button>'; }).join('') + '</div>');
    if (plain) h.push('<h2>বিবরণ</h2><p>' + nl2br(p.desc) + '</p>');
    if (p.specs && p.specs.length) h.push('<h2>স্পেসিফিকেশন</h2><table class="spec">' + p.specs.map(function (r) { return r[0] ? '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>' : '<tr><td colspan="2">' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>');
    h.push('<div class="cta"><a class="wa" id="wa" href="' + esc(l.wa) + '">WhatsApp করুন</a><a class="sms" id="sms" href="' + esc(l.sms) + '">মেসেজ করুন</a><a class="call" id="call" href="' + esc(l.tel) + '">কল করুন: ' + esc(S.phone) + '</a></div>');
    h.push('<p class="seo">' + esc(p.name) + ' এর দাম বাংলাদেশে ' + fmt(mp) + '। ' + esc(p.name) + ' price in Bangladesh ' + fmt(mp) + '. ' + esc(S.name) + '-এ ক্যাশ ও কিস্তিতে পাওয়া যায়।</p>');
    h.push('<div id="relsec" style="display:none"><div class="sec"><h2>' + (p.category ? esc(p.category) + ' ক্যাটাগরির' : 'আরও') + ' অন্যান্য পণ্য</h2><div class="grid" id="rel"></div></div></div>');
    h.push('</div><script>window.__P=' + jsonForScript(p) + ';window.__SITE=' + jsonForScript({ name: S.name, nameEn: S.nameEn, phone: S.phone, whatsapp: S.whatsapp, base: S.base, orgetUrl: S.orgetUrl, logo: S.logo }) + ';</script><script src="../shop.js"></script><script>Shop.product()</script></body></html>');
    return h.join('\n');
  }

  function sitemap(products, S0) {
    var S = S_(S0), base = S.base.replace(/\/$/, ''), d = new Date().toISOString().slice(0, 10);
    var cats = []; products.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
    var urls = [base + '/'].concat(cats.map(function (c) { return base + '/category.html?c=' + encodeURIComponent(c); }), products.map(function (p) { return base + '/p/' + p.slug + '.html'; }));
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(function (u) { return '<url><loc>' + esc(u) + '</loc><lastmod>' + d + '</lastmod></url>'; }).join('\n') + '\n</urlset>\n';
  }

  var Shop = { home: home, category: category, product: product, pageHTML: pageHTML, sitemap: sitemap, site: S_, slugify: slugify, fmt: fmt, minPrice: minPrice, esc: esc };
  g.Shop = Shop;
  if (typeof module !== 'undefined' && module.exports) module.exports = Shop;
})(typeof window !== 'undefined' ? window : globalThis);
