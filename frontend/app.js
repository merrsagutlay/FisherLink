/* FRONTEND: pages, forms, search, profile and talking to the backend API (/api/...) */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const peso = n => '₱' + Number(n).toLocaleString('en-PH', {maximumFractionDigits: 2});
const kg = n => Number(n).toLocaleString('en-PH', {maximumFractionDigits: 1}) + ' kg';
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
let me;

async function api(method, url, body) {
  const r = await fetch(url, {method, headers: {'Content-Type': 'application/json', 'X-Requested-With': 'fishmatch'}, body: body ? JSON.stringify(body) : undefined});
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong. Try again.');
  return d;
}
let tt;
function toast(msg, bad) {
  const t = $('#toast'); t.textContent = msg; t.className = 'show' + (bad ? ' err' : '');
  clearTimeout(tt); tt = setTimeout(() => t.className = '', 3200);
}
const go = h => location.hash === h ? render() : (location.hash = h);

const LOGO = '<svg viewBox="0 0 48 48"><path d="M4 24c8-12 22-14 32-6l8-6v24l-8-6C26 38 12 36 4 24z" fill="#1d5a8e"/><circle cx="14" cy="22" r="2" fill="#fff"/></svg>';
const EYE = '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>';
const ICON = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  post: '<path d="M3 12c4-6 11-7 16-3l2-2v10l-2-2c-5 4-12 3-16-3z"/>',
  listings: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  match: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  out: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>'
};
const ico = k => `<svg viewBox="0 0 24 24">${ICON[k]}</svg>`;
const PLACES = ['Abra','Agusan del Norte','Agusan del Sur','Aklan','Albay','Antique','Apayao','Aurora','Basilan','Bataan','Batanes','Batangas','Benguet','Biliran','Bohol','Bukidnon','Bulacan','Cagayan','Camarines Norte','Camarines Sur','Camiguin','Capiz','Catanduanes','Cavite','Cebu','Cotabato','Davao de Oro','Davao del Norte','Davao del Sur','Davao Oriental','Dinagat Islands','Eastern Samar','Guimaras','Ifugao','Ilocos Norte','Ilocos Sur','Iloilo','Isabela','Kalinga','La Union','Laguna','Lanao del Norte','Lanao del Sur','Leyte','Maguindanao','Marinduque','Masbate','Misamis Occidental','Misamis Oriental','Mountain Province','Negros Occidental','Negros Oriental','Northern Samar','Nueva Ecija','Nueva Vizcaya','Occidental Mindoro','Oriental Mindoro','Palawan','Pampanga','Pangasinan','Quezon','Quirino','Rizal','Romblon','Samar','Sarangani','Siquijor','Sorsogon','South Cotabato','Southern Leyte','Sultan Kudarat','Sulu','Surigao del Norte','Surigao del Sur','Tarlac','Tawi-Tawi','Zambales','Zamboanga del Norte','Zamboanga del Sur','Zamboanga Sibugay','Metro Manila','Dasmariñas','Navotas','Malabon','Bacoor','Lucena','Calapan','Puerto Princesa','Roxas City','General Santos','Davao City','Cebu City','Iloilo City'];
const SPECIES = ['Alimango','Alimasag','Ayungin','Banak','Bangus','Biya','Bisugo','Dalag','Dalagang Bukid','Dilis','Galunggong','Hasa-hasa','Hipon','Hito','Kitang','Lapu-Lapu','Lawlaw','Maya-Maya','Pampano','Pusit','Sapsap','Squid','Sugpo','Tahong','Talaba','Talakitok','Tamban','Tanigue','Tawilis','Tilapia','Tulingan','Tuna'];
const dl = (id, a) => `<datalist id="${id}">${a.map(x => `<option value="${x}">`).join('')}</datalist>`;
const pw = (name, ph, ac) => `<div class="pw"><input type="password" name="${name}" placeholder="${ph}" autocomplete="${ac}" required><button type="button" class="eye" data-eye aria-label="Show password">${EYE}</button></div>`;
const FISH = `<svg class="fish" viewBox="0 0 300 120"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fa7ba"/><stop offset=".55" stop-color="#cfdbe5"/><stop offset="1" stop-color="#f3f7fa"/></linearGradient></defs><path d="M10 62C50 14 140 10 215 50l62-30v84l-62-30C140 112 52 110 10 62z" fill="url(#g)"/><path d="M215 50l62-30v84l-62-30" fill="#7e98ad" opacity=".55"/><circle cx="52" cy="54" r="5" fill="#0f2a43"/><path d="M80 40c40 20 90 24 130 10" stroke="#6f8aa0" stroke-width="2" fill="none" opacity=".6"/></svg>`;
const gauge = s => `<div class="gauge">Match score<svg viewBox="0 0 200 110"><path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#d3ebe7" stroke-width="12" stroke-linecap="round"/><path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#1b8c85" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(s / 100 * 251.3).toFixed(1)} 251.3"/></svg><b>${Math.round(s)}<small style="font-size:12px;color:var(--mute)">/100</small></b></div>`;
const scoreTag = s => `<span class="score ${s >= 80 ? '' : 'mid'}">${Math.round(s)}</span>`;

