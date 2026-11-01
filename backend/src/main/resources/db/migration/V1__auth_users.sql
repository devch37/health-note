CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
    id                 uuid PRIMARY KEY,
    email              citext      NOT NULL,
    password_hash      text        NOT NULL,
    status             text        NOT NULL CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'WITHDRAWN')),
    email_verified_at  timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz
);
-- 탈퇴 후 같은 이메일 재가입 허용: 삭제되지 않은 계정에만 유일성
CREATE UNIQUE INDEX ux_users_email_active ON users (email) WHERE deleted_at IS NULL;

CREATE TABLE user_consents (
    id            uuid PRIMARY KEY,
    user_id       uuid        NOT NULL REFERENCES users (id),
    consent_type  text        NOT NULL CHECK (consent_type IN ('TERMS', 'PRIVACY', 'SENSITIVE_HEALTH_DATA', 'MARKETING')),
    version       text        NOT NULL,
    agreed_at     timestamptz NOT NULL,
    revoked_at    timestamptz
);
CREATE INDEX ix_user_consents_user ON user_consents (user_id, consent_type);

CREATE TABLE email_verifications (
    id             uuid PRIMARY KEY,
    user_id        uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    code_hash      text        NOT NULL,
    expires_at     timestamptz NOT NULL,
    attempt_count  int         NOT NULL DEFAULT 0,
    consumed_at    timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_email_verifications_user ON email_verifications (user_id, created_at DESC);

CREATE TABLE password_reset_tokens (
    id           uuid PRIMARY KEY,
    user_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash   text        NOT NULL UNIQUE,
    expires_at   timestamptz NOT NULL,
    consumed_at  timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE login_attempts (
    id            bigserial PRIMARY KEY,
    email_hash    text        NOT NULL,
    ip_hash       text        NOT NULL,
    succeeded     boolean     NOT NULL,
    attempted_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_login_attempts_email ON login_attempts (email_hash, attempted_at DESC);
CREATE INDEX ix_login_attempts_ip ON login_attempts (ip_hash, attempted_at DESC);
