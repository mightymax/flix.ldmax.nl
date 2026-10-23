import { execFileSync } from 'node:child_process';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (git('branch', '--show-current') !== 'main') throw new Error('Release from main only');
if (git('status', '--porcelain')) throw new Error('Commit all changes before releasing');
git('fetch', 'origin', 'main');
if (git('rev-parse', 'HEAD') !== git('rev-parse', 'origin/main')) {
  throw new Error('Push or pull main before releasing');
}
