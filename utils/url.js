/**
 * URL 처리 유틸리티 모듈
 * - URL 유효성 검증 기능
 * - 로컬 파일과 원격 URL 구분
 */

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

/**
 * 문자열이 유효한 URL인지 확인하는 함수
 * - HTTP/HTTPS URL 형식 검증
 * - 로컬 파일 경로와 원격 URL 구분에 사용
 *
 * @param {string} string - 검증할 문자열
 * @returns {boolean} 유효한 URL이면 true, 아니면 false
 *
 * @example
 * isUrl('https://api.example.com/swagger.json') // true
 * isUrl('./swagger.yml') // false
 * isUrl('not-a-url') // false
 */
export const isUrl = (string) => {
  try {
    // URL 생성자를 사용하여 유효성 검증
    // 유효하지 않은 URL이면 예외 발생
    new URL(string);
    return true;
  } catch (err) {
    // URL 생성 실패 시 false 반환
    return false;
  }
};
