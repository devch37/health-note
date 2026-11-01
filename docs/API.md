# REST API 계약 초안

> 산출물 5. 상태: **검토 요청** · Base path `/api/v1` · JSON(UTF-8) · 구현 후 springdoc-openapi로 생성되는 스펙(`/v3/api-docs`)이 정본이 되며 이 문서는 설계 기준이다.

## 1. 공통 규약

### 인증

서버 세션 하나를 두 가지 방식으로 전달한다. 앱이 1차 클라이언트다(2026-11-01, [ANALYSIS.md §6](ANALYSIS.md)).

| 클라이언트 | 세션 전달 | CSRF | 세션 수명 |
|---|---|---|---|
| **앱 (iOS·Android)** | 요청 헤더 `X-Client: app`을 보내면 로그인·인증코드 확인 응답 헤더 `X-Auth-Token`에 세션 토큰이 담긴다. 이후 모든 요청에 `X-Auth-Token: <token>`. 쿠키를 쓰지 않는다 | 불필요(헤더 인증은 브라우저가 자동으로 붙이지 않음) | 유휴 30일, 절대 90일(제안) |
| (보류) 웹 | 세션 쿠키 `GN_SESSION` (HttpOnly, Secure, SameSite=Lax, Path=/) | 상태 변경 요청(POST/PUT/PATCH/DELETE)은 `GET /api/v1/auth/csrf`로 받은 값을 `X-XSRF-TOKEN` 헤더로 전송 | 유휴 30분, 절대 7일 |

- `X-Auth-Token`이 있는 요청은 쿠키를 무시한다. 무효·만료 토큰은 `401 UNAUTHENTICATED`이며 앱은 저장된 토큰을 지우고 로그인 화면으로 보낸다.
- 토큰은 기기 보안 저장소(iOS Keychain, Android Keystore — expo-secure-store)에만 저장한다. 로그·크래시 리포트에 남기지 않는다.
- 로그아웃은 서버 세션을 삭제한 뒤 앱이 저장된 토큰을 지운다(응답 `X-Auth-Token`이 빈 값).
- CORS: 기본은 어떤 출처도 허용하지 않는다. `local` 프로필에서만 Expo 웹 미리보기(`http://localhost:8081`)를 허용하며 자격증명(쿠키)은 허용하지 않는다(`app.cors-allowed-origins`).
- 건강정보 API는 `ACTIVE`(이메일 인증 완료) 사용자만. 미인증은 `403 EMAIL_NOT_VERIFIED`.

### 오류 형식 (RFC 9457 ProblemDetail)

```json
{
  "type": "https://gumjin.note/problems/validation",
  "title": "입력값을 확인해주세요",
  "status": 400,
  "code": "VALIDATION_FAILED",
  "detail": "일부 항목이 올바르지 않습니다.",
  "instance": "/api/v1/checkups/0192.../measurements",
  "errors": [
    { "field": "measurements[0].value", "code": "NOT_NUMBER", "message": "숫자를 입력해주세요" }
  ],
  "traceId": "4bf92f3577b34da6"
}
```

- 메시지에는 건강정보 값을 포함하지 않는다.
- 타인 리소스·존재하지 않는 리소스 모두 `404 RESOURCE_NOT_FOUND`.

| status | code 예시 |
|---|---|
| 400 | `VALIDATION_FAILED`, `UPLOAD_*` |
| 401 | `UNAUTHENTICATED` |
| 403 | `EMAIL_NOT_VERIFIED`, `CSRF_INVALID` |
| 404 | `RESOURCE_NOT_FOUND` |
| 409 | `VERSION_CONFLICT`, `INVALID_STATE_TRANSITION`, `EMAIL_ALREADY_REGISTERED`* |
| 413 | `UPLOAD_TOO_LARGE` |
| 415 | `UPLOAD_UNSUPPORTED_TYPE` |
| 422 | `CONFIRMATION_INCOMPLETE` |
| 429 | `RATE_LIMITED`, `LOGIN_TEMPORARILY_LOCKED` (`Retry-After` 헤더) |

\* 계정 열거 방지를 위해 가입 API는 이미 가입된 이메일에도 202를 반환하고 메일로 안내하는 방식을 기본으로 한다(아래 참조).

### 페이지네이션
커서 기반: `?limit=20&cursor=<opaque>`. 응답 `{ "items": [...], "nextCursor": "..." | null }`. 정렬 키는 `(exam_date DESC NULLS LAST, id DESC)`로 안정 정렬.

### 동시성
수정 응답에 `ETag: "<version>"`. 수정 요청은 `If-Match` 필수, 불일치 시 `409 VERSION_CONFLICT`.

