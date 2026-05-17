// ==========================================================================
// ãã•ããƒ’ã‚¹ãƒˆãƒªã‚¢ â€” æ¤œç´¢ãƒ­ã‚¸ãƒƒã‚¯ + ã‚¿ã‚¤ãƒ ãƒ©ã‚¤ãƒ³
// ==========================================================================

let DATA = [];
let EVENTS = {};
let activeEra = 'all';
let activeMajorEra = 'all';
let activeWorldRegion = 'all';
let currentQuery = '';
let viewMode = 'cards';
let currentRegion = (function(){
try{
const r = localStorage.getItem('khRegion');
return (r === 'æ—¥æœ¬' || r === 'ä¸–ç•Œ' || r === 'all') ? r : 'all';
} catch(e){ return 'all'; }
})();

function eraGroup(era){
if(!era) return '';
if(era.includes('é£›é³¥')) return 'é£›é³¥';
if(era.includes('å¥ˆè‰¯')) return 'å¥ˆè‰¯';
if(era.includes('å¹³å®‰')) return 'å¹³å®‰';
if(era.includes('éŽŒå€‰')) return 'éŽŒå€‰';
if(era.includes('å®¤ç”º')) return 'å®¤ç”º';
if(era.includes('æˆ¦å›½')||era.includes('å®‰åœŸæ¡ƒå±±')) return 'æˆ¦å›½';
if(era.includes('æ±Ÿæˆ¸')) return 'æ±Ÿæˆ¸';
return era;
}

// å›½åã‹ã‚‰ä¸–ç•Œå²ã®åœ°åŸŸã‚°ãƒ«ãƒ¼ãƒ—ã‚’åˆ¤å®š
function worldRegion(country){
if(!country || country === 'æ—¥æœ¬') return null;
if(country === 'ä¸­å›½') return 'ä¸­å›½';
// åŒ—æ¬§
const nordic = ['ã‚¹ã‚¦ã‚§ãƒ¼ãƒ‡ãƒ³','ãƒ‡ãƒ³ãƒžãƒ¼ã‚¯','ãƒŽãƒ«ã‚¦ã‚§ãƒ¼','ãƒ•ã‚£ãƒ³ãƒ©ãƒ³ãƒ‰','ã‚¢ã‚¤ã‚¹ãƒ©ãƒ³ãƒ‰'];
for(const n of nordic){
if(country.includes(n)) return 'åŒ—æ¬§';
}
// æ±æ¬§ãƒ»ãƒ­ã‚·ã‚¢
const eastEu = ['ãƒ­ã‚·ã‚¢','ãƒãƒ¼ãƒ©ãƒ³ãƒ‰','ãƒã‚§ã‚³','ãƒœãƒ˜ãƒŸã‚¢','ãƒãƒ³ã‚¬ãƒªãƒ¼','ã‚¦ã‚¯ãƒ©ã‚¤ãƒŠ','ãƒ«ãƒ¼ãƒžãƒ‹ã‚¢','ãƒ–ãƒ«ã‚¬ãƒªã‚¢'];
for(const e of eastEu){
if(country.includes(e)) return 'æ±æ¬§ãƒ»ãƒ­ã‚·ã‚¢';
}
// è¥¿æ¬§
const western = ['ãƒ•ãƒ©ãƒ³ã‚¹','ã‚¤ãƒ³ã‚°ãƒ©ãƒ³ãƒ‰','ã‚¹ã‚³ãƒƒãƒˆãƒ©ãƒ³ãƒ‰','ã‚¤ã‚¿ãƒªã‚¢','ã‚¹ãƒšã‚¤ãƒ³',
'ç¥žè–ãƒ­ãƒ¼ãƒž','ãƒãƒ—ã‚¹ãƒ–ãƒ«ã‚¯','ã‚ªãƒ¼ã‚¹ãƒˆãƒªã‚¢','ã‚¨ãƒ«ã‚µãƒ¬ãƒ ','ãƒŠãƒãƒ©','ãƒŠãƒãƒª',
'ã‚¤ã‚®ãƒªã‚¹','ãƒãƒ«ãƒˆã‚¬ãƒ«','ãƒ™ãƒ«ã‚®ãƒ¼','ãƒãƒ¼ãƒ‡ãƒ«ãƒ©ãƒ³ãƒˆ','ã‚ªãƒ©ãƒ³ãƒ€','ãƒ—ãƒ­ã‚¤ã‚»ãƒ³','ãƒ‰ã‚¤ãƒ„'];
for(const w of western){
if(country.includes(w)) return 'è¥¿æ¬§';
}
// ã‚¢ã‚¸ã‚¢
const asia = ['ã‚ªã‚¹ãƒžãƒ³','ã‚¤ãƒ³ãƒ‰','ãƒ ã‚¬ãƒ«','ãƒ¢ãƒ³ã‚´ãƒ«','ãƒšãƒ«ã‚·ã‚¢','éŸ“å›½','æœé®®',
'ãƒ™ãƒˆãƒŠãƒ ','ã‚¿ã‚¤','ã‚¤ãƒ³ãƒ‰ãƒã‚·ã‚¢','ã‚»ãƒ¬ã‚¦ã‚³ã‚¹','ã‚¤ãƒ©ãƒ³','ãƒˆãƒ«ã‚³'];
for(const a of asia){
if(country.includes(a)) return 'ã‚¢ã‚¸ã‚¢';
}
return 'ãã®ä»–'; // ãƒ­ãƒ¼ãƒžå¸å›½ãƒ»æ±ãƒ­ãƒ¼ãƒžå¸å›½ãªã©
}

