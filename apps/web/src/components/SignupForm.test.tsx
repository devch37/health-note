import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignupForm } from "./SignupForm";
import { jsonResponse, renderWithQuery, seriousA11yViolations } from "@/test/utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("이메일"), "user@example.com");
  await user.type(screen.getByLabelText("비밀번호"), "long-enough-password");
  await user.type(screen.getByLabelText("비밀번호 확인"), "long-enough-password");
}

describe("SignupForm", () => {
  beforeEach(() => {
    push.mockReset();
    document.cookie = "XSRF-TOKEN=t; path=/";
  });

  it("필수 동의가 없으면 요청하지 않고 안내한다", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    renderWithQuery(<SignupForm />);

    await fillBasics(user);
    await user.click(screen.getByRole("button", { name: "가입하기" }));

    expect(screen.getByText("필수 항목에 동의해주세요")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("짧은 비밀번호와 불일치를 알려준다", async () => {
    const user = userEvent.setup();
    renderWithQuery(<SignupForm />);

    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "short");
    await user.type(screen.getByLabelText("비밀번호 확인"), "other");
    await user.click(screen.getByRole("button", { name: "가입하기" }));

    expect(screen.getByText("비밀번호는 10자 이상으로 입력해주세요")).toBeInTheDocument();
    expect(screen.getByText("비밀번호가 일치하지 않아요")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toHaveAttribute("aria-invalid", "true");
  });

  it("전체 동의 후 가입하면 동의 버전과 함께 보내고 인증 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(202, { status: "VERIFICATION_REQUIRED" }));
    renderWithQuery(<SignupForm />);

    await fillBasics(user);
    await user.click(screen.getByLabelText("전체 동의"));
    await user.click(screen.getByRole("button", { name: "가입하기" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/signup/verify"));
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.consents.map((c: { type: string }) => c.type).sort()).toEqual(
      ["MARKETING", "PRIVACY", "SENSITIVE_HEALTH_DATA", "TERMS"],
    );
    expect(body.consents.every((c: { version: string }) => c.version === "2026-10-01")).toBe(true);
    expect(sessionStorage.getItem("gn.pendingEmail")).toBe("user@example.com");
  });

  it("서버 필드 오류를 해당 입력 아래에 보여준다", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(400, {
        code: "VALIDATION_FAILED",
        title: "입력값을 확인해주세요",
        errors: [{ field: "password", code: "PASSWORD_LENGTH", message: "서버가 거부한 비밀번호" }],
      }),
    );
    renderWithQuery(<SignupForm />);

    await fillBasics(user);
    await user.click(screen.getByLabelText("전체 동의"));
    await user.click(screen.getByRole("button", { name: "가입하기" }));

    expect(await screen.findByText("서버가 거부한 비밀번호")).toBeInTheDocument();
  });

  it("심각한 접근성 위반이 없다", async () => {
    const { container } = renderWithQuery(<SignupForm />);
    expect(await seriousA11yViolations(container)).toEqual([]);
  });
});
