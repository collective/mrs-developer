# mrs-developer

[![Build Status](https://travis-ci.com/collective/mrs-developer.svg?branch=master)](https://travis-ci.com/collective/mrs-developer)

mrs-developer is an NodeJS utility that makes it easy to work with NPM projects containing lots of packages, of which you only want to develop some.

Note: [mr-developer](https://github.com/collective/mr-developer) is mrs-developer's predecessor. It is now obsolete. mr-developer has a dependency to nodegit which is painful to install. mrs-developer depends on simple-git, which does not build the Git library (it just requires to have the git command avaialble in the environment).

It allows to replace any given dependency with a checkout from its Git repository.

![screenshot](https://raw.githubusercontent.com/collective/mrs-developer/master/docs/mrs-developer.jpeg "Console screenshot")

The paths to those local checkouts are added in `tsconfig.json` or in `tsconfig.base.json` if it exists (or `jsconfig.json` if we don't use TypeScript).

Dependencies are listed in a file named `mrs.developer.json`:

```json
  {
        "ngx-tooltip": {
            "url": "https://github.com/pleerock/ngx-tooltip.git"
        },
        "angular-traversal": {
            "url": "https://github.com/makinacorpus/angular-traversal",
            "branch": "test-as-subproject"
        },
        "plone.restapi-angular": {
            "path": "src/lib",
            "package": "@plone/restapi-angular",
            "url": "git@github.com:plone/plone.restapi-angular.git",
            "https": "https://github.com/plone/plone.restapi-angular.git",
            "tag": "1.3.1"
        }
    }
```

It also supports mono-repositories with the `packages` attribute providing a dictionnary of package ids / pathes:
```json
  {
        "angular": {
            "url": "https://github.com/angular/angular.git",
            "packages": {
                "@angular/core": "/packages/core",
                "@angular/forms": "/packages/forms"
            }
        }
    }
```

By using the `local` property, we can declare a path that will be added in `tsconfig.json` (no repository will be pulled):
```json
   {
        "my-package": {
            "local": "lib/my/package"
        }
    }
```

By running the `missdev` command, those repositories will be checked out in the `./src/develop` folder and they will be added into the `tsconfig.json` file in the `paths` property, so the compiler will use them instead of the `node_modules` ones.

Existing `paths` entries will be preserved if they do not parget a folder located in `src/develop`.

## Usage

```
$ missdev
```
will fetch last changes from each repositories, and checkout the specified branch.

If a repository contains non committed changes or if the merge has conflicts, it will not be updated, and the user will have to update it manually.

```
$ missdev --no-fetch
```
will just checkout the specified branches or tags without fetching the remote repositories.

```
$ missdev --hard
```
will do a hard reset before updating, so local changes are overriden.

```
$ missdev --last-tag
```
will get the last tag (according version sorting) for each epository and will update `mrs.developer.json` accordingly.

```
$ missdev --config=jsconfig.json
```
allows to update a different file than `tsconfig.json` (might be useful in non-Angular context).

```
$ missdev --no-config
```
will not write any config

```
$ missdev --output=myfolder
```
will checkout the files in src/myfolder

```
$ missdev --https
```
will use the `https` entry (if it exists) instead of the `url` entry for each repository

```
$ missdev --default-to-master
```
will checkout the master branch if the requested branch or tag does no exist in the repository.

```
$ missdev --all-master
```
will checkout the master branch even though another branch or tag is mentioned in `mrs.developer.json`.

## Config file structure

The entry key is used to name the folder where we checkout the repository in `./src/develop`.

Properties:

- `package`: Optional. Name of the package that will be mention in `paths`. If not provided, defauklt to entry key.
- `path`: Optional. Source path in the repository. Will be concatenated to the local repository path in `tsconfig.json`.
- `url`: Mandatory. Git repository remote URL.
- `branch`: Optional. Branch name, default to `master`. Ignored if `tag` is defined.
- `tag`: Optional. Tag name.

## Usage with React

Create a minimal `jsconfig.json` file in the project root (see https://code.visualstudio.com/docs/languages/jsconfig):

```
{
    "compilerOptions": {}
}
```

And run:

```
$ missdev --config=jsconfig.json
```

To make sure the `jsconfig.json` paths defined by mrs-developer are used in Webpack, change your `webpack.config.js` like this:

```
const pathsConfig = require('./jsconfig').compilerOptions.paths;
const alias = {};
Object.keys(pathsConfig).forEach(package => {
  alias[package] = pathsConfig[package][0];
});

...

resolve: {
    ...
    alias: alias
}
```

## Credits

mrs-developer is shamelessly inspired by the well-known [mr.developer](https://pypi.python.org/pypi/mr.developer) Python buildout extension.