// ç”Ÿå¹´ã‹ã‚‰å¤§åŒºåˆ†ï¼ˆå¤ä»£/ä¸­ä¸–/è¿‘ä¸–/è¿‘ä»£ï¼‰ã‚’åˆ¤å®š
function majorEraOf(birthRaw){
const y = parseYear(birthRaw);
if(y === null) return '';
if(y < 1100) return 'å¤ä»£';
if(y < 1500) return 'ä¸­ä¸–';
if(y < 1800) return 'è¿‘ä¸–';
return 'è¿‘ä»£';
}

function eraColorClass(era, country){
if(country === 'ä¸­å›½') return 'era-china';
const wr = worldRegion(country);
if(wr === 'åŒ—æ¬§') return 'era-nordic';
if(wr === 'æ±æ¬§ãƒ»ãƒ­ã‚·ã‚¢') return 'era-east';
if(wr === 'ã‚¢ã‚¸ã‚¢') return 'era-asia';
if(country && country !== 'æ—¥æœ¬') return 'era-world';
return 'era-' + ({
'é£›é³¥':'asuka','å¥ˆè‰¯':'nara','å¹³å®‰':'heian',
'éŽŒå€‰':'kamakura','å®¤ç”º':'muromachi','æˆ¦å›½':'sengoku','æ±Ÿæˆ¸':'edo'
}[eraGroup(era)] || 'heian');
}

function regionMatch(item){
if(currentRegion === 'all') return true;
const c = item.country || '';
if(currentRegion === 'æ—¥æœ¬') return c === 'æ—¥æœ¬';
if(currentRegion === 'ä¸–ç•Œ') return c && c !== 'æ—¥æœ¬';
return true;
}

function worldRegionMatch(item){
if(currentRegion !== 'ä¸–ç•Œ') return true;
if(activeWorldRegion === 'all') return true;
return worldRegion(item.country) === activeWorldRegion;
}

function majorEraMatch(item){
if(currentRegion !== 'all') return true;
if(activeMajorEra === 'all') return true;
return majorEraOf(item.birth) === activeMajorEra;
}

function matchScore(item, q){
if(!q) return 1;
const qLower = q.toLowerCase();
let score = 0;
for(const e of (item.events||[])){
if(e.includes(q)) score += 10;
}
for(const k of (item.keywords||[])){
if(k.includes(q)) score += 5;
}
if(item.name.includes(q)) score += 8;
if(item.reading && item.reading.includes(qLower)) score += 4;
if(item.summary && item.summary.includes(q)) score += 2;
if(item.title && item.title.includes(q)) score += 1;
for(const t of (item.themes||[])){
if(t.includes(q)) score += 2;
}
if(item.role && item.role.includes(q)) score += 1;
return score;
}

