package kr.gumjin.note.auth.service;

/**
 * 인증 관련 메일 발송. 테스트에서는 인메모리 구현으로 교체한다.
 * 구현체는 메일 본문·수신자를 로그에 남기지 않는다.
 */
public interface AuthMailer {

    void sendVerificationCode(String to, String code);

    void sendAlreadyRegistered(String to);

    void sendPasswordResetCode(String to, String code);
}
