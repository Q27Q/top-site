const $ = (selector) => document.querySelector(selector);
const mobile = matchMedia('(max-width:760px)');
const sections = ['latest', 'official', 'members'];
function navigate() {
  const view = sections.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'latest';
  document.body.dataset.view = view;
  document.querySelectorAll('.main-nav a').forEach(a => {
    const active = a.hash === `#${view}`;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
  });
}
addEventListener('hashchange', navigate);
mobile.addEventListener('change', navigate);
navigate();
document.querySelectorAll('.main-nav a').forEach(a => a.addEventListener('click', () => {
  document.body.dataset.view = a.hash.slice(1);
}));

const icons = {
  weibo:'<ellipse cx="11" cy="15" rx="8" ry="5"/><ellipse cx="10" cy="15" rx="3" ry="2"/><path d="M5 11c-2-7 4-7 5-3 5-5 8-1 5 3M17 3c4 0 6 3 5 7M17 6c2 0 3 1 2 3"/>',
  douyin:'<path d="M14 3v13a4 4 0 1 1-4-4M14 3c1 4 3 6 7 6"/>',
  kuaishou:'<rect x="3" y="11" width="12" height="10" rx="3"/><circle cx="6" cy="6" r="3"/><circle cx="14" cy="5" r="3"/><path d="m15 14 6-3v10l-6-3"/>',
  bilibili:'<rect x="3" y="7" width="18" height="14" rx="4"/><path d="m7 3 3 4m7-4-3 4M8 12v3m8-3v3"/>'
};
function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className=className; if (text) node.textContent=text; return node; }
function safeUrl(value) { try { const url=new URL(value); return url.protocol==='https:' && !url.username && !url.password ? url.href : null; } catch { return null; } }
export function isPostUrl(value, platform) {
  const safe=safeUrl(value); if (!safe) return false;
  const {hostname:h,pathname:p}=new URL(safe);
  return ({
    weibo: /^(www\.|m\.)?weibo\.(com|cn)$/.test(h) && (/^\/\d+\/[A-Za-z0-9]+\/?$/.test(p)||/^\/detail\/\d+\/?$/.test(p)),
    douyin: /^(www\.)?douyin\.com$/.test(h) && /^\/(video|note)\/\d+\/?$/.test(p),
    kuaishou: /^(www\.)?kuaishou\.com$/.test(h) && /^\/short-video\/[A-Za-z0-9_-]+\/?$/.test(p),
    bilibili: /^(www\.)?bilibili\.com$/.test(h) && /^\/video\/(BV[A-Za-z0-9]+|av\d+)\/?$/.test(p) || platform==='bilibili' && h==='t.bilibili.com' && /^\/\d+\/?$/.test(p)
  })[platform] || false;
}
function externalLink(url, text, className) { const a=el('a',className,text); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; return a; }
function renderAccount(account, platforms) {
  const card=el('article','account-card'), identity=el('div','identity');
  if (account.avatar) { const img=el('img','avatar'); img.src=account.avatar; img.alt=''; img.width=51; img.height=51; identity.append(img); }
  else { const avatar=el('span','avatar initial',account.name.slice(0,1)); avatar.setAttribute('aria-hidden','true'); identity.append(avatar); }
  const info=el('div'); info.append(el('h3','',account.name),el('p','',account.type==='official'?'组合官方账号':'成员个人账号')); identity.append(info); card.append(identity);
  const links=el('div','account-links');
  Object.entries(account.links).forEach(([platform,url]) => {
    if (!safeUrl(url)||!platforms[platform]) return;
    const a=externalLink(url,'','platform-link'); a.setAttribute('aria-label',`${account.name} · ${platforms[platform]}主页（新窗口打开）`);
    const icon=el('span',`platform-icon ${platform}`); icon.setAttribute('aria-hidden','true'); icon.innerHTML=`<svg viewBox="0 0 24 24">${icons[platform]||''}</svg>`;
    a.append(icon,el('span','',platforms[platform])); links.append(a);
  });
  card.append(links); return card;
}
const formatTime = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)) : null;
function empty(title,description) { const box=el('div','empty-state'); const symbol=el('span','empty-symbol','✧'); symbol.setAttribute('aria-hidden','true'); box.append(symbol,el('h3','',title),el('p','',description),el('p','empty-caption','GOOD THINGS ARE ON THEIR WAY')); $('#feed').replaceChildren(box); }
async function readJson(path) { const response=await fetch(path,{cache:'no-cache'}); if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }
async function init() {
  let config;
  try { config=await readJson('data/accounts.json'); if (!Array.isArray(config.accounts)||!config.platforms) throw new Error('Invalid accounts'); }
  catch { empty('账号资料暂时未能加载','请刷新页面后重试。'); ['#official-accounts','#member-accounts'].forEach(id=>$(id).append(el('p','account-note','账号资料加载失败，请刷新重试。'))); $('#feed').setAttribute('aria-busy','false'); return; }
  const accounts=new Map(config.accounts.map(a=>[a.id,a]));
  config.accounts.forEach(account=>{ $(account.type==='official'?'#official-accounts':'#member-accounts').append(renderAccount(account,config.platforms)); const option=el('option','',account.name); option.value=account.id; $('#account-filter').append(option); });
  let data,failed=false;
  try { data=await readJson('data/updates.json'); if (!Array.isArray(data.items)) throw new Error('Invalid feed'); } catch { failed=true; data={items:[],checks:{}}; }
  const seen=new Set();
  const items=data.items.filter(item=>{ if (!accounts.has(item.accountId)||!isPostUrl(item.url,item.platform)||!accounts.get(item.accountId).links[item.platform]) return false; const key=`${item.platform}:${new URL(item.url).pathname.replace(/\/$/,'')}`; if(seen.has(key))return false;seen.add(key);return true; }).sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
  let platform='all',accountId='all',limit=10;
  function render() {
    const filtered=items.filter(item=>(platform==='all'||item.platform===platform)&&(accountId==='all'||item.accountId===accountId));
    $('#feed').replaceChildren(); $('#load-more').hidden=filtered.length<=limit;
    if (!filtered.length) { empty(failed?'动态暂时未能加载':items.length?'暂时没有符合筛选的动态':'最新物料正在收集中 ✨',failed?'请稍后刷新重试，仍可通过账号入口查看原平台。':items.length?'试试其他平台或发布账号吧。':'这里还没有收录动态，不代表账号没有更新。可以先到官方与成员主页看看。'); return; }
    filtered.slice(0,limit).forEach(item=>{const card=el('article','feed-card'); const header=el('header'); header.append(el('strong','',accounts.get(item.accountId).name),el('span','',config.platforms[item.platform]));card.append(header); const published=formatTime(item.publishedAt); if(published){const time=el('time','',`原帖发布于 ${published}（北京时间）`);time.dateTime=item.publishedAt;card.append(time);} card.append(el('h3','',item.text||'查看这条动态'),externalLink(item.url,'查看原帖 ↗','original-link'));$('#feed').append(card);});
  }
  document.querySelectorAll('[data-platform]').forEach(button=>button.addEventListener('click',()=>{platform=button.dataset.platform;limit=10;document.querySelectorAll('[data-platform]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
  $('#account-filter').addEventListener('change',event=>{accountId=event.target.value;limit=10;render();});
  $('#load-more').addEventListener('click',()=>{limit+=10;render();});
  const checks=el('details');checks.append(el('summary','','数据收录与检查状态'));
  Object.entries(config.platforms).forEach(([id,name])=>{const check=data.checks?.[id]; const success=formatTime(check?.lastSuccessAt),failure=formatTime(check?.lastFailureAt);checks.append(el('p','',`${name} · ${success?`最近成功检查：${success}`:'暂无成功检查记录'}${failure?`；最近检查失败：${failure}`:''}`));});
  checks.append(el('p','','检查时间与原帖发布时间分别记录，时间均为北京时间。'));
  if(!failed)$('#sync-status').append(checks);
  render();$('#feed').setAttribute('aria-busy','false');
}
init();
