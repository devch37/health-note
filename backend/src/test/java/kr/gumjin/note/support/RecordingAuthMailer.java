package kr.gumjin.note.support;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import kr.gumjin.note.auth.service.AuthMailer;

/** 테스트용 메일러. 발송 내역을 메모리에 보관한다. */
public class RecordingAuthMailer implements AuthMailer {

    public record Sent(String kind, String to, String payload) {
    }

    private final List<Sent> sent = new CopyOnWriteArrayList<>();

    @Override
    public void sendVerificationCode(String to, String code) {
        sent.add(new Sent("verification", to, code));
    }

    @Override
    public void sendAlreadyRegistered(String to) {
        sent.add(new Sent("already-registered", to, null));
    }

    @Override
    public void sendPasswordResetCode(String to, String code) {
        sent.add(new Sent("password-reset", to, code));
    }

    public List<Sent> all() {
        return List.copyOf(sent);
    }

    public List<Sent> of(String kind, String to) {
        return sent.stream().filter(s -> s.kind().equals(kind) && s.to().equals(to)).toList();
    }

    public String lastCode(String to) {
        List<Sent> codes = of("verification", to);
        if (codes.isEmpty()) {
            throw new AssertionError("no verification mail");
        }
        return codes.getLast().payload();
    }

    public String lastResetCode(String to) {
        List<Sent> resets = of("password-reset", to);
        if (resets.isEmpty()) {
            throw new AssertionError("no reset mail");
        }
        return resets.getLast().payload();
    }

    public void clear() {
        sent.clear();
    }
}