function highlight(text, q){
if(!q || !text) return text||'';
const idx = text.indexOf(q);
if(idx < 0) return text;
return text.slice(0,idx) + '<mark>' + text.slice(idx, idx+q.length) + '</mark>' + text.slice(idx+q.length);
}

function parseYear(s){
if(s === null || s === undefined || s === '') return null;
const str = String(s);
const bcMatch = str.match(/å‰(\d+)/);
if(bcMatch) return -parseInt(bcMatch[1], 10);
const m = str.match(/-?\d+/);
if(m) return parseInt(m[0], 10);
return null;
}

function setQueryAndRefresh(q){
const input = document.getElementById('q');
input.value = q;
currentQuery = q;
document.getElementById('clear').classList.add('visible');
document.querySelectorAll('.chip').forEach(x => {
x.classList.toggle('active', x.dataset.q === currentQuery);
});
render();
window.scrollTo({top:0, behavior:'smooth'});
}

function renderEventInfo(){
const box = document.getElementById('event-info');
if(!box) return;
const ev = EVENTS[currentQuery];
if(!ev){
box.classList.remove('visible');
box.innerHTML = '';
return;
}
const seeAlsoHtml = (ev.see_also||[])
.map(s => '<span class="mini-chip" data-q="'+s+'">'+s+'</span>').join('');
box.innerHTML =
'<div class="ei-head">' +
'<h3 class="ei-name">'+currentQuery+'</h3>' +
'<span class="ei-meta">'+(ev.year||'')+' ï¼ '+(ev.era||'')+'</span>' +
'</div>' +
'<p class="ei-summary">'+(ev.summary||'')+'</p>' +
(seeAlsoHtml ? '<div class="ei-related"><span class="label">é–¢é€£ï¼š</span>'+seeAlsoHtml+'</div>' : '');
box.classList.add('visible');
box.querySelectorAll('.mini-chip').forEach(c => {
c.addEventListener('click', () => setQueryAndRefresh(c.dataset.q));
});
}

function applyRegionUI(){
document.querySelectorAll('.region-btn').forEach(b => {
b.classList.toggle('active', b.dataset.region === currentRegion);
});
const jpChips = document.getElementById('event-chips-jp');
const worldChips = document.getElementById('event-chips-world');
if(jpChips) jpChips.style.display = (currentRegion === 'ä¸–ç•Œ') ? 'none' : '';
if(worldChips) worldChips.style.display = (currentRegion === 'æ—¥æœ¬') ? 'none' : '';

// ã‚¿ãƒ–åˆ‡æ›¿ï¼ˆ3ãƒ¢ãƒ¼ãƒ‰ï¼‰
const allTabs = document.getElementById('all-tabs');
const eraTabs = document.getElementById('era-tabs');
const regionTabs = document.getElementById('region-tabs');
if(currentRegion === 'all'){
if(allTabs) allTabs.style.display = '';
if(eraTabs) eraTabs.style.display = 'none';
if(regionTabs) regionTabs.style.display = 'none';
} else if(currentRegion === 'ä¸–ç•Œ'){
if(allTabs) allTabs.style.display = 'none';
if(eraTabs) eraTabs.style.display = 'none';
if(regionTabs) regionTabs.style.display = '';
} else {
if(allTabs) allTabs.style.display = 'none';
if(eraTabs) eraTabs.style.display = '';
if(regionTabs) regionTabs.style.display = 'none';
}

document.querySelectorAll('.view-btn').forEach(b => {
b.classList.toggle('active', b.dataset.view === viewMode);
});
}

