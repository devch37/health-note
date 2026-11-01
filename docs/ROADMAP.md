# MVP 작업 분해 · 로드맵

> 산출물 9(MVP 작업 분해·우선순위·Sprint 완료 기준), 10(Sprint 1 상세 작업). 상태: Sprint 1 완료, **앱 우선 전환(2026-11-01)으로 추가한 Sprint 1.5 구현(2026-11-01) — 시뮬레이터·E2E 검증 남음**
> 기간은 산정하지 않는다(PRD §13). Sprint는 "완료 기준을 만족하면 끝"인 단위다.

## 1. 공통 완료 기준 (Definition of Done)

- 설계 문서(이 `docs/`) 갱신
- 자동 테스트 통과(CI green), 새 건강정보 엔드포인트마다 **타 사용자 접근 404 테스트**
- 로딩·빈·오류·권한 없음 상태 구현(화면이 있는 경우)
- 로그에 건강정보·토큰·파일 내용 없음(로그 캡처 테스트)
- 수동 검수 체크리스트 수행 결과를 PR에 기록
- 남은 이슈·의사결정 사항 보고

## 2. Sprint 개요

| Sprint | 목표 (수직 기능) | 완료 기준 요약 | 선행 결정 |
|---|---|---|---|
| **1 기반** ✅ | 가입→이메일 인증→로그인→내 정보→로그아웃이 웹에서 동작 | 아래 §3 | Q1, Q5, Q8, Q9 |
| **1.5 앱 기반** 🟡 | 같은 인증 흐름이 iOS·Android 앱(Expo)에서 동작하고 백엔드가 앱 토큰 인증을 지원 | 아래 §4 | Q1 변경, Q5 변경 |
| **2 업로드** | 로그인 사용자가 앱에서 촬영·사진첩·PDF로 올리면 검진(ANALYZING)·작업(PENDING)이 생기고 목록에 보인다 | 검증 규칙 전부 테스트(EICAR·위장·암호화·폭탄), 비공개 저장, 멱등 키, HEIC→JPEG 기기 변환, 업로드 UI 진행률/취소/오류, 권한 거부 상태 | Q4 |
| **3 추출** | 워커가 작업을 처리해 Fake 제공업체 결과로 REVIEW_REQUIRED가 된다. 실제 제공업체 1개 연동은 평가 후 | 큐 동시성·좀비 회수·재시도·멱등 테스트, 정규화 규칙 단위 테스트, 표준 항목 시드, 분석 진행 화면, 평가 스크립트 | **Q2, Q3** |
| **4 검증·기록** | 원본 대조 화면에서 수정·제외·추가 후 확정, 목록·상세·삭제 | 확정 조건(422), 이력 기록, 버전 충돌(409), 원본 미리보기 서명 URL, 직접 입력 경로, 삭제 안내·파기 작업 | — |
| **5 대시보드·추이** | 홈 카드와 항목별 그래프 | 미확정값 미사용 테스트, 단위/방법 차이 비교 보류 테스트, 1개 데이터 단일 표시, 차트 대체 표, 판정 표현 없음(카피 린트) | — |
| **6 출시 준비** | 마이페이지(동의·내보내기·탈퇴), 보안 점검, OCR 정확도 평가, E2E, 백업 복원, 모니터링, TestFlight·Play 내부 테스트 베타, 스토어 제출 | SECURITY.md §10, §8-10(스토어 심사 준비), 출시 차단 오류 0건 기준 충족, 법률·의료기기 검토 결과 반영 | Q6, Q7, 법률 검토, 개발자 계정 |
| 후속 | INFO-001 설명 콘텐츠, 추가 양식, 푸시 알림, GOAL-001, 생체인증 앱 잠금, 웹 재개(Next.js 유지 또는 Expo 웹 출력) | — | 콘텐츠 검토 체계 |

마이페이지의 탈퇴는 Sprint 1에 계정만 지우는 형태로 먼저 두고, 건강정보 파기 연동은 Sprint 4, 내보내기는 Sprint 6에 붙인다.