### 공통 타입
- ID: UUID 문자열
- 날짜: `"2026-10-01"`, 시각: `"2026-10-29T05:12:00Z"`
- 수치: JSON number. 비수치 결과는 `textValue`

## 2. Auth

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| GET | `/auth/csrf` | CSRF 토큰 발급 | — |
| POST | `/auth/signup` | 가입 + 인증코드 발송 (세션을 만들지 않음) | — |
| POST | `/auth/email-verifications/confirm` | 이메일 + 인증코드 확인 → 성공 시 로그인 세션 생성 | — |
| POST | `/auth/email-verifications/resend` | 인증코드 재발송 (1분 쿨다운, 항상 202) | — |
| POST | `/auth/login` | 로그인 | — |
| POST | `/auth/logout` | 로그아웃(세션 무효화) | 세션 |
| POST | `/auth/password-reset/request` | 재설정 코드 메일 요청 (항상 202, 1분 쿨다운) | — |
| POST | `/auth/password-reset/confirm` | 이메일 + 6자리 코드 + 새 비밀번호 | — |

**POST /auth/signup**
```json
// request
{
  "email": "user@example.com",
  "password": "********",
  "consents": [
    { "type": "TERMS", "version": "2026-10-01" },
    { "type": "PRIVACY", "version": "2026-10-01" },
    { "type": "SENSITIVE_HEALTH_DATA", "version": "2026-10-01" }
  ]
}
// 202 Accepted — 새 계정이든 기존 계정이든 같은 응답, 세션 쿠키 없음
{ "status": "VERIFICATION_REQUIRED" }
```
- 새 이메일: 계정(PENDING_VERIFICATION) 생성 + 코드 발송.
- 인증 완료된 기존 이메일: "이미 가입됨" 안내 메일만 발송.
- 미인증 기존 이메일: 비밀번호는 바꾸지 않고 코드만 재발송(쿨다운 적용). 선점된 계정은 비밀번호 재설정으로 회수하며, 재설정이 이메일 소유를 증명하므로 계정이 ACTIVE가 된다.
- 비밀번호: 10~128자, 유출 비밀번호 목록 검사(P1), 이메일과 동일 불가.
- 필수 동의 누락 시 400.

**POST /auth/email-verifications/confirm** `{ "email": "user@example.com", "code": "123456" }` → `200 { "user": UserMe }` + 세션 쿠키. 틀린 코드·만료·없는 이메일은 모두 `400 INVALID_VERIFICATION_CODE`. 코드당 5회 실패 시 무효화.

**GET /auth/csrf** → `200 { "headerName": "X-XSRF-TOKEN" }` + `XSRF-TOKEN` 쿠키(HttpOnly 아님). 클라이언트는 쿠키 값을 헤더로 보낸다. 세션을 만들지 않는다.

**POST /auth/password-reset/confirm** `{ "email", "code": "123456", "newPassword" }` → `204`. 앱에서 딥링크 없이 쓰기 위해 메일 링크 대신 6자리 코드를 쓴다(2026-11-01 변경, Sprint 1.5 구현). 코드 유효 30분, 코드당 5회 실패 시 무효화, 틀린 코드·만료·없는 이메일은 모두 `400 INVALID_RESET_CODE`. 성공 시 그 사용자의 모든 세션 삭제(로그인 세션을 만들지 않음).

**POST /auth/login** `{ "email", "password" }` → `200 { "user": UserMe }` + 세션 쿠키(세션 ID 재발급). 미인증 계정도 로그인되지만(`emailVerified: false`) 건강정보 API는 `403 EMAIL_NOT_VERIFIED`. 실패는 원인 구분 없이 `401 INVALID_CREDENTIALS`. 제한: 이메일 기준 15분 5회 실패 → 15분 잠금(429), IP 기준 별도 상한.

## 3. Users

| Method | Path | 설명 |
|---|---|---|
| GET | `/users/me` | 내 정보 |
| GET | `/users/me/consents` | 동의 이력 |
| POST | `/users/me/consents` | 선택 동의 추가/철회 `{ type, version, agreed: bool }` |
| PUT | `/users/me/password` | 비밀번호 변경 `{ currentPassword, newPassword }` → 다른 세션 모두 무효화 |
| POST | `/users/me/exports` | 데이터 내보내기 생성 (비동기) `{ format: "JSON" \| "CSV" \| "ORIGINALS_ZIP" }` |
| GET | `/users/me/exports/{id}` | 상태·다운로드 URL(5분 유효) |
| DELETE | `/users/me` | 탈퇴 `{ password, confirmText: "탈퇴" }` → 204, 세션 무효화 |

```json
// UserMe
{ "id": "…", "email": "user@example.com", "status": "ACTIVE", "emailVerified": true, "createdAt": "…" }
```

