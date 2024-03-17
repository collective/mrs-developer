# mrs-developer Release Notes

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/volto/developer-guidelines/contributing.html#create-a-pull-request
-->

<!-- towncrier release notes start -->

## 2.2.0 (2024-03-17)

### Feature

- Added per repository `output` parameter @sneridagh [#40](https://github.com/plone/volto/issues/40)

# 2.1.1 (2023-06-05)

- `develop` option to deactivate a package without losing the corresponding configuration [sneridagh]

# 2.1.1 (2023-06-05)

- `develop` option to deactivate a package without losing the corresponding configuration [sneridagh]

# 2.1.0 (2022-12-22)

- Parallelize the repository actions. For the case of large number of packages (ex: 40), there's a 20x speedup in operation [tiberiuichim]
- Install Prettier, reformat code using Prettier [tiberiuichim]

# 2.0.0 (2022-10-27)

- Support default branch names other than master and main [davisagli]
- Rename `--default-to-master` option to `--fallback-to-default-branch`
- Rename `--all-master` option to `--force-default-branch`

# 1.7.1 (2022-03-22)

- Use main branch when master is not available [giuliaghisini]

# 1.7.0 (2022-03-19)

- Upgrade to simple-git 3.3.0 [ebrehault]

# 1.6.1 (2022-01-10)

- replace colors js mith chalk

# 1.6.0 (2021-02-03)

- Allow setting a package as non-develop by setting `"develop": false` in
  mrs-developer.json, for any package configuration. @tiberiuichim

# 1.5.0 (2020-11-23)

- Added the option to separate fetch and push urls

# 1.4.0 (2020-06-29)

- Use tsconfig.base.json by default if it exists
- Do not enforce baseUrl to ./src
- Preserve existing paths (if not in src/develop)

# 1.3.0 (2020-06-22)

- Support local paths to be added in tsconfig.json

# 1.2.0 (2020-05-08)

- Support for mono-repositories

# 1.1.6 (2020-03-05)

- Fix typo in command options

# 1.1.5 (2020-03-05)

- Add `--all-master` option

# 1.1.4 (2020-03-03)

- Fix `--last-tag` option
- Add `--default-to-master` option

# 1.1.3 (2019-06-26)

- Display error properly

# 1.1.2 (2019-06-25)

- Do not crash if tag does not exist

# 1.1.1 (2019-06-22)

- Fetch from origin before checkout tag

# 1.1.0 (2019-06-21)

- Add the --https option to support a secondary repository URL

# 1.0.0 (2019-06-21)

- Adapt mr.developer implementation
