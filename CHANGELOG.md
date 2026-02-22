# Changelog

## 1.0.5

- Rebased behavior to the 1.0.2 line.
- Fixed only one issue in TanStack mutation key generation:
  - when API path segments contain `-`, generated mutation key identifiers now use `_`.
  - example: `undo-upload` -> `UNDO_UPLOAD`
- No stale-file prune behavior.
- No generated folder/template structure changes.

## 1.0.4

- Added stale generated module pruning (enabled by default) so removed/renamed Swagger tags no longer leave old `entities/{module}/api/*` files behind.
- Added `--prune-stale <true|false>` option to control stale-file pruning behavior.
- Fixed axios template method generation to use correct axios signatures:
  - `post/put/patch(url, data, config)`
  - `delete(url, config)` with optional `data` in config
  - `get(url, config)` and other non-body methods.
- This resolves mixed-client leftovers (for example stale `ky` modules) when regenerating with `--http-client axios`.

## 1.0.3

- Fixed invalid TypeScript identifiers in generated mutation keys when API paths contain `-` (for example `undo-upload`, `applied-campaigns`, `notification-settings`, `custom-filters`).
- Added stable HTTP client selection via `--http-client <ky|axios>` (default: `ky` for backward compatibility).
- Updated generated API templates to emit correct imports/types/calls for both `ky` and `axios`.
- Updated TanStack mutation template to emit client-specific variable types and options (`KyInstance/Options` or `AxiosInstance/AxiosRequestConfig`).
