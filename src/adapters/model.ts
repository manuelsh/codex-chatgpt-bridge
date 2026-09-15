import type { Page } from "playwright-core";

// Exact UI labels, never API aliases or a model's self-description.
export async function verifyModel(page: Page, model: string, select = false): Promise<string> {
  if (!model.trim() || /^(auto|latest)$/i.test(model.trim())) {
    throw new Error("MODEL_UNVERIFIABLE: request an explicit model label, not Auto/Latest.");
  }
  const picker = page.locator('button.__composer-pill[aria-haspopup="menu"]')
    .or(page.getByTestId("model-switcher-dropdown-button")).filter({ visible: true });
  try {
    await picker.first().waitFor({ state: "visible", timeout: 15_000 });
    if (await picker.count() !== 1) throw new Error("Model selector is ambiguous.");
    await picker.click();
    const openModels = async () => {
      const submenu = page.getByRole("menuitem", {name: "Select model", exact: true});
      if (await submenu.isVisible()) await submenu.click();
    };
    await openModels();
    const choice = page.getByRole("menuitemradio", { name: model, exact: true });
    await page.getByRole("menu").first().waitFor({ state: "visible", timeout: 5_000 });
    if (await choice.count() !== 1 || !await choice.isVisible() || !await choice.isEnabled()) {
      throw new Error(`Model ${JSON.stringify(model)} is unavailable as an exact selectable UI label.`);
    }
    if (select && await choice.getAttribute("aria-checked") !== "true") {
      await choice.click();
      // Reopen to read the persisted selection rather than trusting the click.
      await page.keyboard.press("Escape");
      await picker.click();
      await openModels();
    }
    if (await choice.getAttribute("aria-checked") !== "true") {
      throw new Error(`The interface does not confirm ${JSON.stringify(model)} as selected.`);
    }
    return model;
  } catch (error) {
    throw new Error(`MODEL_UNVERIFIABLE: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await page.keyboard.press("Escape").catch(() => undefined);
  }
}
