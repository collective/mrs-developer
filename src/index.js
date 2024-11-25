'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const gitP = require('simple-git');
const parallel = require('async/parallel');

const currentPath = process.cwd();

const DEVELOP_DIRECTORY = 'develop';

function getRemotePath(url) {
  if (url.startsWith('.')) {
    return `${currentPath}/${url}`;
  } else {
    return url;
  }
}

function getRepoDir({ root, output }, { output: pkgOutput } = {}) {
  // Check for download directory; create if needed.
  const repoDir = path.join(
    root || '.',
    pkgOutput ? '' : 'src',
    pkgOutput || output || DEVELOP_DIRECTORY,
  );
  if (!fs.existsSync(repoDir)) {
    console.log(`\nCreating repoDir ${repoDir}`);
    fs.mkdirSync(repoDir);
  } else {
    console.log(`\nUsing ${repoDir}`);
  }
  return repoDir;
}

function getDefaultBranch(repository) {
  return repository
    .revparse(['--abbrev-ref', 'origin/HEAD'])
    .then((result) => result.replace('origin/', ''));
}

function cloneRepository(name, path, url, fetchUrl, options = {}) {
  console.log(`Cloning ${name} from ${fetchUrl || url}...`);
  const { noDepth, tag, branch } = options;
  const cloneOptions =
    noDepth && (tag || branch)
      ? ['-b', tag || branch, '--filter=blob:none']
      : undefined;
  return gitP()
    .clone(getRemotePath(fetchUrl || url), path, cloneOptions)
    .then(() => {
      if (fetchUrl) {
        return gitP(path).remote([
          'set-url',
          '--push',
          'origin',
          getRemotePath(url),
        ]);
      }
    })
    .then(() => {
      console.log(chalk.green(`✓ cloned ${name} at ${path}`));
    })
    .then(() => gitP(path))
    .catch((err) =>
      console.error(chalk.red(`Cannot clone ${fetchUrl || url}`, err)),
    );
}

