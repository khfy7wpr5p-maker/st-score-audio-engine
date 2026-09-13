import { expect, test } from "@playwright/test";

test("Web Audio engine can be unlocked only through the explicit gesture path", async ({ page }) => {
  await page.goto("/tests/browser/index.html");
  await expect(page.locator("#result")).toHaveText("NEW");
  await page.locator("#unlock").click();
  await expect(page.locator("#result")).toHaveText(/READY|AUDIO_UNLOCK_REQUIRED/);
});
