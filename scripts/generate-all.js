#!/usr/bin/env node

/**
 * Swagger API 클라이언트 자동 생성 도구 v2.0
 * - HTTP 클라이언트 선택 (axios/ky)
 * - TanStack Query 훅 생성 (useQuery, useMutation, useInfiniteQuery)
 * - FSD(Feature-Sliced Design) 패턴 적용
 * - Config 파일 지원
 * - Watch 모드 지원
 * - Module Filtering 지원
 */

import path from "node:path";
import fs from "node:fs";
import { execSync } from "child_process";
import minimist from "minimist";
import chokidar from "chokidar";
import { fileURLToPath } from "url";
import { generateApi } from "swagger-typescript-api";
import { fetchSwagger } from "../utils/fetch-swagger.js";
import { writeFileToPath } from "../utils/file.js";
import { AnyOfSchemaParser } from "../utils/parser.js";
import { isUrl } from "../utils/url.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Config 파일 로드 (swagger-codegen.config.js)
 * @returns {Promise<Object>} Config 객체
 */
const loadConfig = async () => {
  const configPath = path.resolve(process.cwd(), "swagger-codegen.config.js");

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const module = await import(`file://${configPath}`);
    console.log("📋 Loaded config from swagger-codegen.config.js");
    return module.default || {};
  } catch (error) {
    console.warn("⚠️  Failed to load config:", error.message);
    return {};
  }
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
      "http-client",
      "dto-output-path",
      "api-output-path",
      "api-instance-output-path",
      "query-output-path",
      "mutation-output-path",
      "project-template",
      "include",
      "exclude",
    ],
    boolean: ["watch"],
    alias: {
      u: "uri",
      un: "username",
      pw: "password",
      hc: "http-client",
      dp: "dto-output-path",
      ap: "api-output-path",
      aip: "api-instance-output-path",
      qp: "query-output-path",
      mp: "mutation-output-path",
      pt: "project-template",
      w: "watch",
    },
  });

  return {
    uri: argv.uri,
    username: argv.username,
    password: argv.password,
    httpClient: argv["http-client"],
    dtoOutputPath: argv["dto-output-path"],
    apiOutputPath: argv["api-output-path"],
    apiInstanceOutputPath: argv["api-instance-output-path"],
    queryOutputPath: argv["query-output-path"],
    mutationOutputPath: argv["mutation-output-path"],
    projectTemplate: argv["project-template"],
    watch: argv.watch,
    include: argv.include ? argv.include.split(",") : undefined,
    exclude: argv.exclude ? argv.exclude.split(",") : undefined,
  };
};

/**
 * 출력 경로 설정 (FSD 패턴 기본값)
 * @param {Object} config - 설정 객체
 * @returns {Object} 설정된 출력 경로들
 */
const setupOutputPaths = (config) => {
  const dtoPath = config.output?.dto || config.dtoOutputPath || "src/shared/api/dto.ts";
  const apiPath = config.output?.api || config.apiOutputPath || "src/entities/{moduleName}/api/index.ts";
  const apiInstancePath = config.output?.instance || config.apiInstanceOutputPath || "src/entities/{moduleName}/api/instance.ts";
  const queryPath = config.output?.queries || config.queryOutputPath || "src/entities/{moduleName}/api/queries.ts";
  const mutationPath = config.output?.mutations || config.mutationOutputPath || "src/entities/{moduleName}/api/mutations.ts";

  return {
    dto: {
      relativePath: dtoPath,
      absolutePath: path.resolve(process.cwd(), dtoPath),
    },
    api: {
      relativePath: apiPath,
      absolutePath: path.resolve(process.cwd(), apiPath),
    },
    apiInstance: {
      relativePath: apiInstancePath,
      absolutePath: path.resolve(process.cwd(), apiInstancePath),
    },
    query: {
      relativePath: queryPath,
      absolutePath: path.resolve(process.cwd(), queryPath),
    },
    mutation: {
      relativePath: mutationPath,
      absolutePath: path.resolve(process.cwd(), mutationPath),
    },
  };
};

/**
 * HTTP client에 따른 템플릿 경로 반환
 * @param {string} baseTemplate - 기본 템플릿 경로
 * @param {string} httpClient - HTTP client ('axios' | 'ky')
 * @returns {string} 최종 템플릿 경로
 */
const getTemplatePath = (baseTemplate, httpClient) => {
  // Check for client-specific template first
  const clientSpecificPath = path.join(baseTemplate, httpClient);
  if (fs.existsSync(clientSpecificPath)) {
    return clientSpecificPath;
  }

  // Fallback to shared template
  return baseTemplate;
};

/**
 * Module filtering 체크
 * @param {string} moduleName - 모듈명
 * @param {Object} config - 설정 객체
 * @returns {boolean} 생성 여부
 */
