#!/usr/bin/env node

/**
 * Swagger API 클라이언트 자동 생성 도구
 * - ky HTTP 클라이언트 기반 API 클래스 생성
 * - TanStack Query 훅 생성 (useQuery, useMutation)
 * - FSD(Feature-Sliced Design) 패턴 적용
 */

import path from "node:path";
import minimist from "minimist";
import { fileURLToPath } from "url";
import { generateApi } from "swagger-typescript-api";
import { fetchSwagger } from "../utils/fetch-swagger.js";
import { writeFileToPath } from "../utils/file.js";
import { AnyOfSchemaParser } from "../utils/parser.js";
import { isUrl } from "../utils/url.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 명령행 인수 파싱
 * @returns {Object} 파싱된 인수들
 */
const parseArguments = () => {
  const argv = minimist(process.argv.slice(2), {
    string: [
      "uri",
      "username",
      "password",
      "dto-output-path",
      "api-output-path",
      "api-instance-output-path",
      "query-output-path",
      "mutation-output-path",
      "project-template",
    ],
    alias: {
      u: "uri",
      un: "username",
      pw: "password",
      dp: "dto-output-path",
      ap: "api-output-path",
      aip: "api-instance-output-path",
      qp: "query-output-path",
      mp: "mutation-output-path",
      pt: "project-template",
    },
  });

  return {
    uri: argv.uri,
    username: argv.username,
    password: argv.password,
    dtoOutputPath: argv["dto-output-path"],
    apiOutputPath: argv["api-output-path"],
    apiInstanceOutputPath: argv["api-instance-output-path"],
    queryOutputPath: argv["query-output-path"],
    mutationOutputPath: argv["mutation-output-path"],
    projectTemplate: argv["project-template"],
  };
};

/**
 * 출력 경로 설정 (FSD 패턴 기본값)
 * @param {Object} args - 명령행 인수
 * @returns {Object} 설정된 출력 경로들
 */
const setupOutputPaths = (args) => {
  return {
    // DTO 타입 정의 파일 (공통)
    dto: {
      relativePath: args.dtoOutputPath ?? "src/shared/api/dto.ts",
      absolutePath: path.resolve(
        process.cwd(),
        args.dtoOutputPath ?? "src/shared/api/dto.ts"
      ),
    },
    // API 클래스 파일 (모듈별)
    api: {
      relativePath:
        args.apiOutputPath ?? "src/entities/{moduleName}/api/index.ts",
      absolutePath: path.resolve(
        process.cwd(),
        args.apiOutputPath ?? "src/entities/{moduleName}/api/index.ts"
      ),
    },
    // API 인스턴스 파일 (모듈별)
    apiInstance: {
      relativePath:
        args.apiInstanceOutputPath ??
        "src/entities/{moduleName}/api/instance.ts",
      absolutePath: path.resolve(
        process.cwd(),
        args.apiInstanceOutputPath ??
          "src/entities/{moduleName}/api/instance.ts"
      ),
    },
    // TanStack Query 훅 파일 (모듈별)
    query: {
      relativePath:
        args.queryOutputPath ?? "src/entities/{moduleName}/api/queries.ts",
      absolutePath: path.resolve(
        process.cwd(),
        args.queryOutputPath ?? "src/entities/{moduleName}/api/queries.ts"
      ),
    },
    // TanStack Mutation 훅 파일 (모듈별)
    mutation: {
      relativePath:
        args.mutationOutputPath ?? "src/entities/{moduleName}/api/mutations.ts",
      absolutePath: path.resolve(
        process.cwd(),
        args.mutationOutputPath ?? "src/entities/{moduleName}/api/mutations.ts"
      ),
    },
  };
};

/**
 * 사용법 출력
 * @param {Object} outputPaths - 출력 경로 설정
 */
const printUsage = (outputPaths) => {
  console.error(
    "❗️ Error: Please provide the swagger URL or swagger file name"
  );
  console.error(
    "Usage: generate-all --uri <swagger-url|swagger-file-name> " +
      "[--username <username>] [--password <password>] " +
      "[--dto-output-path <dto-output-path>] " +
      "[--api-output-path <api-output-path>] " +
      "[--query-output-path <query-output-path>] " +
      "[--mutation-output-path <mutation-output-path>] " +
      "[--project-template <project-template>]"
  );
  console.error(
    `\nCurrent output paths:\n` +
      `  DTO Path: ${outputPaths.dto.relativePath}\n` +
      `  API Path: ${outputPaths.api.relativePath}\n` +
      `  Query Path: ${outputPaths.query.relativePath}\n` +
      `  Mutation Path: ${outputPaths.mutation.relativePath}`
  );
};

/**
 * swagger-typescript-api를 사용하여 API 코드 생성
 * @param {Object} params - 생성 파라미터
 * @returns {Promise<Object>} 생성된 파일들
 */