/* ---------- public pages ---------- */
const MARK = '<svg viewBox="0 0 48 48"><path d="M4 24c8-12 22-14 32-6l8-6v24l-8-6C26 38 12 36 4 24z" fill="#fff"/><circle cx="14" cy="22" r="2.4" fill="#1b8c85"/></svg>';
const authShell = (tab, form) => `<section class="sa"><aside class="panel"><div class="brand"><span class="lgcard"><img src="/logo-light.png" alt="FishMatch"></span></div>
  <div class="mid"><small class="eyebrow-l">A smarter catch-to-market connection</small><h1>Good catch.<br><span>Better connections.</span></h1>
  <p>Bringing fisherfolk and fish buyers closer through a simple, smarter matching experience.</p></div><div class="foot">FishMatch · Fisherfolk and fish buyers</div></aside>
  <div class="pane"><div class="box"><nav class="tabs"><a href="#/login" class="${tab === 'login' ? 'on' : ''}">Log in</a><a href="#/register" class="${tab === 'register' ? 'on' : ''}">Create account</a></nav>${form}</div></div></section>`;
const pub = {
  login: arg => (accounts().length && arg !== 'new') ? authShell('login', savedPicker()) : authShell('login', `<p class="eb">Welcome back</p><h2>Log in to FishMatch</h2><p class="sub">Enter your account details to continue.</p>
    <form data-form="login"><div class="err-msg" id="err"></div>
    <label>Email address<input type="email" name="email" autocomplete="email" required></label>
    <label>Password${pw('password', '', 'current-password')}</label>
    <label class="rem"><input type="checkbox" name="remember" checked> Save my login on this device (one click next time)</label>
    <button class="go">Log in <span>→</span></button></form>
    <p class="demo">Demo access: <b>fisher@demo.com / demo123</b></p><p class="demo">Buyer demo: <b>buyer@demo.com / demo123</b></p>${accounts().length ? '<p class="alt"><a href="#/login">← Back to saved logins</a></p>' : ''}`),
  register: () => authShell('register', `<p class="eb">Get started</p><h2>Create your account</h2><p class="sub">Tell us who you are so we can match you.</p>
    <form data-form="register"><div class="err-msg" id="err"></div>
    <div class="row"><label>First name<input name="first" autocomplete="given-name" required></label><label>Surname<input name="last" autocomplete="family-name" required></label></div>
    <label>Email address<input type="email" name="email" autocomplete="email" required></label>
    <label>Password (6+ characters)${pw('password', '', 'new-password')}</label>
    <div class="row"><label>Mobile number<input type="tel" name="phone" autocomplete="tel" required></label><label>Location${cb(`name="location" placeholder="City or province" required`, 'PLACES')}</label></div>
    <label style="margin-bottom:0">I am a</label>
    <div class="rolebox"><label>Fisherfolk <input type="radio" name="role" value="fisherfolk" required></label><label>Fish buyer <input type="radio" name="role" value="buyer"></label></div>
    <p class="fine">By creating an account, you agree to share your phone and email with matched buyers or sellers so you can arrange the sale.</p>
    <button class="go">Create account <span>→</span></button></form>
    <p class="alt">Already have an account? <a href="#/login">Log in</a></p>`)
};
pub.landing = pub.login;

/* ---------- app shell ---------- */
const NAV = {
  fisherfolk: [['dashboard', 'Dashboard', 'dashboard'], ['post', 'Post fish', 'post'], ['listings', 'Manage listings', 'listings'], ['matches', 'Matching results', 'match'], ['profile', 'Profile', 'profile']],
  buyer: [['dashboard', 'Dashboard', 'dashboard'], ['market', 'Browse fish', 'search'], ['requirement', 'Submit requirement', 'post'], ['requirements', 'Manage requirements', 'listings'], ['matches', 'Matching results', 'match'], ['profile', 'Profile', 'profile']]
};
const shell = (page, title, html, stat) => `<div class="app"><aside class="side"><a class="lgcard" href="#/dashboard"><img src="/logo-light.png" alt="FishMatch"></a>
  ${NAV[me.role].map(([k, label, ic]) => `<a class="nav ${k === page ? 'on' : ''}" href="#/${k}">${ico(ic)}${label}</a>`).join('')}
  <div class="sp"></div><a class="sidepro" href="#/profile">${av(me)}<span>${esc(me.name)}<small>View profile</small></span></a><button class="nav" data-act="switcher">${ico('swap')}Switch account</button><button class="nav" data-act="logout">${ico('out')}Log out</button></aside>
  <main><div class="top"><h1>${title}</h1>${stat || ''}<a class="chip" href="#/profile">${av(me)}<div>${esc(me.name)}<small>${me.role === 'buyer' ? 'Fish buyer' : 'Fisherfolk'} · ${esc(me.location)}</small></div></a></div>${html}</main></div>`;

const fisher = () => me.role === 'fisherfolk';
function matchTable(rows, searching) {
  if (!rows.length && searching) return '<p class="empty">No match fits your search.</p>';
  if (!rows.length) return fisher()
    ? `<p class="empty">No matches yet. When a buyer asks for fish like yours, they show up here.</p>`
    : `<p class="empty">No matches yet. <a href="#/requirement">Submit a requirement</a> or check back after fisherfolk post new fish.</p>`;
  return fisher()
    ? `<div class="tw"><table><thead><tr><th>Buyer</th><th>Wants</th><th>Pays up to</th><th>Your fish</th><th>Contact</th><th>Score</th></tr></thead><tbody>${rows.map(m => `<tr><td>${esc(m.buyer_name)}<br><small style="color:var(--mute)">${esc(m.buyer_location)}</small></td><td>${esc(m.species)}, ${kg(m.wanted_kg)}</td><td>${peso(m.max_price_per_kg)}/kg</td><td>${kg(m.quantity_kg)} at ${peso(m.price_per_kg)}/kg</td><td>${esc(m.buyer_phone)}</td><td>${scoreTag(m.score)}</td></tr>`).join('')}</tbody></table></div>`
    : `<div class="tw"><table><thead><tr><th>Fish</th><th>Seller</th><th>Available</th><th>Price</th><th>Location</th><th>Freshness</th><th>Score</th><th></th></tr></thead><tbody>${rows.map(m => `<tr><td><b>${esc(m.species)}</b></td><td>${esc(m.fisher_name)}</td><td>${kg(m.quantity_kg)}</td><td>${peso(m.price_per_kg)}/kg</td><td>${esc(m.location)}</td><td>${cap(esc(m.freshness))}</td><td>${scoreTag(m.score)}</td><td><a class="sm" href="#/listing/${m.listing_id}">Details</a></td></tr>`).join('')}</tbody></table></div>`;
}

