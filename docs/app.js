import { profile, icons, cards, research, ctf, rubiya, team, honors, education } from './content.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const number = n => String(n + 1).padStart(2, '0');
const extraIcons = {
  mail: ['M3 5H21V19H3Z', 'M3 5L12 12L21 5'],
  person: ['M12 3A4 4 0 1 0 12 11A4 4 0 1 0 12 3Z', 'M4 22V20A8 8 0 0 1 20 20V22'],
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(icons[name] || extraIcons[name]).map(path => `<path d="${path}"/>`).join('')}</svg>`;
const tagList = tags => `<div class="tag-list">${tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div>`;
const page = $('.archive-page');
const box = $('.project-box');
const dialog = $('#portfolio-dialog');
const about = $('#about-scene');
const mobile = matchMedia('(max-width: 760px)');
let selectCard, disposeScene, opener, dialogKind;
let fallback = false, finishedLoading = false, pickerIndex = 0;

const state = {
  cards, about: false, contact: false, paused: false, hovered: null,
  canStart: false, projectIndex: 0, mobileSelected: mobile.matches ? 0 : null,
  onOpen: openCard,
  onHover(index) {
    state.hovered = index;
    const card = cards[index];
    $('.caption-number').textContent = card ? number(index) : '01 — 06';
    $('.caption-title').textContent = card ? card.label : 'Select a card to explore';
    $('.box-caption').classList.toggle('is-hive', card?.accent === 'rainbow');
    $('.box-caption').style.color = card?.accent === 'rainbow' ? 'var(--hive-caption-accent, #c4f568)' : card?.color || '#91a27b';
    document.documentElement.style.setProperty('--portfolio-native-cursor', `url(/cursor-${card?.accent === 'rainbow' ? 'lime' : card?.accent || 'lime'}.png) 7 6, auto`);
  },
  onHoverSound() {},
  onAboutSettled(visible) {
    about.setAttribute('aria-hidden', String(!visible));
    about.inert = !visible;
  },
  onReady: finishLoading,
};

function finishLoading() {
  if (finishedLoading) return;
  finishedLoading = true;
  state.canStart = true;
  $('.portfolio-loader')?.remove();
  page.dataset.homeIdle = 'true';
}

function showFallback() {
  if (fallback) return;
  fallback = true;
  disposeScene?.();
  box.querySelector('canvas')?.remove();
  page.dataset.fallback = 'true';
  $('.scene-fallback').hidden = false;
  selectCard = (index, trigger) => openCard(index, trigger);
  finishLoading();
}

function recordList(records) {
  return `<ol class="record-list">${records.map((record, i) => `<li${record.featured ? ' class="featured-record"' : ''}><span class="record-number">${number(i)}</span><div><h3>${escape(record.name)}</h3>${record.note ? `<p>${escape(record.note)}</p>` : ''}</div><strong>${escape(record.result)}</strong></li>`).join('')}</ol>`;
}

function researchCards() {
  return `<div class="research-grid">${research.map(paper => `<article class="paper"><div class="paper-meta"><span>${escape(paper.venue)}</span><span>NO. ${paper.number}</span></div><div class="paper-icon">${icon('document')}</div><h3>${escape(paper.title)}</h3><div class="paper-role"><span>AUTHORSHIP</span><strong>${escape(paper.role)}</strong></div>${tagList(paper.tags)}</article>`).join('')}</div>`;
}

function educationList() {
  return `<ol class="education-list">${education.map(item => `<li${item.current ? ' class="current-education"' : ''}><span class="education-period">${escape(item.period)}</span><div><h3>${escape(item.school)}${item.current ? '<span class="current-label">CURRENT</span>' : ''}</h3><p>${escape(item.course)}</p></div></li>`).join('')}</ol>`;
}

function sectionContents(id) {
  switch (id) {
    case 'research': return researchCards();
    case 'ctf': return recordList(ctf);
    case 'rubiyalab': return `<div class="section-note"><span>ROLE</span><p>RubiyaLAB · CTF Member</p></div>${recordList(rubiya)}<section class="activity-note"><span>EXPEDITION</span><h3>def-cam CTF (D-CTF) Quals</h3><p>RubiyaLAB 원정대 활동</p></section>`;
    case 'team-o3o': return `<div class="team-banner"><span>o3o</span><div><p>ACADEMIC TEAM</p><h3>Team o3o</h3><span>Leader</span></div>${icon('flag')}</div>${recordList(team)}`;
    case 'honors': return `${recordList(honors)}<section class="activity-note"><span>ACTIVITIES</span><h3>모두의 창업 1기</h3><p>창업 프로그램 참여</p><h3>제 9회 정보보호영재교육원 경진대회</h3><p>대회 참여 기록</p></section>`;
    case 'education': return educationList();
    default: return '';
  }
}

function openDialog(kind, trigger) {
  if (!dialog.open) opener = trigger || document.activeElement;
  dialogKind = kind;
  state.paused = true;
  page.dataset.homeIdle = 'false';
  dialog.className = kind === 'card' ? 'archive-detail' : `info-dialog ${kind}-dialog`;
  dialog.dataset.slot = 'dialog-content';
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  dialog.querySelector('[data-action="close"]')?.focus({ preventScroll: true });
}

function closeDialog() { if (dialog.open) dialog.close(); }
dialog.addEventListener('close', () => {
  dialogKind = null;
  // Let the renderer observe the covered/paused card even after a very fast close.
  // It schedules its next frame before onOpen, so this releases it afterwards.
  requestAnimationFrame(() => {
    if (dialog.open) return;
    state.paused = false;
    page.dataset.homeIdle = 'true';
  });
  if (opener?.isConnected) opener.focus({ preventScroll: true });
});

function topbar(label) {
  return `<div class="detail-topbar"><span>${label}</span><button class="detail-close" data-action="close" aria-label="Close ${dialogKind === 'card' ? 'project' : 'dialog'}"><span>Close</span><span aria-hidden="true">✕</span></button></div>`;
}

function openCard(index, trigger) {
  const card = cards[index];
  if (!card) return;
  state.projectIndex = index;
  dialogKind = 'card';
  dialog.dataset.project = card.id;
  dialog.style.setProperty('--detail-accent', card.color);
  dialog.style.setProperty('--detail-edge', `${card.color}28`);
  dialog.innerHTML = `${topbar(`YEONG CHOI <span class="topbar-slash">/</span> ${number(index)} — ${card.label.toUpperCase()}`)}<div class="detail-body"><header class="personal-hero"><div class="section-eyebrow">${icon(card.symbol)}<span>${card.eyebrow}</span></div><h1 id="dialog-title">${card.label}</h1><h2>${card.subtitle}</h2><p>${card.description}</p>${tagList(card.meta)}</header><section class="personal-section" aria-label="${escape(card.label)} records">${sectionContents(card.id)}</section><nav class="personal-next" aria-label="Browse sections"><button data-open="${(index + 5) % 6}"><span>← PREVIOUS</span><strong>${cards[(index + 5) % 6].label}</strong></button><button data-action="close"><span>BACK TO</span><strong>The archive</strong></button><button data-open="${(index + 1) % 6}"><span>NEXT →</span><strong>${cards[(index + 1) % 6].label}</strong></button></nav><footer class="detail-signoff">YEONG CHOI <span>RESEARCH & CTF</span></footer></div>`;
  openDialog('card', trigger);
}

function aboutContent() {
  return `<div class="about-eyebrow">ABOUT / YEONG CHOI</div><h2>최영<span class="about-english">Yeong Choi</span></h2><div class="yc-portrait" role="img" aria-label="YC monogram"><span>YC</span><small>FORENSICS · AI · CTF</small></div><p>고려대학교 인공지능사이버보안학과에 재학 중인 최영입니다. 디지털 포렌식과 사고 대응, AI를 중심으로 공부하고 연구합니다.</p><p>RubiyaLAB의 CTF 팀원, 학술팀 Team o3o의 리더로 활동하고 있습니다.</p>${tagList(['Korea Univ AICS', 'RubiyaLAB', 'Team o3o'])}<div class="about-links"><a href="mailto:${profile.email}">Email ↗</a><a href="${profile.github}" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="${profile.instagram}" target="_blank" rel="noopener noreferrer">Instagram ↗</a></div>`;
}

function setAbout(visible) {
  state.about = visible;
  $$('.box-keyboard button').forEach(button => { button.disabled = visible; });
  $('.yc-logo').setAttribute('aria-expanded', String(visible));
  if (!visible) { about.setAttribute('aria-hidden', 'true'); about.inert = true; }
}

function openAbout(trigger) {
  if (mobile.matches || fallback) {
    dialogKind = 'about';
    dialog.innerHTML = `${topbar('ABOUT')}<div class="info-body"><h1 class="sr-only" id="dialog-title">About Yeong Choi</h1>${aboutContent()}</div>`;
    openDialog('about', trigger);
  } else setAbout(!state.about);
}

function openResume(trigger) {
  dialogKind = 'resume';
  dialog.innerHTML = `${topbar('YEONG CHOI / RÉSUMÉ')}<article class="info-body resume-sheet"><header class="resume-heading"><div><p class="section-eyebrow">DFIR · AI · CTF</p><h1 id="dialog-title">Yeong Choi<span>최영</span></h1><p>고려대학교 인공지능사이버보안학과</p></div><button class="outline-button print-button" data-action="print">인쇄 / PDF 저장 ↗</button></header><div class="resume-contact"><a href="mailto:${profile.email}">${profile.email}</a><a href="mailto:${profile.universityEmail}">${profile.universityEmail}</a><a href="${profile.github}" target="_blank" rel="noopener noreferrer">github.com/o3oC4T ↗</a></div><section><h2>Research</h2>${research.map(paper => `<div class="resume-paper"><h3>${escape(paper.title)}</h3><p>${paper.venue} · Poster No. ${paper.number}</p><strong>${paper.role}</strong></div>`).join('')}</section><section><h2>Selected achievements</h2>${recordList([ctf[0], ctf[1], ctf[2], ctf[3], honors[0], team[0]])}</section><section><h2>Teams & activities</h2><div class="resume-roles"><div><h3>RubiyaLAB</h3><p>CTF Member</p></div><div><h3>Team o3o</h3><p>Academic Team · Leader</p></div><div><h3>모두의 창업</h3><p>1기</p></div></div></section><section><h2>Education</h2>${educationList()}</section><footer class="resume-note">전체 대회 기록은 CTF · RubiyaLAB · Team o3o · Honors 카드에서 확인할 수 있습니다.</footer></article>`;
  openDialog('resume', trigger);
}

function openContact(trigger) {
  dialogKind = 'contact';
  dialog.innerHTML = `${topbar('GET IN TOUCH')}<div class="info-body"><p class="section-eyebrow">CONTACT / YEONG CHOI</p><h1 id="dialog-title">Let’s talk.</h1><p class="contact-intro">연구와 협업에 관한 이야기를 기다립니다.</p><a class="contact-email" href="mailto:${profile.email}">이메일 보내기 <span>↗</span></a>${[profile.email, profile.universityEmail].map((email, index) => `<div class="email-row"><div><span>${index ? 'UNIVERSITY' : 'PRIMARY'}</span><a href="mailto:${email}">${email}</a></div><button data-copy="${email}" aria-label="Copy ${email}">복사</button></div>`).join('')}<div class="contact-socials"><a href="${profile.instagram}" target="_blank" rel="noopener noreferrer">Instagram <span>@ilh_sh ↗</span></a><div class="discord-row"><span>Discord</span><button data-copy="${profile.discord}" aria-label="Copy Discord ID ${profile.discord}">${profile.discord} <span>복사</span></button></div><a href="${profile.github}" target="_blank" rel="noopener noreferrer">GitHub <span>o3oC4T ↗</span></a></div><p class="copy-feedback" role="status" aria-live="polite"></p></div>`;
  openDialog('contact', trigger);
}

function openIndex(trigger) {
  dialogKind = 'index';
  dialog.innerHTML = `${topbar('THE ARCHIVE')}<div class="info-body"><p class="section-eyebrow">SIX CHAPTERS</p><h1 id="dialog-title">Explore the archive.</h1><div class="index-cards">${cardLinks()}</div></div>`;
  openDialog('index', trigger);
}

function cardLinks() {
  return cards.map((card, i) => `<button data-open="${i}" style="--card-color:${card.color}"><span>${number(i)}</span>${icon(card.symbol)}<strong>${card.label}</strong><span>↗</span></button>`).join('');
}

function updatePicker(index, scroll = true) {
  pickerIndex = Math.max(0, Math.min(cards.length - 1, index));
  state.mobileSelected = mobile.matches ? pickerIndex : null;
  $('.picker-count').textContent = `${number(pickerIndex)} / 06`;
  $$('.mobile-picker-dots button').forEach((button, i) => {
    button.setAttribute('aria-pressed', String(i === pickerIndex));
    button.dataset.active = String(i === pickerIndex);
  });
  if (scroll) {
    const rail = $('.mobile-picker-rail');
    rail.scrollTo({ left: rail.clientWidth * pickerIndex, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
}

function updateViewport() {
  page.dataset.mobile = String(mobile.matches);
  state.mobileSelected = mobile.matches ? pickerIndex : null;
  $$('.box-keyboard button').forEach(button => { button.tabIndex = mobile.matches ? -1 : 0; });
  if (mobile.matches) setAbout(false);
}

$$('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
$('.box-keyboard').innerHTML = cards.map((card, i) => `<button type="button" data-select="${i}" aria-label="Open ${card.label}"></button>`).join('');
$$('.box-keyboard button').forEach((button, index) => {
  button.addEventListener('focus', () => state.onHover(index));
  button.addEventListener('blur', () => { if (!dialog.open) state.onHover(null); });
});
$('.mobile-picker-rail').innerHTML = cards.map((card, i) => `<article class="mobile-picker-slide" style="--picker-accent:${card.color}"><p class="mobile-picker-number">${number(i)} / ${card.eyebrow}</p><h2>${icon(card.symbol)}${card.label}</h2><button data-select="${i}" aria-label="View ${card.label}">View ${card.label}<span>↗</span></button></article>`).join('');
$('.mobile-picker-dots').innerHTML = cards.map((card, i) => `<button data-picker="${i}" aria-label="Select ${card.label}" aria-pressed="${i === 0}"><span></span></button>`).join('');
$('.fallback-cards').innerHTML = cardLinks();
about.innerHTML = `<button class="about-close" data-action="close-about" aria-label="Close about">✕</button>${aboutContent()}`;
let scrollFrame;
$('.mobile-picker-rail').addEventListener('scroll', event => {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    const rail = event.target;
    updatePicker(Math.round(rail.scrollLeft / rail.clientWidth), false);
  });
}, { passive: true });
mobile.addEventListener('change', updateViewport);
updateViewport();
updatePicker(0, false);

document.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.select !== undefined) { selectCard?.(Number(button.dataset.select), button); return; }
  if (button.dataset.open !== undefined) return openCard(Number(button.dataset.open), button);
  if (button.dataset.picker !== undefined) return updatePicker(Number(button.dataset.picker));
  if (button.dataset.copy) {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      $('.copy-feedback').textContent = '클립보드에 복사했습니다.';
    } catch { $('.copy-feedback').textContent = '텍스트를 길게 누르거나 선택해 복사해 주세요.'; }
    return;
  }
  switch (button.dataset.action) {
    case 'about': openAbout(button); break;
    case 'close-about': setAbout(false); $('.yc-logo').focus(); break;
    case 'work': setAbout(false); break;
    case 'resume': openResume(button); break;
    case 'contact': openContact(button); break;
    case 'index': openIndex(button); break;
    case 'close': closeDialog(); break;
    case 'print': window.print(); break;
    case 'previous-card': updatePicker((pickerIndex + 5) % 6); break;
    case 'next-card': updatePicker((pickerIndex + 1) % 6); break;
    case 'text-view': showFallback(); break;
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.about && !dialog.open) { setAbout(false); $('.yc-logo').focus(); }
});

// Retain the public reference renderer's geometry and motions, with personal identity/icons.
async function initializeScene() {
  try {
    const [{ createProjectBox }, { createProjectTexturePixels }] = await Promise.all([
      import('./assets/archive-scene.js'), import('./assets/textures.js'), document.fonts.ready,
    ]);
    if (fallback) return;
    const image = new Image();
    image.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path fill="white" d="M5 2H14L20 8V22H5Z"/></svg>')}`;
    await image.decode();
    if (fallback) return;
    disposeScene = createProjectBox(box, {
      getState: () => state,
      getButtons: () => $$('.box-keyboard button'),
      onError: showFallback,
      registerSelect: select => { selectCard = select; },
    }, createProjectTexturePixels(), image);
    box.querySelector('canvas')?.addEventListener('webglcontextlost', event => {
      event.preventDefault(); showFallback();
    }, { once: true });
  } catch (error) {
    console.error('Unable to initialize the archive scene:', error);
    showFallback();
  }
}
initializeScene();
