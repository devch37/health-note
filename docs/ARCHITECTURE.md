# 아키텍처

> 산출물 2(기술 스택·출시 플랫폼), 3(시스템 아키텍처·모듈 경계). 상태: **검토 요청**

## 1. 출시 플랫폼 선택

| 안 | 장점 | 단점 | 판단 |
|---|---|---|---|
| A. Next.js 모바일 반응형 웹 | 1인 개발 속도, 배포 즉시 반영, 데스크톱에서 원본 대조 화면이 넓음, 심사 없음 | 카메라 UX·푸시 제한, 홈 화면 설치는 PWA 수준, 스토어 노출 없음 | Sprint 1에 구현 후 **보류** |
| **B. React Native + Expo** | iOS·Android 단일 코드베이스, 카메라·스토어 노출, EAS 클라우드 빌드, Expo Router 웹 출력으로 웹 재개 여지 | 스토어 심사(건강 앱 심사 강화), 원본 대조 화면이 좁음 | **채택(2026-11-01)** |

앱 우선 전환의 이유와 후보 비교는 [ANALYSIS.md §6](ANALYSIS.md). 백엔드 API는 클라이언트와 무관하게 그대로 쓰고, 인증 전달 방식만 쿠키·헤더 두 가지를 지원한다(§3, ADR-10).

## 2. 기술 스택

| 영역 | 선택 | 버전(착수 시점 최신 안정판 확인) | 이유 |
|---|---|---|---|
| 언어/런타임 | Java 21 (LTS) | 21 | PRD 지정, 로컬 설치 확인됨 |
| 백엔드 | Spring Boot 4.1, Spring Security 7, Spring Data JPA(Hibernate 7), Spring Validation | 4.1.2 | 표준 스택. 착수 시점(2026-10) Initializr가 3.x를 더 이상 제공하지 않아 4.x 채택 |
| 세션 | Spring Session JDBC | — | 서버 측 세션, 즉시 무효화(로그아웃·탈퇴·비밀번호 변경) |
| DB | PostgreSQL 16 + Flyway | 16 | jsonb, 부분 인덱스, `FOR UPDATE SKIP LOCKED` 큐 |
| 빌드 | Gradle (Kotlin DSL), Wrapper | 9.8.2 | |
| API 문서 | springdoc-openapi | — | 코드 → OpenAPI 생성, `docs/API.md`와 대조 |
| 오브젝트 스토리지 | S3 호환 (로컬 MinIO, 운영 S3 호환 서비스) | — | 비공개 버킷, 서명 URL |
| 악성코드 검사 | ClamAV (clamd) | — | 오픈소스, 컨테이너 운영 |
| 메일 | 로컬 Mailpit, 운영 SMTP 제공업체(미정) | — | |
| 앱 | React Native + Expo (Expo Router, TypeScript) | Expo SDK 58 (착수 시 재확인) | iOS·Android 단일 코드. 디자인 토큰은 `theme.ts` + `StyleSheet` |
| 앱 기기 기능 | expo-secure-store(세션 토큰), expo-image-picker·expo-image-manipulator(촬영·JPEG 변환), expo-document-picker(PDF) | — | Expo 공식 모듈만 우선 사용 |
| 앱 데이터 | TanStack Query | — | 분석 상태 폴링, 재시도. 웹과 같은 패턴 |
| 차트 | Sprint 5에 결정(react-native-svg 기반 후보) | — | 참고범위 밴드, 접근성 대체 표 |
| 테스트 | JUnit 5, AssertJ, Testcontainers 2(PostgreSQL), MockMvc, ArchUnit / Jest(jest-expo), React Native Testing Library, Maestro(E2E) | — | |
| 배포 | 백엔드: Docker, GitHub Actions · 앱: EAS Build/Submit(TestFlight, Play 내부 테스트) | — | |
| (보류) 웹 | Next.js 16 + Tailwind 4 (`apps/web`) | 16.4.3 | Sprint 1 결과물. 웹 재개 시 유지 또는 Expo 웹 출력으로 대체 결정 |

## 3. 시스템 구성

