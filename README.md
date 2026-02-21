# swagger-fsd-gen

Swagger/OpenAPI 문서를 기반으로 **axios/ky + TanStack Query (with Infinite Query) + FSD(Feature-Sliced Design) 패턴**에 맞는 API 클라이언트를 자동으로 생성하는 도구입니다.

## ✨ 주요 기능

- 🔄 **HTTP 클라이언트 선택** - axios 또는 ky 중 선택 가능
- 🚀 **TanStack Query 완벽 지원**
  - `useQuery` - 일반 조회
  - `useSuspenseQuery` - Suspense 기반 조회
  - `useInfiniteQuery` - 페이지네이션 자동 생성 ⭐ NEW
  - `useMutation` - 데이터 변경
- 📁 **FSD(Feature-Sliced Design)** 패턴 자동 적용
- ⚙️ **Config 파일 지원** - `swagger-codegen.config.js`로 설정 관리
- 👀 **Watch 모드** - 파일 변경 감지 자동 재생성
- 🎯 **Module Filtering** - 특정 모듈만 선택적으로 생성
- 🔐 **HTTP Basic Authentication** 지원
- 📝 **TypeScript** 완전 지원 (타입 안전성)
- 🎨 **프로젝트의 Prettier 설정** 자동 적용

## 📦 설치

```bash
# npm
npm install -D swagger-fsd-gen

# yarn
yarn add -D swagger-fsd-gen

# pnpm
pnpm add -D swagger-fsd-gen
```

## 🚀 빠른 시작

### 1. Config 파일 생성 (권장)

프로젝트 루트에 `swagger-codegen.config.js` 파일을 생성합니다:

```javascript
export default {
  // Swagger 문서 URL
  uri: process.env.SWAGGER_URL || 'http://localhost:8000/api-json',

  // HTTP 클라이언트 선택 (axios 또는 ky)
  httpClient: 'axios', // 기본값

  // Basic Auth (선택사항)
  username: process.env.SWAGGER_USERNAME,
  password: process.env.SWAGGER_PASSWORD,

  // 출력 경로 커스터마이징 (선택사항)
  output: {
    dto: 'src/shared/api/dto.ts',
    api: 'src/entities/{moduleName}/api/index.ts',
    instance: 'src/entities/{moduleName}/api/instance.ts',
    queries: 'src/entities/{moduleName}/api/queries.ts',
    mutations: 'src/entities/{moduleName}/api/mutations.ts',
  },

  // Module Filtering (선택사항)
  // include: ['user', 'campaign'], // 특정 모듈만 생성
  // exclude: ['admin', 'internal'], // 특정 모듈 제외
};
```

### 2. 코드 생성

```bash
# npm
npx generate-all

# yarn
yarn generate-all

# pnpm
pnpm generate-all
```

## 📋 사용 방법

### CLI로 직접 실행

```bash
# 기본 사용법
generate-all --uri https://api.example.com/swagger.json

# HTTP 클라이언트 지정
generate-all --uri https://api.example.com/swagger.json --http-client ky

# Watch 모드 (자동 재생성)
generate-all --uri https://api.example.com/swagger.json --watch

# Module Filtering
generate-all --uri https://api.example.com/swagger.json --include user,campaign
generate-all --uri https://api.example.com/swagger.json --exclude admin,internal

# Basic Auth
generate-all --uri https://api.example.com/swagger.json --username admin --password secret
```

### package.json 스크립트 (권장)

```json
{
  "scripts": {
    "codegen": "generate-all",
    "codegen:watch": "generate-all --watch"
  }
}
```

실행:

```bash
npm run codegen
npm run codegen:watch
```

## 📁 생성되는 파일 구조

```
src/
├── shared/
│   └── api/
│       └── dto.ts              # DTO 타입 정의
└── entities/
    └── {moduleName}/           # Swagger 태그별 모듈
        └── api/
            ├── index.ts        # API 클래스
            ├── instance.ts     # API 인스턴스
            ├── queries.ts      # TanStack Query 훅
            └── mutations.ts    # TanStack Mutation 훅
```

