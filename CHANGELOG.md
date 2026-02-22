# Changelog

## 1.0.3

- Fixed invalid TypeScript identifiers in generated mutation keys when API paths contain `-` (for example `undo-upload`, `applied-campaigns`, `notification-settings`, `custom-filters`).
- Added stable HTTP client selection via `--http-client <ky|axios>` (default: `ky` for backward compatibility).
- Updated generated API templates to emit correct imports/types/calls for both `ky` and `axios`.
- Updated TanStack mutation template to emit client-specific variable types and options (`KyInstance/Options` or `AxiosInstance/AxiosRequestConfig`).