export const generateApiCode = async ({
  uri,
  username,
  password,
  templates,
  ...params
}) => {
  const isLocal = !isUrl(uri);

  return generateApi({
    // 로컬 파일 또는 원격 URL 처리
    input: isLocal ? path.resolve(process.cwd(), uri) : undefined,
    spec: !isLocal && (await fetchSwagger(uri, username, password)),
    templates: templates,
    generateClient: true,
    generateUnionEnums: true,
    cleanOutput: false,
    silent: true,
    // 프로젝트의 Prettier 설정을 사용
    prettier: true,
    modular: true,
    moduleNameFirstTag: true, // Swagger 태그를 모듈명으로 사용
    moduleNameIndex: 1,
    // typeSuffix: "Dto", // 타입에 Dto 접미사 추가
    generateRouteTypes: true,
    schemaParsers: {
      complexAnyOf: AnyOfSchemaParser,
    },
    ...params,
  });
};

/**
 * API 클래스와 DTO 파일 생성
 * @param {Object} args - 명령행 인수
 * @param {Object} outputPaths - 출력 경로 설정
 */
const generateApiFunctionCode = async (args, outputPaths) => {
  const { projectTemplate, uri, username, password } = args;

  // 템플릿 경로 결정 (커스텀 템플릿 또는 기본 템플릿)
  const templatePath = projectTemplate
    ? path.resolve(process.cwd(), projectTemplate)
    : path.resolve(__dirname, "../templates");

  console.log("🔄 Generating API classes and DTOs...");

  const apiFunctionCode = await generateApiCode({
    uri,
    username,
    password,
    templates: templatePath,
  });

  // 생성된 파일들을 적절한 위치에 저장
  for (const { fileName, fileContent } of apiFunctionCode.files) {
    // http-client 파일은 사용하지 않음 (ky 사용)
    if (fileName === "http-client") continue;

    if (fileName === "data-contracts") {
      // DTO 타입 정의 파일 저장
      await writeFileToPath(outputPaths.dto.absolutePath, fileContent);
      console.log(`✅ Generated DTO: ${outputPaths.dto.relativePath}`);
    } else {
      // 모듈명 추출 (예: UserRoute -> user)
      const moduleName = fileName.replace("Route", "").toLowerCase();

      if (fileName.match(/Route$/)) {
        // API 인스턴스 파일 생성 (예: UserRoute -> user/api/instance.ts)
        const output = outputPaths.apiInstance.absolutePath.replace(
          "{moduleName}",
          moduleName
        );
        await writeFileToPath(output, fileContent);
        console.log(
          `✅ Generated API instance: ${output.replace(process.cwd(), ".")}`
        );
      } else {
        // API 클래스 파일 생성 (예: User -> user/api/index.ts)
        const output = outputPaths.api.absolutePath.replace(
          "{moduleName}",
          moduleName
        );
        await writeFileToPath(output, fileContent);
        console.log(
          `✅ Generated API class: ${output.replace(process.cwd(), ".")}`
        );
      }
    }
  }
};

/**
 * TanStack Query 훅 파일 생성
 * @param {Object} args - 명령행 인수
 * @param {Object} outputPaths - 출력 경로 설정
 */
const generateTanstackQueryCode = async (args, outputPaths) => {
  const { projectTemplate, uri, username, password } = args;

  // TanStack Query 템플릿 경로 결정
  const templatePath = projectTemplate
    ? path.resolve(process.cwd(), projectTemplate, "tanstack-query")
    : path.resolve(__dirname, "../templates/tanstack-query");

  console.log("🔄 Generating TanStack Query hooks...");

  const tanstackQueryCode = await generateApiCode({
    uri,
    username,
    password,
    templates: templatePath,
  });

  // 생성된 파일들을 적절한 위치에 저장
  for (const { fileName, fileContent } of tanstackQueryCode.files) {
    // 불필요한 파일들 제외
    if (fileName === "http-client" || fileName === "data-contracts") continue;

    const moduleName = fileName.replace("Route", "").toLowerCase();

    if (fileName.match(/Route$/)) {
      // Mutation 훅 파일 생성
      const output = outputPaths.mutation.absolutePath.replace(
        "{moduleName}",
        moduleName
      );
      await writeFileToPath(output, fileContent);
      console.log(
        `✅ Generated mutations: ${output.replace(process.cwd(), ".")}`
      );
    } else {
      // Query 훅 파일 생성
      const output = outputPaths.query.absolutePath.replace(
        "{moduleName}",
        moduleName
      );
      await writeFileToPath(output, fileContent);
      console.log(
        `✅ Generated queries: ${output.replace(process.cwd(), ".")}`
      );
    }
  }
};

/**
 * 메인 실행 함수
 */
const main = async () => {
  console.log("🚀 Starting Swagger API client generation...\n");

  const args = parseArguments();
  const outputPaths = setupOutputPaths(args);

  // URI 필수 체크
  if (!args.uri) {
    printUsage(outputPaths);
    process.exit(1);
  }

  try {
    // 1. API 클래스와 DTO 생성
    await generateApiFunctionCode(args, outputPaths);

    // 2. TanStack Query 훅 생성
    await generateTanstackQueryCode(args, outputPaths);

    console.log("\n🎉 API client generation completed successfully!");
    console.log("\n📁 Generated files:");
    console.log(`   - DTOs: ${outputPaths.dto.relativePath}`);
    console.log(`   - API classes: ${outputPaths.api.relativePath}`);
    console.log(`   - Query hooks: ${outputPaths.query.relativePath}`);
    console.log(`   - Mutation hooks: ${outputPaths.mutation.relativePath}`);
  } catch (error) {
    console.error("\n❌ Error during generation:");
    console.error(error.message);
    process.exit(1);
  }
};

main();
