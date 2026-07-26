# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-07-02

### Added
- **Stateful Connection Settings Configuration (`config` command)**: Added network connections configuration storage (`default-network`, `grpc-endpoint`, `mainnet-endpoint`, `testnet-endpoint`) to prevent repetitive flags. Resolves defaults hierarchically: CLI flag > ENV variable > Config Store (`conf`) > Hardcoded default.
- **Interactive Prompts & Empathic CLI UI**: Wired step-by-step interactive prompts using the `prompts` library when required CLI arguments or flags are omitted in interactive TTY sessions. Exits cleanly with code 1 in non-TTY environments.
- **Piped STDIN Support**: Added support for reading input variables (such as addresses, messages, transaction details) directly from piped STDIN when `-` is passed as the argument or omitted in standard terminal pipelines.
- **QRL v1.0 Native Token Creation (`token:create`)**: Implemented support for creating new tokens on the QRL network, specifying symbol, name, decimal precision, and custom initial holder balances.
- **QRL v1.0 Native Token Transfer (`token:transfer`)**: Implemented support for transferring existing custom tokens to one or more recipient addresses.
- **GitHub Actions CI Workflow**: Added a secure, hardened GitHub Actions CI workflow (`.github/workflows/ci.yml`) pinned to secure git commit SHAs, audited using `actionlint` and verified by `zizmor` with zero security warnings.
- **Config & Token Test Suites**: Created unit test suites to verify parameters validation, TTY guards, and config state changes (`test/commands/config.test.js`, `test/commands/token.test.js`).

### Changed
- **Unified Network Resolution**: Migrated all query and transaction commands (`balance`, `send`, `list-transactions`, `status`, `ots`, `validate`, `notarize`, `send-message`, `generate-shared-keys`, `generate-lattice-keys`) to fetch settings using the new connection precedence rules and the config store.
- **Standardized `--json` Query Output**: Updated `balance`, `list-transactions`, `status`, `ots`, and `validate` to support the `--json` output flag. When enabled, spinner logs, connection status, and decorative banners are suppressed from standard output, writing only valid, parseable JSON payloads.
- **Upgraded Dependencies**: Swapped out the deprecated `"crypto"` dependency from `package.json` to use `"conf"` and `"prompts"`. Removed old security vulnerabilities.
- **Documentation Updates**: Auto-generated CLI commands references in the `README.md` documentation by running the Oclif build routines.

### Fixed
- **Test Suite: `list-transactions` hook timeouts**: Increased all per-hook mocha `this.timeout()` values from 15–30 s to 60 s to account for the 5-second rate-limit delay plus real gRPC round-trip time. Changed test #10 (`--limit` flag) to use a testnet address with a bounded transaction set, preventing the unlimited pagination loop that caused intermittent timeouts on mainnet.
- **`generate-shared-keys` loader deadlock**: Corrected the `waitForKYBLIB` and `waitForDILLIB` polling functions, which were incorrectly cross-checking each other's `*Loaded` flags. Each function now independently checks its own library's exported function for readiness, eliminating the infinite-loop hang during test setup.
- **Mocha global timeout**: Increased global mocha timeout to 240 000 ms (`-t 240000`) in `package.json` to give networked tests sufficient headroom without hitting the runner's default 2-second cap.
