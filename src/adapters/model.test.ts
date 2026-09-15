import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { verifyModel } from "./model.js";

test("model UI: select, verify, reject missing model and reject changed selection", async () => {
  const browser = await chromium.launch({channel: process.env.CGPT_BROWSER_CHANNEL ?? "chrome", headless: true});
  try {
    const page = await browser.newPage();
    await page.setContent(`<button class="__composer-pill" aria-haspopup="menu" onclick="document.querySelector('[role=menu]').hidden=false">6 Pro</button>
      <div role="menu" hidden><button role="menuitemradio" aria-checked="false"
      onclick="this.setAttribute('aria-checked','true');this.parentElement.hidden=true">GPT-5.6 Sol</button></div>`);
    assert.equal(await verifyModel(page, "GPT-5.6 Sol", true), "GPT-5.6 Sol");
    assert.equal(await verifyModel(page, "GPT-5.6 Sol"), "GPT-5.6 Sol");
    await assert.rejects(verifyModel(page, "not-a-model", true), /MODEL_UNVERIFIABLE/);
    await assert.rejects(verifyModel(page, "Latest", true), /MODEL_UNVERIFIABLE/);
    await page.getByRole("menuitemradio").evaluate(n => n.setAttribute("aria-checked", "false"));
    await assert.rejects(verifyModel(page, "GPT-5.6 Sol"), /MODEL_UNVERIFIABLE/);
  } finally { await browser.close(); }
});
