'use strict';

const chai = require('chai');
const fs = require('fs');
const developer = require('../src/index.js');
const expect = chai.expect;
const exec = require('child_process').execSync;

describe('cloneRepository', () => {
  beforeEach(async () => {
    await exec('./test/test-setup.sh');
    await Promise.resolve(developer.getRepoDir('./test'));
  });

  it('puts the repository in ./src/develop', async () => {
    const exists = await developer
      .cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1')
      .then(() => {
        return fs.existsSync('./test/src/develop/repo1');
      });
    expect(exists).to.be.true;
  });

  it('puts the repository in ./src/develop with a partial (noDeep) clone', async () => {
    const repo = await developer
      .cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1', null, { filterBlobs: true, tag: '1.0.0' });

    const branches = await repo.branchLocal();
    expect(branches.all[0]).to.be.equals('(no');
  });

  it('gets the repository remotes', async () => {
    const repo = await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    const remotes = await repo.getRemotes();
    expect(remotes[0].name).to.be.equal('origin');
  });

  it('sets separate fetch and push urls correctly', async () => {
    const repo = await developer.cloneRepository(
      'repo1',
      './test/src/develop/repo1',
      './test/fake-push-remote/repo1',
      './test/fake-remote/repo1',
    );
    const remotes = await repo.getRemotes(true);
    expect(remotes[0].refs.fetch).to.contain('./test/fake-remote/repo1');
    expect(remotes[0].refs.push).to.contain('./test/fake-push-remote/repo1');
  });

  afterEach(async () => {
    await exec('./test/test-clean.sh');
  });
});