## 4. Checkups & Uploads

| Method | Path | 설명 |
|---|---|---|
| POST | `/checkups/uploads` | 파일 업로드 → 검진(ANALYZING) + 분석 작업 생성 |
| POST | `/checkups` | 직접 입력용 빈 검진 생성(DRAFT) |
| GET | `/checkups` | 목록 `?year=2026&institution=…&status=…&limit&cursor` |
| GET | `/checkups/{id}` | 상세 |
| PATCH | `/checkups/{id}` | 검진일·기관명 수정 (If-Match) |
| DELETE | `/checkups/{id}` | 삭제 → 204 (파일·측정값·작업 파기 예약) |
| GET | `/checkups/{id}/documents/{docId}/pages/{n}` | 페이지 미리보기 → `302` 서명 URL(60초) 또는 스트리밍 |
| GET | `/checkups/{id}/documents/{docId}/original` | 원본 다운로드 → 서명 URL(60초), `Content-Disposition: attachment` |
| POST | `/checkups/{id}/reanalyze` | 실패한 분석 재시도 (확정 전만) → 202 `{ jobId }` |

**POST /checkups/uploads** — `multipart/form-data`, 필드 `files`(1~20개), 헤더 `Idempotency-Key`(권장)
```json
// 202 Accepted
{
  "checkupId": "0192f3a0-…",
  "jobId": "0192f3a1-…",
  "jobStatus": "PENDING",
  "duplicateOf": null          // 같은 해시 문서가 이미 있으면 기존 checkupId (경고용)
}
```

**GET /checkups (item)**
```json
{
  "id": "…",
  "examDate": "2026-10-01",
  "institutionName": "OO건강검진센터",
  "status": "CONFIRMED",
  "confirmedMeasurementCount": 18,
  "createdAt": "2026-10-20T09:00:00Z"
}
```

**GET /checkups/{id}**
```json
{
  "id": "…",
  "examDate": "2026-10-01",
  "institutionName": "OO건강검진센터",
  "status": "REVIEW_REQUIRED",
  "version": 3,
  "documents": [
    { "id": "…", "mimeType": "application/pdf", "pageCount": 4, "uploadedAt": "…" }
  ],
  "latestJob": { "id": "…", "status": "SUCCEEDED", "errorCode": null },
  "createdAt": "…",
  "confirmedAt": null
}
```

## 5. Analysis jobs

| Method | Path | 설명 |
|---|---|---|
| GET | `/analysis-jobs/{id}` | 상태 조회 (클라이언트는 2s→5s 백오프 폴링) |
| POST | `/analysis-jobs/{id}/cancel` | PENDING 상태만 취소 가능 |

```json
{
  "id": "…",
  "checkupId": "…",
  "status": "PROCESSING",          // PENDING | PROCESSING | SUCCEEDED | FAILED | CANCELLED
  "attemptCount": 1,
  "errorCode": null,               // 예: EXTRACTION_UNREADABLE, EXTRACTION_PROVIDER_UNAVAILABLE
  "retryable": false,
  "updatedAt": "…"
}
```

## 6. Measurements (검증·확정)

| Method | Path | 설명 |
|---|---|---|
| GET | `/checkups/{id}/measurements` | 추출/확정 항목 목록 |
| PUT | `/checkups/{id}/measurements` | 전체 검증 결과 제출 + 확정 (If-Match) |
| GET | `/measurement-definitions` | 표준 항목 사전 (수동 추가 시 선택지) |

**GET /checkups/{id}/measurements**
```json
{
  "checkupId": "…",
  "checkupStatus": "REVIEW_REQUIRED",
  "examDate": "2026-10-01",
  "examDateNeedsReview": false,
  "summary": { "total": 18, "needsReview": 2 },
  "items": [
    {
      "id": "…",
      "code": "FASTING_GLUCOSE",              // 미매핑이면 null
      "displayName": "공복혈당",
      "source": "EXTRACTED",
      "valueType": "NUMERIC",
      "value": 105,
      "textValue": null,
      "unit": "mg/dL",
      "referenceRange": { "min": 70, "max": 99, "minInclusive": true, "maxInclusive": true, "text": "70-99" },
      "method": null,
      "raw": { "name": "공복혈당", "value": "105", "unit": "mg/dl", "referenceText": "70-99", "judgement": "정상B" },
      "sourcePage": 2,
      "sourceBbox": { "x": 0.12, "y": 0.44, "w": 0.3, "h": 0.03 },   // 페이지 대비 비율, nullable
      "needsReview": false,
      "reviewReasons": [],                   // UNMAPPED_NAME, UNIT_MISMATCH, LOW_CONFIDENCE, VALUE_PARSE_FAILED, OUT_OF_PLAUSIBLE_RANGE, DUPLICATE_CONFLICT
      "reviewStatus": "PENDING"
    }
  ]
}
```

