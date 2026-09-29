import test from 'node:test';
import assert from 'node:assert/strict';
import { createArchiveLoader, formatLoadingProgress, loadingStages } from '../docs/loader.js';

function fixture() {
  const nodes = Object.fromEntries(['progress', 'filled', 'empty', 'percent'].map(name => [`.loader-${name}`, {
    textContent: '',
    attributes: {},
    setAttribute(key, value) { this.attributes[key] = value; },
  }]));
  const element = { removed: false, querySelector: selector => nodes[selector], remove() { this.removed = true; } };
  return { element, nodes, loader: createArchiveLoader(element) };
}

test('ASCII progress is bounded, fixed width, and accurate at each milestone', () => {
  for (const value of [-20, 0, 10, 30, 75, 85, 100, 150, NaN]) {
    const { percent, filled, empty } = formatLoadingProgress(value);
    assert.equal(filled.length + empty.length, 20);
    assert.match(filled, /^#*$/);
    assert.match(empty, /^\.*$/);
    assert.ok(percent >= 0 && percent <= 100);
    assert.equal(filled.length, Math.floor(percent / 5));
  }
  assert.equal(Object.values(loadingStages).reduce((sum, weight) => sum + weight, 0), 100);
});

test('out-of-order milestones only add progress once; the first frame reserves the last 15%', () => {
  const { loader, nodes } = fixture();
  for (const stage of ['fonts', 'textures', 'interface', 'interface', 'unknown']) loader.mark(stage);
  assert.equal(nodes['.loader-percent'].textContent, '30%');
  for (const stage of ['renderer', 'icon', 'surfaces']) loader.mark(stage);
  assert.equal(nodes['.loader-percent'].textContent, '85%');
  assert.equal(nodes['.loader-progress'].attributes['aria-valuenow'], '85');
  assert.equal(nodes['.loader-progress'].attributes['aria-valuetext'], '85%');
});

test('completion displays 100% briefly, reveals once and ignores late events', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { loader, nodes, element } = fixture();
  for (const stage of Object.keys(loadingStages).filter(stage => stage !== 'frame')) loader.mark(stage);
  let reveals = 0;
  loader.complete(() => reveals++);
  loader.complete(() => reveals++);
  assert.equal(nodes['.loader-percent'].textContent, '100%');
  t.mock.timers.tick(219);
  assert.equal(element.removed, false);
  t.mock.timers.tick(1);
  assert.equal(element.removed, true);
  assert.equal(reveals, 1);
  loader.complete(() => reveals++);
  t.mock.timers.tick(1000);
  assert.equal(reveals, 1);
});

test('an error dismisses immediately without manufacturing 100% or leaving a callback', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { loader, nodes, element } = fixture();
  loader.mark('interface');
  loader.dismiss();
  loader.mark('renderer');
  loader.complete(() => assert.fail('Dismissed loaders must not reveal again'));
  t.mock.timers.tick(1000);
  assert.equal(element.removed, true);
  assert.equal(nodes['.loader-percent'].textContent, '10%');
  const pending = fixture();
  pending.loader.complete(() => assert.fail('Pending reveal should be cancelled'));
  pending.loader.dismiss();
  t.mock.timers.tick(1000);
});
