# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-28

### 🎉 Major Release - v2.0

이 릴리스는 여러 새로운 기능과 개선사항을 포함합니다!

### Added

- ✨ **HTTP Client Selection**: axios와 ky 중 선택 가능
  - `--http-client` CLI 옵션 추가
  - `httpClient` config 옵션 추가
  - axios와 ky 전용 템플릿 분리

- ♾️ **Infinite Query 자동 생성**: 페이지네이션 엔드포인트에 대해 `useInfiniteQuery` 훅 자동 생성
  - `page`, `cursor`, `offset`, `pageToken` 파라미터 자동 감지
  - 페이지네이션 타입에 맞는 `getNextPageParam`, `getPreviousPageParam` 로직 생성
  - 모든 페이지네이션 전략 지원

- ⚙️ **Config 파일 지원**: `swagger-codegen.config.js` 파일로 설정 관리
  - Config 파일 자동 로드
  - CLI 인수가 config 파일 설정보다 우선
  - 환경 변수 지원

- 👀 **Watch 모드**: 파일 변경 감지 시 자동 재생성
  - `--watch` CLI 옵션 추가
  - 로컬 파일 변경 감지 (chokidar)
  - 원격 URL 폴링 (ETag/Last-Modified)
  - Graceful shutdown 지원

- 🎯 **Module Filtering**: 특정 모듈만 선택적으로 생성
  - `--include` 옵션: 특정 모듈만 생성
  - `--exclude` 옵션: 특정 모듈 제외
  - Config 파일에서도 설정 가능

### Changed

- 🔄 **Breaking**: HTTP 클라이언트 기본값이 `ky`에서 `axios`로 변경
  - 기존 ky 사용자는 `httpClient: 'ky'` 설정 필요

- 📁 **템플릿 구조 재구성**
  - `templates/modular/axios/` - axios 전용 템플릿
  - `templates/modular/ky/` - ky 전용 템플릿
  - `templates/tanstack-query/axios/` - axios mutation 템플릿
  - `templates/tanstack-query/ky/` - ky mutation 템플릿

- 📦 **의존성 업데이트**
  - `chokidar@^3.5.3` 추가 (watch 모드)

### Migration

**v1.x에서 v2.0으로 마이그레이션:**

기존 ky 사용자는 config 파일에 다음 설정을 추가하세요:

```javascript
// swagger-codegen.config.js
export default {
  httpClient: 'ky',
};
```

새로운 사용자는 별도 설정 없이 axios가 기본값으로 사용됩니다.

## [1.0.2] - 2024-XX-XX

### Fixed

- 프로젝트의 prettier 설정 자동 적용

## [1.0.1] - 2024-XX-XX

### Changed

- README.md 업데이트
- package.json 메타데이터 개선

## [1.0.0] - 2024-XX-XX

### Added

- 🎉 Initial release
- ky HTTP 클라이언트 기반 API 생성
- TanStack Query 훅 생성 (useQuery, useMutation)
- FSD 패턴 지원
- TypeScript 완전 지원
- Prettier 설정 자동 적용

---

[2.0.0]: https://github.com/sen-jik/swagger-autogen/compare/v1.0.2...v2.0.0
[1.0.2]: https://github.com/sen-jik/swagger-autogen/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/sen-jik/swagger-autogen/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/sen-jik/swagger-autogen/releases/tag/v1.0.0