const TIMELINE_ROWS = [
{ key: 'æ—¥æœ¬', label: 'æ—¥æœ¬', dotClass: 'dot-jp', match: c => c === 'æ—¥æœ¬' },
{ key: 'ä¸­å›½', label: 'ä¸­å›½', dotClass: 'dot-china', match: c => c === 'ä¸­å›½' },
{ key: 'è¥¿æ¬§', label: 'è¥¿æ¬§', dotClass: 'dot-west', match: c => worldRegion(c) === 'è¥¿æ¬§' },
{ key: 'åŒ—æ¬§', label: 'åŒ—æ¬§', dotClass: 'dot-nordic', match: c => worldRegion(c) === 'åŒ—æ¬§' },
{ key: 'æ±æ¬§ãƒ»ãƒ­ã‚·ã‚¢', label: 'æ±æ¬§', dotClass: 'dot-east', match: c => worldRegion(c) === 'æ±æ¬§ãƒ»ãƒ­ã‚·ã‚¢' },
{ key: 'ã‚¢ã‚¸ã‚¢',label: 'ã‚¢ã‚¸ã‚¢',dotClass: 'dot-asia', match: c => worldRegion(c) === 'ã‚¢ã‚¸ã‚¢' },
{ key: 'ãã®ä»–',label: 'ãã®ä»–',dotClass: 'dot-other', match: c => worldRegion(c) === 'ãã®ä»–' }
];

function showPersonModal(item){
const backdrop = document.getElementById('modal-backdrop');
document.getElementById('modal-name').textContent = item.name;
document.getElementById('modal-reading').textContent = item.reading || '';
const meta = document.getElementById('modal-meta');
const years = (item.birth || '?') + ' â€“ ' + (item.death || '?');
meta.innerHTML = '<span>'+(item.country||'')+'</span><span>'+(item.era||'')+'</span><span>'+years+'</span>'+(item.role?'<span>'+item.role+'</span>':'');
document.getElementById('modal-summary').textContent = item.summary || '';
const eventsBox = document.getElementById('modal-events');
eventsBox.innerHTML = (item.events||[]).map(e => '<span>'+e+'</span>').join('');
document.getElementById('modal-link').href = item.url;
backdrop.classList.add('visible');
}

function hidePersonModal(){
document.getElementById('modal-backdrop').classList.remove('visible');
}

function renderTimeline(items, eventYear){
const tl = document.getElementById('timeline');
if(!tl) return;
tl.innerHTML = '';

const plotted = items
.map(({item}) => ({item, year: parseYear(item.birth)}))
.filter(x => x.year !== null);

if(plotted.length === 0){
tl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-sub)">è¡¨ç¤ºã§ãã‚‹ãƒ‡ãƒ¼ã‚¿ãŒã‚ã‚Šã¾ã›ã‚“ã€‚</div>';
return;
}

let minYear = Math.min(...plotted.map(x => x.year));
let maxYear = Math.max(...plotted.map(x => x.year));
minYear = Math.floor(minYear / 100) * 100 - 50;
maxYear = Math.ceil(maxYear / 100) * 100 + 50;
if(maxYear - minYear < 600) maxYear = minYear + 600;

const pxPerYear = 1.2;
const totalSpanYears = maxYear - minYear;
const innerWidth = 80 + totalSpanYears * pxPerYear;

const legend = document.createElement('div');
legend.className = 'timeline-legend';
legend.innerHTML =
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#9C2D2D"></span>æ—¥æœ¬</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#BA7517"></span>ä¸­å›½</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#185FA5"></span>è¥¿æ¬§</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#1592C9"></span>åŒ—æ¬§</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#993556"></span>æ±æ¬§</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#3B6D11"></span>ã‚¢ã‚¸ã‚¢</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#5F5E5A"></span>ãã®ä»–</span>' +
'<span style="margin-left:auto;font-size:11px">' + plotted.length + 'åï¼ã‚¯ãƒªãƒƒã‚¯ã§äººç‰©ç´¹ä»‹</span>';
tl.appendChild(legend);

const inner = document.createElement('div');
inner.className = 'timeline-inner';
inner.style.width = innerWidth + 'px';

// äº‹ä»¶å¹´ãŒã‚ã‚Œã°ç¸¦å¸¯ã‚’è¡¨ç¤ºï¼ˆå‰å¾Œ50å¹´ï¼‰
if(eventYear !== null && eventYear !== undefined){
const band = document.createElement('div');
band.className = 'timeline-event-band';
const left = 80 + (eventYear - 50 - minYear) * pxPerYear;
const width = 100 * pxPerYear;
band.style.left = left + 'px';
band.style.width = width + 'px';
inner.appendChild(band);
}

