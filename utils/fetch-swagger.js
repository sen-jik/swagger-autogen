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
  // HTTP Basic Authentication 헤더 생성
  const credentials = btoa(`${username}:${password}`);

  try {
    // Swagger 문서 HTTP 요청
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    // HTTP 응답 상태 확인
    if (!response.ok) {
      console.error("failed with status code", response.status);
    }

    // JSON 형태로 파싱하여 반환
    return response.json();
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
};
