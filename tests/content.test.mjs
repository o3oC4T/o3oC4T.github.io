import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { profile, icons, cards, research, ctf, rubiya, team, honors, education } from '../docs/content.js';

test('six approved archive cards have matching icons and original accent order', () => {
  assert.deepEqual(cards.map(card => card.label), ['Research', 'CTF', 'RubiyaLAB', 'Team o3o', 'Honors', 'Education']);
  assert.deepEqual(cards.map(card => card.accent), ['purple', 'blue', 'orange', 'pink', 'red', 'rainbow']);
  assert.equal(new Set(cards.map(card => card.id)).size, 6);
  cards.forEach(card => assert.ok(icons[card.symbol]?.length));
});
test('provided research roles, record counts and dates are retained', () => {
  assert.deepEqual(research.map(p => [p.number, p.role]), [['202', 'Co-First Author'], ['200', 'Co-Second Author']]);
  assert.equal(ctf.length, 7);
  assert.equal(rubiya.length, 12);
  assert.equal(team.length, 6);
  assert.equal(honors.length, 6);
  assert.equal(education.length, 9);
  assert.equal(education[0].period, '2026 — 현재');
  assert.equal(rubiya.find(r => r.name === 'LilacCTF 2026').result, '21st place');
  assert.equal(ctf.filter(r => r.name === 'DEFCON 34').length, 1);
});
test('personal contact information is exact; no assumed LinkedIn', () => {
  assert.equal(profile.email, 'ilhsh4874@gmail.com');
  assert.equal(profile.universityEmail, 'ilhsh4874@korea.ac.kr');
  assert.equal(profile.instagram, 'https://www.instagram.com/ilh_sh/');
  assert.equal(profile.discord, 'you_me._.');
  assert.equal(profile.linkedin, undefined);
});
test('scene identity and rainbow slot are personalized, motion constants intact', async () => {
  const scene = await readFile(new URL('../docs/assets/archive-scene.js', import.meta.url), 'utf8');
  assert.ok(scene.includes('Y E O N G   C H O I'));
  assert.ok(scene.includes('Oe=_e.findIndex(e=>e.accent===`rainbow`)'));
  assert.ok(scene.includes('flyOut:1.08,flyBack:1.05,cameraFocus:1.55'));
  assert.ok(!scene.includes('M R I D U L'));
});
test('public application no longer contains reference identity, media or music', async () => {
  for (const path of ['index.html', 'app.js', 'content.js']) {
    const text = await readFile(new URL(`../docs/${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(text, /Mridul|Narnaulia|soundcloud|district-by|lakme|linkedin/i);
  }
});