// è©²å½“ã‚¿ã‚°ã®äººç‰©ã‚»ãƒƒãƒˆï¼ˆãƒã‚¤ãƒ©ã‚¤ãƒˆç”¨ï¼‰
const taggedSet = new Set();
if(currentQuery){
for(const v of DATA){
if(matchScore(v, currentQuery) > 0){
taggedSet.add(v.id);
}
}
}

for(const row of TIMELINE_ROWS){
const rowItems = plotted.filter(x => row.match(x.item.country || ''));
if(rowItems.length === 0) continue; // ç©ºã®è¡Œã¯çœç•¥
const rowEl = document.createElement('div');
rowEl.className = 'timeline-row';
const labelEl = document.createElement('span');
labelEl.className = 'timeline-row-label';
labelEl.textContent = row.label + ' (' + rowItems.length + ')';
rowEl.appendChild(labelEl);

for(const {item, year} of rowItems){
const xPx = 80 + (year - minYear) * pxPerYear;
const dot = document.createElement('span');
const isTagged = taggedSet.has(item.id);
const isFiltered = currentQuery && !isTagged;
dot.className = 'timeline-dot ' + row.dotClass;
if(isTagged && currentQuery) dot.className += ' highlight';
if(isFiltered) dot.className += ' dim';
dot.style.left = xPx + 'px';
dot.dataset.itemId = item.id;
const yearLabel = year < 0 ? 'å‰' + Math.abs(year) : year + '';
const tip = document.createElement('span');
tip.className = 'timeline-tooltip';
tip.textContent = item.name + ' ('+ yearLabel +')';
dot.appendChild(tip);
dot.addEventListener('click', () => showPersonModal(item));
rowEl.appendChild(dot);
}
inner.appendChild(rowEl);
}

const axis = document.createElement('div');
axis.className = 'timeline-axis';
for(let y = Math.ceil(minYear / 100) * 100; y <= maxYear; y += 100){
const xPx = 80 + (y - minYear) * pxPerYear;
const m = document.createElement('span');
m.className = 'timeline-year';
m.style.left = xPx + 'px';
m.textContent = y < 0 ? 'å‰' + Math.abs(y) : y + '';
axis.appendChild(m);
}
inner.appendChild(axis);

tl.appendChild(inner);
}

