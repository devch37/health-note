# 검진노트 (Gumjin Note)

> 건강검진은 1년에 한 번, 건강관리는 매일.

건강검진 결과지(PDF/사진)에서 검사 항목·수치·단위·참고범위를 추출하고, 사용자가 원본과 대조해 확정한 뒤 과거 검진과의 변화를 보여주는 개인 건강기록 서비스입니다. 의료적 진단이나 치료를 대체하지 않습니다.

## 상태

**Sprint 1 완료** — 가입·이메일 인증·로그인·비밀번호 재설정·내 정보·탈퇴(계정만), 웹 클라이언트.

**2026-11-01 앱 우선으로 전환** — 첫 출시는 iOS·Android 앱(React Native + Expo)입니다. 웹(`apps/web`)은 보류합니다. **Sprint 1.5(앱 기반·앱 토큰 인증) 구현** — 같은 인증 흐름이 Expo 앱에서 동작합니다. 다음은 Sprint 2(문서 업로드). 이유는 [docs/ANALYSIS.md §6](docs/ANALYSIS.md), 계획은 [docs/ROADMAP.md](docs/ROADMAP.md).

## 구조

```
backend/           Spring Boot 4.1 · Java 21 · PostgreSQL · Flyway
apps/mobile/       React Native · Expo SDK 58 · Expo Router · TypeScript — iOS·Android
apps/web/          (보류) Next.js 16 · TypeScript · Tailwind CSS 4
infrastructure/    로컬 개발용 Docker Compose (PostgreSQL, Mailpit)
docs/              요구사항·설계 문서
```

## 로컬 실행

필요: JDK 25(`backend/build.gradle.kts` 툴체인 — Gradle이 설치된 JDK 중에서 찾습니다), Node.js 22+, Docker. 앱은 휴대폰의 **Expo Go** 앱 또는 브라우저로 봅니다(Xcode·Android Studio 불필요).

**1. DB·메일함 띄우기**

```bash
docker compose -f infrastructure/compose.yaml up -d --wait
```

**2. 백엔드 실행** (http://localhost:8080)

```bash
cd backend && ./gradlew bootRun --args='--spring.profiles.active=local'
```

**3. 앱 실행** (다른 터미널)

```bash
cd apps/mobile && npm install && npx expo start
```

- **휴대폰에서 보기:** App Store/Play 스토어에서 *Expo Go*를 설치하고, 터미널에 뜬 QR 코드를 찍습니다(iPhone은 기본 카메라 앱, Android는 Expo Go 안의 스캐너). 휴대폰과 컴퓨터가 **같은 Wi‑Fi**여야 합니다. 앱은 Metro 서버 주소를 보고 같은 컴퓨터의 `:8080` 백엔드를 자동으로 찾습니다.
- **브라우저에서 보기:** 같은 터미널에서 `w`를 누르거나 `npx expo start --web` → http://localhost:8081. 브라우저 미리보기는 토큰을 메모리에만 두므로 새로고침하면 로그아웃됩니다.
- **인증코드·재설정 코드 확인:** 메일함(Mailpit) http://localhost:8025
- 백엔드 주소를 직접 지정하려면 `EXPO_PUBLIC_API_ORIGIN=http://<IP>:8080 npx expo start`.

**잘 안 될 때**

| 증상 | 확인 |
|---|---|
| 휴대폰에서 "네트워크 연결을 확인해주세요" | 같은 Wi‑Fi인지, macOS 방화벽이 Java(8080) 수신을 막지 않는지. 회사·공용 Wi‑Fi는 기기 간 통신을 막기도 함 → `npx expo start --tunnel`은 Metro만 터널링하므로 이 경우 `EXPO_PUBLIC_API_ORIGIN`에 접근 가능한 주소 지정 |
| Expo Go가 "SDK 버전이 맞지 않음" | Expo Go를 최신으로 업데이트(이 프로젝트는 Expo SDK 58) |
| 백엔드가 `UnsupportedClassVersionError` | JDK 25로 실행해야 함. `./gradlew bootRun`은 툴체인 JDK를 자동으로 씀 |

(보류 중인) 웹: `cd apps/web && npm install && npm run dev` → http://localhost:3000

- OpenAPI(local 프로필): http://localhost:8080/v3/api-docs
- 환경변수 예시는 [.env.example](.env.example). 기본값은 로컬 전용이며 운영에서는 `APP_TOKEN_SECRET` 등을 반드시 주입합니다.

## 테스트

```bash
cd backend && ./gradlew test
```

```bash
cd apps/mobile && npm run lint && npm run typecheck && npm test
```

```bash
cd apps/web && npm run lint && npm run typecheck && npm test
```

## 문서

| 문서 | 내용 |
|---|---|
| [docs/PRD.md](docs/PRD.md) | 제품 요구사항 원문 |
| [docs/ANALYSIS.md](docs/ANALYSIS.md) | 모호점, 확정 질문과 결정(제안 기본값 승인) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 기술 스택, 모듈 경계, ADR |
| [docs/DATABASE.md](docs/DATABASE.md) | ERD, 마이그레이션 |
| [docs/API.md](docs/API.md) | REST API 계약 |
| [docs/UX.md](docs/UX.md) | 사용자 흐름, 화면, 디자인 시스템 |
| [docs/EXTRACTION_PIPELINE.md](docs/EXTRACTION_PIPELINE.md) | OCR/추출, 검증, 재시도 |
| [docs/SECURITY.md](docs/SECURITY.md) | 보안·개인정보·규제 검토 항목 |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Sprint 계획과 진행 상황 |
| [AGENTS.md](AGENTS.md) | 코딩 에이전트 작업 규칙 |