## 3. Sprint 1 상세 작업 목록

### 3.1 저장소·인프라

| # | 작업 | 결과물 | 테스트/확인 |
|---|---|---|---|
| 1-1 | 모노레포 구조 생성 (PRD §16) | `backend/`, `apps/web/`, `infrastructure/`, `.github/workflows/`, `.gitignore`, `.editorconfig` | — |
| 1-2 | 로컬 인프라 | `infrastructure/compose.yaml`: postgres:16, mailpit (minio·clamav는 Sprint 2에 추가) | `docker compose up` 후 헬스체크 |
| 1-3 | `.env.example` | DB·메일 접속 정보 예시(실제 비밀정보 없음) | gitleaks CI |

### 3.2 백엔드 기반

| # | 작업 | 테스트 |
|---|---|---|
| 1-4 | Spring Boot 3 + Java 21 + Gradle(Kotlin DSL) 프로젝트, 패키지 `global/auth/user` | 컨텍스트 로드 테스트 |
| 1-5 | Flyway V1(users·consents·verifications·reset tokens·login attempts), V2(spring session) | Testcontainers로 마이그레이션 적용 테스트 |
| 1-6 | 공통 오류 처리: `@RestControllerAdvice` → ProblemDetail + `code` + 필드 오류 + traceId | 400/401/403/404/409/429 형식 스냅샷 테스트 |
| 1-7 | 로깅: JSON 로그, 요청 ID, 마스킹 규칙, 요청 본문 로깅 금지 | 로그 캡처 테스트(이메일·비밀번호·코드 미포함) |
| 1-8 | 보안 설정: Spring Security, Session JDBC, 쿠키 속성, CSRF, CORS(로컬 web origin), 보안 헤더 | 미인증 401, CSRF 없는 POST 403, 쿠키 속성 검사 |
| 1-9 | springdoc-openapi (`/v3/api-docs`, local 프로필에서만 UI) | 스펙 생성 테스트 |
| 1-10 | ArchUnit: 모듈 간 repository 직접 참조 금지 규칙 | ArchUnit 테스트 |

### 3.3 인증 기능 (AUTH-001)

| # | API | 테스트 시나리오 |
|---|---|---|
| 1-11 | `POST /auth/signup` | 정상 가입·필수 동의 누락 400·비밀번호 정책·이미 있는 이메일에도 동일 응답·동의 이력 저장·Argon2id 해시 저장 |
| 1-12 | `POST /auth/email-verifications/confirm`, `/resend` | 정상 인증 → ACTIVE·만료·5회 실패 무효화·재발송 쿨다운·코드 해시 저장 |
| 1-13 | 메일 발송 어댑터(`MailSender` 인터페이스, local=Mailpit SMTP, test=인메모리) | 발송 내용에 코드 포함, 로그에 미포함 |
| 1-14 | `POST /auth/login`, `/logout` | 성공 시 세션 ID 재발급·잘못된 비밀번호 401·5회 실패 잠금 429 + Retry-After·로그아웃 후 401 |
| 1-15 | `POST /auth/password-reset/request`, `/confirm` | 존재/미존재 이메일 동일 202·토큰 단회용·만료·재설정 후 기존 세션 무효화 |
| 1-16 | `GET /users/me`, `PUT /users/me/password`, `DELETE /users/me`(계정만) | 미인증 401·미인증메일 사용자 건강정보 API 403(가드 필터 단위 테스트)·탈퇴 후 로그인 불가·같은 이메일 재가입 가능 |

### 3.4 웹 기반

| # | 작업 | 테스트 |
|---|---|---|
| 1-17 | Next.js + TypeScript + Tailwind, 디자인 토큰(UX.md §6), Pretendard, ESLint/Prettier | `lint`, `typecheck`, `build` |
| 1-18 | API 클라이언트(fetch 래퍼: CSRF 헤더, ProblemDetail 파싱, 401 → 로그인), TanStack Query, `next.config` rewrites로 `/api` 프록시 | Vitest 단위 테스트 |
| 1-19 | 기본 컴포넌트: Button, TextField, CodeInput, Card, ErrorState, Skeleton | Testing Library + jest-axe |
| 1-20 | 화면: 가입(동의 포함)·인증코드·로그인·비밀번호 재설정·빈 홈(Empty State)·MY(로그아웃·탈퇴) | 상태별 렌더 테스트 |
| 1-21 | E2E: 가입→Mailpit에서 코드 조회→인증→로그인→로그아웃 | Playwright (compose 환경) |