`confidence` 원값은 응답에 노출하지 않는다(정확도로 오인 방지). `needsReview`로만 표현한다.

**PUT /checkups/{id}/measurements**
```json
{
  "examDate": "2026-10-01",
  "institutionName": "OO건강검진센터",
  "items": [
    { "id": "…", "action": "CONFIRM", "code": "FASTING_GLUCOSE", "displayName": "공복혈당",
      "value": 105, "unit": "mg/dL", "referenceRange": { "min": 70, "max": 99 } },
    { "id": "…", "action": "EXCLUDE" },
    { "id": null, "action": "ADD", "code": "HBA1C", "displayName": "당화혈색소",
      "value": 5.6, "unit": "%", "referenceRange": null }
  ]
}
```
- 확정 조건: `examDate` 필수, 모든 기존 항목이 `CONFIRM` 또는 `EXCLUDE`로 처리됨. 미처리 항목이 있으면 `422 CONFIRMATION_INCOMPLETE`.
- 서버는 변경된 필드마다 `measurement_revisions` 기록, 원문(`raw`)·`extractedValue`는 변경하지 않는다.
- 응답 `200` = GET과 동일 형식, `checkupStatus: "CONFIRMED"`, 새 `ETag`.
- 확정 후 같은 API로 재수정 가능(이력 기록).

## 7. Trends & Dashboard

| Method | Path | 설명 |
|---|---|---|
| GET | `/measurements/{code}/trends` | 확정값 시계열 |
| GET | `/dashboard` | 홈 데이터 |

**GET /measurements/FASTING_GLUCOSE/trends**
```json
{
  "code": "FASTING_GLUCOSE",
  "displayName": "공복혈당",
  "canonicalUnit": "mg/dL",
  "points": [
    { "checkupId": "…", "examDate": "2025-10-02", "value": 98, "unit": "mg/dL",
      "referenceRange": { "min": 70, "max": 99, "text": "70-99" }, "institutionName": "OO센터", "method": null },
    { "checkupId": "…", "examDate": "2026-10-01", "value": 105, "unit": "mg/dL",
      "referenceRange": { "min": 70, "max": 99, "text": "70-99" }, "institutionName": "OO센터", "method": null }
  ],
  "changes": [
    { "fromCheckupId": "…", "toCheckupId": "…", "comparable": true, "absoluteChange": 7, "unit": "mg/dL", "reason": null }
  ]
}
```
- `comparable=false`면 `absoluteChange=null`, `reason`: `UNIT_DIFFERENT`, `METHOD_DIFFERENT`, `NON_NUMERIC`.
- 방향성 판정(좋음/나쁨, 정상/이상) 필드는 **두지 않는다**.

**GET /dashboard**
```json
{
  "latestCheckup": { "id": "…", "examDate": "2026-10-01", "institutionName": "OO센터", "confirmedMeasurementCount": 18 },
  "inProgress": [ { "checkupId": "…", "status": "ANALYZING", "jobId": "…" } ],
  "reviewPending": [ { "checkupId": "…", "needsReviewCount": 2 } ],
  "changes": [
    { "code": "FASTING_GLUCOSE", "displayName": "공복혈당", "previous": 98, "current": 105, "unit": "mg/dL", "comparable": true }
  ]
}
```
- `changes`: 최신 확정 검진과 직전 확정 검진에 모두 있는 항목 중 비교 가능한 것, 표준 항목 순서(sort_order), 최대 5개. "변화가 큰 순" 같은 정렬은 의미 부여 우려로 MVP에서 하지 않는다.
- 기록 없음: `latestCheckup=null` → 클라이언트 Empty State.

## 8. Health information (P1)

`GET /health-information/{code}` → `{ code, title, sections: [{ heading, body }], sources: [{ title, url, accessedAt }], version, reviewedAt, medicallyReviewed: bool, disclaimer }`

## 9. 엔드포인트별 소유권 검증 체크리스트

| 리소스 | 검증 방법 |
|---|---|
| checkup | `checkups.user_id = 현재 사용자 AND deleted_at IS NULL` |
| document/page | 위 checkup 검증 + `document.checkup_id = checkupId` |
| job | `job → document → checkup.user_id` 조인 |
| measurement | 경로의 checkupId 검증 + `measurement.checkup_id = checkupId` (요청 본문의 item id도 각각 확인) |
| export | `exports.user_id` |

각 항목에 "타 사용자 접근 시 404" 통합 테스트를 둔다(Sprint별).
