'use strict';

const chai = require('chai');
const developer = require('../src/index.js');
const expect = chai.expect;
const exec = require('child_process').execSync;
const fs = require('fs');

describe('develop', () => {
  beforeEach(async () => {
    await exec('./test/test-setup.sh');
    await Promise.resolve(developer.getRepoDir('./test'));
  });

  it('clones all the repositories indicated in mrs.developer.json', async () => {
    await developer.develop({ root: './test' });
    const repo1 = await developer.openRepository('repo1', './test/src/develop/repo1');
    let commits = await repo1.log();
    expect(commits.latest.message).to.be.equal('Add file 2');
    const repo2 = await developer.openRepository('repo2', './test/src/develop/repo2');
    commits = await repo2.log();
    expect(commits.latest.message).to.be.equal('Modify file 1');
    const repo3 = await developer.openRepository('repo3', './test/src/develop/repo3');
    commits = await repo3.log();
    expect(commits.latest.message).to.be.equal('Add file 2');
  });

  it('updates tsconfig.json with proper paths', async () => {
    await developer.develop({ root: './test' });
    const raw = fs.readFileSync('./test/tsconfig.json');
    const config = JSON.parse(raw);
    expect(config.compilerOptions.baseUrl).to.be.equal('src');
    expect(config.compilerOptions.paths.repo1[0]).to.be.equal('develop/repo1');
    expect(config.compilerOptions.paths['@test/package2'][0]).to.be.equal('develop/repo2');
    expect(config.compilerOptions.paths.repo3[0]).to.be.equal('develop/repo3/lib/core');
    expect(config.compilerOptions.paths['@test/forms'][0]).to.be.equal('develop/repo4/lib/forms');
  });

  it('updates tsconfig.json with local paths', async () => {
    await developer.develop({ root: './test' });
    const raw = fs.readFileSync('./test/tsconfig.json');
    const config = JSON.parse(raw);
    expect(config.compilerOptions.paths.local1[0]).to.be.equal('some/path');
  });

  it('updates mrs.developer.json with last tag', async () => {
    await exec('cp ./test/mrs.developer.json ./test/mrs.developer.json.bak');
    await exec('./test/test-create-tags.sh');
    await developer.develop({ root: './test', lastTag: true });
    const raw = fs.readFileSync('./test/mrs.developer.json');
    const config = JSON.parse(raw);
    expect(config.repo1.tag).to.be.equal('1.0.10');
    await exec('mv ./test/mrs.developer.json.bak ./test/mrs.developer.json');
  });

  it('preserves baseUrl', async () => {
    await developer.develop({ root: './test', configFile: 'tsconfig-1.json' });
    const raw = fs.readFileSync('./test/tsconfig-1.json');
    const config = JSON.parse(raw);
    expect(config.compilerOptions.baseUrl).to.be.equal('./');
  });

  it('preserves existing paths outside src/develop', async () => {
    await developer.develop({ root: './test', configFile: 'tsconfig-1.json' });
    const raw = fs.readFileSync('./test/tsconfig-1.json');
    const config = JSON.parse(raw);
    expect(config.compilerOptions.paths.something[0]).to.be.equal('dist/something');
  });

  afterEach(async () => {
    await exec('./test/test-clean.sh');
  });
});
