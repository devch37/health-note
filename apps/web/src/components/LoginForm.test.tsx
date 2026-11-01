import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";
import { jsonResponse, renderWithQuery, seriousA11yViolations } from "@/test/utils";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace }) }));

const user = (emailVerified: boolean) => ({
  user: { id: "u1", email: "user@example.com", status: emailVerified ? "ACTIVE" : "PENDING_VERIFICATION", emailVerified, createdAt: "" },
});

async function submit(u: ReturnType<typeof userEvent.setup>) {
  await u.type(screen.getByLabelText("이메일"), "user@example.com");
  await u.type(screen.getByLabelText("비밀번호"), "long-enough-password");
  await u.click(screen.getByRole("button", { name: "로그인" }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    document.cookie = "XSRF-TOKEN=t; path=/";
  });

  it("인증된 계정은 홈으로 이동한다", async () => {
    const u = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(200, user(true)));
    renderWithQuery(<LoginForm />);

    await submit(u);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/home"));
  });

  it("미인증 계정은 인증 화면으로 이동한다", async () => {
    const u = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(200, user(false)));
    renderWithQuery(<LoginForm />);

    await submit(u);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/signup/verify"));
  });

  it("잠금 응답이면 남은 시간을 분 단위로 보여준다", async () => {
    const u = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(429, { code: "LOGIN_TEMPORARILY_LOCKED", title: "로그인 시도가 너무 많습니다" }, { "Retry-After": "600" }),
    );
    renderWithQuery(<LoginForm />);

    await submit(u);

    expect(await screen.findByRole("alert")).toHaveTextContent("로그인 시도가 너무 많습니다 (약 10분 후)");
  });

  it("심각한 접근성 위반이 없다", async () => {
    const { container } = renderWithQuery(<LoginForm />);
    expect(await seriousA11yViolations(container)).toEqual([]);
  });
});
