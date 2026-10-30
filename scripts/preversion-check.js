import { execFileSync } from 'node:child_process';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (git('branch', '--show-current') !== 'main') throw new Error('Release from main only');
if (git('status', '--porcelain')) throw new Error('Commit all changes before releasing');
git('fetch', 'origin', 'main');
try {
  git('merge-base', '--is-ancestor', 'origin/main', 'HEAD');
} catch {
  throw new Error('Integrate changes from origin/main before releasing');
}
