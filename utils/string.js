/**
 * 문자열 처리 유틸리티 모듈
 * - 문자열 케이스 변환 기능
 * - 파일명 생성을 위한 kebab-case 변환
 */

/**
 * 문자열을 kebab-case로 변환하는 함수
 * - PascalCase, camelCase, snake_case를 kebab-case로 변환
 * - 공백을 하이픈으로 변환
 * - 모든 문자를 소문자로 변환
 *
 * @param {string} str - 변환할 문자열
 * @returns {string} kebab-case로 변환된 문자열
 *
 * @example
 * toKebabCase('MyApiTitle') // 'my-api-title'
 * toKebabCase('user_management') // 'user-management'
 * toKebabCase('API Documentation') // 'api-documentation'
 */
export const toKebabCase = (str) => {
  return (
    str
      // PascalCase/camelCase를 kebab-case로 변환 (예: MyApi -> My-Api)
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      // 공백을 하이픈으로 변환
      .replace(/\s+/g, "-")
      // 언더스코어를 하이픈으로 변환
      .replace(/_/g, "-")
      // 모든 문자를 소문자로 변환
      .toLowerCase()
  );
};
