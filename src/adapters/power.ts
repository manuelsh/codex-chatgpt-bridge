import type { Page } from "playwright-core";

export async function verifyPower(page: Page, level: number, select = false): Promise<{ level: number; label: string }> {
  if (!Number.isInteger(level) || level < 1 || level > 5) throw new Error("POWER_UNVERIFIABLE: power must be an integer from 1 to 5.");
  const picker = page.locator('button.__composer-pill[aria-haspopup="menu"]')
    .or(page.getByTestId("model-switcher-dropdown-button")).filter({ visible: true });
  try {
    await picker.click({ timeout: 15000 });
    const control = page.getByRole("menuitem", { name: "Power", exact: true });
    await control.waitFor({ state: "visible", timeout: 5000 });
    const read = async () => {
      const state = await control.evaluate(node => {
        const slider = node.querySelector('[role="slider"]');
        const description = (node.getAttribute("aria-describedby") ?? "").split(" ")
          .map(id => document.getElementById(id)?.textContent ?? "").join(" ");
        return { min: slider?.getAttribute("aria-valuemin"), max: slider?.getAttribute("aria-valuemax"), value: slider?.getAttribute("aria-valuenow"), description };
      });
      const match = state.description.match(/^(.+?), ([1-5]) of 5\./);
      if (state.min !== "0" || state.max !== "4" || !match || state.value !== String(Number(match[2]) - 1)) {
        throw new Error("The interface does not expose a consistent five-level Power control.");
      }
      return { level: Number(match[2]), label: match[1] };
    };
    let current = await read();
    if (select) {
      for (let step = 0; current.level !== level && step < 4; step++) {
        const previous = current.level;
        await control.press(current.level < level ? "ArrowRight" : "ArrowLeft");
        current = await read();
        if (current.level === previous) throw new Error("Power did not change; the requested level may be unavailable.");
      }
      await page.keyboard.press("Escape");
      await picker.click();
      current = await read();
    }
    if (current.level !== level) throw new Error(`Requested level ${level}, but the interface reports ${current.level}.`);
    return current;
  } catch (error) {
    throw new Error(`POWER_UNVERIFIABLE: ${error instanceof Error ? error.message : String(error)}`);
  } finally { await page.keyboard.press("Escape").catch(() => undefined); }
}
