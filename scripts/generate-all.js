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
import fs from "node:fs";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 프로젝트의 Prettier 설정을 로드
 * @returns {Object} Prettier 설정
 */
const loadPrettierConfig = () => {
  const configPaths = [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.js",
    ".prettierrc.cjs",
    "prettier.config.js",
    "prettier.config.cjs",
  ];

  for (const configPath of configPaths) {
    const fullPath = path.resolve(process.cwd(), configPath);
    if (fs.existsSync(fullPath)) {
      try {
        if (configPath.endsWith(".js") || configPath.endsWith(".cjs")) {
          return require(fullPath);
        }
        return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      } catch (error) {
        console.warn(
          `Warning: Failed to load prettier config from ${configPath}`
        );
      }
    }
  }

  // 기본 Prettier 설정
  return {
    semi: true,
    trailingComma: "es5",
    singleQuote: true,
    printWidth: 100,
    tabWidth: 2,
    arrowParens: "always",
  };
};

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
    input: isLocal ? path.resolve(process.cwd(), uri) : undefined,
    spec: !isLocal && (await fetchSwagger(uri, username, password)),
    templates: templates,
    generateClient: true,
    generateUnionEnums: true,
    cleanOutput: false,
    silent: true,
    prettier: {
      semi: true,
      trailingComma: "es5",
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2,
      arrowParens: "always",
      bracketSameLine: false,
      jsxSingleQuote: false,
    },
    modular: true,
    moduleNameFirstTag: true,
    moduleNameIndex: 1,
    generateRouteTypes: true,
    schemaParsers: {
      complexAnyOf: AnyOfSchemaParser,
    },
    ...params,
  });
};

/**
 * 생성된 파일에 프로젝트의 prettier 적용
 * @param {string} filePath - 파일 경로
 */
const formatWithProjectPrettier = (filePath) => {
  try {
    execSync(`prettier --write "${filePath}"`, { stdio: "inherit" });
  } catch (error) {
    console.warn(`Warning: Failed to format ${filePath}`);
  }
};

/**
 * API 클래스와 DTO 파일 생성
 * @param {Object} args - 명령행 인수
 * @param {Object} outputPaths - 출력 경로 설정
 */
const generateApiFunctionCode = async (args, outputPaths) => {
  const { projectTemplate, uri, username, password } = args;

  const templatePath = projectTemplate
    ? path.resolve(process.cwd(), projectTemplate)
    : path.resolve(__dirname, "../templates");

  console.log("🔄 Generating API classes and DTOs...");

  const apiFunctionCode = await generateApiCode({
    uri,
    username,
    password,
    templates: templatePath,
    prettier: false, // prettier 비활성화
  });

  for (const { fileName, fileContent } of apiFunctionCode.files) {
    if (fileName === "http-client") continue;

    let outputPath;
    if (fileName === "data-contracts") {
      outputPath = outputPaths.dto.absolutePath;
      await writeFileToPath(outputPath, fileContent);
      formatWithProjectPrettier(outputPath);
      console.log(`✅ Generated DTO: ${outputPaths.dto.relativePath}`);
    } else {
      const moduleName = fileName.replace("Route", "").toLowerCase();

      if (fileName.match(/Route$/)) {
        outputPath = outputPaths.apiInstance.absolutePath.replace(
          "{moduleName}",
          moduleName
        );
        await writeFileToPath(outputPath, fileContent);
        formatWithProjectPrettier(outputPath);
        console.log(
          `✅ Generated API instance: ${outputPath.replace(process.cwd(), ".")}`
        );
      } else {
        outputPath = outputPaths.api.absolutePath.replace(
          "{moduleName}",
          moduleName
        );
        await writeFileToPath(outputPath, fileContent);
        formatWithProjectPrettier(outputPath);
        console.log(
          `✅ Generated API class: ${outputPath.replace(process.cwd(), ".")}`
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

  const templatePath = projectTemplate
    ? path.resolve(process.cwd(), projectTemplate, "tanstack-query")
    : path.resolve(__dirname, "../templates/tanstack-query");

  console.log("🔄 Generating TanStack Query hooks...");

  const tanstackQueryCode = await generateApiCode({
    uri,
    username,
    password,
    templates: templatePath,
    prettier: false, // prettier 비활성화
  });

  for (const { fileName, fileContent } of tanstackQueryCode.files) {
    if (fileName === "http-client" || fileName === "data-contracts") continue;

    const moduleName = fileName.replace("Route", "").toLowerCase();
    let outputPath;

    if (fileName.match(/Route$/)) {
      outputPath = outputPaths.mutation.absolutePath.replace(
        "{moduleName}",
        moduleName
      );
      await writeFileToPath(outputPath, fileContent);
      formatWithProjectPrettier(outputPath);
      console.log(
        `✅ Generated mutations: ${outputPath.replace(process.cwd(), ".")}`
      );
    } else {
      outputPath = outputPaths.query.absolutePath.replace(
        "{moduleName}",
        moduleName
      );
      await writeFileToPath(outputPath, fileContent);
      formatWithProjectPrettier(outputPath);
      console.log(
        `✅ Generated queries: ${outputPath.replace(process.cwd(), ".")}`
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
