# 검진노트 (Gumjin Note)

> 건강검진은 1년에 한 번, 건강관리는 매일.

건강검진 결과지(PDF/사진)에서 검사 항목·수치·단위·참고범위를 추출하고, 사용자가 원본과 대조해 확정한 뒤 과거 검진과의 변화를 보여주는 개인 건강기록 서비스입니다. 의료적 진단이나 치료를 대체하지 않습니다.

## 상태

**설계 검토 단계** — 코드는 아직 없습니다. 아래 문서를 검토·승인한 뒤 Sprint 1을 시작합니다.

| 문서 | 내용 |
|---|---|
| [docs/PRD.md](docs/PRD.md) | 제품 요구사항 원문 |
| [docs/ANALYSIS.md](docs/ANALYSIS.md) | 모호점, **확정이 필요한 질문과 제안 기본값** |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 기술 스택, 플랫폼, 모듈 경계 |
| [docs/DATABASE.md](docs/DATABASE.md) | ERD, 마이그레이션 초안 |
| [docs/API.md](docs/API.md) | REST API 계약 |
| [docs/UX.md](docs/UX.md) | 사용자 흐름, 화면, 디자인 시스템 |
| [docs/EXTRACTION_PIPELINE.md](docs/EXTRACTION_PIPELINE.md) | OCR/추출, 검증, 재시도 |
| [docs/SECURITY.md](docs/SECURITY.md) | 보안·개인정보·규제 검토 항목 |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Sprint 계획, Sprint 1 작업 목록 |
| [AGENTS.md](AGENTS.md) | 코딩 에이전트 작업 규칙 |

## 기술 스택 (제안)

Java 21 · Spring Boot 3 · PostgreSQL 16 · Flyway · Next.js · TypeScript · S3 호환 스토리지 · Docker · GitHub Actions