function render(){
const cards = document.getElementById('cards');
const summary = document.getElementById('summary');
const empty = document.getElementById('empty');
const worldEmpty = document.getElementById('world-empty');
const timeline = document.getElementById('timeline');
cards.innerHTML = '';
renderEventInfo();
applyRegionUI();

// ã‚¿ã‚¤ãƒ ãƒ©ã‚¤ãƒ³ãƒ¢ãƒ¼ãƒ‰ã®å ´åˆ
if(viewMode === 'timeline'){
cards.style.display = 'none';
empty.style.display = 'none';
worldEmpty.style.display = 'none';

// Dº‹ä»¶ã‚¿ã‚°ãŒé¸ã°ã‚Œã¦ã„ã‚‹ã¨ãã¯ã€ãã®ä¸–ç´€ï¼ˆå‰å¾Œ50å¹´ï¼‰ã®äººç‰©ã‚’å…¨å“¡è¡¨ç¤º
let eventYear = null;
let eventTagItems;
if(currentQuery && EVENTS[currentQuery]){
const evYearStr = EVENTS[currentQuery].year;
eventYear = parseYear(evYearStr);
}

let baseItems;
if(eventYear !== null){
// åŒæ™‚ä»£ãƒ¢ãƒ¼ãƒ‰ï¼šäº‹ä»¶å¹´Â±50å¹´ã«ç”ŸããŸäººç‰©ã‚’å…¨å“¡è¡¨ç¤º
baseItems = DATA
.filter(v => regionMatch(v))
.filter(v => worldRegionMatch(v))
.filter(v => {
const by = parseYear(v.birth);
const dy = parseYear(v.death);
if(by === null) return false;
// ç”Ÿæ²¡å¹´ã¨äº‹ä»¶å¹´(Â±50å¹´ç¯„å›²)ãŒé‡ãªã‚‹ã‹ã©ã†ã‹
const liveStart = by;
const liveEnd = (dy !== null) ? dy : (by + 80);
return liveEnd >= eventYear - 50 && liveStart <= eventYear + 50;
})
.map(item => ({item, score: 1}));
} else {
baseItems = DATA.map(item => ({item, score: matchScore(item, currentQuery)}))
.filter(x => x.score > 0)
.filter(x => regionMatch(x.item))
.filter(x => worldRegionMatch(x.item))
.filter(x => majorEraMatch(x.item));
}

if(baseItems.length === 0){
timeline.classList.remove('visible');
summary.textContent = '';
if(currentRegion === 'ä¸–ç•Œ'){
worldEmpty.style.display = 'block';
} else {
empty.style.display = 'block';
}
return;
}

timeline.classList.add('visible');
let regionLabel = currentRegion === 'æ—¥æœ¬' ? 'ã€æ—¥æœ¬å²ã€‘' : currentRegion === 'ä¸–ç•Œ' ? 'ã€ä¸–ç•Œå²ã€‘' : '';
if(eventYear !== null){
summary.textContent = regionLabel + 'åŒæ™‚ä»£ã‚¿ã‚¤ãƒ ãƒ©ã‚¤ãƒ³ï¼šã€Œ' + currentQuery + 'ã€(' +
(eventYear < 0 ? 'å‰' + Math.abs(eventYear) : eventYear) + 'å¹´) å‰å¾Œ50å¹´ã®äººç‰© ' + baseItems.length + 'å';
} else {
summary.textContent = regionLabel + 'åŒæ™‚ä»£ã‚¿ã‚¤ãƒ ãƒ©ã‚¤ãƒ³ï¼š' + baseItems.length + 'åï¼ˆç”Ÿå¹´ãŒåˆ¤æ˜Žã—ã¦ã„ã‚‹äººç‰©ã®ã¿ï¼‰';
}
renderTimeline(baseItems, eventYear);
return;
}

// ã‚«ãƒ¼ãƒ‰ãƒ¢ãƒ¼ãƒ‰
cards.style.display = '';
timeline.classList.remove('visible');
timeline.innerHTML = ''; // ã‚¯ãƒªã‚¢ï¼ˆé‡è¤‡é˜²æ­¢ï¼‰

let items = DATA.map(item => ({item, score: matchScore(item, currentQuery)}))
.filter(x => x.score > 0)
.filter(x => regionMatch(x.item))
.filter(x => worldRegionMatch(x.item))
.filter(x => majorEraMatch(x.item));

if(currentRegion === 'æ—¥æœ¬' && activeEra !== 'all'){
items = items.filter(x => eraGroup(x.item.era) === activeEra);
}

if(currentQuery){
items.sort((a,b)=>b.score - a.score);
} else {
items.sort((a,b)=>{
const ya = parseYear(a.item.birth);
const yb = parseYear(b.item.birth);
return (ya === null ? 99999 : ya) - (yb === null ? 99999 : yb);
});
}

if(items.length === 0 && currentRegion === 'ä¸–ç•Œ'){
summary.textContent = '';
empty.style.display = 'none';
worldEmpty.style.display = 'block';
return;
}
worldEmpty.style.display = 'none';

if(items.length === 0){
summary.textContent = '';
empty.style.display = 'block';
return;
}
empty.style.display = 'none';

let regionLabel = '';
if(currentRegion === 'æ—¥æœ¬') regionLabel = 'ã€æ—¥æœ¬å²ã€‘';
else if(currentRegion === 'ä¸–ç•Œ'){
if(activeWorldRegion !== 'all') regionLabel = 'ã€ä¸–ç•Œå²ãƒ»'+activeWorldRegion+'ã€‘';
else regionLabel = 'ã€ä¸–ç•Œå²ã€‘';
} else if(activeMajorEra !== 'all'){
regionLabel = 'ã€'+activeMajorEra+'ã€‘';
}

if(currentQuery){
summary.textContent = regionLabel + 'ã€Œ'+currentQuery+'ã€ã®æ¤œç´¢çµæžœï¼š'+items.length+'äºº';
} else if(currentRegion === 'æ—¥æœ¬' && activeEra !== 'all'){
summary.textContent = regionLabel + activeEra+'æ™‚ä»£ï¼š'+items.length+'äºº';
} else {
summary.textContent = regionLabel + 'åŽéŒ² '+items.length+'äººï¼ˆç”Ÿæ²¡å¹´é †ï¼‰';
}

for(const {item} of items){
const a = document.createElement('a');
a.className = 'card ' + eraColorClass(item.era, item.country);
a.href = item.url;
a.target = '_blank';
a.rel = 'noopener';

const years = (item.birth || '?') + 'â€“' + (item.death || '?');
const eventsHtml = (item.events||[]).slice(0,4)
.map(e => '<span class="event-tag">'+highlight(e, currentQuery)+'</span>').join('');
const showCountry = (currentRegion === 'all' && item.country && item.country !== 'æ—¥æœ¬');
const countryHtml = showCountry ? '<span class="country-tag">'+item.country+'</span>' : '';

a.innerHTML =
'<h3 class="name">'+highlight(item.name, currentQuery)+'</h3>' +
'<p class="reading">'+(item.reading||'')+'</p>' +
'<div class="era-bar">' +
'<span class="era-tag">'+(item.era||'')+'</span>' +
countryHtml +
'<span class="years">'+years+'</span>' +
'</div>' +
'<p class="summary">'+highlight(item.summary||'', currentQuery)+'</p>' +
'<div class="events">'+eventsHtml+'</div>' +
'<span class="play">è§£èª¬å‹•ç”»ã§è©³ã—ãå­¦ã¶</span>';
cards.appendChild(a);
}
}