### 3.5 CI·문서

| # | 작업 |
|---|---|
| 1-22 | GitHub Actions: backend(`./gradlew check`, Testcontainers), web(lint/typecheck/test/build), gitleaks, Dependabot |
| 1-23 | `backend/Dockerfile`(멀티스테이지, non-root), web Dockerfile은 배포 대상 확정 시 |
| 1-24 | README 실행 방법, `docs/API.md`와 생성된 OpenAPI 비교 갱신 |

### 3.6 Sprint 1 완료 기준 (2026-10-29 로컬 검증)

- [x] README 절차로 로컬 실행 (compose → 백엔드 → 웹)
- [x] 1-11~1-16 시나리오 자동 테스트 통과 — 백엔드 44건
- [x] Playwright E2E(가입→인증→홈→로그아웃→로그인) + 공개 화면 axe 검사 5건 통과
- [ ] CI green — 워크플로는 작성했으나 원격 저장소가 없어 GitHub Actions에서 아직 실행하지 않음
- [x] 로그 캡처 테스트에서 이메일·비밀번호·코드·토큰·세션 ID 미검출
- [x] 공개 화면 axe serious/critical 위반 0건(실제 브라우저, 색 대비 포함)

### 3.7 Sprint 1에서 남긴 것

| 항목 | 이유/계획 |
|---|---|
| 세션 절대 만료(7일) | 유휴 30분만 적용. Sprint 1.5(1.5-3)에서 앱 수명과 함께 구현 |
| 동시 가입 경쟁(같은 이메일 동시 요청) | 유니크 인덱스가 막지만 500 응답. Sprint 2에서 409 없이 202로 정리 |
| "이미 가입됨" 안내 메일 발송 간격 제한 | 인증코드·재설정과 달리 쿨다운 없음(메일 폭탄 가능). Sprint 2 |
| 웹 CSP | Next nonce 기반 CSP 설계 필요. 그 외 보안 헤더는 적용 |
| 약관·처리방침 문안 | 법률 검토 후 게시(현재 체크박스와 안내 문구만) |
| 유출 비밀번호 목록 검사 | P1 |
| 1-10 ArchUnit | auth→user.repository 금지, user→auth 금지, global→기능 모듈 금지 3개 규칙 적용 |

## 4. Sprint 1.5 상세 작업 목록 — 앱 기반

웹(`apps/web`)은 더 개발하지 않고 보류한다. 코드는 지우지 않고 CI에서 lint/test만 유지한다.

### 4.1 백엔드: 앱 인증 지원

| # | 작업 | 테스트 |
|---|---|---|
| 1.5-1 | 복합 `HttpSessionIdResolver`: `X-Auth-Token` 헤더가 있거나 `X-Client: app`이면 헤더, 아니면 `GN_SESSION` 쿠키 | 앱 로그인 응답에 `X-Auth-Token`·쿠키 없음, 헤더로 `/users/me` 200, 헤더+쿠키 동시 시 헤더 우선 |
| 1.5-2 | CSRF 매처: 헤더 인증 요청은 CSRF 제외, 쿠키 요청은 기존대로 | 헤더 요청 POST에 CSRF 없이 성공, 쿠키 요청 POST에 CSRF 없으면 403 |
| 1.5-3 | 세션 수명: 로그인 시 클라이언트별 유휴(앱 30일·웹 30분) 설정, 절대 만료(앱 90일·웹 7일) 필터 | 시계 주입으로 유휴·절대 만료 후 401 |
| 1.5-4 | 비밀번호 재설정을 6자리 코드로 변경: V3 마이그레이션(시도 횟수 컬럼), `confirm {email, code, newPassword}`, `INVALID_RESET_CODE`, 메일 문안 | 정상·만료·5회 실패 무효화·없는 이메일 동일 400·재설정 후 전 세션(헤더 포함) 무효화 |
| 1.5-5 | 로그 검사 확장: `X-Auth-Token` 값이 로그에 없음 | SensitiveLoggingTest |

