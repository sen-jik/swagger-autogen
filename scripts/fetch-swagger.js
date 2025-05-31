#!/usr/bin/env node

/**
 * Swagger 문서 다운로드 도구
 * - 원격 Swagger 문서를 가져와서 로컬에 YAML 파일로 저장
 * - HTTP Basic Authentication 지원
 * - 파일명은 Swagger 문서의 title을 kebab-case로 변환하여 생성
 */

import path from "node:path";
import minimist from "minimist";
import yaml from "js-yaml";
import { fetchSwagger } from "../utils/fetch-swagger.js";
import { toKebabCase } from "../utils/string.js";
import { writeFileToPath } from "../utils/file.js";

/**
 * 명령행 인수 파싱
 */
const argv = minimist(process.argv.slice(2), {
  string: ["url", "username", "password"],
  alias: {
    u: "url",
    un: "username",
    pw: "password",
  },
});

const { url, username, password } = argv;

/**
 * 사용법 출력
 */
const printUsage = () => {
  console.error("❗️ Error: Please provide the Swagger URL");
  console.error(
    "Usage: fetch-swagger --url <swagger-url> [--username <username>] [--password <password>]"
  );
  console.error("\nExamples:");
  console.error("  fetch-swagger --url https://api.example.com/swagger.json");
  console.error(
    "  fetch-swagger --url https://api.example.com/swagger.json --username admin --password secret"
  );
};

/**
 * 메인 실행 함수
 */
const main = async () => {
  console.log("📥 Starting Swagger document download...\n");

  // URL 필수 체크
  if (!url) {
    printUsage();
    process.exit(1);
  }

  try {
    console.log(`🔄 Fetching Swagger document from: ${url}`);

    // 인증 정보가 있는 경우 표시
    if (username) {
      console.log(`🔐 Using authentication: ${username}`);
    }

    // Swagger 문서 가져오기
    const swaggerData = await fetchSwagger(url, username, password);

    // YAML 형식으로 변환
    const yamlData = yaml.dump(swaggerData);

    // 파일명 생성 (title을 kebab-case로 변환)
    const fileName = toKebabCase(swaggerData.info.title);
    const outputPath = path.resolve(process.cwd(), `swagger/${fileName}.yml`);

    // 파일 저장
    await writeFileToPath(outputPath, yamlData);

    console.log(`✅ Successfully downloaded and saved Swagger document`);
    console.log(`📁 File saved to: swagger/${fileName}.yml`);
    console.log(`📋 API Title: ${swaggerData.info.title}`);
    console.log(`📝 API Version: ${swaggerData.info.version}`);
  } catch (error) {
    console.error("\n❌ Failed to download Swagger document:");
    console.error(error.message);
    process.exit(1);
  }
};

main();
