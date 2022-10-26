'use strict';

const chai = require('chai');
const developer = require('../src/index.js');
const expect = chai.expect;
const fs = require('fs');
const exec = require('child_process').execSync;

describe('setHead', () => {
  beforeEach(async () => {
    await exec('./test/test-setup.sh');
    await Promise.resolve(developer.getRepoDir('./test'));
  });

  it('can set head to a branch', async () => {
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, { branch: 'staging' });
    const commits = await repo.log();
    expect(commits.latest.message).to.be.equal('Modify file 1');
  });

  it('can set head to a tag', async () => {
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, { tag: '1.0.0' });
    const commits = await repo.log();
    expect(commits.latest.message).to.be.equal('Add file 1');
  });

  it('ignores branch if tag is mentioned', async () => {
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, { branch: 'staging', tag: '1.0.0' });
    const commits = await repo.log();
    expect(commits.latest.message).to.be.equal('Add file 1');
  });

  it('does nothing if status is not clean', async () => {
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    let repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, { branch: 'staging' });

    // now let's make a local change
    await exec('./test/test-local-change.sh');

    repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    const head = await developer.setHead('repo1', repo, { branch: 'staging' });
    expect(head.abort).to.be.true;
    const txt = fs.readFileSync('./test/src/develop/repo1/file1.txt').toString();
    expect(txt).to.be.equal('File 1\nMore text\nLocal change\n');
  });

  it('resets to HEAD if status is not clean but reset=true', async () => {
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    let repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, { branch: 'staging' });

    // now let's make a local change
    await exec('./test/test-local-change.sh');

    repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, { branch: 'staging' }, { reset: true });
    const txt = fs.readFileSync('./test/src/develop/repo1/file1.txt').toString();
    expect(txt).to.be.equal('File 1\nMore text\n');
  });

  it('can get last tag', async () => {
    await exec('./test/test-create-tags.sh');
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, { tag: '1.0.0' }, { lastTag: true });
    const commits = await repo.log();
    expect(commits.latest.refs).to.be.equal('HEAD -> main, tag: 1.0.10, origin/main, origin/HEAD');
    expect(commits.latest.message).to.be.equal('fix quote');
    const txt = fs.readFileSync('./test/src/develop/repo1/file1.txt').toString();
    expect(txt).to.be.equal('File 1\nKnowledge is power\nFrance is bacon\nFrancis Bacon\n');
    await exec('sleep 1');
  });

  it('does nothing if tag does not exist', async () => {
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, { tag: '2.0.0' });
    const status = await repo.status();
    expect(status.current).to.be.equal('main');
  });

  it('can fall back to default branch if tag does not exist', async () => {
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, { branch: 'staging' });
    await developer.setHead('repo1', repo, { tag: '2.0.0' }, { fallbackToDefaultBranch: true });
    const status = await repo.status();
    expect(status.current).to.be.equal('main');
  });

  it('can force default branch with --force-default-branch', async () => {
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, { branch: 'staging' }, { forceDefaultBranch: true });
    const commits = await repo.log();
    expect(commits.latest.message).to.be.equal('Add file 2');
  });

  afterEach(async () => {
    await exec('./test/test-clean.sh');
  });
});
