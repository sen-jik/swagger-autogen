# swagger-fsd-gen

Swagger/OpenAPI 문서를 기반으로 **axios/ky + TanStack Query + FSD(Feature-Sliced Design) 패턴**에 맞는 API 클라이언트를 자동으로 생성하는 도구입니다.

## ✨ 주요 기능

- 🚀 **axios/ky HTTP 클라이언트 선택** 기반 API 클래스 자동 생성
- 🔄 **TanStack Query** 훅 자동 생성 (useQuery, useMutation)
- 📁 **FSD(Feature-Sliced Design)** 패턴 자동 적용
- 🔐 **HTTP Basic Authentication** 지원
- 📝 **TypeScript** 완전 지원 (타입 안전성)
- 🎨 **프로젝트의 Prettier 설정** 자동 적용

## 📦 설치

```bash
# npm
npm install -D swagger-fsd-gen

# yarn
yarn add -D swagger-fsd-gen
```

## 🚀 사용 방법

### 1. 직접 실행

```bash
# npm
npx fetch-swagger --url https://api.example.com/swagger.json --username your-username --password your-password
npx generate-all --uri https://api.example.com/swagger.json --username your-username --password your-password

# yarn
yarn fetch-swagger --url https://api.example.com/swagger.json --username your-username --password your-password
yarn generate-all --uri https://api.example.com/swagger.json --username your-username --password your-password

# axios 클라이언트로 생성
yarn generate-all --uri https://api.example.com/swagger.json --http-client axios

# ky 클라이언트로 생성 (기본값)
yarn generate-all --uri https://api.example.com/swagger.json --http-client ky
```

### 2. package.json에 스크립트 추가 (권장)

```json
{
  "scripts": {
    "fetch-swagger": "fetch-swagger --url https://api.example.com/swagger.json --username your-username --password your-password",
    "generate-all": "generate-all --uri https://api.example.com/swagger.json --username your-username --password your-password"
  }
}
```

그리고 실행:

```bash
# npm
npm run fetch-swagger
npm run generate-all

# yarn
yarn fetch-swagger
yarn generate-all
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

## ⚙️ 옵션

### fetch-swagger

| 옵션       | 설명                | 필수 |
| ---------- | ------------------- | ---- |
| --url      | Swagger 문서 URL    | ✅   |
| --username | Basic Auth 사용자명 | -    |
| --password | Basic Auth 비밀번호 | -    |

### generate-all

| 옵션                   | 설명                  | 기본값                                     |
| ---------------------- | --------------------- | ------------------------------------------ |
| --uri                  | Swagger 문서 URL/경로 | 필수                                       |
| --username             | Basic Auth 사용자명   | -                                          |
| --password             | Basic Auth 비밀번호   | -                                          |
| --http-client          | HTTP 클라이언트 선택  | ky (`axios`, `ky`)                         |
| --dto-output-path      | DTO 파일 경로         | src/shared/api/dto.ts                      |
| --api-output-path      | API 클래스 경로       | src/entities/{moduleName}/api/index.ts     |
| --query-output-path    | Query 훅 경로         | src/entities/{moduleName}/api/queries.ts   |
| --mutation-output-path | Mutation 훅 경로      | src/entities/{moduleName}/api/mutations.ts |

## 📄 라이선스

MIT © [sen2y](https://github.com/sen-jik)
