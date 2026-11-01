import { expect, test } from "@playwright/test";
import { waitForMail } from "./mailpit";

const PASSWORD = "e2e-password-123";

test("가입 → 이메일 인증 → 홈 → 로그아웃 → 로그인", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("link", { name: "시작하기" }).click();

  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(PASSWORD);
  await page.getByLabel("비밀번호 확인").fill(PASSWORD);
  await page.getByLabel("전체 동의").check();
  await page.getByRole("button", { name: "가입하기" }).click();

  await expect(page).toHaveURL(/\/signup\/verify$/);
  await expect(page.getByText(email).filter({ visible: true })).toBeVisible();

  const mail = await waitForMail(email, "인증코드");
  const code = mail.match(/인증코드: (\d{6})/)?.[1];
  expect(code).toBeTruthy();
  await page.getByLabel("인증코드 6자리").fill(code!);
  await page.getByRole("button", { name: "인증하기" }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("heading", { name: "첫 건강검진 결과를 올려보세요" })).toBeVisible();

  await page.getByRole("link", { name: "MY" }).click();
  await expect(page.getByText(email).filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/login$/);
  // 로그아웃은 전체 페이지를 다시 불러와 숨겨진 이전 화면에 계정 정보가 남지 않는다.
  await expect(page.getByText(email)).toHaveCount(0);

  // 로그아웃 후 보호된 화면은 로그인으로 돌려보낸다.
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(PASSWORD);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/home$/);

  // 세션 쿠키는 스크립트에서 읽을 수 없다.
  const cookies = await page.context().cookies();
  const session = cookies.find((c) => c.name === "GN_SESSION");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain("GN_SESSION");
});

test("틀린 비밀번호는 같은 안내를 보여준다", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("이메일").fill("nobody@example.com");
  await page.getByLabel("비밀번호").fill("wrong-password-1");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "올바르지" })).toHaveText("이메일 또는 비밀번호가 올바르지 않습니다");
});
