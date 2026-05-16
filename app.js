// ==========================================================================
// きさきヒストリア — 検索ロジック + タイムライン
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
return (r === '日本' || r === '世界' || r === 'all') ? r : 'all';
} catch(e){ return 'all'; }
})();

function eraGroup(era){
if(!era) return '';
if(era.includes('飛鳥')) return '飛鳥';
if(era.includes('奈良')) return '奈良';
if(era.includes('平安')) return '平安';
if(era.includes('鎌倉')) return '鎌倉';
if(era.includes('室町')) return '室町';
if(era.includes('戦国')||era.includes('安土桃山')) return '戦国';
if(era.includes('江戸')) return '江戸';
return era;
}

// 国名から世界史の地域グループを判定
function worldRegion(country){
if(!country || country === '日本') return null;
if(country === '中国') return '中国';
// 北欧
const nordic = ['スウェーデン','デンマーク','ノルウェー','フィンランド','アイスランド'];
for(const n of nordic){
if(country.includes(n)) return '北欧';
}
// 東欧・ロシア
const eastEu = ['ロシア','ポーランド','チェコ','ボヘミア','ハンガリー','ウクライナ','ルーマニア','ブルガリア'];
for(const e of eastEu){
if(country.includes(e)) return '東欧・ロシア';
}
// 西欧
const western = ['フランス','イングランド','スコットランド','イタリア','スペイン',
'神聖ローマ','ハプスブルク','オーストリア','エルサレム','ナバラ','ナポリ',
'イギリス','ポルトガル','ベルギー','ネーデルラント','オランダ','プロイセン','ドイツ'];
for(const w of western){
if(country.includes(w)) return '西欧';
}
// アジア
const asia = ['オスマン','インド','ムガル','モンゴル','ペルシア','韓国','朝鮮',
'ベトナム','タイ','インドネシア','セレウコス','イラン','トルコ'];
for(const a of asia){
if(country.includes(a)) return 'アジア';
}
return 'その他'; // ローマ帝国・東ローマ帝国など
}

// 生年から大区分（古代/中世/近世/近代）を判定
function majorEraOf(birthRaw){
const y = parseYear(birthRaw);
if(y === null) return '';
if(y < 1100) return '古代';
if(y < 1500) return '中世';
if(y < 1800) return '近世';
return '近代';
}

function eraColorClass(era, country){
if(country === '中国') return 'era-china';
const wr = worldRegion(country);
if(wr === '北欧') return 'era-nordic';
if(wr === '東欧・ロシア') return 'era-east';
if(wr === 'アジア') return 'era-asia';
if(country && country !== '日本') return 'era-world';
return 'era-' + ({
'飛鳥':'asuka','奈良':'nara','平安':'heian',
'鎌倉':'kamakura','室町':'muromachi','戦国':'sengoku','江戸':'edo'
}[eraGroup(era)] || 'heian');
}

function regionMatch(item){
if(currentRegion === 'all') return true;
const c = item.country || '';
if(currentRegion === '日本') return c === '日本';
if(currentRegion === '世界') return c && c !== '日本';
return true;
}

