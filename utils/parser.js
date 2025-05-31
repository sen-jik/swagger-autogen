/**
 * Swagger 스키마 파서 유틸리티
 * - Swagger anyOf 스키마를 TypeScript Union 타입으로 변환
 * - 필수/선택적 필드 처리
 * - null 타입 자동 추가/제거
 */

/**
 * 기본 스키마 파서 클래스
 * - swagger-typescript-api의 스키마 파서 기반 클래스
 * - 다양한 스키마 타입 처리를 위한 공통 기능 제공
 */
class MonoSchemaParser {
  schema;
  typeName;
  schemaPath;

  schemaParser;
  /** @type {SchemaParserFabric} */
  schemaParserFabric;
  /** @type {TypeNameFormatter} */
  typeNameFormatter;
  /** @type {SchemaComponentsMap} */
  schemaComponentsMap;
  /** @type {SchemaUtils} */
  schemaUtils;
  /** @type {CodeGenConfig} */
  config;
  /** @type {SchemaFormatters} */
  schemaFormatters;

  /**
   * MonoSchemaParser 생성자
   * @param {Object} schemaParser - 상위 스키마 파서 인스턴스
   * @param {Object} schema - 파싱할 스키마 객체
   * @param {string} typeName - 생성할 타입명
   * @param {Array} schemaPath - 스키마 경로 배열 (기본값: [])
   */
  constructor(schemaParser, schema, typeName, schemaPath = []) {
    this.schemaParser = schemaParser;
    this.schemaParserFabric = schemaParser.schemaParserFabric;
    this.schema = schema;
    this.typeName = typeName;
    this.typeNameFormatter = schemaParser.typeNameFormatter;
    this.schemaPath = schemaPath;
    this.schemaComponentsMap = this.schemaParser.schemaComponentsMap;
    this.schemaUtils = this.schemaParser.schemaUtils;
    this.config = this.schemaParser.config;
    this.schemaFormatters = this.schemaParser.schemaFormatters;
  }
}

/**
 * anyOf 스키마 파서 클래스
 * - Swagger anyOf 스키마를 TypeScript Union 타입 (T1 | T2)으로 변환
 * - 필수/선택적 필드에 따른 null 타입 자동 처리
 * - 중복 타입 제거 및 최적화
 *
 * @example
 * // Swagger anyOf 스키마:
 * {
 *   "anyOf": [
 *     { "type": "string" },
 *     { "type": "number" }
 *   ]
 * }
 *
 * // 생성되는 TypeScript 타입:
 * string | number
 */
class AnyOfSchemaParser extends MonoSchemaParser {
  /**
   * anyOf 스키마를 TypeScript Union 타입으로 파싱
   * @returns {string} TypeScript Union 타입 문자열
   */
  parse() {
    // 제외할 타입들 (any 타입은 항상 제외)
    const ignoreTypes = [this.config.Ts.Keyword.Any];

    // 필수 필드 여부에 따른 null 타입 처리
    if (this.schema.required === "boolean") {
      // 스키마에 required가 boolean으로 명시된 경우
      !this.schema.required && ignoreTypes.push("null");
    } else {
      // 상위 스키마에서 required 필드 확인
      const isRequired = this.schemaComponentsMap._data
        .find((v) => v.typeName === this.schemaPath.at(0))
        ?.rawTypeData?.required?.includes(this.schemaPath.at(1));
      !isRequired && ignoreTypes.push("null");
    }

    // anyOf 배열의 각 스키마를 TypeScript 타입으로 변환
    const combined = this.schema.anyOf.map((childSchema) =>
      this.schemaParserFabric.getInlineParseContent(
        this.schemaUtils.makeAddRequiredToChildSchema(this.schema, childSchema),
        this.schemaPath
      )
    );

    // 제외할 타입들을 필터링하여 최종 타입 배열 생성
    const filtered = this.schemaUtils.filterSchemaContents(
      combined,
      (content) => !ignoreTypes.includes(content)
    );

    // TypeScript Union 타입 문자열 생성 (예: "string | number")
    return this.config.Ts.UnionType(filtered);
  }
}

export { AnyOfSchemaParser };
