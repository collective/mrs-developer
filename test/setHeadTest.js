'use strict';

const chai = require('chai');
const developer = require('../src/index.js');
const expect = chai.expect;
const util = require('util');
const fs = require('fs');
const exec = util.promisify(require('child_process').exec);

describe('setHead', () => {
	beforeEach(async () => {
        await exec('./test/test-setup.sh');
		await Promise.resolve(developer.getRepoDir('./test'));
	});

	it('can set head to a branch', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.setHead('repo1', repo, {'branch': 'staging'});
        const commits = await repo.log();
		expect(commits.latest.message).to.be.equal('Modify file 1');
  });

  it('can set head to a tag', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.setHead('repo1', repo, {'tag': '1.0.0'});
        const commits = await repo.log();
		expect(commits.latest.message).to.be.equal('Add file 1');
  });

  it('ignores branch if tag is mentionned', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.setHead('repo1', repo, {'branch': 'staging', 'tag': '1.0.0'});
        const commits = await repo.log();
		expect(commits.latest.message).to.be.equal('Add file 1');
  });

  it('does nothing if status is not clean', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        let repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.setHead('repo1', repo, {'branch': 'staging'});
		
		// now let's make a local change
		await exec('./test/test-local-change.sh');
		
		repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		const head = await developer.setHead('repo1', repo, {'branch': 'staging'});
        expect(head.abort).to.be.true;
        const txt = fs.readFileSync('./test/src/develop/repo1/file1.txt').toString();
		expect(txt).to.be.equal('File 1\nMore text\nLocal change\n');
  });
    
  it('resets to HEAD if status is not clean but reset=true', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        let repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.setHead('repo1', repo, {'branch': 'staging'});
		
		// now let's make a local change
		await exec('./test/test-local-change.sh');
		
		repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		await developer.setHead('repo1', repo, {'branch': 'staging'}, true);
		const txt = fs.readFileSync('./test/src/develop/repo1/file1.txt').toString();
		expect(txt).to.be.equal('File 1\nMore text\n');
  });
    
  it('can get last tag', async () => {
    await exec('./test/test-create-tags.sh');
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, {'tag': '1.0.0'}, false, true);
    const commits = await repo.log();
		expect(commits.latest.refs).to.be.equal('HEAD, tag: 1.0.11'); 
		expect(commits.latest.message).to.be.equal('really?');
        const txt = fs.readFileSync('./test/src/develop/repo1/file1.txt').toString();
		expect(txt).to.be.equal('File 1\nKnowledge is power\nFrance is bacon\n');
	});

  it('does nothing if tag does not exist', async () => {
    await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
    const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
    await developer.setHead('repo1', repo, {'tag': '2.0.0'});
    const status = await repo.status();
		expect(status.current).to.be.equal('No');
  });

	afterEach(async () => {
        await exec('./test/test-clean.sh');
	});
});
