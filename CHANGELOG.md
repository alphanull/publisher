# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org) and follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

---

## [1.5.0] – 2025-04-06

### Added

- This marks the first public release of **Publisher**
- Publish/Subscribe architecture with topic hierarchy
- Wildcard support in subscriptions (`*`)
- Persistent message storage and late delivery
- Subscription priority and invocation limits
- Conditional subscriptions via `condition` function
- Global configuration via `configure()`
- Support for both ES Modules and CommonJS (`require`) as well as UMD (global `publisher`)
- Minified build output via Rollup (ESM + UMD)

---