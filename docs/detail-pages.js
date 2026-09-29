import { cards, detailCopy, research, ctf, rubiya, team, honors, education } from './content.js?v=20260929-terminal';
import { artStyles, renderTitleArt } from './title-art.js?v=20260930-ascii';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = index => String(index + 1).padStart(2, '0');
const section = (title, content) => `<section class="terminal-section"><h2 class="terminal-section-title"><span aria-hidden="true">// </span>${escape(title)}</h2>${content}</section>`;

function headingArt(card, index) {
  const style = artStyles[index % artStyles.length];
  const prefix = `title-${card.id}`;
  return `<button type="button" class="terminal-art-button" data-art-title="${escape(card.label)}" data-art-prefix="${prefix}" data-art-style="${style}" data-art-phase="idle" aria-label="Change ${escape(card.label)} ASCII art style" title="Click to change ASCII style"><canvas class="terminal-art-field" aria-hidden="true"></canvas><span class="terminal-art-layer">${renderTitleArt(card.label, style, prefix)}</span></button>`;
}

function workItem(index, title, meta, content) {
  return `<article class="terminal-work"><header class="terminal-work-heading"><span class="terminal-work-number">${number(index)}</span><h3>${escape(title)}</h3><span class="terminal-work-meta">${escape(meta)}</span></header><div class="terminal-work-content">${content}</div></article>`;
}

function results(records) {
  return `<ol class="terminal-history">${records.map(record => `<li class="terminal-history-row${record.featured ? ' is-featured' : ''}"><strong class="terminal-history-key">${escape(record.result)}</strong><div><h3>${escape(record.name)}</h3>${record.note ? `<p class="terminal-branch"><span aria-hidden="true">└─ </span>${escape(record.note)}</p>` : ''}</div></li>`).join('')}</ol>`;
}

function sectionContents(id) {
  switch (id) {
    case 'research':
      return section('selected work', research.map((paper, i) => workItem(i, paper.title, paper.venue,
        `<p>Poster No. ${escape(paper.number)}</p><p class="terminal-authorship"><span aria-hidden="true">▸ </span><mark>${escape(paper.role)}</mark></p><p class="terminal-branch"><span aria-hidden="true">└─ </span>${paper.tags.map(escape).join(' · ')}</p>`)).join(''));
    case 'ctf':
      return section('competition results', results(ctf));
    case 'rubiyalab':
      return section('selected work', workItem(0, 'RubiyaLAB', 'CTF TEAM', '<p>CTF Member</p>')
        + workItem(1, 'def-cam CTF (D-CTF) Quals', 'EXPEDITION', '<p>RubiyaLAB 원정대 활동</p>'))
        + section('competition results', results(rubiya));
    case 'team-o3o':
      return section('selected work', workItem(0, 'Team o3o', 'ACADEMIC TEAM', '<p>Academic Team · <mark>Leader</mark></p>'))
        + section('competition results', results(team));
    case 'honors':
      return section('honors & awards', results(honors))
        + section('activities', workItem(0, '모두의 창업 1기', 'ENTREPRENEURSHIP', '<p>창업 프로그램 참여</p>')
          + workItem(1, '제 9회 정보보호영재교육원 경진대회', 'COMPETITION', '<p>대회 참여 기록</p>'));
    case 'education':
      return section('education', `<ol class="terminal-history">${education.map(item => `<li class="terminal-history-row"><span class="terminal-history-key">${escape(item.period)}</span><div><h3>${escape(item.school)}${item.current ? '<span class="terminal-current">current</span>' : ''}</h3><p class="terminal-branch"><span aria-hidden="true">└─ </span>${escape(item.course)}</p></div></li>`).join('')}</ol>`);
    default: throw new Error(`Unknown portfolio section: ${id}`);
  }
}

export function renderDetailPage(index) {
  const card = cards[index];
  if (!card) throw new RangeError('Unknown portfolio card');
  const copy = detailCopy[card.id];
  const previous = (index + cards.length - 1) % cards.length;
  const next = (index + 1) % cards.length;
  return `<div class="detail-topbar terminal-topbar"><div class="terminal-command" aria-label="yeong at o3oc4t, open ${escape(card.label)}"><span class="terminal-host">yeong@o3oc4t</span><span class="terminal-shell"> ~ % </span><span>./${card.id}</span><span class="terminal-cursor" aria-hidden="true"></span></div><button class="detail-close" data-action="close" aria-label="Close project"><span>esc</span><span aria-hidden="true">✕</span></button></div>
    <div class="detail-body terminal-body"><header class="terminal-hero"><h1 id="dialog-title" class="sr-only">${escape(card.label)}</h1>${headingArt(card, index)}<p class="terminal-role"><mark>${escape(card.eyebrow.toLowerCase())}</mark></p><p class="terminal-lead" lang="en">${escape(copy.subtitle)}</p><p class="terminal-description" lang="en">${escape(copy.description)}</p></header>
    ${sectionContents(card.id)}
    <nav class="terminal-navigation" aria-label="Browse sections"><button data-open="${previous}"><span>← previous</span><strong>${escape(cards[previous].label)}</strong></button><button data-action="close"><span>cd ..</span><strong>The archive</strong></button><button data-open="${next}"><span>next →</span><strong>${escape(cards[next].label)}</strong></button></nav><footer class="terminal-signoff">yeong choi <span aria-hidden="true">/</span> ${escape(card.label.toLowerCase())} <span aria-hidden="true">/</span> ${number(index)} of 06</footer></div>
    <div class="terminal-status" aria-hidden="true"><span class="terminal-status-host">[yeong@o3oc4t]</span><span class="terminal-status-section">▸ ${escape(card.label.toLowerCase())}</span><span class="terminal-status-progress"><span class="terminal-meter">░░░░░░░░</span><span class="terminal-percent">00%</span></span></div>`;
}

export function updateDetailProgress(dialog) {
  const meter = dialog.querySelector('.terminal-meter');
  if (!meter) return;
  const distance = dialog.scrollHeight - dialog.clientHeight;
  const progress = distance <= 1 ? 1 : Math.min(1, Math.max(0, dialog.scrollTop / distance));
  const filled = Math.round(progress * 8);
  meter.textContent = '█'.repeat(filled) + '░'.repeat(8 - filled);
  dialog.querySelector('.terminal-percent').textContent = `${String(Math.round(progress * 100)).padStart(2, '0')}%`;
}