function setHead(name, repository, settings, options) {
  const {
    reset,
    lastTag,
    noFetch,
    fallbackToDefaultBranch,
    forceDefaultBranch,
  } = options || {};
  let promise;
  if (reset) {
    promise = repository
      .reset('hard')
      .then(() => console.log(chalk.yellow.inverse(`Hard reset in ${name}.`)));
  } else {
    promise = repository.status().then((status) => {
      if (status.files.length > 0) {
        console.log(
          chalk.yellow.inverse(
            `Cannot update ${name}. Commit your changes first.`,
          ),
        );
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
      if (!forceDefaultBranch && lastTag) {
        return fetchOrNot
          .then(() => repository.checkoutLatestTag())
          .then(() => console.log(chalk.green(`✓ update ${name} to last tag`)));
      } else if (!forceDefaultBranch && settings.tag) {
        return fetchOrNot
          .then(() => repository.checkout(settings.tag))
          .then(
            () =>
              console.log(
                chalk.green(`✓ update ${name} to tag ${settings.tag}`),
              ),
            () => {
              console.error(
                chalk.red(`✗ tag ${settings.tag} does not exist in ${name}`),
              );
              if (fallbackToDefaultBranch) {
                return getDefaultBranch(repository).then((defaultBranch) => {
                  return repository
                    .checkout(defaultBranch)
                    .then(() =>
                      console.log(
                        chalk.yellow(
                          `✓ update ${name} to {defaultBranch} instead of ${settings.tag}`,
                        ),
                      ),
                    );
                });
              } else {
                return Promise.resolve(true);
              }
            },
          );
      } else {
        return fetchOrNot
          .then(() => getDefaultBranch(repository))
          .then((defaultBranch) => {
            let branch = !forceDefaultBranch
              ? settings.branch || defaultBranch
              : defaultBranch;
            return repository
              .checkout(branch)
              .then(() => {
                if (!noFetch) {
                  return repository
                    .pull('origin', branch, { '--rebase': 'true' })
                    .catch(() =>
                      console.error(
                        chalk.yellow.inverse(
                          `Cannot merge origin/${branch}. Please merge manually.`,
                        ),
                      ),
                    );
                } else {
                  return Promise.resolve(true);
                }
              })
              .then(
                () =>
                  console.log(
                    chalk.green(`✓ update ${name} to branch ${branch}`),
                  ),
                () => {
                  console.error(
                    chalk.red(`✗ branch ${branch} does not exist in ${name}`),
                  );
                  if (fallbackToDefaultBranch) {
                    return repository
                      .checkout(defaultBranch)
                      .then(() =>
                        console.log(
                          chalk.yellow(
                            `✓ update ${name} to ${defaultBranch} instead of ${branch}`,
                          ),
                        ),
                      );
                  }
                },
              );
          });
      }
    }
  });
}

function openRepository(name, path) {
  const git = gitP(path);
  return git
    .checkIsRepo()
    .then((isRepo) => {
      if (isRepo) {
        console.log(`Found ${name} at ${path}`);
        return Promise.resolve(true);
      } else {
        throw `No repo: ${name}`;
      }
    })
    .then(() => gitP(path))
    .catch((err) => console.error(chalk.red(`Cannot open ${path}`, err)));
}

function checkoutRepository(name, root, settings, options) {
  const {
    noFetch,
    reset,
    lastTag,
    https,
    fetchHttps,
    fallbackToDefaultBranch,
    forceDefaultBranch,
  } = options || {};
  const pathToRepo = path.join(root, name);
  let url = settings.url;
  let fetchUrl;
  if (https && settings.https) {
    url = settings.https;
  } else if (fetchHttps && settings.https) {
    fetchUrl = settings.https;
  }
  const promise = !fs.existsSync(pathToRepo)
    ? cloneRepository(name, pathToRepo, url, fetchUrl, options)
    : openRepository(name, pathToRepo);
  return promise.then((git) => {
    if (git) {
      return setHead(name, git, settings, {
        reset,
        lastTag,
        noFetch,
        fallbackToDefaultBranch,
        forceDefaultBranch,
      })
        .then(() => git.log())
        .then((commits) => {
          const tags = commits.latest.refs
            .split(', ')
            .filter((ref) => ref.includes('tag: '));
          return tags.length > 0 ? tags[0].slice(5) : '';
        });
    } else {
      console.error(chalk.red(`Cannot checkout ${name}`));
      return Promise.resolve(false);
    }
  });
}

async function developPackage(pkg, name, options) {
  let gitTag;
  const paths = {};
  const repoDir = getRepoDir(options, pkg);

  if (!pkg.local) {
    gitTag = await checkoutRepository(name, repoDir, pkg, options);
    const packages = pkg.packages || { [pkg.package || name]: pkg.path };
    Object.entries(packages).forEach(([packageId, subPath]) => {
      let packagePath = path.join(
        '.',
        options.output || DEVELOP_DIRECTORY,
        name,
      );
      if (subPath) {
        packagePath = path.join(packagePath, subPath);
      }
      paths[packageId] = [packagePath.replace(/\\/g, '/')]; // we do not want Windows separators here
    });
  } else {
    paths[pkg.package || name] = [pkg.local];
  }

  return { gitTag, pkgPaths: paths, name };
}

async function developPackages(pkgs, options) {
  const developedPackages = Object.keys(pkgs).filter(
    (name) => pkgs[name].develop ?? true,
  );
  const paths = {};
  const tasks = developedPackages.map(
    (name) => async () => await developPackage(pkgs[name], name, options),
  );

  let results = [];
  try {
    results = await parallel(tasks);
  } catch (err) {
    console.log('Error:', err);
  }

  results.forEach(({ gitTag, pkgPaths, name }) => {
    const pkg = pkgs[name];
    if (options.lastTag) {
      pkg.tag = gitTag;
    }
    Object.assign(paths, pkgPaths);
  });

  return { paths, pkgs, developedPackages };
}

async function develop(options) {
  // Read in mrs.developer.json.
  const raw = fs.readFileSync(
    path.join(options.root || '.', 'mrs.developer.json'),
  );
  const rawPkgs = JSON.parse(raw);

  // Checkout the repos.
  const { paths, pkgs, developedPackages } = await developPackages(
    rawPkgs,
    options,
  );

  if (!options.noConfig) writeConfigFile(paths, options, developedPackages);

  // update mrs.developer.json with last tag if needed
  if (options.lastTag) {
    fs.writeFileSync(
      path.join(options.root || '.', 'mrs.developer.json'),
      JSON.stringify(pkgs, null, 4),
    );
    console.log(chalk.yellow('Update tags in mrs.developer.json\n'));
  }
}

function disabledPackages(options) {
  const mrsDeveloperJSON = JSON.parse(
    fs.readFileSync(path.join(options.root || '.', 'mrs.developer.json')),
  );

  return Object.entries(mrsDeveloperJSON || {})
    .filter(([name, config]) => config.develop === false)
    .reduce((acc, [name, config]) => {
      acc.push(config.package || name);
      return acc;
    }, []);
}

function writeConfigFile(paths, options, developedPackages) {
  // update paths in configFile
  const defaultConfigFile = fs.existsSync('./tsconfig.base.json')
    ? 'tsconfig.base.json'
    : 'tsconfig.json';
  const configFile = options.configFile || defaultConfigFile;
  const tsconfig = JSON.parse(
    fs.readFileSync(path.join(options.root || '.', configFile)),
  );
  const baseUrl = tsconfig.compilerOptions.baseUrl;

  const nonDevelop = Object.entries(tsconfig.compilerOptions.paths || {})
    .filter(
      ([pkg, path]) =>
        !developedPackages.includes(pkg) &&
        !path[0].startsWith(
          baseUrl === 'src'
            ? `${DEVELOP_DIRECTORY}/`
            : `src/${DEVELOP_DIRECTORY}`,
        ),
    )
    .filter(([pkg, path]) => !disabledPackages(options).includes(pkg))
    .reduce((acc, [pkg, path]) => {
      acc[pkg] = path;
      return acc;
    }, {});

  const updates = Object.entries(paths).reduce((acc, [pkg, path]) => {
    acc[pkg] = baseUrl === 'src' ? path : [`src/${path[0]}`];
    return acc;
  }, {});

  tsconfig.compilerOptions.paths = { ...nonDevelop, ...updates };
  console.log(chalk.yellow(`Update paths in ${configFile}\n`));
  fs.writeFileSync(
    path.join(options.root || '.', configFile),
    JSON.stringify(tsconfig, null, 4),
  );
}

module.exports = {
  cloneRepository,
  openRepository,
  setHead,
  checkoutRepository,
  getRepoDir,
  develop,
  developPackage,
  developPackages,
};
