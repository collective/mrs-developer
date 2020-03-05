'use strict';

const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const gitP = require('simple-git/promise');
const currentPath = process.cwd();

const DEVELOP_DIRECTORY = 'develop';

const getRemotePath = function (url) {
    if (url.startsWith('.')) {
        return `${currentPath}/${url}`;
    } else {
        return url;
    }
};

const getRepoDir = function (root, output) {
    // Check for download directory; create if needed.
    const repoDir = path.join(root || '.', 'src', output || DEVELOP_DIRECTORY);
    if (!fs.existsSync(repoDir)) {
        console.log(`\nCreating repoDir ${repoDir}`);
        fs.mkdirSync(repoDir);
    } else {
        console.log(`\nUsing ${repoDir}`);
    }
    return repoDir;
};

const cloneRepository = function (name, path, url) {
    fs.mkdirSync(path);
    const git = gitP(path);
    return git.init()
        .then(() => git.addRemote('origin', getRemotePath(url)))
        .then(() => {
            console.log(`Cloning ${name} from ${url}...`);
            return git.fetch();
        })
        .then(() => {
            console.log(colors.green(`✓ cloned ${name} at ${path}`));
            return git;
        })
        .catch(err => console.error(colors.red(`Cannot clone ${url}`, err)))
};


const setHead = function (name, repository, settings, options) {
    const { reset, lastTag, noFetch, defaultToMaster, allMaster } = options || {};
    let promise;
    if (reset) {
        promise = repository.reset('hard').then(() => console.log(colors.yellow.inverse(`Hard reset in ${name}.`)));
    } else {
        promise = repository.status().then(status => {
            if (status.files.length > 0) {
                console.log(colors.yellow.inverse(`Cannot update ${name}. Commit your changes first.`));
                return { abort: true };
            } else {
                return {};
            }
        });
    }
    return promise.then(res => {
        if (!!res && res.abort) {
            return { abort: true };
        } else if (lastTag) {
            return repository.checkoutLatestTag();
        } else if (!allMaster && settings.tag) {
            const promise = !noFetch ? repository.fetch() : Promise.resolve();
            return promise
                .then(() => repository.checkout(settings.tag))
                .then(
                    () => console.log(colors.green(`✓ update ${name} to tag ${settings.tag}`)),
                    () => {
                        console.error(colors.red(`✗ tag ${settings.tag} does not exist in ${name} ${defaultToMaster}`));
                        if (defaultToMaster) {
                            repository.checkout('master').then(() => console.log(colors.yellow(`✓ update ${name} to master instead of ${settings.tag}`)));
                        }
                    }
                );
        } else {
            const branch = !allMaster ? (settings.branch || 'master') : 'master';
            const promise = !noFetch ? repository.fetch() : Promise.resolve();
            return promise.then(() => {
                return repository.checkout(branch)
                    .then(() => {
                        if (!noFetch) {
                            return repository.pull('origin', branch, ['rebase'])
                            .catch(() => console.error(
                                colors.yellow.inverse(`Cannot merge origin/${branch}. Please merge manually.`)));
                        }
                    })
                    .then(
                        () => console.log(colors.green(`✓ update ${name} to branch ${branch}`)),
                        () => {
                            console.error(colors.red(`✗ branch ${branch} does not exist in ${name}`));
                            if (defaultToMaster) {
                                repository.checkout('master').then(() => console.log(colors.yellow(`✓ update ${name} to master instead of ${branch}`)));
                            }
                        }
                    );
            });
        }
    });
};

const openRepository = function (name, path) {
    const git = gitP(path);
    return git.checkIsRepo()
        .then(isRepo => {
            if (isRepo) {
                console.log(`Found ${name} at ${path}`);
                return git;
            } else {
                throw ('No repo');
            }
        })
        .catch(err => console.error(colors.red(`Cannot open ${path}`, err)));
};

const checkoutRepository = function (name, root, settings, options) {
    const { noFetch, reset, lastTag, https, defaultToMaster, allMaster } = options || {};
    const pathToRepo = path.join(root, name);
    let url = settings.url;
    if (https && settings.https) {
        url = settings.https;
    }
    const promise = !fs.existsSync(pathToRepo) ? cloneRepository(name, pathToRepo, url) :
        openRepository(name, pathToRepo);
    return promise.then(git => {
        if (!!git) {
            return setHead(name, git, settings, {reset, lastTag, noFetch, defaultToMaster, allMaster})
                .then(() => git.log())
                .then(commits => {
                    const tags = commits.latest.refs.split(', ').filter(ref => ref.includes('tag: '));
                    return tags.length > 0 ? tags[0].slice(5) : '';
                });
        } else {
            console.error(colors.red(`Cannot checkout ${name}`))
        }
    });
};

const develop = async function develop(options) {
    // Read in mrs.developer.json.
    const raw = fs.readFileSync(path.join(options.root || '.', 'mrs.developer.json'));
    const pkgs = JSON.parse(raw);
    const repoDir = getRepoDir(options.root, options.output);
    const paths = {};
    // Checkout the repos.
    for (let name in pkgs) {
        const settings = pkgs[name];
        const res = await checkoutRepository(name, repoDir, settings, options);
        if (options.lastTag) {
            pkgs[name].tag = res;
        }
        const packageId = settings.package || name;
        let packagePath = path.join('.', options.output || DEVELOP_DIRECTORY, name);
        if (settings.path) {
            packagePath = path.join(packagePath, settings.path);
        }
        paths[packageId] = [packagePath.replace(/\\/g, '/')]; // we do not want Windows separators here
    }

    if (!options.noConfig) {
        // update paths in configFile
        const configFile = options.configFile || 'tsconfig.json';
        const tsconfig = JSON.parse(fs.readFileSync(path.join(options.root || '.', configFile)));
        tsconfig.compilerOptions.paths = paths;
        tsconfig.compilerOptions.baseUrl = 'src';
        console.log(colors.yellow(`Update paths in tsconfig.json\n`));
        fs.writeFileSync(path.join(options.root || '.', configFile), JSON.stringify(tsconfig, null, 4));
    }
    // update mrs.developer.json with last tag if needed
    if (options.lastTag) {
        fs.writeFileSync(path.join(options.root || '.', 'mrs.developer.json'), JSON.stringify(pkgs, null, 4));
        console.log(colors.yellow(`Update tags in mrs.developer.json\n`));
    }
};

exports.cloneRepository = cloneRepository;
exports.openRepository = openRepository;
exports.setHead = setHead;
exports.checkoutRepository = checkoutRepository;
exports.getRepoDir = getRepoDir;
exports.develop = develop;