const shouldGenerateModule = (moduleName, config) => {
  // If include list exists, only generate those
  if (config.include?.length > 0) {
    return config.include.includes(moduleName);
  }

  // If exclude list exists, exclude those
  if (config.exclude?.length > 0) {
    return !config.exclude.includes(moduleName);
  }

  // No filter, generate all
  return true;
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
      "[--http-client <axios|ky>] " +
      "[--username <username>] [--password <password>] " +
      "[--dto-output-path <dto-output-path>] " +
      "[--api-output-path <api-output-path>] " +
      "[--query-output-path <query-output-path>] " +
      "[--mutation-output-path <mutation-output-path>] " +
      "[--project-template <project-template>] " +
      "[--watch] " +
      "[--include <module1,module2>] " +
      "[--exclude <module1,module2>]"
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
 * @param {Object} config - 설정 객체
 * @param {Object} outputPaths - 출력 경로 설정
 */
const generateApiFunctionCode = async (config, outputPaths) => {
  const { projectTemplate, uri, username, password, httpClient } = config;

  const templatePath = projectTemplate
    ? path.resolve(process.cwd(), projectTemplate, "modular")
    : path.resolve(__dirname, "../templates/modular");

  const finalTemplatePath = getTemplatePath(templatePath, httpClient || "axios");

  console.log(`🔄 Generating API classes and DTOs with ${httpClient || "axios"}...`);

  const apiFunctionCode = await generateApiCode({
    uri,
    username,
    password,
    templates: finalTemplatePath,
    prettier: false,
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

      // Module filtering check
      if (!shouldGenerateModule(moduleName, config)) {
        console.log(`⏭️  Skipped module: ${moduleName}`);
        continue;
      }

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
 * @param {Object} config - 설정 객체
 * @param {Object} outputPaths - 출력 경로 설정
 */
const generateTanstackQueryCode = async (config, outputPaths) => {
  const { projectTemplate, uri, username, password, httpClient } = config;

  const templatePath = projectTemplate
    ? path.resolve(process.cwd(), projectTemplate, "tanstack-query")
    : path.resolve(__dirname, "../templates/tanstack-query");

  const finalTemplatePath = getTemplatePath(templatePath, httpClient || "axios");

  console.log(`🔄 Generating TanStack Query hooks with ${httpClient || "axios"}...`);

  const tanstackQueryCode = await generateApiCode({
    uri,
    username,
    password,
    templates: finalTemplatePath,
    prettier: false,
  });

  for (const { fileName, fileContent } of tanstackQueryCode.files) {
    if (fileName === "http-client" || fileName === "data-contracts") continue;

    const moduleName = fileName.replace("Route", "").toLowerCase();

    // Module filtering check
    if (!shouldGenerateModule(moduleName, config)) {
      console.log(`⏭️  Skipped module: ${moduleName}`);
      continue;
    }

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
 * Watch 모드 실행
 * @param {Object} config - 설정 객체
 * @param {Object} outputPaths - 출력 경로 설정
 */
const watchMode = async (config, outputPaths) => {
  console.log("\n👀 Watch mode enabled. Press Ctrl+C to exit.\n");

  let isGenerating = false;
  let lastHash = "";

  const regenerate = async () => {
    if (isGenerating) return;

    isGenerating = true;
    console.log("🔄 Changes detected! Regenerating...\n");

    try {
      await generateApiFunctionCode(config, outputPaths);
      await generateTanstackQueryCode(config, outputPaths);
      console.log("\n✅ Regeneration completed!\n");
    } catch (error) {
      console.error("\n❌ Error:", error.message, "\n");
    } finally {
      isGenerating = false;
    }
  };

  // Initial generation
  await regenerate();

  // Watch local file
  if (!isUrl(config.uri)) {
    chokidar.watch(config.uri).on("change", regenerate);
    console.log(`👁️  Watching local file: ${config.uri}\n`);
  }
  // Poll remote URL
  else {
    console.log(`👁️  Polling remote URL: ${config.uri} (every 10s)\n`);
    setInterval(async () => {
      try {
        const response = await fetch(config.uri, { method: "HEAD" });
        const etag =
          response.headers.get("etag") || response.headers.get("last-modified");

        if (etag && etag !== lastHash) {
          lastHash = etag;
          await regenerate();
        }
      } catch (error) {
        // Ignore network errors
      }
    }, 10000); // Check every 10 seconds
  }

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopping watch mode...");
    process.exit(0);
  });
};

/**
 * 메인 실행 함수
 */
const main = async () => {
  console.log("🚀 Starting Swagger API client generation v2.0...\n");

  // Load config file
  const fileConfig = await loadConfig();

  // Parse CLI args
  const cliArgs = parseArguments();

  // Merge (CLI args override config file)
  const config = {
    httpClient: "axios", // default
    ...fileConfig,
    ...Object.fromEntries(
      Object.entries(cliArgs).filter(([_, v]) => v !== undefined)
    ),
  };

  const outputPaths = setupOutputPaths(config);

  // URI 필수 체크
  if (!config.uri) {
    printUsage(outputPaths);
    process.exit(1);
  }

  // Validation: cannot use both include and exclude
  if (config.include?.length > 0 && config.exclude?.length > 0) {
    console.error("❌ Error: Cannot use both --include and --exclude");
    process.exit(1);
  }

  console.log(`📦 HTTP Client: ${config.httpClient}`);
  if (config.include) {
    console.log(`📌 Include modules: ${config.include.join(", ")}`);
  }
  if (config.exclude) {
    console.log(`🚫 Exclude modules: ${config.exclude.join(", ")}`);
  }
  console.log();

  try {
    // Watch mode
    if (config.watch) {
      await watchMode(config, outputPaths);
    } else {
      // Normal mode
      await generateApiFunctionCode(config, outputPaths);
      await generateTanstackQueryCode(config, outputPaths);

      console.log("\n🎉 API client generation completed successfully!");
      console.log("\n📁 Generated files:");
      console.log(`   - DTOs: ${outputPaths.dto.relativePath}`);
      console.log(`   - API classes: ${outputPaths.api.relativePath}`);
      console.log(`   - Query hooks: ${outputPaths.query.relativePath}`);
      console.log(`   - Mutation hooks: ${outputPaths.mutation.relativePath}`);
    }
  } catch (error) {
    console.error("\n❌ Error during generation:");
    console.error(error.message);
    process.exit(1);
  }
};

main();