// data.json の全 events を地域別にグループ化してドロップダウンを構築する
function buildEventDropdown(){
const container = document.getElementById('event-dropdowns');
if(!container) return;

// 各事件に地域を割り当て（初出アイテムの国で決定）
const eventRegionMap = new Map();
for(const item of DATA){
const region = (!item.country || item.country === '日本')
? '日本史'
: (worldRegion(item.country) || 'その他');
for(const ev of (item.events||[])){
if(!eventRegionMap.has(ev)) eventRegionMap.set(ev, region);
}
}

// グループ順序
const groupOrder = ['日本史','西欧','北欧','東欧・ロシア','中国','アジア','その他'];
const groups = {};
for(const g of groupOrder) groups[g] = [];

for(const [ev, region] of eventRegionMap){
if(groups[region]) groups[region].push(ev);
else groups['その他'].push(ev);
}

// グループごとに別々の select を生成
container.innerHTML = '';
for(const g of groupOrder){
const evs = groups[g].sort();
if(evs.length === 0) continue;
const sel = document.createElement('select');
sel.className = 'event-group-select';
sel.dataset.group = g;
const ph = document.createElement('option');
ph.value = '';
ph.textContent = '— ' + g + ' —';
sel.appendChild(ph);
for(const ev of evs){
const opt = document.createElement('option');
opt.value = ev;
opt.textContent = ev;
sel.appendChild(opt);
}
sel.addEventListener('change', () => {
const val = sel.value;
if(val){ setQueryAndRefresh(val); sel.value = ''; }
});
container.appendChild(sel);
}
}
function bindEvents(){
const input = document.getElementById('q');
const clearBtn = document.getElementById('clear');

input.addEventListener('input', e => {
currentQuery = e.target.value.trim();
clearBtn.classList.toggle('visible', currentQuery.length > 0);
document.querySelectorAll('.chip').forEach(c => {
c.classList.toggle('active', c.dataset.q === currentQuery);
});
render();
});

clearBtn.addEventListener('click', () => {
input.value = '';
currentQuery = '';
clearBtn.classList.remove('visible');
document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
render();
input.focus();
});

document.querySelectorAll('.chip').forEach(c => {
c.addEventListener('click', () => {
const q = c.dataset.q;
if(currentQuery === q){
input.value = '';
currentQuery = '';
clearBtn.classList.remove('visible');
} else {
input.value = q;
currentQuery = q;
clearBtn.classList.add('visible');
}
document.querySelectorAll('.chip').forEach(x => {
x.classList.toggle('active', x.dataset.q === currentQuery);
});
render();
});
});

// å¤§åŒºåˆ†ã‚¿ãƒ–ï¼ˆã™ã¹ã¦ãƒ¢ãƒ¼ãƒ‰ç”¨ï¼‰
document.querySelectorAll('#all-tabs .tab').forEach(t => {
t.addEventListener('click', () => {
document.querySelectorAll('#all-tabs .tab').forEach(x => x.classList.remove('active'));
t.classList.add('active');
activeMajorEra = t.dataset.majorEra;
render();
});
});

document.querySelectorAll('#era-tabs .tab').forEach(t => {
t.addEventListener('click', () => {
document.querySelectorAll('#era-tabs .tab').forEach(x => x.classList.remove('active'));
t.classList.add('active');
activeEra = t.dataset.era;
render();
});
});

document.querySelectorAll('#region-tabs .tab').forEach(t => {
t.addEventListener('click', () => {
document.querySelectorAll('#region-tabs .tab').forEach(x => x.classList.remove('active'));
t.classList.add('active');
activeWorldRegion = t.dataset.worldRegion;
render();
});
});

document.querySelectorAll('.region-btn').forEach(b => {
b.addEventListener('click', () => {
currentRegion = b.dataset.region;
try{ localStorage.setItem('khRegion', currentRegion); } catch(e){}
activeEra = 'all';
activeWorldRegion = 'all';
activeMajorEra = 'all';
document.querySelectorAll('#all-tabs .tab').forEach(x => {
x.classList.toggle('active', x.dataset.majorEra === 'all');
});
document.querySelectorAll('#era-tabs .tab').forEach(x => {
x.classList.toggle('active', x.dataset.era === 'all');
});
document.querySelectorAll('#region-tabs .tab').forEach(x => {
x.classList.toggle('active', x.dataset.worldRegion === 'all');
});
render();
});
});

document.querySelectorAll('.view-btn').forEach(b => {
b.addEventListener('click', () => {
viewMode = b.dataset.view;
render();
});
});

// ãƒ¢ãƒ¼ãƒ€ãƒ«é–‰ã˜ã‚‹
document.getElementById('modal-close').addEventListener('click', hidePersonModal);
document.getElementById('modal-cancel').addEventListener('click', hidePersonModal);
document.getElementById('modal-backdrop').addEventListener('click', e => {
if(e.target.id === 'modal-backdrop') hidePersonModal();
});
document.addEventListener('keydown', e => {
if(e.key === 'Escape') hidePersonModal();
});
}

