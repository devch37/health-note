package kr.gumjin.note.user.service;

import kr.gumjin.note.user.domain.ConsentType;

public record ConsentAgreement(ConsentType type, String version) {
}
