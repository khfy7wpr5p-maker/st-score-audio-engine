import { expect, test } from "@playwright/test";

test("WebKit unlocks, decodes samples and switches Piano to Classical Guitar", async ({ page }) => {
  await page.goto("/tests/browser/index.html");
  await expect(page.locator("#result")).toHaveText("NEW");
  await page.locator("#unlock").click();
  await expect(page.locator("#result")).toHaveText("SWITCH_OK");
});
