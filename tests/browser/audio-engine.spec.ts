import { expect, test } from "@playwright/test";

test("WebKit explicit user gesture unlocks and schedules decoded sample audition", async ({ page }) => {
  await page.goto("/tests/browser/index.html");
  await expect(page.locator("#result")).toHaveText("NEW");
  await page.locator("#unlock").click();
  await expect(page.locator("#result")).toHaveText("AUDITION_OK");
});