async function init(){
try{
const cacheBust = '?v=' + Date.now();
const [resData, resEvents] = await Promise.all([
fetch('data.json' + cacheBust),
fetch('events.json' + cacheBust)
]);
DATA = await resData.json();
EVENTS = await resEvents.json();
// ãƒ•ãƒƒã‚¿ãƒ¼ã®åŽéŒ²æ•°ã‚’å‹•çš„ã«æ›´æ–°
const jpCount = DATA.filter(p => p.country === 'æ—¥æœ¬').length;
const worldCount = DATA.filter(p => p.country && p.country !== 'æ—¥æœ¬').length;
const footerCountEl = document.getElementById('footer-count');
if (footerCountEl) {
footerCountEl.textContent = 'åŽéŒ²ï¼šäººç‰©' + DATA.length + 'åï¼ˆæ—¥æœ¬å²' + jpCount + 'ãƒ»ä¸–ç•Œå²' + worldCount + 'ï¼‰ï¼äº‹ä»¶è§£èª¬' + Object.keys(EVENTS).length + 'ä»¶ï¼ˆè©¦ä½œç‰ˆï¼‰';
}
bindEvents();
buildEventDropdown();
render();
}catch(err){
document.getElementById('cards').innerHTML =
'<p style="grid-column:1/-1;color:#9C2D2D">ãƒ‡ãƒ¼ã‚¿ã®èª­ã¿è¾¼ã¿ã«å¤±æ•—ã—ã¾ã—ãŸã€‚<br>ã€Œãƒ­ãƒ¼ã‚«ãƒ«ã‚µãƒ¼ãƒã€çµŒç”±ã§ã‚¢ã‚¯ã‚»ã‚¹ã—ã¦ãã ã•ã„ã€‚<br>ä¾‹: <code>python -m http.server</code></p>';
console.error(err);
}
}

init();
