# Changelog

## [0.6.0](https://github.com/Texarkanine/inquirerjs-checkbox-search/compare/v0.5.1...v0.6.0) (2025-06-17)


### ⚠ BREAKING CHANGES

* **ui:** always add buffer value if specified

### Features

* **demos:** Add custom theme demo and refactor generation process ([#30](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/30)) ([c12918d](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/c12918da468712aeeb5488159cde7e6fadfc6068))
* **theme:** add theme.icon.nocursor option for custom cursor spacing ([c12918d](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/c12918da468712aeeb5488159cde7e6fadfc6068))


### Bug Fixes

* **ci:** was not correctly detecting demo preview comments on PRs ([c12918d](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/c12918da468712aeeb5488159cde7e6fadfc6068))
* **perf:** micro-optimize don't re-resolve noCursorIcon each time ([c12918d](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/c12918da468712aeeb5488159cde7e6fadfc6068))
* **perf:** optimize renderItem function to avoid O(N²) operations and unnecessary closures ([c12918d](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/c12918da468712aeeb5488159cde7e6fadfc6068))
* **ui:** always add buffer value if specified ([c12918d](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/c12918da468712aeeb5488159cde7e6fadfc6068))

## [0.5.1](https://github.com/Texarkanine/inquirerjs-checkbox-search/compare/v0.5.0...v0.5.1) (2025-06-15)


### Bug Fixes

* strip whitespace from wc output to prevent arithmetic expansion errors ([877b5f9](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/877b5f90f93a642ac849080adc8cccbd101eb81e))

## [0.5.0](https://github.com/Texarkanine/inquirerjs-checkbox-search/compare/v0.4.0...v0.5.0) (2025-06-15)


### Features

* **demo:** implement PR-based demo naming and smart cleanup system ([#15](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/15)) ([bec7b99](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/bec7b996dda5cbece92ed41e0e01c2ed7e24dc47))


## [0.4.0](https://github.com/Texarkanine/inquirerjs-checkbox-search/compare/v0.3.0...v0.4.0) (2025-06-14)


### Features

* Comprehensive demo GIF CI/CD workflow with VHS Docker integration ([#12](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/12)) ([f3f38ff](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/f3f38ff364f22f814de2d4c712ac54081d5af8f7))

## [0.3.0](https://github.com/Texarkanine/inquirerjs-checkbox-search/compare/v0.2.1...v0.3.0) (2025-06-13)


### Features

* add advanced PageSize configuration with auto-buffering support ([#10](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/10)) ([18cc792](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/18cc79274fff69dc1e0efd653f98e91aee5d0c42))

## [0.2.1](https://github.com/Texarkanine/inquirerjs-checkbox-search/compare/v0.2.0...v0.2.1) (2025-06-13)


### Bug Fixes

* **tests:** resolve test race conditions and improve reliability ([#8](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/8)) ([2f74b08](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/2f74b08b095b45deec80ed5096af2473549a1f1e))

## [0.2.0](https://github.com/Texarkanine/inquirerjs-checkbox-search/compare/v0.1.2...v0.2.0) (2025-06-13)


### Features

* **description:** move descriptions from inline to bottom display ([7102295](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/710229536868c42217764faa746cebd94fef308b))
* **examples:** add separators to examples/fruits.js ([7102295](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/710229536868c42217764faa746cebd94fef308b))
* **ui:** automatic page sizing based on terminal height ([7102295](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/710229536868c42217764faa746cebd94fef308b))


### Bug Fixes

* **deps:** bump vitest to 3.x & remove unused ansi-escapes ([7102295](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/710229536868c42217764faa746cebd94fef308b))
* **deps:** put ansi-escapes back in explicit deps; we use it ([62be6a0](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/62be6a0d606031473a13caf6a47b375773951da7))
* **instructions:** 'instructions' were not used in UI ([7102295](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/710229536868c42217764faa746cebd94fef308b))
* prevent tab key search pollution + enhance UI descriptions ([#6](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/6)) ([7102295](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/710229536868c42217764faa746cebd94fef308b))
* **separator:** resolve separator navigation bug that caused wrong item selection ([7102295](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/710229536868c42217764faa746cebd94fef308b))
* **tests:** many test quality improvements ([7102295](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/710229536868c42217764faa746cebd94fef308b))
* **ui:** do not write to TTY when there is no TTY ([7102295](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/710229536868c42217764faa746cebd94fef308b))

## [0.1.2](https://github.com/Texarkanine/inquirerjs-checkbox-search/compare/v0.1.1...v0.1.2) (2025-06-10)


### Bug Fixes

* **ci:** normalize repository URL format for npm publishing ([bbb658c](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/bbb658c24ff85cfa72020096d8172b15c5ffe4f8))

## [0.1.1](https://github.com/Texarkanine/inquirerjs-checkbox-search/compare/v0.1.0...v0.1.1) (2025-06-10)


### Bug Fixes

* **ci:** prettier was checking release-please's CHANGELOG.md ([1ee608e](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/1ee608ea4316a3ea6eab2d82cc24b69f3fe5f27d))

## 0.1.0 (2025-06-10)


### Features

* initial launch of inquirerjs-checkbox-search ([#1](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/1)) ([5f3d1f0](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/5f3d1f007c869d6050b9e6db8b1ebe638ee6f068))


### Bug Fixes

* add issues:write permission for release-please to create labels ([c1f1325](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/c1f1325ac3148734e011f7a60d761cb374a6f8f7))
* **ci:** configure release-please for 0.1.0 initial release ([5ee62d6](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/5ee62d616ac3a6592c75f5f7482ed20df3a6ef97))
* release-please config ([b4cf1ec](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/b4cf1ec0d2c6832f843963436f020e1190e2694e))
* set explicit initial-version 0.1.0 in release-please config - Add initial-version: 0.1.0 to force starting version - Update package.json version to 0.0.1 for consistency - This should override release-please default 1.0.0 for initial releases ([61cbc8e](https://github.com/Texarkanine/inquirerjs-checkbox-search/commit/61cbc8ed55faa05a71ce81d09aaecce643f13bb0))