## 🔄 HTTP 클라이언트 선택

### axios (기본값)

```javascript
export default {
  httpClient: 'axios',
};
```

**장점:**
- ✅ 가장 인기 있는 HTTP 클라이언트
- ✅ 훌륭한 TypeScript 지원
- ✅ Request/Response 인터셉터
- ✅ 더 나은 에러 핸들링
- ✅ 취소 토큰 지원

### ky

```javascript
export default {
  httpClient: 'ky',
};
```

**장점:**
- ✅ 경량 (axios 대비 10배 작음)
- ✅ 모던한 fetch 기반
- ✅ 내장 재시도 기능
- ✅ 깔끔한 API

## ♾️ Infinite Query 자동 생성

페이지네이션이 있는 엔드포인트는 `useInfiniteQuery` 훅이 자동으로 생성됩니다!

### 지원되는 페이지네이션 파라미터

다음 쿼리 파라미터 중 하나라도 있으면 자동으로 Infinite Query가 생성됩니다:

- `page` - 페이지 기반 (`?page=1`)
- `cursor` - 커서 기반 (`?cursor=abc`)
- `offset` - 오프셋 기반 (`?offset=0&limit=20`)
- `pageToken` - 토큰 기반 (`?pageToken=xyz`)

### 사용 예시

**Swagger 정의:**

```yaml
/api/campaigns:
  get:
    parameters:
      - name: page
        in: query
        schema:
          type: integer
      - name: category
        in: query
        schema:
          type: string
```

**생성된 코드 (queries.ts):**

```typescript
// 일반 Query
export const useGetCampaignsQuery = (params?: { page?: number; category?: string }) => {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => campaignApi.getCampaigns(params),
  });
};

// ⭐ Infinite Query (자동 생성!)
export const useGetCampaignsInfiniteQuery = (
  params?: { category?: string }, // page는 제외됨
  options?: UseInfiniteQueryOptions
) => {
  return useInfiniteQuery({
    queryKey: ['campaigns', params],
    queryFn: ({ pageParam }) => campaignApi.getCampaigns({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.hasNext) return undefined;
      return (lastPage?.page ?? 0) + 1;
    },
    getPreviousPageParam: (firstPage) => {
      if ((firstPage?.page ?? 1) <= 1) return undefined;
      return (firstPage?.page ?? 1) - 1;
    },
    ...options,
  });
};
```

**컴포넌트에서 사용:**

```tsx
function CampaignList() {
  const { data, fetchNextPage, hasNextPage, isFetching } = useGetCampaignsInfiniteQuery({
    category: 'food',
  });

  return (
    <div>
      {data?.pages.map(page =>
        page.items.map(campaign => (
          <CampaignCard key={campaign.id} {...campaign} />
        ))
      )}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetching}>
          더 보기
        </button>
      )}
    </div>
  );
}
```

## 👀 Watch 모드

개발 중 Swagger 문서가 변경될 때 자동으로 코드를 재생성합니다.

```bash
# CLI
generate-all --watch

# Config
{
  "scripts": {
    "codegen:watch": "generate-all --watch"
  }
}
```

**특징:**
- 로컬 파일: `chokidar`로 변경 감지
- 원격 URL: 10초마다 ETag/Last-Modified 체크

## 🎯 Module Filtering

필요한 모듈만 선택적으로 생성할 수 있습니다.

### Include (특정 모듈만 생성)

```javascript
export default {
  include: ['user', 'campaign', 'schedule'],
};
```

또는

```bash
generate-all --include user,campaign,schedule
```

### Exclude (특정 모듈 제외)

```javascript
export default {
  exclude: ['admin', 'internal'],
};
```

또는

```bash
generate-all --exclude admin,internal
```

**주의:** `include`와 `exclude`는 동시에 사용할 수 없습니다.

## ⚙️ 전체 옵션

### CLI 옵션

