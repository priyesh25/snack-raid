// Snack Raid: menus and overlays, built as plain HTML over the canvas.
import { LEVELS, SNACKS, GADGETS, RANKS, PAJAMAS, TYPE_COLOR, STASH_HINT, VERSION, gadgetCharges } from './data.js';
import { save, persist, resetSave, rank, gadgetSlots, carrySlots, levelInfo, totalStars, unlocked, lockReason, claimDaily,
  ownGadget, giveGadget, buyGadget, upgradeCost, upgradeGadget, toggleLoadout } from './save.js';
import { redeem, CHEATS } from './codes.js';
import { spriteUrl } from './gfx.js';
import { play } from './audio.js';

const root = () => document.getElementById('ui');
const img = (name, cls = '') => `<img class="${cls}" src="${spriteUrl(name)}" alt="">`;
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const num = n => Number(n).toLocaleString('en-US');
const pjSprite = () => (PAJAMAS.find(p => p.id === save.pajama) || PAJAMAS[0]).sprite;
let cb = {}, current = null, lastMsg = null;

function wallet() {
  return `<span class="chip">${img('ui_coin')}${num(save.coins)}</span><span class="chip">${img('ui_wrapper')}${save.wrappers}</span>` +
    `<span class="chip">${img('ui_card')}${save.cards}</span>`;
}
function stars3(st, cls = 'stars') { return `<div class="${cls}">${st.map(s => img(s ? 'ui_star' : 'ui_star_off')).join('')}</div>`; }
function back(to = 'hub') { return `<button class="btn ghost small" data-act="go" data-arg="${to}">Back</button>`; }