/* ---------- private pages ---------- */
const priv = {
  async dashboard() {
    const [s, m] = await Promise.all([api('GET', '/api/stats'), api('GET', '/api/matches')]);
    const f = fisher(), top = m[0];
    const split = (a, empty) => a.length ? `<div class="split">${a.map(x => `<div>${esc(x.name)}<b>${x.val ?? kg(x.kg)}</b></div>`).join('')}</div>` : `<p class="empty" style="padding:4px 0">${empty}</p>`;
    const feat = top
      ? `<span class="tag">Best match</span><h3 style="text-align:left">${f ? 'Top buyer interest' : 'Top listing for you'}</h3>${FISH}<h2>${esc(top.species)}</h2>
         <div class="facts"><span>• ${esc(top.location)}</span><span>• ${peso(top.price_per_kg)} per kg</span><span>• ${kg(top.quantity_kg)} available</span><span>• ${esc(f ? top.buyer_name : top.fisher_name)}</span></div>${gauge(top.score)}
         ${f ? '' : `<a class="link" href="#/listing/${top.listing_id}">View listing</a>`}`
      : `<h3 style="text-align:left">Top match</h3>${FISH}<p class="empty">${f ? 'Post fish and matching buyers appear here.' : 'Submit a requirement to see your best match.'}</p>`;
    return {title: 'Dashboard', stat: `<div class="stat">${f ? 'Average price per kg' : 'Average budget per kg'}<strong>${s.avg_price ? peso(s.avg_price) : '—'}</strong></div>`, html: `<div class="grid">
      <div class="card"><h3>${f ? 'Fish posted' : 'Fish wanted'}</h3><div class="big">${s.kg}<small> kg</small></div><div class="dots" style="--p:${s.covered}%"></div>
        <h3>By species</h3>${split(s.by_species, 'Nothing yet.')}<h3 style="margin-top:16px">By location</h3>${split(s.by_location.map(x => ({name: x.name, val: x.pct + '%'})), 'Nothing yet.')}
        <a class="link" href="#/${f ? 'listings' : 'requirements'}">${f ? 'Manage listings' : 'Manage requirements'}</a></div>
      <div class="card feat">${feat}</div>
      <div class="card"><h3>${f ? 'Buyers interested' : 'Fisherfolk matched'}</h3><div class="big">${s.people}</div>
        <div class="mini"><h3>${f ? 'Listings with interest' : 'Requirements matched'}</h3><div class="big" style="font-size:28px">${s.covered}%<small style="font-size:12px"> ${s.covered_n} of ${s.covered_of}</small></div><div class="bar"><i style="--p:${s.covered}%"></i></div></div></div>
      <div class="card wide2"><h3>Matching results</h3>${matchTable(m.slice(0, 5))}${m.length > 5 ? '<a class="link" href="#/matches">See all matches</a>' : ''}</div>
      <div class="card"><h3>${f ? 'Post fish' : 'Find fish'}</h3><p class="empty">${f ? 'New listings are matched to buyer requirements right away.' : 'Tell us what you need and we will rank the best listings.'}</p><a class="btn" href="#/${f ? 'post' : 'requirement'}">${f ? 'Post fish' : 'Submit requirement'}</a>${f ? '' : ' <a class="sm" href="#/market">Browse fish</a>'}</div></div>`};
  },
  async post(id) {
    let l = {species: '', quantity_kg: '', price_per_kg: '', min_order_kg: '', location: me.location, freshness: 'fresh', source: 'wild', delivery: 'pickup', catch_date: new Date().toISOString().slice(0, 10), notes: '', photo: ''};
    if (id) l = await api('GET', '/api/listings/' + encodeURIComponent(id));
    photoState.changed = false;
    const opt = (cur, v, label) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${label}</option>`;
    return {title: id ? 'Edit listing' : 'Post fish', html: `<div class="card form" style="max-width:660px"><form data-form="post"><div class="err-msg" id="err"></div>
    <input type="hidden" name="id" value="${id ? esc(id) : ''}"><input type="hidden" name="photo" id="photoVal" value="">
    <span class="lbl2">Photo of your fish</span>
    <div class="drop"><div id="prev">${l.photo ? `<img src="${esc(l.photo)}" alt="Fish photo">` : 'No photo yet'}</div>
      <div><button type="button" class="sm" data-act="pickPhoto">Choose photo</button> <button type="button" class="sm del" data-act="rmPhoto">Remove</button>
      <input type="file" id="photoFile" accept="image/*" hidden><small>Buyers trust listings with a clear photo. JPG, PNG or WebP.</small></div></div>
    <label>Species${cb(`name="species" required placeholder="Tilapia" value="${esc(l.species)}"`, 'SPECIES')}</label>
    <div class="g"><label>Quantity available (kg)<input type="number" name="quantity_kg" min="1" step="any" required value="${esc(l.quantity_kg)}"></label><label>Price per kg (₱)<input type="number" name="price_per_kg" min="1" step="any" required value="${esc(l.price_per_kg)}"></label></div>
    <div class="g"><label>Minimum order (kg, optional)<input type="number" name="min_order_kg" min="0" step="any" value="${l.min_order_kg ? esc(l.min_order_kg) : ''}"></label><label>Location${cb(`name="location" required value="${esc(l.location)}"`, 'PLACES')}</label></div>
    <div class="g"><label>Freshness<select name="freshness">${opt(l.freshness, 'fresh', 'Fresh (caught today)')}${opt(l.freshness, 'good', 'Good')}${opt(l.freshness, 'fair', 'Fair')}</select></label>
      <label>Source<select name="source">${opt(l.source, 'wild', 'Wild-caught')}${opt(l.source, 'farmed', 'Farm-raised')}</select></label></div>
    <div class="g"><label>Delivery<select name="delivery">${opt(l.delivery, 'pickup', 'Buyer picks up')}${opt(l.delivery, 'delivery', 'I can deliver')}${opt(l.delivery, 'both', 'Pickup or delivery')}</select></label>
      <label>Catch or harvest date<input type="date" name="catch_date" value="${esc(l.catch_date)}"></label></div>
    <label>Notes (optional)<textarea name="notes" rows="2" maxlength="300" placeholder="Size, how it was kept, best time to pick up">${esc(l.notes)}</textarea></label>
    <button class="btn">${id ? 'Save changes' : 'Post fish'}</button> ${id ? '<a class="sm" href="#/listings">Cancel</a>' : ''}</form></div>`};
  },
  async listings() {
    const rows = await api('GET', '/api/listings');
    LIST = {rows, table: listingTable};
    return {title: 'Manage listings', html: `<div class="card"><div class="lhead">${rows.length ? searchBar() : '<span></span>'}<a class="btn" href="#/post">Post fish</a></div><div id="lres">${listingTable(rows, false)}</div></div>`};
  },
  requirement: async () => ({title: 'Submit requirement', html: `<div class="card form"><form data-form="requirement"><div class="err-msg" id="err"></div>
    <label>Species wanted${cb(`name="species" required placeholder="Tilapia"`, 'SPECIES')}</label>
    <div class="g"><label>Quantity needed (kg)<input type="number" name="quantity_kg" min="1" step="any" required></label><label>Highest price per kg (₱)<input type="number" name="max_price_per_kg" min="1" step="any" required></label></div>
    <div class="g"><label>Your location${cb(`name="location" required value="${esc(me.location)}"`, 'PLACES')}</label><label>Lowest freshness<select name="min_freshness"><option value="good">Good</option><option value="fresh">Fresh only</option><option value="fair">Fair is fine</option></select></label></div>
    <button class="btn">Find matches</button></form></div>`}),
  async requirements() {
    const rows = await api('GET', '/api/requirements');
    LIST = {rows, table: reqTable};
    return {title: 'Manage requirements', html: `<div class="card">${rows.length ? `<div class="lhead">${searchBar()}</div>` : ''}<div id="lres">${reqTable(rows, false)}</div></div>`};
  },
  async matches() {
    const rows = await api('GET', '/api/matches');
    LIST = {rows, table: matchTable};
    return {title: 'Matching results', html: `<div class="card"><div class="lhead">${rows.length ? searchBar() : '<span></span>'}${fisher() ? '' : '<button class="sm" data-act="rematch">Refresh matches</button>'}</div><div id="lres">${matchTable(rows, false)}</div></div>`};
  },
  async listing(id) {
    const l = await api('GET', '/api/listings/' + encodeURIComponent(id));
    const dv = {pickup: 'Buyer picks up', delivery: 'Delivery available', both: 'Pickup or delivery'}[l.delivery] || '';
    return {title: 'Fish listing details', html: `<div class="card feat" style="max-width:480px">${l.photo ? `<img class="dphoto" src="${esc(l.photo)}" alt="${esc(l.species)}">` : FISH}<h2>${esc(l.species)}</h2>
      <div class="facts"><span>• ${kg(l.quantity_kg)} available</span><span>• ${peso(l.price_per_kg)} per kg</span><span>• ${esc(l.location)}</span><span>• ${cap(esc(l.freshness))}, caught ${esc(l.catch_date)}</span><span>• ${l.source === 'farmed' ? 'Farm-raised' : 'Wild-caught'}</span><span>• ${dv}</span>${l.min_order_kg > 0 ? `<span>• Minimum order ${kg(l.min_order_kg)}</span>` : ''}</div>
      ${l.notes ? `<p class="empty" style="text-align:left">${esc(l.notes)}</p>` : ''}
      <div class="contact"><div class="crow">${av(l.owner, 'md')}<div><b>${esc(l.owner.name)}</b><small>${fisher() ? 'Your contact details' : 'Contact the fisherfolk'}</small></div></div>${l.owner.bio ? `<p class="obio">${esc(l.owner.bio)}</p>` : ''}${esc(l.owner.location)}<br>${esc(l.owner.phone)}<br>${esc(l.owner.email)}</div>
      <a class="link" href="#/${fisher() ? 'listings' : 'market'}">${fisher() ? 'Back to my listings' : 'Back to browse fish'}</a></div>`};
  },
  async market() {
    window._market = await api('GET', '/api/market');
    return {title: 'Browse fish', html: `<div class="card" style="margin-bottom:20px"><div class="filters">${cb('id="mq" placeholder="Search fish, e.g. Tilapia" aria-label="Search fish"', 'SPECIES')}${cb('id="ml" placeholder="Search location" aria-label="Location"', 'PLACES')}<input id="mp" type="number" min="0" placeholder="Max price/kg" aria-label="Max price per kg"><select id="ms" aria-label="Sort"><option value="new">Newest</option><option value="low">Lowest price</option><option value="qty">Most available</option></select></div></div><div id="mgrid" class="mgrid">${marketCards(window._market)}</div>`};
  },
  profile: async () => {
    avState.changed = false; avState.value = '';
    const since = me.created_at ? String(me.created_at).slice(0, 10) : '';
    return {title: 'Profile', html: `<div class="pgrid">
    <div class="card pcard"><div class="av xl" id="avPrev">${avInner(me)}</div>
      <h2>${esc(me.name)}</h2><span class="badge">${me.role === 'buyer' ? 'Fish buyer' : 'Fisherfolk'}</span>
      <p class="pbio">${me.bio ? esc(me.bio) : 'You have not written anything about yourself yet.'}</p>
      <div class="pacts"><button type="button" class="sm" data-act="pickAvatar">Choose picture</button><button type="button" class="sm del" data-act="rmAvatar">Remove</button></div>
      <input type="file" id="avFile" accept="image/*" hidden>
      <p class="phint">Pick a picture, then press <b>Save changes</b> to keep it.</p>
      <ul class="pinfo"><li>${ico('pin')}${esc(me.location)}</li><li>${ico('phone')}${esc(me.phone)}</li><li>${ico('mail')}${esc(me.email)}</li></ul>
      ${since ? `<p class="since">Member since ${esc(since)}</p>` : ''}</div>
    <div class="card form"><form data-form="profile"><div class="err-msg" id="err"></div>
      <label>Name<input name="name" required value="${esc(me.name)}"></label>
      <div class="g"><label>Mobile number<input name="phone" required value="${esc(me.phone)}"></label><label>Location${cb(`name="location" required value="${esc(me.location)}"`, 'PLACES')}</label></div>
      <label>About you (optional)<textarea name="bio" rows="4" maxlength="300" placeholder="Tell buyers or sellers who you are: what you catch or buy, where, and when you are available.">${esc(me.bio || '')}</textarea></label>
      <div class="g"><label>Email<input value="${esc(me.email)}" readonly></label><label>Account type<input value="${me.role === 'buyer' ? 'Fish buyer' : 'Fisherfolk'}" readonly></label></div>
      <button class="btn">Save changes</button></form></div></div>`};
  }
};
const ALLOWED = {fisherfolk: ['dashboard', 'post', 'listings', 'matches', 'profile', 'listing'], buyer: ['dashboard', 'market', 'requirement', 'requirements', 'matches', 'profile', 'listing']};

/* ---------- actions ---------- */
const forms = {
  async register(d) { d.name = (d.first + ' ' + d.last).trim(); me = await api('POST', '/api/register', d); go('#/dashboard'); },
  async login(d) {
    if (d.remember) d.remember = true; else delete d.remember;
    me = await api('POST', '/api/login', d);
    if (me.device_token) rememberAccount(me, me.device_token);
    delete me.device_token; go('#/dashboard');
  },
  async post(d) {
    if (!photoState.changed) delete d.photo;
    const id = d.id; delete d.id;
    if (id) { await api('PUT', '/api/listings/' + id, d); toast('Listing updated.'); }
    else { await api('POST', '/api/listings', d); toast('Fish posted.'); }
    go('#/listings');
  },
  async requirement(d) { const r = await api('POST', '/api/requirements', d); toast(r.matches ? `Found ${r.matches} matching listing${r.matches > 1 ? 's' : ''}.` : 'Requirement saved. No matches yet.'); go('#/matches'); },
  async profile(d) { if (avState.changed) d.avatar = avState.value; me = await api('PUT', '/api/me', d); refreshSaved(me); toast('Profile saved.'); render(); }
};
const actions = {
  async pickPhoto() { $('#photoFile').click(); },
  async pickAvatar() { $('#avFile').click(); },
  async rmAvatar() { avState.value = ''; avState.changed = true; $('#avPrev').textContent = (me.name || '?')[0].toUpperCase(); toast('Picture removed. Press Save changes to keep this.'); },
  async clearSearch() { $('#lq').value = ''; $('#ll').value = ''; drawList(); },
  async rmPhoto() { $('#photoVal').value = ''; photoState.changed = true; $('#prev').textContent = 'No photo yet'; },
  async logout() { await api('POST', '/api/logout'); me = null; closeModal(); go('#/'); },
  async logoutForget() { forgetAccount(me.email); await actions.logout(); },
  async switcher() { openSwitcher(); },
  async closeModal() { closeModal(); },
  async addAccount() { await api('POST', '/api/logout'); me = null; closeModal(); go('#/login/new'); },
  async switchTo(email) {
    const a = accounts().find(x => x.email === email); if (!a) return;
    await api('POST', '/api/logout'); me = null;
    try { me = await api('POST', '/api/login/saved', {token: a.token}); refreshSaved(me); closeModal(); go('#/dashboard'); }
    catch (err) { forgetLocal(email); closeModal(); toast('That saved login expired. Please log in again.', true); go('#/login/new'); }
  },
  async quickLogin(email) {
    const a = accounts().find(x => x.email === email); if (!a) return;
    try { me = await api('POST', '/api/login/saved', {token: a.token}); refreshSaved(me); go('#/dashboard'); }
    catch (err) { forgetLocal(email); toast('Your saved login expired. Please log in again.', true); go('#/login/new'); }
  },
  async forgetAcc(email) { if (!confirm('Remove this account from this device?')) return; forgetAccount(email); render(); },
  async sold(id) { await api('POST', `/api/listings/${id}/sold`); toast('Marked as sold.'); render(); },
  async delListing(id) { if (!confirm('Delete this listing?')) return; await api('DELETE', '/api/listings/' + id); toast('Listing deleted.'); render(); },
  async cancelReq(id) { if (!confirm('Cancel this requirement?')) return; await api('DELETE', '/api/requirements/' + id); toast('Requirement cancelled.'); render(); },
  async rematch() { await api('POST', '/api/match'); toast('Matches refreshed.'); render(); }
};
document.addEventListener('submit', async e => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  const btn = f.querySelector('button:not([type])'), box = f.querySelector('#err');
  if (box) box.classList.remove('show');
  if (btn) btn.disabled = true;
  try { await forms[f.dataset.form](Object.fromEntries(new FormData(f))); }
  catch (err) { if (box) { box.textContent = err.message; box.classList.add('show'); } else toast(err.message, true); }
  if (btn) btn.disabled = false;
});
document.addEventListener('click', e => {
  if (e.target.classList && e.target.classList.contains('mdl')) return closeModal();
  const eye = e.target.closest('[data-eye]');
  if (eye) {
    const i = eye.parentElement.querySelector('input'), show = i.type === 'password';
    i.type = show ? 'text' : 'password'; eye.innerHTML = show ? EYE_OFF : EYE;
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); return;
  }
  const a = e.target.closest('[data-act]');
  if (a) actions[a.dataset.act](a.dataset.id).catch(err => toast(err.message, true));
});

/* ---------- photos + marketplace helpers ---------- */
const photoState = {changed: false};
function readPhoto(file) {
  return new Promise((res, rej) => {
    if (!file.type.startsWith('image/')) return rej(new Error('Choose an image file.'));
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('Could not read that photo.'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error('That image could not be opened.'));
      img.onload = () => {
        const k = Math.min(1, 720 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', .72));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function marketCards(rows) {
  if (!rows.length) return '<p class="empty">No fish matches your search. Try a different species or location.</p>';
  return rows.map(l => `<a class="mcard" href="#/listing/${l.id}"><div class="mimg">${l.photo ? `<img src="${esc(l.photo)}" alt="${esc(l.species)}" loading="lazy">` : FISH}</div>
    <div class="mbody"><h3>${esc(l.species)}</h3><div class="mprice">${peso(l.price_per_kg)}<small> per kg</small></div>
    <div class="mmeta"><span class="badge">${cap(esc(l.freshness))}</span><span class="badge" style="background:#e3f3f0;color:var(--deep)">${l.source === 'farmed' ? 'Farm-raised' : 'Wild-caught'}</span><br>${kg(l.quantity_kg)} available · ${esc(l.location)}</div><div class="by">${av({name: l.fisher_name, avatar: l.fisher_avatar}, 'sm')}<span>${esc(l.fisher_name)}</span></div></div></a>`).join('');
}
function drawMarket() {
  const q = $('#mq').value.trim().toLowerCase(), loc = $('#ml').value.trim().toLowerCase(), mp = parseFloat($('#mp').value), sort = $('#ms').value;
  let r = (window._market || []).filter(l => (!q || l.species.toLowerCase().includes(q)) && (!loc || l.location.toLowerCase().includes(loc)) && (isNaN(mp) || l.price_per_kg <= mp));
  if (sort === 'low') r.sort((a, b) => a.price_per_kg - b.price_per_kg); else if (sort === 'qty') r.sort((a, b) => b.quantity_kg - a.quantity_kg);
  $('#mgrid').innerHTML = marketCards(r);
}
document.addEventListener('input', e => {
  if (['mq', 'ml', 'mp', 'ms'].includes(e.target.id)) drawMarket();
  if (['lq', 'll'].includes(e.target.id)) drawList();
  const w = e.target.closest && e.target.closest('.cb'); if (w && e.target.tagName === 'INPUT' && document.activeElement === e.target) cbDraw(w);
});
document.addEventListener('change', async e => {
  if (e.target.id !== 'photoFile' || !e.target.files[0]) return;
  try {
    const url = await readPhoto(e.target.files[0]);
    $('#photoVal').value = url; photoState.changed = true; $('#prev').innerHTML = `<img src="${url}" alt="Fish photo">`;
  } catch (err) { toast(err.message, true); }
});

/* ---------- avatars, searchable dropdowns, list search ---------- */
const avInner = u => u && u.avatar ? `<img src="${esc(u.avatar)}" alt="">` : esc(((u && u.name) || '?')[0].toUpperCase());
const av = (u, size = '') => `<div class="av ${size}">${avInner(u)}</div>`;
const avState = {changed: false, value: ''};
function readAvatar(file) {
  return new Promise((res, rej) => {
    if (!file.type.startsWith('image/')) return rej(new Error('Choose an image file.'));
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('Could not read that picture.'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error('That image could not be opened.'));
      img.onload = () => {
        const S = 256, side = Math.min(img.width, img.height), c = document.createElement('canvas');
        c.width = c.height = S;
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, S, S);
        x.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
        res(c.toDataURL('image/jpeg', .85));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
document.addEventListener('change', async e => {
  if (e.target.id !== 'avFile' || !e.target.files[0]) return;
  try {
    const url = await readAvatar(e.target.files[0]);
    avState.value = url; avState.changed = true; $('#avPrev').innerHTML = `<img src="${url}" alt="">`;
  } catch (err) { toast(err.message, true); }
});

/* searchable dropdown: type to filter, click or use arrow keys + Enter. Your own text is still allowed. */
const CB = {PLACES, SPECIES};
const cb = (attrs, key) => `<div class="cb" data-cb="${key}"><input ${attrs} autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false"><ul class="cbl" role="listbox" hidden></ul></div>`;
const hl = (x, q) => { const i = q ? x.toLowerCase().indexOf(q) : -1; return i < 0 ? esc(x) : esc(x.slice(0, i)) + '<mark>' + esc(x.slice(i, i + q.length)) + '</mark>' + esc(x.slice(i + q.length)); };
function cbClose() { document.querySelectorAll('.cbl:not([hidden])').forEach(l => { l.hidden = true; l.previousElementSibling.setAttribute('aria-expanded', 'false'); }); }
function cbDraw(wrap) {
  const input = wrap.querySelector('input'), list = wrap.querySelector('.cbl'), q = input.value.trim().toLowerCase();
  const hits = (CB[wrap.dataset.cb] || []).filter(x => x.toLowerCase().includes(q)).sort((a, b) => b.toLowerCase().startsWith(q) - a.toLowerCase().startsWith(q));
  list.innerHTML = hits.length ? hits.map(x => `<li role="option" data-v="${esc(x)}">${hl(x, q)}</li>`).join('') : `<li class="none">No match. We will use what you typed.</li>`;
  list.hidden = false; input.setAttribute('aria-expanded', 'true');
}
function cbPick(li) {
  const wrap = li.closest('.cb'), input = wrap.querySelector('input');
  input.value = li.dataset.v; input.dispatchEvent(new Event('input', {bubbles: true})); cbClose();
}
document.addEventListener('focusin', e => { const w = e.target.closest && e.target.closest('.cb'); if (w && e.target.tagName === 'INPUT') cbDraw(w); });
document.addEventListener('focusout', e => { if (e.target.closest && e.target.closest('.cb')) cbClose(); });
document.addEventListener('mousedown', e => {
  if (e.target.closest && e.target.closest('.cbl')) e.preventDefault();  // keep focus in the box (also while dragging the scrollbar)
  const li = e.target.closest && e.target.closest('.cbl li[data-v]');
  if (li) cbPick(li);
});
document.addEventListener('keydown', e => {
  const w = e.target.closest && e.target.closest('.cb'); if (!w || e.target.tagName !== 'INPUT') return;
  const list = w.querySelector('.cbl'), items = [...list.querySelectorAll('li[data-v]')];
  if (e.key === 'Escape') return cbClose();
  if (list.hidden && e.key === 'ArrowDown') { cbDraw(w); return e.preventDefault(); }
  if (!items.length) return;
  const cur = items.findIndex(i => i.classList.contains('on'));
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const n = e.key === 'ArrowDown' ? (cur + 1) % items.length : (cur <= 0 ? items.length - 1 : cur - 1);
    items.forEach(i => i.classList.remove('on')); items[n].classList.add('on'); items[n].scrollIntoView({block: 'nearest'});
  } else if (e.key === 'Enter' && cur >= 0) { e.preventDefault(); cbPick(items[cur]); }
});

/* search bar for Manage listings, Manage requirements and Matching results */
let LIST = null;
const searchBar = () => `<div class="sbar"><div class="sf">${ico('search')}${cb('id="lq" placeholder="Search fish, e.g. Tilapia" aria-label="Search fish"', 'SPECIES')}</div><div class="sf">${ico('pin')}${cb('id="ll" placeholder="Search location" aria-label="Search location"', 'PLACES')}</div><button type="button" class="sm" data-act="clearSearch">Clear</button></div>`;
function drawList() {
  if (!LIST || !$('#lres')) return;
  const q = ($('#lq').value || '').trim().toLowerCase(), l = ($('#ll').value || '').trim().toLowerCase(), searching = !!(q || l);
  const rows = LIST.rows.filter(r => (!q || String(r.species).toLowerCase().includes(q)) && (!l || String(r.location).toLowerCase().includes(l)));
  $('#lres').innerHTML = (searching ? `<p class="cnt">${rows.length} of ${LIST.rows.length} shown</p>` : '') + LIST.table(rows, searching);
}
const listingTable = (rows, searching) => !rows.length
  ? (searching ? '<p class="empty">No listing matches your search.</p>' : '<p class="empty">You have not posted any fish yet. Post your first catch so buyers can find it.</p>')
  : `<div class="tw"><table><thead><tr><th></th><th>Fish</th><th>Quantity</th><th>Price</th><th>Location</th><th>Freshness</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(l => `<tr><td>${l.photo ? `<img class="thumb" src="${esc(l.photo)}" alt="">` : '<div class="thumb"></div>'}</td><td><b>${esc(l.species)}</b><br><small style="color:var(--mute)">${l.source === 'farmed' ? 'Farm-raised' : 'Wild-caught'}</small></td><td>${kg(l.quantity_kg)}</td><td>${peso(l.price_per_kg)}/kg</td><td>${esc(l.location)}</td><td>${cap(esc(l.freshness))}</td><td><span class="st ${l.status === 'sold' ? 'sold' : ''}">${cap(l.status)}</span></td><td style="white-space:nowrap"><a class="sm" href="#/post/${l.id}">Edit</a> ${l.status === 'active' ? `<button class="sm" data-act="sold" data-id="${l.id}">Mark sold</button> ` : ''}<button class="sm del" data-act="delListing" data-id="${l.id}">Delete</button></td></tr>`).join('')}</tbody></table></div>`;
const reqTable = (rows, searching) => !rows.length
  ? (searching ? '<p class="empty">No requirement matches your search.</p>' : '<p class="empty">No requirements yet. <a href="#/requirement">Tell us what fish you need.</a></p>')
  : `<div class="tw"><table><thead><tr><th>Fish</th><th>Quantity</th><th>Highest price</th><th>Location</th><th>Lowest freshness</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${esc(r.species)}</b></td><td>${kg(r.quantity_kg)}</td><td>${peso(r.max_price_per_kg)}/kg</td><td>${esc(r.location)}</td><td>${cap(esc(r.min_freshness))}</td><td><button class="sm del" data-act="cancelReq" data-id="${r.id}">Cancel</button></td></tr>`).join('')}</tbody></table></div>`;

/* ---------- saved logins on this device (like Facebook's recent logins) ---------- */
const ACC_KEY = 'fm_accounts', roleName = r => r === 'buyer' ? 'Fish buyer' : 'Fisherfolk';
const accounts = () => { try { return JSON.parse(localStorage.getItem(ACC_KEY) || '[]'); } catch (e) { return []; } };
const putAccounts = a => { try { localStorage.setItem(ACC_KEY, JSON.stringify(a.slice(0, 6))); } catch (e) {} };
function rememberAccount(u, token) {
  putAccounts([{email: u.email, name: u.name, role: u.role, avatar: u.avatar || '', token}, ...accounts().filter(x => x.email !== u.email)]);
}
function refreshSaved(u) {  // keep the saved card's name and picture up to date
  const a = accounts(), i = a.findIndex(x => x.email === u.email);
  if (i >= 0) { a[i] = {...a[i], name: u.name, role: u.role, avatar: u.avatar || ''}; putAccounts(a); }
}
function forgetLocal(email) { putAccounts(accounts().filter(x => x.email !== email)); }
function forgetAccount(email) {  // revoke on the server too
  const a = accounts().find(x => x.email === email);
  if (a && a.token) api('POST', '/api/login/forget', {token: a.token}).catch(() => {});
  forgetLocal(email);
}
const savedPicker = () => `<p class="eb">Welcome back</p><h2>Recent logins</h2><p class="sub">Click your picture to log in.</p>
  <div class="saved">${accounts().map(a => `<div class="sc"><button type="button" class="scb" data-act="quickLogin" data-id="${esc(a.email)}">${av(a, 'lg')}<b>${esc(a.name)}</b><small>${roleName(a.role)}</small></button><button type="button" class="scx" data-act="forgetAcc" data-id="${esc(a.email)}" aria-label="Remove ${esc(a.name)} from this device" title="Remove from this device">×</button></div>`).join('')}
  <a class="sc add" href="#/login/new"><span class="plus">+</span><b>Log in to another account</b></a></div>`;
function closeModal() { $('#modal').innerHTML = ''; }
function openSwitcher() {
  const saved = accounts(), here = saved.some(x => x.email === me.email), others = saved.filter(x => x.email !== me.email);
  $('#modal').innerHTML = `<div class="mdl"><div class="mbox"><h3>Switch account</h3>
    <div class="srow cur">${av(me, 'md')}<div><b>${esc(me.name)}</b><small>Logged in now${here ? '' : ' · not saved on this device'}</small></div></div>
    ${others.map(a => `<button type="button" class="srow" data-act="switchTo" data-id="${esc(a.email)}">${av(a, 'md')}<div><b>${esc(a.name)}</b><small>${roleName(a.role)} · click to switch</small></div></button>`).join('')}
    <button type="button" class="srow" data-act="addAccount"><span class="plus">+</span><div><b>Log in to another account</b><small>${here ? 'Your current login stays saved' : 'You will be logged out of this one'}</small></div></button>
    <hr class="mdiv">
    <button type="button" class="srow out" data-act="logout"><div><b>Log out</b><small>${here ? 'You can come back with one click' : 'Ends this session'}</small></div></button>
    ${here ? '<button type="button" class="srow out" data-act="logoutForget"><div><b>Log out and forget this device</b><small>Use this on a shared computer</small></div></button>' : ''}
    <div style="text-align:right;margin-top:10px"><button type="button" class="sm" data-act="closeModal">Close</button></div></div></div>`;
}

/* ---------- router ---------- */
async function render() {
  if (me === undefined) me = (await api('GET', '/api/me')).user;
  const [page, arg] = (location.hash.replace(/^#\/?/, '') || '').split('/');
  const isPub = ['', 'login', 'register'].includes(page);
  if (!me && !isPub) return go('#/login');
  if (me && isPub) return go('#/dashboard');
  try {
    if (isPub) $('#root').innerHTML = pub[page || 'landing'](arg);
    else {
      const key = ALLOWED[me.role].includes(page) ? page : 'dashboard';
      LIST = null;
      const p = await priv[key](arg);
      $('#root').innerHTML = shell(key, p.title, p.html, p.stat);
    }
    scrollTo(0, 0);
  } catch (err) { toast(err.message, true); if (!isPub) { $('#root').innerHTML = shell('dashboard', 'Something went wrong', `<div class="card"><p class="empty">${esc(err.message)} <a href="#/dashboard">Back to dashboard</a></p></div>`); } }
}
addEventListener('hashchange', render);
render();
