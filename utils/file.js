/**
 * 파일 처리 유틸리티 모듈
 * - 파일 및 디렉토리 생성 기능
 * - 생성된 API 파일들을 적절한 위치에 저장
 * - 디렉토리 자동 생성 지원
 */

import path from "node:path";
import fs from "node:fs";

/**
 * 지정된 경로에 파일을 생성하는 함수
 * - 필요한 디렉토리를 자동으로 생성
 * - 파일 내용을 UTF-8 인코딩으로 저장
 * - 성공/실패 로그 출력
 *
 * @param {string} filePath - 생성할 파일의 전체 경로
 * @param {string} fileContent - 파일에 저장할 내용
 *
 * @example
 * await writeFileToPath('./src/api/user.ts', 'export class UserApi {}');
 */
export const writeFileToPath = async (filePath, fileContent) => {
  // 파일 경로에서 디렉토리 경로 추출
  const outputDir = path.dirname(filePath);

  try {
    // 디렉토리가 존재하지 않으면 재귀적으로 생성
    await fs.promises.mkdir(outputDir, { recursive: true });

    // 파일 내용을 UTF-8 인코딩으로 저장
    await fs.promises.writeFile(filePath, fileContent);

    console.log(`✅  Successfully wrote file at ${filePath}`);
  } catch (err) {
    console.error(`☠️   Failed to write file at ${filePath}: ${err}`);
  }
};

/**
 * DTO 파일을 저장하는 함수
 * - 생성된 파일들 중에서 data-contracts 파일을 찾아 저장
 * - DTO 타입 정의들이 포함된 파일
 *
 * @param {string} outputPath - DTO 파일을 저장할 경로
 * @param {Array} generateFiles - 생성된 파일들의 배열
 *
 * @deprecated 현재는 generate-all.js에서 직접 처리하므로 사용되지 않음
 */
export const saveDto = async (outputPath, generateFiles) => {
  await writeFileToPath(
    outputPath,
    generateFiles.find(({ fileName }) => fileName === "data-contracts")
      .fileContent
  );
};

/**
 * 엔티티별 API 파일들을 저장하는 함수
 * - http-client와 data-contracts를 제외한 모든 파일 저장
 * - 모듈명을 기반으로 경로 동적 생성
 *
 * @param {string} outputPath - 출력 경로 템플릿 ({moduleName} 플레이스홀더 포함)
 * @param {Array} generateFiles - 생성된 파일들의 배열
 *
 * @deprecated 현재는 generate-all.js에서 직접 처리하므로 사용되지 않음
 */
export const saveEntitiesFile = async (outputPath, generateFiles) => {
  for (const { fileName, fileContent } of generateFiles) {
    // http-client와 data-contracts 파일은 제외
    if (fileName === "http-client" || fileName === "data-contracts") continue;

    // 파일명을 소문자로 변환하여 모듈명으로 사용
    const moduleName = fileName.toLowerCase();

    // 출력 경로에서 {moduleName} 플레이스홀더를 실제 모듈명으로 교체
    const output = outputPath.replace("{moduleName}", moduleName);

    await writeFileToPath(output, fileContent);
  }
};
