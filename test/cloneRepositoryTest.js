'use strict';

const chai = require('chai');
const fs = require('fs');
const developer = require('../src/index.js');
const expect = chai.expect;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

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
      './test/fake-remote/repo1'
    );
    const remotes = await repo.getRemotes(true);
    expect(remotes[0].refs.fetch).to.contain('./test/fake-remote/repo1');
    expect(remotes[0].refs.push).to.contain('./test/fake-push-remote/repo1');
  });

  afterEach(async () => {
    await exec('./test/test-clean.sh');
  });
});
