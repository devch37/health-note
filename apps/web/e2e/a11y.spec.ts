import { expect, test } from "@playwright/test";
import axe from "axe-core";

// 실제 브라우저 렌더링 기준(색 대비 포함)으로 공개 화면을 검사한다.
for (const path of ["/", "/signup", "/login", "/password-reset", "/signup/verify"]) {
  test(`접근성: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () => {
      // @ts-expect-error axe는 addScriptTag로 주입된다
      const result = await window.axe.run(document);
      return result.violations
        .filter((v: { impact: string }) => v.impact === "serious" || v.impact === "critical")
        .map((v: { id: string; nodes: unknown[] }) => `${v.id} (${v.nodes.length})`);
    });
    expect(violations).toEqual([]);
  });
}