| 옵션                          | 단축키 | 설명                                        | 기본값                                        |
| ----------------------------- | ------ | ------------------------------------------- | --------------------------------------------- |
| `--uri`                       | `-u`   | Swagger 문서 URL/경로                       | 필수                                          |
| `--http-client`               | `-hc`  | HTTP 클라이언트 (axios/ky)                  | `axios`                                       |
| `--username`                  | `-un`  | Basic Auth 사용자명                         | -                                             |
| `--password`                  | `-pw`  | Basic Auth 비밀번호                         | -                                             |
| `--dto-output-path`           | `-dp`  | DTO 파일 경로                               | `src/shared/api/dto.ts`                       |
| `--api-output-path`           | `-ap`  | API 클래스 경로                             | `src/entities/{moduleName}/api/index.ts`      |
| `--api-instance-output-path`  | `-aip` | API 인스턴스 경로                           | `src/entities/{moduleName}/api/instance.ts`   |
| `--query-output-path`         | `-qp`  | Query 훅 경로                               | `src/entities/{moduleName}/api/queries.ts`    |
| `--mutation-output-path`      | `-mp`  | Mutation 훅 경로                            | `src/entities/{moduleName}/api/mutations.ts`  |
| `--project-template`          | `-pt`  | 커스텀 템플릿 경로                          | -                                             |
| `--watch`                     | `-w`   | Watch 모드 활성화                           | `false`                                       |
| `--include`                   | -      | 포함할 모듈 (쉼표로 구분)                   | -                                             |
| `--exclude`                   | -      | 제외할 모듈 (쉼표로 구분)                   | -                                             |

### Config 파일 옵션

```javascript
export default {
  // 필수
  uri: string,

  // HTTP 클라이언트
  httpClient: 'axios' | 'ky', // 기본값: 'axios'

  // 인증
  username?: string,
  password?: string,

  // 출력 경로
  output?: {
    dto?: string,
    api?: string,
    instance?: string,
    queries?: string,
    mutations?: string,
  },

  // 템플릿
  templates?: string,

  // Module Filtering
  include?: string[],
  exclude?: string[],
};
```

## 🔧 고급 설정

### 커스텀 템플릿 사용

자체 EJS 템플릿을 사용하려면:

```javascript
export default {
  templates: './custom-templates',
};
```

템플릿 구조:

```
custom-templates/
├── modular/
│   ├── axios/
│   │   └── procedure-call.ejs
│   ├── ky/
│   │   └── procedure-call.ejs
│   ├── api.ejs
│   ├── data-contracts.ejs
│   └── route-docs.ejs
└── tanstack-query/
    ├── axios/
    │   └── route-types.ejs
    ├── ky/
    │   └── route-types.ejs
    └── api.ejs
```

### 환경 변수 사용

`.env` 파일:

```env
SWAGGER_URL=http://localhost:8000/api-json
SWAGGER_USERNAME=admin
SWAGGER_PASSWORD=secret
```

`swagger-codegen.config.js`:

```javascript
import 'dotenv/config';

export default {
  uri: process.env.SWAGGER_URL,
  username: process.env.SWAGGER_USERNAME,
  password: process.env.SWAGGER_PASSWORD,
};
```

## 📦 Migration Guide

### v1.x에서 v2.0으로 마이그레이션

#### Breaking Changes

**HTTP Client 기본값 변경**

- v1.x: `ky`만 지원
- v2.0: `axios` 기본값, `ky` 선택 가능

**기존 ky 사용자:**

```javascript
// swagger-codegen.config.js
export default {
  httpClient: 'ky',
};
```

#### New Features

- ✅ HTTP 클라이언트 선택 (axios/ky)
- ✅ 자동 Infinite Query 생성
- ✅ Config 파일 지원
- ✅ Watch 모드
- ✅ Module Filtering

## 🤝 기여

기여는 언제나 환영입니다! 이슈와 PR을 자유롭게 제출해주세요.

## 📄 라이선스

MIT © [sen2y](https://github.com/sen-jik)

## 🔗 링크

- [GitHub Repository](https://github.com/sen-jik/swagger-autogen)
- [Issues](https://github.com/sen-jik/swagger-autogen/issues)
- [npm Package](https://www.npmjs.com/package/swagger-fsd-gen)
