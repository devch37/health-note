-- 비밀번호 재설정을 메일 링크 토큰에서 6자리 코드로 바꾼다(docs/API.md, Sprint 1.5).
-- 코드 해시는 HMAC(userId:code)라 서로 다른 발급분이 같을 수 있으므로 유일 제약을 없앤다.
ALTER TABLE password_reset_tokens DROP CONSTRAINT password_reset_tokens_token_hash_key;
ALTER TABLE password_reset_tokens ADD COLUMN attempt_count integer NOT NULL DEFAULT 0;
CREATE INDEX ix_password_reset_tokens_user ON password_reset_tokens (user_id, created_at DESC);

-- 아직 쓰지 않은 링크 토큰은 새 방식으로 확인할 수 없으므로 무효화한다.
UPDATE password_reset_tokens SET consumed_at = now() WHERE consumed_at IS NULL;
