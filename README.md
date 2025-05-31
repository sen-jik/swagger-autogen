# Swagger Client Autogen

**ky + TanStack Query + FSD 패턴**을 위한 Swagger API 클라이언트 자동 생성 도구입니다.

## ✨ 주요 기능

- 🚀 **ky HTTP 클라이언트** 기반 API 클래스 자동 생성
- 🔄 **TanStack Query** 훅 자동 생성 (useQuery, useMutation)
- 📁 **FSD(Feature-Sliced Design)** 패턴 자동 적용
- 🔐 **HTTP Basic Authentication** 지원
- 📝 **TypeScript** 완전 지원 (타입 안전성)
- 🎨 **Prettier** 자동 포맷팅

## 📦 설치 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd swagger-client-autogen
```

### 2. 의존성 설치

```bash
yarn install
```

### 3. 전역 설치 (선택사항)

```bash
yarn link
```

## 🚀 사용 방법

### 1. Swagger 문서 다운로드

```bash
# 기본 사용법
fetch-swagger --url https://api.example.com/swagger.json

# 인증이 필요한 경우
fetch-swagger --url https://api.example.com/swagger.json --username admin --password secret
```

**결과**: `swagger/` 디렉토리에 YAML 파일로 저장됩니다.

### 2. API 클라이언트 생성

```bash
# 원격 Swagger 문서에서 생성
generate-all --uri https://api.example.com/swagger.json

# 로컬 파일에서 생성
generate-all --uri ./swagger/my-api.yml

# 인증이 필요한 경우
generate-all --uri https://api.example.com/swagger.json --username admin --password secret

# 커스텀 출력 경로 지정
generate-all --uri ./swagger/my-api.yml \
  --dto-output-path ./src/shared/api/dto.ts \
  --api-output-path ./src/entities/{moduleName}/api/index.ts \
  --query-output-path ./src/entities/{moduleName}/api/queries.ts \
  --mutation-output-path ./src/entities/{moduleName}/api/mutations.ts
```

## 📁 생성되는 파일 구조 (FSD 패턴)

```
src/
├── shared/
│   └── api/
│       └── dto.ts              # 모든 DTO 타입 정의
└── entities/
    └── {moduleName}/           # Swagger 태그별 모듈
        └── api/
            ├── index.ts        # API 클래스
            ├── instance.ts     # API 인스턴스
            ├── queries.ts      # TanStack Query 훅
            └── mutations.ts    # TanStack Mutation 훅
```

## 💡 생성된 코드 사용 예시

### 1. API 인스턴스 설정

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

### 2. API 클래스 사용

```typescript
// src/entities/user/api/instance.ts (자동 생성됨)
import { UserApi } from "./index";
import { apiInstance } from "@/app/providers/api";

export const userApi = new UserApi(apiInstance);
```

### 3. TanStack Query 훅 사용

```typescript
// src/pages/user/ui/UserProfile.tsx
import { useGetUserByIdQuery } from "@/entities/user/api/queries";
import { useUpdateUserMutation } from "@/entities/user/api/mutations";

export const UserProfile = ({ userId }: { userId: number }) => {
  // Query 사용
  const { data: user, isLoading } = useGetUserByIdQuery(userId);

  // Mutation 사용
  const updateUserMutation = useUpdateUserMutation({
    onSuccess: () => {
      console.log("User updated successfully!");
    },
  });

  const handleUpdate = (userData: UpdateUserRequestDto) => {
    updateUserMutation.mutate({
      id: userId,
      body: userData,
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => handleUpdate({ name: "New Name" })}>
        Update User
      </button>
    </div>
  );
};
```

## ⚙️ 설정 옵션

### 명령행 옵션

| 옵션                     | 단축키 | 설명                            | 기본값                                       |
| ------------------------ | ------ | ------------------------------- | -------------------------------------------- |
| `--uri`                  | `-u`   | Swagger 문서 URL 또는 파일 경로 | 필수                                         |
| `--username`             | `-un`  | HTTP Basic Auth 사용자명        | -                                            |
| `--password`             | `-pw`  | HTTP Basic Auth 비밀번호        | -                                            |
| `--dto-output-path`      | `-dp`  | DTO 파일 출력 경로              | `src/shared/api/dto.ts`                      |
| `--api-output-path`      | `-ap`  | API 클래스 출력 경로            | `src/entities/{moduleName}/api/index.ts`     |
| `--query-output-path`    | `-qp`  | Query 훅 출력 경로              | `src/entities/{moduleName}/api/queries.ts`   |
| `--mutation-output-path` | `-mp`  | Mutation 훅 출력 경로           | `src/entities/{moduleName}/api/mutations.ts` |
| `--project-template`     | `-pt`  | 커스텀 템플릿 경로              | -                                            |

### 경로에서 `{moduleName}` 사용

`{moduleName}`을 포함한 경로는 Swagger 태그명으로 자동 대체됩니다.

예: `User` 태그 → `user` 모듈명으로 변환

## 🔧 커스텀 템플릿

기본 템플릿을 복사하여 프로젝트에 맞게 수정할 수 있습니다:

```bash
# 템플릿 복사
cp -r templates/ ./my-templates/

# 커스텀 템플릿 사용
generate-all --uri ./swagger/my-api.yml --project-template ./my-templates/
```

## 🛠️ 개발 환경

- **Node.js**: 18+
- **Package Manager**: Yarn 4.7.0
- **Type**: ES Module

## 📋 의존성

- `swagger-typescript-api`: Swagger 문서 파싱 및 코드 생성
- `minimist`: 명령행 인수 파싱
- `js-yaml`: YAML 파일 처리
- `node-fetch`: HTTP 요청

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## �� 라이선스

ISC License