function worldRegionMatch(item){
if(currentRegion !== '世界') return true;
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
const bcMatch = str.match(/前(\d+)/);
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
'<span class="ei-meta">'+(ev.year||'')+' ／ '+(ev.era||'')+'</span>' +
'</div>' +
'<p class="ei-summary">'+(ev.summary||'')+'</p>' +
(seeAlsoHtml ? '<div class="ei-related"><span class="label">関連：</span>'+seeAlsoHtml+'</div>' : '');
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
if(jpChips) jpChips.style.display = (currentRegion === '世界') ? 'none' : '';
if(worldChips) worldChips.style.display = (currentRegion === '日本') ? 'none' : '';

// タブ切替（3モード）
const allTabs = document.getElementById('all-tabs');
const eraTabs = document.getElementById('era-tabs');
const regionTabs = document.getElementById('region-tabs');
if(currentRegion === 'all'){
if(allTabs) allTabs.style.display = '';
if(eraTabs) eraTabs.style.display = 'none';
if(regionTabs) regionTabs.style.display = 'none';
} else if(currentRegion === '世界'){
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
{ key: '日本', label: '日本', dotClass: 'dot-jp', match: c => c === '日本' },
{ key: '中国', label: '中国', dotClass: 'dot-china', match: c => c === '中国' },
{ key: '西欧', label: '西欧', dotClass: 'dot-west', match: c => worldRegion(c) === '西欧' },
{ key: '北欧', label: '北欧', dotClass: 'dot-nordic', match: c => worldRegion(c) === '北欧' },
{ key: '東欧・ロシア', label: '東欧', dotClass: 'dot-east', match: c => worldRegion(c) === '東欧・ロシア' },
{ key: 'アジア',label: 'アジア',dotClass: 'dot-asia', match: c => worldRegion(c) === 'アジア' },
{ key: 'その他',label: 'その他',dotClass: 'dot-other', match: c => worldRegion(c) === 'その他' }
];

function showPersonModal(item){
const backdrop = document.getElementById('modal-backdrop');
document.getElementById('modal-name').textContent = item.name;
document.getElementById('modal-reading').textContent = item.reading || '';
const meta = document.getElementById('modal-meta');
const years = (item.birth || '?') + ' – ' + (item.death || '?');
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
tl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-sub)">表示できるデータがありません。</div>';
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
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#9C2D2D"></span>日本</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#BA7517"></span>中国</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#185FA5"></span>西欧</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#1592C9"></span>北欧</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#993556"></span>東欧</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#3B6D11"></span>アジア</span>' +
'<span class="timeline-legend-item"><span class="timeline-legend-dot" style="background:#5F5E5A"></span>その他</span>' +
'<span style="margin-left:auto;font-size:11px">' + plotted.length + '名／クリックで人物紹介</span>';
tl.appendChild(legend);

const inner = document.createElement('div');
inner.className = 'timeline-inner';
inner.style.width = innerWidth + 'px';

// 事件年があれば縦帯を表示（前後50年）
if(eventYear !== null && eventYear !== undefined){
const band = document.createElement('div');
band.className = 'timeline-event-band';
const left = 80 + (eventYear - 50 - minYear) * pxPerYear;
const width = 100 * pxPerYear;
band.style.left = left + 'px';
band.style.width = width + 'px';
inner.appendChild(band);
}

// 該当タグの人物セット（ハイライト用）
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
if(rowItems.length === 0) continue; // 空の行は省略
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
const yearLabel = year < 0 ? '前' + Math.abs(year) : year + '';
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
m.textContent = y < 0 ? '前' + Math.abs(y) : y + '';
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

// タイムラインモードの場合
if(viewMode === 'timeline'){
cards.style.display = 'none';
empty.style.display = 'none';
worldEmpty.style.display = 'none';

// D��件タグが選ばれているときは、その世紀（前後50年）の人物を全員表示
let eventYear = null;
let eventTagItems;
if(currentQuery && EVENTS[currentQuery]){
const evYearStr = EVENTS[currentQuery].year;
eventYear = parseYear(evYearStr);
}

let baseItems;
if(eventYear !== null){
// 同時代モード：事件年±50年に生きた人物を全員表示
baseItems = DATA
.filter(v => regionMatch(v))
.filter(v => worldRegionMatch(v))
.filter(v => {
const by = parseYear(v.birth);
const dy = parseYear(v.death);
if(by === null) return false;
// 生没年と事件年(±50年範囲)が重なるかどうか
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
if(currentRegion === '世界'){
worldEmpty.style.display = 'block';
} else {
empty.style.display = 'block';
}
return;
}

timeline.classList.add('visible');
let regionLabel = currentRegion === '日本' ? '【日本史】' : currentRegion === '世界' ? '【世界史】' : '';
if(eventYear !== null){
summary.textContent = regionLabel + '同時代タイムライン：「' + currentQuery + '」(' +
(eventYear < 0 ? '前' + Math.abs(eventYear) : eventYear) + '年) 前後50年の人物 ' + baseItems.length + '名';
} else {
summary.textContent = regionLabel + '同時代タイムライン：' + baseItems.length + '名（生年が判明している人物のみ）';
}
renderTimeline(baseItems, eventYear);
return;
}

// カードモード
cards.style.display = '';
timeline.classList.remove('visible');
timeline.innerHTML = ''; // クリア（重複防止）

let items = DATA.map(item => ({item, score: matchScore(item, currentQuery)}))
.filter(x => x.score > 0)
.filter(x => regionMatch(x.item))
.filter(x => worldRegionMatch(x.item))
.filter(x => majorEraMatch(x.item));

if(currentRegion === '日本' && activeEra !== 'all'){
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

if(items.length === 0 && currentRegion === '世界'){
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
if(currentRegion === '日本') regionLabel = '【日本史】';
else if(currentRegion === '世界'){
if(activeWorldRegion !== 'all') regionLabel = '【世界史・'+activeWorldRegion+'】';
else regionLabel = '【世界史】';
} else if(activeMajorEra !== 'all'){
regionLabel = '【'+activeMajorEra+'】';
}

if(currentQuery){
summary.textContent = regionLabel + '「'+currentQuery+'」の検索結果：'+items.length+'人';
} else if(currentRegion === '日本' && activeEra !== 'all'){
summary.textContent = regionLabel + activeEra+'時代：'+items.length+'人';
} else {
summary.textContent = regionLabel + '収録 '+items.length+'人（生没年順）';
}

for(const {item} of items){
const a = document.createElement('a');
a.className = 'card ' + eraColorClass(item.era, item.country);
a.href = item.url;
a.target = '_blank';
a.rel = 'noopener';

const years = (item.birth || '?') + '–' + (item.death || '?');
const eventsHtml = (item.events||[]).slice(0,4)
.map(e => '<span class="event-tag">'+highlight(e, currentQuery)+'</span>').join('');
const showCountry = (currentRegion === 'all' && item.country && item.country !== '日本');
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
'<span class="play">解説動画で詳しく学ぶ</span>';
cards.appendChild(a);
}
}

// data.json の全 events を地域別にグループ化してドロップダウンを構築する
function buildEventDropdown(){
const select = document.getElementById('event-select');
if(!select) return;

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

// ドロップダウンを構築
select.innerHTML = '<option value="">— すべての事件から探す —</option>';
for(const g of groupOrder){
const evs = groups[g].sort();
if(evs.length === 0) continue;
const og = document.createElement('optgroup');
og.label = g;
for(const ev of evs){
const opt = document.createElement('option');
opt.value = ev;
opt.textContent = ev;
og.appendChild(opt);
}
select.appendChild(og);
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

// 大区分タブ（すべてモード用）
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

// 事件ドロップダウン
const eventSelect = document.getElementById('event-select');
if(eventSelect){
eventSelect.addEventListener('change', () => {
const val = eventSelect.value;
if(val){ setQueryAndRefresh(val); eventSelect.value = ''; }
});
}

// モーダル閉じる
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
// フッターの収録数を動的に更新
const jpCount = DATA.filter(p => p.country === '日本').length;
const worldCount = DATA.filter(p => p.country && p.country !== '日本').length;
const footerCountEl = document.getElementById('footer-count');
if (footerCountEl) {
footerCountEl.textContent = '収録：人物' + DATA.length + '名（日本史' + jpCount + '・世界史' + worldCount + '）／事件解説' + Object.keys(EVENTS).length + '件（試作版）';
}
bindEvents();
buildEventDropdown();
render();
}catch(err){
document.getElementById('cards').innerHTML =
'<p style="grid-column:1/-1;color:#9C2D2D">データの読み込みに失敗しました。<br>「ローカルサーバ」経由でアクセスしてください。<br>例: <code>python -m http.server</code></p>';
console.error(err);
}
}

init();