// ------------------------------------------------------------ screens
const SCREENS = {
  title: () => `<div class="titlebg"></div><div class="titlebox">
      <button class="btn big green" data-act="go" data-arg="hub">PLAY</button>
      <button class="btn ghost small" data-act="fs">Full screen</button></div>
      <div class="titlenote muted small">v${VERSION} &middot; plays offline &middot; no ads, no purchases</div>`,

  hub: () => {
    const r = rank(), cur = RANKS[r - 1], nxt = RANKS[r];
    const pct = nxt ? Math.round(100 * (save.crumbs - cur.need) / (nxt.need - cur.need)) : 100;
    return `<div class="screen">
      <div class="bar"><h2>My bedroom</h2>${wallet()}</div>
      <div class="hub">
        <div class="me"><div class="pair">${img(pjSprite(), 'kid')}${img('biscuit_sleep', 'dog')}</div>
          <div class="rank"><b>Rank ${r}: ${cur.title}</b><div class="meter"><i style="width:${pct}%"></i></div>
          <div class="muted small">${nxt ? 'Next: ' + nxt.reward : 'Top rank!'}</div></div></div>
        <div class="things">
          <button class="thing play" data-act="go" data-arg="map">${img('snack_cookie')}<div><b>START A RAID</b><br><span>Hop out of bed. ${totalStars()} of 27 stars</span></div></button>
          <button class="thing" data-act="go" data-arg="chest">${img('gad_socks')}<b>Toy Chest</b><span>Gadgets and upgrades</span></button>
          <button class="thing" data-act="go" data-arg="closet">${img('kid_star')}<b>Closet</b><span>Pajamas</span></button>
          <button class="thing" data-act="go" data-arg="codes">${img('ui_card')}<b>Secret Codes</b><span>Promos and cheats</span></button>
          <button class="thing" data-act="go" data-arg="streak">${img('ui_lunchbox')}<b>Snack Streak</b><span>Day ${save.streak % 7 || (save.streak ? 7 : 0)} of 7</span></button>
          <button class="thing" data-act="go" data-arg="help">${img('gad_goggles')}<b>How to play</b><span>Rules in 30 seconds</span></button>
          <button class="thing" data-act="go" data-arg="settings">${img('gad_clicker')}<b>Settings</b><span>Sound, controls</span></button>
        </div>
      </div></div>`;
  },

  map: () => `<div class="screen">
      <div class="bar">${back()}<h2>Home Sweet Home</h2><span class="chip">${img('ui_star')}${totalStars()} / 27</span>${wallet()}</div>
      <div class="nights">${LEVELS.map(l => {
        const info = levelInfo(l.n), open = unlocked(l.n);
        const cls = (l.type || '') + (open ? '' : ' locked');
        return `<button class="night ${cls}" data-act="brief" data-arg="${l.n}">
          ${info.wrapper ? img('ui_wrapper', 'wr') : ''}
          <span class="num">${l.type === 'boss' ? 'BOSS' : l.type === 'dream' ? 'DREAM' : 'Night ' + l.n}</span>
          <span class="nm">${esc(l.name)}</span>
          ${open ? img(l.craving ? 'snack_' + l.craving : 'ui_coin', 'sn') : img('ui_lock', 'sn')}
          ${open ? (l.type === 'dream' ? `<span class="lock">${info.cleared ? 'Play again' : 'Bonus night'}</span>` : stars3(info.stars)) : `<span class="lock">${lockReason(l.n)}</span>`}
        </button>`;
      }).join('')}</div>
      <div class="muted small" style="text-align:center">World 1 of 5. Grandma's House, The Sleepover, Camp Pinecone and The Grand Hotel come later.</div></div>`,

  brief: n => {
    const l = LEVELS[n - 1], info = levelInfo(n), slots = gadgetSlots();
    if (l.gift && !ownGadget(l.gift)) { giveGadget(l.gift); lastMsg = { title: 'New gadget!', icon: 'gad_' + l.gift, text: GADGETS[l.gift].name + ': ' + GADGETS[l.gift].desc }; }
    save.loadout = save.loadout.filter(id => ownGadget(id) && GADGETS[id].ready).slice(0, slots);
    const owned = Object.keys(GADGETS).filter(id => ownGadget(id) && GADGETS[id].ready);
    const home = Object.keys(l.home || {});
    const who = { dad: 'dad', mom: 'mom_asleep', baby: 'baby_asleep', mika: 'mika', biscuit: 'biscuit', dusty: 'dusty' };
    const want = l.craving ? [l.craving, ...l.extras] : [];
    return `<div class="screen center"><div class="panel pop wide">
      <h2 style="font-size:clamp(26px,5.5vh,46px)">${l.type === 'boss' ? 'Boss' : l.type === 'dream' ? 'Bonus' : 'Night ' + n}: ${esc(l.name)}</h2>
      <div class="muted">${esc(l.blurb)}</div>
      ${want.length ? `<div><b>Tonight's Craving List</b><div class="icons">${want.map((id, i) => `<figure class="${i ? '' : 'first'}">${img('snack_' + id)}${SNACKS[id].name}${i ? '' : ' (must)'}</figure>`).join('')}</div></div>` : ''}
      ${home.length ? `<div><b>Who is home</b><div class="icons who">${home.map(h => img(who[h])).join('')}</div></div>` : ''}
      ${l.stash ? `<div class="small ${info.wrapper ? 'muted' : 'note'}">${info.wrapper ? 'Golden Wrapper already found.' : 'Rumor: a Secret Stash is hidden ' + STASH_HINT[l.stash] + '.'}</div>` : ''}
      ${owned.length && l.type !== 'dream' ? `<div><b>Pick your gadgets</b> <span class="muted small">(${slots} slot${slots > 1 ? 's' : ''}, carry ${carrySlots()} snacks)</span>
        <div class="load">${owned.map(id => `<button class="gchip ${save.loadout.includes(id) ? 'on' : ''}" data-act="load" data-arg="${id}">${img('gad_' + id)}${GADGETS[id].name}</button>`).join('')}</div></div>` : ''}
      <div class="row" style="justify-content:center">${back('map')}<button class="btn big green" data-act="start" data-arg="${n}">SNEAK OUT</button></div>
    </div></div>`;
  },

  chest: () => {
    const shopOpen = levelInfo(4).stars[0] || save.unlockAll;
    return `<div class="screen">
      <div class="bar">${back()}<h2>Toy Chest</h2>${wallet()}</div>
      ${shopOpen ? '' : '<div class="note">The shop opens after Night 4. Until then, gadgets come as gifts.</div>'}
      <div class="list">
        <div class="item">${img('ui_card')}<b>Excuse Card</b><p>A free pass when a grown-up busts you. One per night. You hold ${save.cards}.</p>
          <div class="act"><span class="muted small">Hold up to 3 from the shop</span><button class="btn small" data-act="card" ${save.coins < 100 || save.cards >= 3 ? 'disabled' : ''}>Buy: 100</button></div></div>
        ${Object.entries(GADGETS).map(([id, g]) => {
          const lvl = save.gadgets[id] || 0, up = upgradeCost(id);
          let act;
          if (!g.ready) act = '<span class="muted small">Coming in a later version</span>';
          else if (!lvl) act = g.gift ? `<span class="muted small">Gift on Night ${g.gift}</span>` : `<span></span><button class="btn small" data-act="buy" data-arg="${id}" ${!shopOpen || save.coins < g.price ? 'disabled' : ''}>Buy: ${num(g.price)}</button>`;
          else act = `<span class="pips">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('')} <span class="muted small">Lv ${lvl}${g.uses ? ', ' + gadgetCharges(id, lvl) + ' uses' : ''}</span></span>` +
            (up != null ? `<button class="btn small green" data-act="up" data-arg="${id}" ${save.coins < up ? 'disabled' : ''}>Upgrade: ${num(up)}</button>` : '<span class="tag" style="background:var(--glow)">MAX</span>');
          return `<div class="item ${g.ready ? '' : 'off'}">${img('gad_' + id)}<b>${g.name} <span class="tag" style="background:${TYPE_COLOR[g.type]}">${g.type}</span></b><p>${esc(g.desc)}</p><div class="act">${act}</div></div>`;
        }).join('')}
      </div></div>`;
  },

  closet: () => `<div class="screen">
      <div class="bar">${back()}<h2>Closet</h2>${wallet()}</div>
      <div class="muted">Pajamas change your look only. Some sets come from promo codes.</div>
      <div class="pjs">${PAJAMAS.map(p => {
        const own = save.pajamas.includes(p.id), on = save.pajama === p.id;
        const act = on ? '<span class="tag" style="background:var(--green)">WEARING</span>' : own ? `<button class="btn small" data-act="wear" data-arg="${p.id}">Wear</button>` :
          p.promo ? '<span class="muted small">Promo code only</span>' : `<button class="btn small" data-act="buypj" data-arg="${p.id}" ${save.coins < p.price ? 'disabled' : ''}>Buy: ${num(p.price)}</button>`;
        return `<div class="pj ${on ? 'on' : ''}">${img(p.sprite)}<b>${p.name}</b>${act}</div>`;
      }).join('')}</div></div>`,

  codes: () => `<div class="screen center"><div class="panel pop">
      <h2 style="font-size:clamp(26px,5.5vh,44px)">Secret Codes</h2>
      <div class="muted">Got a promo code or a cheat code? Type it here.</div>
      <input class="code" id="code" maxlength="20" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="TYPE A CODE">
      <button class="btn green" data-act="redeem">Use code</button>
      <div id="codemsg" class="note"></div>
      ${save.cheatsFound.length ? `<b>Your cheats</b>${save.cheatsFound.map(id => `<button class="switch ${save.cheats[id] ? 'on' : ''}" data-act="cheat" data-arg="${id}"><div><b>${CHEATS[id][0]}</b><span>${CHEATS[id][1]}</span></div><em>${save.cheats[id] ? 'ON' : 'OFF'}</em></button>`).join('')}` : ''}
      <div class="muted small">${save.promos.length} promo code${save.promos.length === 1 ? '' : 's'} used${save.unlockAll ? ' &middot; all nights unlocked' : ''}</div>
      ${back()}</div></div>`,

  streak: () => {
    const prizes = ['50 coins', 'Excuse Card', 'Brown Bag', '100 coins', '75 coins', 'Lunchbox', 'Golden Wrapper'], done = save.streak % 7 || (save.streak ? 7 : 0);
    return `<div class="screen center"><div class="panel pop">
      <h2 style="font-size:clamp(26px,5.5vh,44px)">Snack Streak</h2>
      <div class="muted">Play on 7 different days. Miss a day and the streak just waits for you.</div>
      <div class="icons">${prizes.map((p, i) => `<figure style="opacity:${i < done ? 1 : 0.45}"><span class="chip" style="padding:6px 14px">${i < done ? '✓ ' : ''}Day ${i + 1}</span><span class="small">${p}</span></figure>`).join('')}</div>
      <div class="note">First raid of each day pays double coins.</div>${back()}</div></div>`;
  },

  help: () => `<div class="screen center"><div class="panel pop wide">
      <h2 style="font-size:clamp(26px,5.5vh,44px)">How to play</h2>
      <div class="keys">
        <b>Goal</b><span>Grab the Craving, take it to your bed, hop in and Sleep. Do it before 6:00.</span>
        <b>Move</b><span>Left thumb. Push a little to TIPTOE, halfway to WALK, all the way to RUN. Louder steps make bigger rings.</span>
        <b>Zs</b><span>A ring that touches a sleeper pops a Z. No Zs left and they wake up and come looking.</span>
        <b>Eyes</b><span>Stay out of the yellow cone of anyone awake. Light makes you easy to see. Tables and baskets hide you.</span>
        <b>Snore</b><span>Inside Dad's blue snore wave your noise is covered. Move on the snore.</span>
        <b>Button</b><span>The big green button does what it says: Grab, Open, Hide, Pet. On doors: tap is fast and loud, hold is slow and quiet.</span>
        <b>Greed</b><span>Hands hold 2 snacks. Stash them under your bed and go back for more if you dare.</span>
        <b>Keyboard</b><span>WASD or arrows to walk. Shift to tiptoe, Space to run. E for the button, Q for the small one, 1 2 3 for gadgets, M for the map.</span>
      </div>${back()}</div></div>`,

  settings: () => {
    const s = save.settings, sw = (k, name, sub) => `<button class="switch ${s[k] ? 'on' : ''}" data-act="set" data-arg="${k}"><div><b>${name}</b><span>${sub}</span></div><em>${s[k] ? 'ON' : 'OFF'}</em></button>`;
    return `<div class="screen center"><div class="panel pop">
      <h2 style="font-size:clamp(26px,5.5vh,44px)">Settings</h2>
      ${sw('sound', 'Sound effects', 'Creaks, snores and beeps')}${sw('music', 'Music', 'The sneaky tune')}
      ${sw('haptics', 'Vibration', 'Buzz on creaks and busts')}${sw('lefty', 'Left-handed mode', 'Swap the stick and the buttons')}
      <div class="row" style="justify-content:center">${back()}<button class="btn red small" data-act="reset">${current && current.confirmReset ? 'Tap again to erase everything' : 'Reset progress'}</button></div>
      <div class="muted small">Snack Raid v${VERSION}. Progress is saved on this device only. No accounts, no ads, no purchases.</div></div></div>`;
  },
};

// ------------------------------------------------------------ overlays during a night
const OVERLAYS = {
  pause: () => `<div class="screen center"><div class="panel pop">
      <h2 style="font-size:clamp(30px,7vh,56px)">Paused</h2>
      <button class="btn big green" data-act="resume">Keep sneaking</button>
      <div class="row" style="justify-content:center"><button class="btn" data-act="restart">Restart night</button><button class="btn ghost" data-act="quit">Back to bedroom</button></div>
      <div class="muted small">Tiptoe: push the stick a little. Hold the button on doors to open them quietly.</div></div></div>`,

  busted: d => {
    const who = { mom: 'Mom', dad: 'Dad', alarm: 'The 6:00 alarm' }[d.by] || 'Someone';
    const why = d.why === 'bed' ? 'Mom checked your bed. It was empty.' : d.why === 'alarm' ? 'The alarm rang and you were not in bed.' : who + ' saw you out of bed.';
    return `<div class="screen center"><div class="panel pop">
      <div class="stamp">BUSTED!</div>
      <div class="family">${d.by === 'dad' ? img('dad_awake') : d.by === 'alarm' ? '' : img('mom')}${img(pjSprite())}</div>
      <div>${why}</div>
      <div class="bubble">"${esc(d.excuse)}"</div>
      ${d.canExcuse && save.cards > 0 ? `<button class="btn big pink" data-act="excuse">Play an Excuse Card (${save.cards})</button><div class="muted small">Back to bed. You lose what is in your hands, and one hour.</div>` :
        d.canExcuse ? '<div class="muted small">No Excuse Cards left. Buy them in the Toy Chest.</div>' : ''}
      <div class="row" style="justify-content:center"><button class="btn green" data-act="retry">Try again</button><button class="btn ghost" data-act="giveup">Back to bedroom</button></div></div></div>`;
  },

  results: ({ res, out, level }) => {
    const l = level;
    let scene, fam = ['mom', 'dad_awake'];
    if (res.dream) scene = 'What a dream. Your pillow is a little bit chewed.';
    else if (!res.craving) scene = 'You went to bed hungry. Your tummy rumbles all through breakfast.';
    else if (res.framedDog) { scene = 'Biscuit has crumbs on his nose. Everyone looks at him.'; fam = ['mom', 'biscuit', 'dad_awake']; }
    else if (res.woke.includes('dad')) scene = 'Dad yawns into his coffee with huge eye bags.';
    else if (res.woke.includes('mom')) scene = 'Mom squints at you over her tea. She suspects something.';
    else if (res.ghost) scene = 'Mom stares at the empty spot in the fridge. Dad shrugs. You whistle.';
    else scene = 'Somebody slept badly. Nobody can prove a thing.';
    const lines = res.lines.map(([a, b]) => `<span>${esc(a)}</span><span>${num(b)}</span>`).join('') + res.style.map(([a, b]) => `<span class="sty">${esc(a)}</span><span>${num(b)}</span>`).join('');
    const nextN = l.n < LEVELS.length && unlocked(l.n + 1) ? l.n + 1 : 0;
    return `<div class="screen center"><div class="panel pop wide">
      <h2 style="font-size:clamp(26px,5.5vh,46px)">${res.dream ? 'Sweet dreams' : res.win ? 'The Morning After' : 'Hungry morning'}</h2>
      <div class="family">${fam.map(f => img(f)).join('')}${img(pjSprite())}</div>
      <div class="muted">${scene}</div>
      ${res.dream ? '' : stars3(res.stars, 'stars bigstars')}
      ${lines ? `<div class="tally">${lines}<span><b>Total points</b></span><span>${num(res.points)}</span></div>` : ''}
      <div class="row" style="justify-content:center"><span class="chip">${img('ui_coin')}+${num(out.coins)}</span>${res.wrapper ? `<span class="chip">${img('ui_wrapper')}Secret Stash</span>` : ''}<span class="chip">+${num(res.crumbs)} Crumbs</span></div>
      ${out.notes.map(n => `<div class="note">${esc(n)}</div>`).join('')}
      ${out.boxes.map(b => `<div class="note">${img('ui_lunchbox')} ${b.kind}: ${num(b.coins)} coins${b.cards ? ', ' + b.cards + ' Excuse Card' + (b.cards > 1 ? 's' : '') : ''}${b.wrappers ? ', ' + b.wrappers + ' Golden Wrappers' : ''}${b.pajama ? ', ' + b.pajama + ' pajamas' : ''}</div>`).join('')}
      ${out.rankUp ? `<div class="bubble">Rank up! Rank ${out.rankUp.rank}: ${out.rankUp.title}. ${out.rankUp.rewards.join(', ')}.</div>` : ''}
      <div class="row" style="justify-content:center">
        <button class="btn ghost" data-act="quit">Bedroom</button><button class="btn" data-act="restart">Play again</button>
        ${nextN ? `<button class="btn big green" data-act="brief" data-arg="${nextN}">Next night</button>` : ''}</div></div></div>`;
  },

  popup: d => `<div class="screen center"><div class="panel pop">
      <h2 style="font-size:clamp(26px,5.5vh,44px)">${esc(d.title)}</h2>${d.icon ? `<div class="icons">${img(d.icon)}</div>` : ''}
      <div>${esc(d.text)}</div><button class="btn big green" data-act="closepop">OK</button></div></div>`,
};

// ------------------------------------------------------------ plumbing
function render(html, cls) { const r = root(); r.innerHTML = html; r.className = 'on ' + cls; r.scrollTop = 0; }
export const UI = {
  init(callbacks) {
    cb = callbacks;
    root().addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el) return;
      play('click');
      this.act(el.dataset.act, el.dataset.arg);
    });
    root().addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'code') this.act('redeem'); });
  },
  show(name, arg) {
    current = { name, arg, confirmReset: current && current.name === name ? current.confirmReset : false };
    render(SCREENS[name](arg), name === 'title' ? '' : 'solid');
    if (name === 'hub') {
      const d = claimDaily();
      if (d) lastMsg = { title: 'Snack Streak: day ' + d.day, icon: 'ui_lunchbox', text: 'Today\'s gift: ' + d.text + '. Come back tomorrow for: ' + d.next + '.' };
    }
    if (lastMsg) { const m = lastMsg; lastMsg = null; this.popupOver(m); }
  },
  popupOver(m) { this.stack = current; render(OVERLAYS.popup(m), 'dim'); current = { name: 'popup' }; },
  overlay(name, data) { current = { name, data, overlay: true }; render(OVERLAYS[name](data), 'dim'); },
  hide() { current = null; const r = root(); r.className = ''; r.innerHTML = ''; },
  refresh() { if (current && !current.overlay && SCREENS[current.name]) render(SCREENS[current.name](current.arg), current.name === 'title' ? '' : 'solid'); },
  act(a, arg) {
    switch (a) {
      case 'go': this.show(arg); break;
      case 'fs': {
        const el = document.documentElement;
        try {
          if (document.fullscreenElement) document.exitFullscreen();
          else if (el.requestFullscreen) el.requestFullscreen().then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {});
        } catch (e) { /* full screen is not available here */ }
        break;
      }
      case 'brief': if (unlocked(+arg)) { if (cb.onLeaveNight) cb.onLeaveNight(); this.show('brief', +arg); } break;
      case 'load': toggleLoadout(arg); this.refresh(); break;
      case 'start': cb.onStart(+arg); break;
      case 'buy': if (buyGadget(arg)) { play('coin'); persist(); } this.refresh(); break;
      case 'up': if (upgradeGadget(arg)) play('star'); this.refresh(); break;
      case 'card': if (save.coins >= 100 && save.cards < 3) { save.coins -= 100; save.cards++; persist(); play('coin'); } this.refresh(); break;
      case 'wear': save.pajama = arg; persist(); this.refresh(); break;
      case 'buypj': { const p = PAJAMAS.find(q => q.id === arg); if (p && save.coins >= p.price) { save.coins -= p.price; save.pajamas.push(arg); save.pajama = arg; persist(); play('coin'); } this.refresh(); break; }
      case 'redeem': {
        const el = document.getElementById('code'), r = redeem(el.value);
        play(r.ok ? 'wrapper' : 'tax');
        this.refresh();
        const m = document.getElementById('codemsg');
        if (m) { m.textContent = (r.title ? r.title + ' ' : '') + r.msg; m.style.color = r.ok ? '' : 'var(--orange)'; }
        break;
      }
      case 'cheat': save.cheats[arg] = !save.cheats[arg]; persist(); this.refresh(); break;
      case 'set': save.settings[arg] = !save.settings[arg]; persist(); if (cb.onSettings) cb.onSettings(); this.refresh(); break;
      case 'reset': if (current.confirmReset) { resetSave(); current.confirmReset = false; this.show('title'); } else { current.confirmReset = true; this.refresh(); } break;
      case 'closepop': { const s = this.stack; this.stack = null; if (s && s.name && SCREENS[s.name]) this.show(s.name, s.arg); else this.hide(); break; }
      case 'resume': cb.onResume(); break;
      case 'restart': cb.onRestart(); break;
      case 'quit': cb.onQuit(); break;
      case 'excuse': cb.onExcuse(); break;
      case 'retry': cb.onRetry(); break;
      case 'giveup': cb.onGiveUp(); break;
    }
  },
};
