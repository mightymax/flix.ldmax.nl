import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const script = resolve('scripts/preversion-check.js');
test('preversion accepts local commits but rejects dirty, behind and diverged branches', () => {
  const root = mkdtempSync(join(tmpdir(), 'flix-preversion-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  const check = () => spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  const commit = message => {
    writeFileSync(join(root, 'fixture'), message);
    git('add', 'fixture');
    git('commit', '-m', message);
  };
  try {
    git('init', '-b', 'main');
    git('config', 'user.email', 'test@example.org');
    git('config', 'user.name', 'Test');
    commit('initial');
    // Fetch main from a separate local bare repository, with no network access.
    const remote = `${root}-remote.git`;
    try {
      git('clone', '--bare', '.', remote);
      git('remote', 'add', 'origin', remote);
      git('config', 'remote.origin.fetch', '+refs/heads/main:refs/remotes/origin/main');
      assert.equal(check().status, 0);
      commit('local');
      assert.equal(check().status, 0, 'unpushed local commit is allowed');
      writeFileSync(join(root, 'fixture'), 'dirty');
      assert.notEqual(check().status, 0);
      git('restore', 'fixture');
      git('checkout', '-b', 'other');
      assert.notEqual(check().status, 0);
      git('checkout', 'main');
      git('push', 'origin', 'main');
      git('reset', '--hard', 'HEAD~1');
      assert.notEqual(check().status, 0, 'behind remote is refused');
      commit('diverged');
      assert.notEqual(check().status, 0, 'diverged history is refused');
    } finally { rmSync(remote, { recursive: true, force: true }); }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