```mermaid
flowchart LR
    subgraph Client
      APP[Expo App iOS·Android<br/>apps/mobile]
      WEB[Next.js Web 보류<br/>apps/web]
    end
    subgraph Backend[Spring Boot 단일 배포 단위]
      API[REST API /api/v1]
      WORKER[Analysis Worker<br/>같은 JVM, @Scheduled 폴링]
    end
    APP -- HTTPS + X-Auth-Token 헤더 --> API
    WEB -. HTTPS + 세션 쿠키 .-> API
    API --> PG[(PostgreSQL)]
    WORKER --> PG
    API --> OBJ[(Private Object Storage)]
    WORKER --> OBJ
    API --> AV[ClamAV]
    WORKER --> OCR[Extraction Provider<br/>교체 가능 어댑터]
    API --> MAIL[SMTP]
```

- **단일 배포 단위**: API와 워커는 같은 Spring Boot 애플리케이션. `app.worker.enabled` 프로퍼티로 워커만/API만 띄울 수 있어 나중에 분리 가능.
- **앱은 백엔드를 직접 호출**한다(다른 출처지만 브라우저가 아니므로 CORS·SameSite 제약 없음). 로그인·인증코드 확인 응답의 `X-Auth-Token` 헤더 값을 expo-secure-store에 저장하고 이후 요청에 같은 헤더로 보낸다. 헤더 인증 요청은 CSRF 검사를 하지 않는다. API 주소는 빌드 환경변수(`EXPO_PUBLIC_API_ORIGIN`)로 주입하고, 개발 중에는 Metro 서버 주소의 호스트를 쓴다. 브라우저 미리보기(`expo start --web`)는 토큰을 메모리에만 두고 local 프로필 CORS로 백엔드를 호출한다.
- (보류된 웹) **Next.js는 BFF 없이** 백엔드 API를 호출한다. 화면은 정적 셸 + 클라이언트 컴포넌트이며 세션 확인은 브라우저에서 `/api/v1/users/me`로 한다(서버 컴포넌트에서 쿠키를 읽지 않음). 같은 상위 도메인(`app.example.kr` / `api.example.kr`) 또는 Next.js rewrites로 동일 출처를 구성해 쿠키·CORS를 단순화한다(로컬은 rewrites).

## 4. 모듈 경계 (모듈형 모놀리스)

패키지 루트 `kr.gumjin.note` (가칭)

| 모듈 | 책임 | 소유 테이블 | 의존 가능 |
|---|---|---|---|
| `global` | 오류 형식(ProblemDetail), 보안 설정, 공통 ID/시간, 로깅 마스킹 | — | — |
| `auth` | 가입, 이메일 인증, 로그인/로그아웃, 비밀번호 재설정, 로그인 시도 제한 | `email_verifications`, `password_reset_tokens`, `login_attempts`, `spring_session*` | user |
| `user` | 내 정보, 동의 이력, 탈퇴, 내보내기 | `users`, `user_consents` | checkup(삭제·내보내기 위임) |
| `checkup` | 검진 이벤트 CRUD, 상태 전이, 확정 | `checkups` | document, measurement |
| `document` | 업로드 검증, 스토리지, 분석 작업 큐·워커, 추출 어댑터 | `checkup_documents`, `document_pages`, `document_analysis_jobs` | — (결과는 이벤트/서비스 호출로 checkup·measurement에 전달) |
| `measurement` | 표준 항목 사전, 항목 결과, 수정 이력, 단위 정규화 | `measurement_definitions`, `measurement_unit_aliases`, `checkup_measurements`, `measurement_revisions` | — |
| `trend` | 확정값 기반 추이·비교 가능성 판단, 대시보드 조회 | (읽기 전용) | measurement, checkup |
| `healthinfo` (P1) | 검증된 설명 콘텐츠 | `health_information` | measurement |
| `goal` (P2) | 목표·실천 | `health_goals`, `goal_records` | — |

규칙
- 모듈 간 호출은 상대 모듈의 `*Service`(공개 API)로만 한다. 다른 모듈의 Repository·Entity 직접 사용 금지.
- 각 모듈 내부: `controller / service / domain / repository`. 필요해질 때만 세분화.
- 경계 위반은 ArchUnit 테스트로 검사한다(Sprint 1에 규칙 1~2개부터).

