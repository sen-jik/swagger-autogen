/**
 * Swagger 문서 가져오기 유틸리티
 * - 원격 Swagger 문서를 HTTP 요청으로 가져옴
 * - HTTP Basic Authentication 지원
 * - JSON 형태의 Swagger 문서 반환
 *
 * @param {string} url - Swagger 문서 URL
 * @param {string} username - HTTP Basic Auth 사용자명 (선택사항)
 * @param {string} password - HTTP Basic Auth 비밀번호 (선택사항)
 * @returns {Promise<Object>} Swagger 문서 JSON 객체
 *
 * @example
 * // 인증 없이 가져오기
 * const swagger = await fetchSwagger('https://api.example.com/swagger.json');
 *
 * // 인증과 함께 가져오기
 * const swagger = await fetchSwagger(
 *   'https://api.example.com/swagger.json',
 *   'admin',
 *   'password'
 * );
 */
export const fetchSwagger = async (url, username, password) => {
  const headers = {};
  if (username && password) {
    const credentials = Buffer.from(`${username}:${password}`).toString(
      "base64"
    );
    headers.Authorization = `Basic ${credentials}`;
  }

  try {
    // Swagger 문서 HTTP 요청
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    // HTTP 응답 상태 확인
    if (!response.ok) {
      throw new Error(`Failed to fetch Swagger: HTTP ${response.status}`);
    }

    // JSON 형태로 파싱하여 반환
    return response.json();
  } catch (error) {
    throw new Error(
      `There was a problem with the fetch operation: ${error.message}`
    );
  }
};
