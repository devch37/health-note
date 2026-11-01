# AGENTS.md — 코딩 에이전트 작업 규칙

이 저장소에서 작업하는 AI 코딩 에이전트(Claude Code, Codex 등)와 개발자를 위한 규칙이다. 요구사항 기준은 [docs/PRD.md](docs/PRD.md), 설계 기준은 `docs/`의 나머지 문서다.

## 현재 단계

[docs/ANALYSIS.md](docs/ANALYSIS.md) 제안 기본값 승인(2026-10-29). **Sprint 1(기반·인증) 완료.** 2026-11-01 **앱 우선(React Native + Expo)으로 전환** — Sprint 1.5(앱 기반·앱 토큰 인증) 구현, 다음은 Sprint 2(업로드). [docs/ROADMAP.md](docs/ROADMAP.md)의 순서와 완료 기준을 따른다.

- 새 화면은 `apps/mobile`에만 만든다. `apps/web`은 보류 상태라 기능을 추가하지 않는다(빌드가 깨지는 변경만 고친다).

## 반드시 지킬 것

- 요구사항이 불명확하면 추측하지 말고 질문한다.
- 한 번에 하나의 작은 수직 기능만 구현한다. 전체 일괄 구현 금지.
- 모듈형 모놀리스. 다른 모듈의 Repository를 직접 쓰지 않고 그 모듈의 `*Service`를 호출한다. 서비스가 돌려준 엔티티는 읽기만 한다([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §4, ArchUnit으로 검사).
- DB 변경은 Flyway 마이그레이션으로만. 이미 적용된 마이그레이션 파일은 수정하지 않는다.
- 건강정보 리소스는 리포지토리 쿼리에서 `userId` 조건으로 소유권을 강제하고, 타 사용자 접근 404 테스트를 함께 작성한다.
- 추출값은 사용자 확정 전에 추이·대시보드에 쓰지 않는다.
- 문서에 없는 수치를 생성·계산하지 않는다(BMI 자동 계산 포함).
- 건강정보 값, 이메일, 파일명·내용, 토큰, 인증코드, 세션 ID를 로그에 남기지 않는다.
- 의료적 진단·처방·위험도 예측, "정상/이상/위험/개선/악화" 판정 문구를 구현하지 않는다.
- 비밀정보를 커밋하지 않는다. `.env.example`에는 예시 값만.
- 로딩·빈·오류·권한 없음 상태를 모두 구현한다.
- 앱: 세션 토큰은 expo-secure-store에만 저장한다. AsyncStorage·URL·라우트 파라미터에 토큰·이메일·건강정보를 넣지 않는다. `EXPO_PUBLIC_*` 환경변수에는 공개값만 둔다(앱 번들에 그대로 포함됨).

## 작업 보고 형식

각 작업 단위가 끝나면 다음을 보고한다.

1. 변경 요약
2. 실행한 테스트와 결과(실패 포함, 출력 그대로)
3. 남은 이슈
4. 결정이 필요한 사항

## 명령어

```bash
docker compose -f infrastructure/compose.yaml up -d --wait   # PostgreSQL, Mailpit
cd backend && ./gradlew test                                # 백엔드 테스트 (Docker 필요, Testcontainers)
cd backend && ./gradlew bootRun --args='--spring.profiles.active=local'
cd apps/mobile && npx expo start                            # 앱 개발 서버 (Expo Go QR, w = 브라우저)
cd apps/mobile && npm run lint && npm run typecheck && npm test
cd apps/web && npm run lint && npm run typecheck && npm test # 보류 중인 웹
```

## 알아둘 점

- Spring Boot 4 / Spring Security 7 / Jackson 3(`tools.jackson.*`) / Testcontainers 2(`org.testcontainers.postgresql.*`).
- Next.js 16: 작업 전 `apps/web/AGENTS.md`의 안내대로 `node_modules/next/dist/docs/`를 확인한다. 이전 화면이 숨겨진 채 DOM에 남으므로 E2E 로케이터는 `filter({ visible: true })`를 쓴다.
- 테스트에서 spring-security-test의 `csrf()`를 쓰지 않는다(공유 필터 상태를 바꿔 다른 테스트를 오염시킴). `IntegrationTest.csrf()`를 쓴다.
- 앱(`apps/mobile`): Expo SDK 58. 작업 전 `apps/mobile/AGENTS.md`(Expo 제공)대로 버전에 맞는 문서를 확인하고, 패키지는 `npx expo install`로 추가한다. 테스트는 RNTL 14(`await render`, `userEvent`).
- 앱 세션: `X-Client: app`·`X-Auth-Token` 헤더(`ClientChannel`, `ClientAwareSessionIdResolver`). 헤더 요청은 CSRF 면제, 세션 수명은 `ClientChannel`에 있다. 로그인 세션에는 절대 만료 검사용 속성이 있어야 한다(`SessionAbsoluteExpiryFilter`).
- 로그아웃 등으로 세션을 비울 때 `queryClient.clear()`를 쓰지 않는다(세션 쿼리 구독이 끊겨 화면이 안 바뀜). `resetSession()`을 쓴다.
- 세션 쿠키 속성은 `SessionCookieConfig`에서 정한다(Boot 4에서 `server.servlet.session.cookie.*`가 Spring Session 쿠키에 적용되지 않았음).
