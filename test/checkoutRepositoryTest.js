'use strict';

const chai = require('chai');
const developer = require('../src/index.js');
const expect = chai.expect;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const git = require('simple-git');

describe('checkoutRepository', () => {
  beforeEach(async () => {
    await exec('./test/test-setup.sh');
    developer.getRepoDir('./test');
  });

  it('clones the repository locally and checkout the proper branch', async () => {
    await developer.checkoutRepository(
      'repo1',
      './test/src/develop',
      {
        url: './test/fake-remote/repo1',
        branch: 'staging',
      },
      {}
    );
    const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    const status = await repo.status();
    expect(status.current).to.be.equal('staging');
    const commits = await repo.log();
    expect(commits.latest.message).to.be.equal('Modify file 1');
  });

  it('sets separate fetch and push urls correctly', async () => {
    await developer.checkoutRepository(
      'repo1',
      './test/src/develop',
      {
        url: './test/fake-push-remote/repo1',
        https: './test/fake-remote/repo1',
      },
      {
        fetchHttps: true,
      }
    );
    const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    const remotes = await repo.getRemotes(true);
    expect(remotes[0].refs.fetch).to.contain('./test/fake-remote/repo1');
    expect(remotes[0].refs.push).to.contain('./test/fake-push-remote/repo1');
  });

  it('fetchs last changes if repository exists', async () => {
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    await developer.checkoutRepository(
      'repo1',
      './test/src/develop',
      {
        url: './test/fake-remote/repo1',
        branch: 'staging',
      },
      {}
    );

    // now let's make a change in the remote
    await exec('./test/test-add-commit.sh');

    // and checkout
    await developer.checkoutRepository(
      'repo1',
      './test/src/develop',
      {
        url: './test/fake-remote/repo1',
        branch: 'staging',
      },
      {}
    );
    const repo = await git('./test/src/develop/repo1');
    const commits = await repo.log();
    expect(commits.latest.message).to.be.equal('Modify file 1 again');
  });

  it('does not fetchs last changes if noFetch', async () => {
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    await developer.checkoutRepository('repo1', './test/src/develop', {
      url: './test/fake-remote/repo1',
      branch: 'staging',
    });

    // now let's make a change in the remote
    await exec('./test/test-add-commit.sh');

    // and checkout
    await developer.checkoutRepository(
      'repo1',
      './test/src/develop',
      {
        url: './test/fake-remote/repo1',
        branch: 'staging',
      },
      { noFetch: true }
    );
    const repo = await git('./test/src/develop/repo1');
    const commits = await repo.log();
    expect(commits.latest.message).to.be.equal('Modify file 1');
  });

  afterEach(async () => {
    await exec('./test/test-clean.sh');
  });
});
