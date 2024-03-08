'use strict';

const chai = require('chai');
const fs = require('fs');
const developer = require('../src/index.js');
const expect = chai.expect;
const exec = require('child_process').execSync;

describe('getRepoDir', () => {
  it('creates the ./src/develop folder if it does not exist', () => {
    developer.getRepoDir({ root: './test' });
    expect(fs.existsSync('./test/src/develop')).to.be.true;
  });

  it('creates a folder with no src if it does not exist', () => {
    developer.getRepoDir({ root: './test' }, { output: 'packages' });
    expect(fs.existsSync('./test/packages')).to.be.true;
  });

  afterEach(async () => {
    await exec('./test/test-clean.sh');
  });
});
