package kr.gumjin.note.auth.service;

import kr.gumjin.note.global.config.AppProperties;
import kr.gumjin.note.global.error.ApiException;
import kr.gumjin.note.global.error.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class SmtpAuthMailer implements AuthMailer {

    private static final Logger log = LoggerFactory.getLogger(SmtpAuthMailer.class);

    private final JavaMailSender mailSender;
    private final AppProperties properties;

    public SmtpAuthMailer(JavaMailSender mailSender, AppProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    @Override
    public void sendVerificationCode(String to, String code) {
        send(to, "[검진노트] 이메일 인증코드", """
                검진노트 이메일 인증코드입니다.

                인증코드: %s

                코드는 10분 동안 유효합니다.
                본인이 요청하지 않았다면 이 메일을 무시해주세요.
                """.formatted(code), "verification");
    }

    @Override
    public void sendAlreadyRegistered(String to) {
        send(to, "[검진노트] 이미 가입된 이메일입니다", """
                이 이메일로 검진노트 가입이 다시 요청되었습니다.
                이미 가입된 계정이 있어 새 계정을 만들지 않았습니다.

                비밀번호가 기억나지 않으면 로그인 화면의 '비밀번호 재설정'을 이용해주세요.
                본인이 요청하지 않았다면 이 메일을 무시해주세요.
                """, "already-registered");
    }

    @Override
    public void sendPasswordResetCode(String to, String code) {
        send(to, "[검진노트] 비밀번호 재설정 코드", """
                검진노트 비밀번호 재설정 코드입니다.

                재설정 코드: %s

                앱의 비밀번호 재설정 화면에 입력해주세요. 코드는 30분 동안 한 번만 사용할 수 있습니다.
                본인이 요청하지 않았다면 이 메일을 무시해주세요. 비밀번호는 바뀌지 않습니다.
                """.formatted(code), "password-reset");
    }

    private void send(String to, String subject, String body, String kind) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.mailFrom());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        try {
            mailSender.send(message);
        } catch (MailException e) {
            // 수신자·본문은 남기지 않는다.
            log.warn("Mail delivery failed: kind={} cause={}", kind, e.getClass().getSimpleName());
            throw new ApiException(ErrorCode.MAIL_UNAVAILABLE);
        }
    }
}
