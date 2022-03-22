'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const gitP = require('simple-git');
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

const cloneRepository = function (name, path, url, fetchUrl) {
  fs.mkdirSync(path);
  const git = gitP(path);
  return git
    .init()
    .then(() => {
      if (fetchUrl) {
        return git
          .remote(['add', 'origin', getRemotePath(fetchUrl)])
          .then(() => git.remote(['set-url', '--push', 'origin', getRemotePath(url)]));
      } else {
        return git.remote(['add', 'origin', getRemotePath(url)]);
      }
    })
    .then(() => {
      console.log(`Cloning ${name} from ${url}...`);
      return git.fetch();
    })
    .then(() => {
      console.log(chalk.green(`✓ cloned ${name} at ${path}`));
      return git.checkout('master');
    })
    .catch((err) => {
      console.log(chalk.green(`!Cannot clone 'master' branch. Try to clone 'main' branch'...(${name} at ${path})`));
      return git.checkout('main');
    })
    .then(() => gitP(path))
    .catch((err) => console.error(chalk.red(`Cannot clone ${url}`, err)));
};

const setHead = function (name, repository, settings, options) {
  const { reset, lastTag, noFetch, defaultToMaster, allMaster } = options || {};
  let promise;
  if (reset) {
    promise = repository.reset('hard').then(() => console.log(chalk.yellow.inverse(`Hard reset in ${name}.`)));
  } else {
    promise = repository.status().then((status) => {
      if (status.files.length > 0) {
        console.log(chalk.yellow.inverse(`Cannot update ${name}. Commit your changes first.`));
        return { abort: true };
      } else {
        return {};
      }
    });
  }
  return promise.then((res) => {
    if (!!res && res.abort) {
      return { abort: true };
    } else {
      const fetchOrNot = !noFetch ? repository.fetch() : Promise.resolve();
      if (!allMaster && lastTag) {
        return fetchOrNot
          .then(() => repository.checkout('master'))
          .catch((err) => repository.checkout('main'))
          .then(() => repository.checkoutLatestTag())
          .then(() => console.log(chalk.green(`✓ update ${name} to last tag`)));
      } else if (!allMaster && settings.tag) {
        return fetchOrNot
          .then(() => repository.checkout(settings.tag))
          .then(
            () => console.log(chalk.green(`✓ update ${name} to tag ${settings.tag}`)),
            () => {
              console.error(chalk.red(`✗ tag ${settings.tag} does not exist in ${name}`));
              if (defaultToMaster) {
                return repository
                  .checkout('master')
                  .then(() => console.log(chalk.yellow(`✓ update ${name} to master instead of ${settings.tag}`)))
                  .catch((err) => {
                    return repository.checkout('main');
                  })
                  .then(() => console.log(chalk.yellow(`✓ update ${name} to main instead of ${settings.tag}`)));
              } else {
                return Promise.resolve(true);
              }
            }
          );
      } else {
        let branch = !allMaster ? settings.branch || 'master' : 'master';
        return fetchOrNot.then(() => {
          return repository
            .checkout(branch)
            .catch((err) => {
              branch = 'main';
              return repository.checkout(branch);
            })
            .then(() => {
              if (!noFetch) {
                return repository
                  .pull('origin', branch, { '--rebase': 'true' })
                  .catch(() =>
                    console.error(chalk.yellow.inverse(`Cannot merge origin/${branch}. Please merge manually.`))
                  );
              } else {
                return Promise.resolve(true);
              }
            })
            .then(
              () => console.log(chalk.green(`✓ update ${name} to branch ${branch}`)),
              () => {
                console.error(chalk.red(`✗ branch ${branch} does not exist in ${name}`));
                if (defaultToMaster) {
                  let defaultMasterBranch = 'master;';
                  return repository
                    .checkout('defaultMasterBranch')
                    .catch((err) => {
                      defaultMasterBranch = 'main';
                      return repository.checkout(defaultMasterBranch);
                    })
                    .then(() =>
                      console.log(chalk.yellow(`✓ update ${name} to ${defaultMasterBranch} instead of ${branch}`))
                    );
                }
              }
            );
        });
      }
    }
  });
};