### 4.2 앱 기반 (`apps/mobile`)

| # | 작업 | 테스트/확인 |
|---|---|---|
| 1.5-6 | Expo(최신 SDK) + TypeScript + Expo Router 스캐폴딩, ESLint, 디자인 토큰 `theme.ts`, Pretendard | `lint`, `typecheck`, iOS 시뮬레이터·Android 에뮬레이터 실행 |
| 1.5-7 | API 클라이언트: `EXPO_PUBLIC_API_ORIGIN`, `X-Client: app`, 토큰 저장(expo-secure-store)·첨부·401 시 삭제, ProblemDetail 파싱(웹 `api.ts` 로직 이식) | Jest 단위 테스트 |
| 1.5-8 | 기본 컴포넌트: Button, TextField, CodeInput, Card, Alert, Skeleton, ErrorState, EmptyState | RNTL 역할·라벨 테스트 |
| 1.5-9 | 화면: 온보딩·가입(동의)·인증코드·로그인·비밀번호 재설정(코드)·빈 홈·MY(로그아웃·비밀번호 변경·탈퇴) | 상태별 렌더 테스트 |
| 1.5-10 | E2E: 가입→Mailpit 코드→인증→홈→로그아웃→로그인 (Maestro, 로컬 시뮬레이터) | Maestro 플로우 |
| 1.5-11 | CI: mobile `lint/typecheck/test`, Dependabot에 `apps/mobile` 추가·`apps/web` 제외. EAS 프로젝트 설정(`eas.json`, development/preview 프로필) | CI 정의 검토 |

### 4.3 Sprint 1.5 완료 기준 (2026-11-01 로컬 검증)

- [x] README 절차로 백엔드 + 앱 실행 — 개발 PC에 Xcode·Android SDK가 없어 **Expo 웹 미리보기**로 가입→Mailpit 코드→인증→홈→MY→로그아웃→로그인 확인. iOS·Android 실기기(Expo Go) 확인은 남음
- [x] 1.5-1~1.5-5 백엔드 테스트 통과 — 55건(기존 44 + 앱 세션 8 + 재설정 코드 2 + CORS 1)
- [ ] 앱 단위 테스트 통과(15건 ✔), Maestro 인증 플로우 — **미작성**(시뮬레이터 필요)
- [x] 토큰이 AsyncStorage·로그에 없음 — expo-secure-store만 사용(웹 미리보기는 메모리), SensitiveLoggingTest에 앱 토큰 추가
- [ ] VoiceOver로 가입·로그인 화면 수동 점검 — 실기기 필요

### 4.4 Sprint 1.5에서 남긴 것

| 항목 | 이유/계획 |
|---|---|
| Maestro E2E, VoiceOver·TalkBack 점검 | Xcode·Android 에뮬레이터 설치 후. 실기기 Expo Go로 수동 확인 먼저 |
| Pretendard 글꼴 | 앱은 시스템 글꼴(iOS SF·Apple SD Gothic Neo, Android Roboto·Noto) 사용. 웹의 woff2는 앱에서 못 써 OTF 번들 필요 |
| 앱 아이콘·스플래시 | Expo 템플릿 기본 이미지. 브랜드 자산 필요 |
| 생체인증 앱 잠금 | P1 |
| EAS 프로젝트 연결(`eas init`) | Expo 계정 필요. `eas.json`의 preview/production 프로필만 작성 |

## 5. Sprint 1·1.5에서 하지 않는 것

업로드·스토리지·분석·측정값·대시보드 데이터, 운영 배포, 스토어 제출, 푸시 알림, 결제, 소셜 로그인.