## 5. 요청 처리 공통 규칙

- **소유권 검증**: 건강정보 조회는 항상 `findByIdAndUserId(id, currentUserId)` 형태. 없거나 타인 소유면 동일하게 `404 Not Found`(존재 여부 노출 방지).
- **외부 ID**: UUID(v7 또는 v4)를 PK로 사용. 순번 노출 없음. 추측 불가성은 보조 수단이며 소유권 검증을 대체하지 않는다.
- **낙관적 잠금**: `checkups.version`. 확정·수정 API는 `If-Match`(ETag) 또는 요청 본문 `version` 필수 → 충돌 시 `409`.
- **멱등성**: 업로드 API는 `Idempotency-Key` 헤더 지원(24시간). 워커 결과 저장은 `job_id` 기준 upsert.
- **시간**: DB `timestamptz`, API는 ISO-8601 UTC. 검진일(`exam_date`)은 `date`(시간대 없음).

## 6. 배포·환경

| 환경 | 구성 |
|---|---|
| local | `infrastructure/compose.yaml`: postgres, minio, clamav, mailpit. 백엔드는 호스트에서 실행, 앱은 `npx expo start`로 시뮬레이터·Expo Go에서 실행(실기기는 같은 LAN의 호스트 IP로 접속) |
| CI | GitHub Actions: backend `./gradlew check`(Testcontainers), mobile `lint/typecheck/test`, (보류 중) web `lint/typecheck/test/build`. 앱 빌드는 EAS에서 수동 트리거 |
| staging/prod | 미정. 국내 리전 권장. 비밀정보는 환경변수/시크릿 매니저, 저장소에 커밋 금지 |

## 7. 아키텍처 의사결정 기록 (ADR 요약)

| ID | 결정 | 대안 | 이유 |
|---|---|---|---|
| ADR-1 | 모듈형 모놀리스 | MSA | 1인 개발, 트랜잭션 단순 |
| ADR-2 | DB 기반 작업 큐 (`SKIP LOCKED`) | SQS/RabbitMQ | 인프라 최소화, 트랜잭션 일관성. 처리량 증가 시 교체 |
| ADR-3 | 서버 세션(웹은 HttpOnly 쿠키) | JWT(localStorage) | XSS 시 토큰 탈취 방지, 즉시 무효화 |
| ADR-4 | 추출 결과는 별도 컬럼에 원본 보존 | 덮어쓰기 | 추적성·감사 |
| ADR-5 | 단위 변환 미구현(MVP) | 변환 테이블 | 잘못된 변환 위험 > 편의 |
| ADR-6 | 추출 제공업체는 어댑터 + Fake | 처음부터 특정 벤더 | 평가 전 락인 방지, 테스트 결정성 |
| ADR-7 | CSRF는 쿠키 double-submit(`XSRF-TOKEN` 쿠키 → `X-XSRF-TOKEN` 헤더) | 세션 저장 토큰 | 익명 방문자에게 DB 세션을 만들지 않음. Spring Security 7.1의 `csrf.spa()`는 세션 저장소를 써서 명시 설정 |
| ADR-8 | (웹) 로그아웃·탈퇴 후 전체 페이지 새로고침 | 클라이언트 라우팅 | Next 16은 이전 화면을 숨긴 채 유지(Activity)하므로 계정 정보가 DOM·메모리에 남지 않게 함 |
| ADR-9 | 앱 우선, React Native + Expo 단일 코드베이스 | Next.js 웹 우선, Flutter, Capacitor | 1인·저리소스로 iOS·Android 동시 지원, TS 재사용, EAS로 빌드 부담 축소. [ANALYSIS.md §6](ANALYSIS.md) |
| ADR-10 | 앱은 같은 서버 세션을 `X-Auth-Token` 헤더로 전달(Spring Session 헤더 리졸버), 앱 세션은 유휴 30일·절대 90일 | JWT + 리프레시 토큰 | 기존 세션 무효화 로직(로그아웃·비밀번호 변경·탈퇴)을 그대로 재사용, 즉시 폐기 가능, 구현량 최소. 토큰은 Keychain/Keystore에만 저장 |