const openRepository = function (name, path) {
  const git = gitP(path);
  return git
    .checkIsRepo()
    .then((isRepo) => {
      if (isRepo) {
        console.log(`Found ${name} at ${path}`);
        return Promise.resolve(true);
      } else {
        throw 'No repo';
      }
    })
    .then(() => gitP(path))
    .catch((err) => console.error(chalk.red(`Cannot open ${path}`, err)));
};

const checkoutRepository = function (name, root, settings, options) {
  const { noFetch, reset, lastTag, https, fetchHttps, defaultToMaster, allMaster } = options || {};
  const pathToRepo = path.join(root, name);
  let url = settings.url;
  let fetchUrl;
  if (https && settings.https) {
    url = settings.https;
  } else if (fetchHttps && settings.https) {
    fetchUrl = settings.https;
  }
  const promise = !fs.existsSync(pathToRepo)
    ? cloneRepository(name, pathToRepo, url, fetchUrl)
    : openRepository(name, pathToRepo);
  return promise.then((git) => {
    if (git) {
      return setHead(name, git, settings, { reset, lastTag, noFetch, defaultToMaster, allMaster })
        .then(() => git.log())
        .then((commits) => {
          const tags = commits.latest.refs.split(', ').filter((ref) => ref.includes('tag: '));
          return tags.length > 0 ? tags[0].slice(5) : '';
        });
    } else {
      console.error(chalk.red(`Cannot checkout ${name}`));
      return Promise.resolve(false);
    }
  });
};

const develop = async function develop(options) {
  // Read in mrs.developer.json.
  const raw = fs.readFileSync(path.join(options.root || '.', 'mrs.developer.json'));
  const pkgs = JSON.parse(raw);
  const repoDir = getRepoDir(options.root, options.output);
  const paths = {};

  const developPackages = [];

  // Checkout the repos.
  for (let name in pkgs) {
    const settings = pkgs[name];
    if (settings.develop === false) continue;
    developPackages.push(name);

    if (!settings.local) {
      const res = await checkoutRepository(name, repoDir, settings, options);
      if (options.lastTag) {
        pkgs[name].tag = res;
      }
      const packages = settings.packages || { [settings.package || name]: settings.path };
      Object.entries(packages).forEach(([packageId, subPath]) => {
        let packagePath = path.join('.', options.output || DEVELOP_DIRECTORY, name);
        if (subPath) {
          packagePath = path.join(packagePath, subPath);
        }
        paths[packageId] = [packagePath.replace(/\\/g, '/')]; // we do not want Windows separators here
      });
    } else {
      paths[settings.package || name] = [settings.local];
    }
  }

  if (!options.noConfig) {
    // update paths in configFile
    const defaultConfigFile = fs.existsSync('./tsconfig.base.json') ? 'tsconfig.base.json' : 'tsconfig.json';
    const configFile = options.configFile || defaultConfigFile;
    const tsconfig = JSON.parse(fs.readFileSync(path.join(options.root || '.', configFile)));
    const baseUrl = tsconfig.compilerOptions.baseUrl;
    const nonDevelop = Object.entries(tsconfig.compilerOptions.paths || {})
      .filter(
        ([pkg, path]) =>
          !developPackages.includes(pkg) &&
          !path[0].startsWith(baseUrl === 'src' ? `${DEVELOP_DIRECTORY}/` : `src/${DEVELOP_DIRECTORY}`)
      )
      .reduce((acc, [pkg, path]) => {
        acc[pkg] = path;
        return acc;
      }, {});
    const updates = Object.entries(paths).reduce((acc, [pkg, path]) => {
      acc[pkg] = baseUrl === 'src' ? path : [`src/${path[0]}`];
      return acc;
    }, {});
    tsconfig.compilerOptions.paths = { ...nonDevelop, ...updates };
    console.log(chalk.yellow(`Update paths in ${defaultConfigFile}\n`));
    fs.writeFileSync(path.join(options.root || '.', configFile), JSON.stringify(tsconfig, null, 4));
  }

  // update mrs.developer.json with last tag if needed
  if (options.lastTag) {
    fs.writeFileSync(path.join(options.root || '.', 'mrs.developer.json'), JSON.stringify(pkgs, null, 4));
    console.log(chalk.yellow('Update tags in mrs.developer.json\n'));
  }
};

exports.cloneRepository = cloneRepository;
exports.openRepository = openRepository;
exports.setHead = setHead;
exports.checkoutRepository = checkoutRepository;
exports.getRepoDir = getRepoDir;
exports.develop = develop;
