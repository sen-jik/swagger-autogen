# 🚀 Quick Start Guide

## 📋 요구사항

- Node.js 18+
- Yarn 4.7.0+

## 🔧 설치

```bash
# 1. 저장소 클론
git clone <your-repo-url>
cd swagger-client-autogen

# 2. 의존성 설치
yarn install

# 3. 전역 설치 (선택사항)
yarn link
```

## 💡 사용법

### 1단계: Swagger 문서 다운로드 (선택사항)

```bash
# 원격 Swagger 문서를 로컬에 저장
fetch-swagger --url https://api.example.com/swagger.json

# 인증이 필요한 경우
fetch-swagger --url https://api.example.com/swagger.json --username admin --password secret
```

### 2단계: API 클라이언트 생성

```bash
# 원격 URL에서 직접 생성
generate-all --uri https://api.example.com/swagger.json

# 로컬 파일에서 생성
generate-all --uri ./swagger/my-api.yml

# axios 클라이언트로 생성
generate-all --uri ./swagger/my-api.yml --http-client axios

# ky 클라이언트로 생성 (기본값)
generate-all --uri ./swagger/my-api.yml --http-client ky

# 인증이 필요한 경우
generate-all --uri https://api.example.com/swagger.json --username admin --password secret
```

## 📁 생성되는 파일

```
src/
├── shared/
│   └── api/
│       └── dto.ts              # 모든 DTO 타입
└── entities/
    └── {moduleName}/           # 각 Swagger 태그별
        └── api/
            ├── index.ts        # API 클래스
            ├── instance.ts     # API 인스턴스
            ├── queries.ts      # Query 훅
            └── mutations.ts    # Mutation 훅
```

## 🎯 프로젝트에 적용하기

### 1. 필요한 패키지 설치

```bash
# ky를 사용할 때
npm install ky @tanstack/react-query

# axios를 사용할 때
npm install axios @tanstack/react-query
```

### 2. API 인스턴스 설정

```typescript
// src/app/providers/api.ts
import ky from "ky";

export const apiInstance = ky.create({
  prefixUrl: "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
  },
});
```

### 3. 생성된 코드 사용

```typescript
// Query 사용
import { useGetUsersQuery } from "@/entities/user/api/queries";

const { data: users, isLoading } = useGetUsersQuery();

// Mutation 사용
import { useCreateUserMutation } from "@/entities/user/api/mutations";

const createUser = useCreateUserMutation({
  onSuccess: () => console.log("User created!"),
});

createUser.mutate({ body: { name: "John" } });
```

## ⚙️ 커스텀 설정

```bash
# 출력 경로 커스터마이징
generate-all --uri ./swagger.json \
  --dto-output-path ./src/types/api.ts \
  --api-output-path ./src/api/{moduleName}/client.ts \
  --query-output-path ./src/api/{moduleName}/queries.ts \
  --mutation-output-path ./src/api/{moduleName}/mutations.ts

# 커스텀 템플릿 사용
generate-all --uri ./swagger.json --project-template ./my-templates/
```

## 🔍 문제 해결

### 의존성 오류

```bash
yarn install
```

### 권한 오류 (전역 설치 시)

```bash
yarn unlink
yarn link
```

### 생성된 파일 확인

```bash
# 생성된 파일 목록 확인
find src -name "*.ts" -type f | grep -E "(api|dto)" | sort
```
