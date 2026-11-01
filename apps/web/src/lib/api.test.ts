import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, parseProblem, readCookie } from "./api";
import { jsonResponse } from "@/test/utils";

function clearCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

describe("readCookie", () => {
  it("이름이 같은 쿠키 값을 디코딩해 돌려준다", () => {
    expect(readCookie("XSRF-TOKEN", "a=1; XSRF-TOKEN=ab%3Dcd; b=2")).toBe("ab=cd");
    expect(readCookie("missing", "a=1")).toBeNull();
  });
});

describe("parseProblem", () => {
  it("ProblemDetail의 code·title·필드 오류·Retry-After를 읽는다", async () => {
    const error = await parseProblem(
      jsonResponse(
        429,
        { code: "LOGIN_TEMPORARILY_LOCKED", title: "잠시 후 다시", errors: [{ field: "email", code: "X", message: "m" }] },
        { "Retry-After": "120" },
      ),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("LOGIN_TEMPORARILY_LOCKED");
    expect(error.retryAfterSeconds).toBe(120);
    expect(error.fieldMessage("email")).toBe("m");
  });

  it("JSON이 아니면 일반 오류로 바꾼다", async () => {
    const error = await parseProblem(new Response("<html>", { status: 502 }));
    expect(error.code).toBe("UNKNOWN");
    expect(error.status).toBe(502);
  });
});

describe("apiRequest", () => {
  beforeEach(() => clearCookies());

  it("상태 변경 요청에는 XSRF 쿠키 값을 헤더로 보낸다", async () => {
    document.cookie = "XSRF-TOKEN=token-123; path=/";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiRequest("/auth/login", { method: "POST", body: { email: "a@example.com" } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/auth/login");
    expect((init?.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe("token-123");
    expect(init?.credentials).toBe("same-origin");
  });

  it("XSRF 쿠키가 없으면 먼저 발급받는다", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).endsWith("/auth/csrf")) {
        document.cookie = "XSRF-TOKEN=fresh; path=/";
        return jsonResponse(200, { headerName: "X-XSRF-TOKEN" });
      }
      return new Response(null, { status: 204 });
    });

    await apiRequest("/auth/logout", { method: "POST" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1][1]?.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe("fresh");
  });

  it("GET 요청에는 CSRF 헤더를 붙이지 않는다", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(200, {}));
    await apiRequest("/users/me");
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBeUndefined();
  });

  it("네트워크 실패는 NETWORK_ERROR로 바꾼다", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(apiRequest("/users/me")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});
