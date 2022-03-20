# 1.7.0 (2022-03-19)

- Upgarde to simple-git 3.3.0 [ebrehault]

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
