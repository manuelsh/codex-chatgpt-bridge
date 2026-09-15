# codex-chatgpt-bridge

Fork of [RPG-478/codex-chatgpt-bridge](https://github.com/RPG-478/codex-chatgpt-bridge), retaining its MIT license and attribution.

## Fork options: model and headless

Working background alternative on Windows:

```powershell
node .\dist\cli.js ask --adapter playwright --minimized --model "GPT-5.6 Sol" --question "Use the required structure and summarize 2 + 2."
```

Normal Chrome minimized is now the default for Playwright CLI/MCP runs. The window state is verified using Chrome's protocol. This is **not headless**. No window flags are needed. Use `ask --minimized false` (MCP `minimized: false`) for a visible window. Explicit `--headless true` remains experimental; combining it with `--minimized true` is rejected. Login always stays visible. A window may briefly appear during startup or site prompts; restore it manually if interaction is required.

Verified 2026-09-15: minimized Chrome returned HTTP 200, reported `windowState: minimized`, and completed a real structured query with GPT-5.6 Sol verified before/after submission. Native Chrome invoked directly with `--headless --dump-dom`, without Playwright, returned `Just a moment...` and no editor using the same dedicated profile. Thus the observed headless failure is reproducible without Playwright.

Additional headless comparison (same dedicated profile, Chrome 152.0.7977.84, sequential runs with each browser closed before the next):

| Framework | Version | Observed result | Prompt sent |
| --- | --- | --- | --- |
| Puppeteer Core | 25.11.0 | HTTP 403, no editor (about 3.8 seconds); title was empty at inspection | No |
| Selenium WebDriver | 4.49.0 | `Just a moment...` verification page, no editor (about 7.2 seconds); HTTP status not captured | No |

These are navigation diagnostics, not successful end-to-end tests. Both used documented headless launch settings, without stealth plugins, fingerprint changes or challenge interaction. Temporary dependencies and probes remain in ignored `.cgpt/framework-test/`; the bridge dependencies were not changed. Neither alternative improved access in this comparison; this is not a claim about every possible configuration or future version.

Research references:

- [Chrome's unified headless mode](https://developer.chrome.com/docs/automation-and-testing/headless): modern Chrome shares headed/headless implementation; our installed Chrome 152 already uses this generation.
- [Cloudflare supported browsers](https://developers.cloudflare.com/cloudflare-challenges/reference/supported-browsers/): automated production challenge solving is unsupported.
- [Playwright CLI minimized-window request](https://github.com/microsoft/playwright-cli/issues/318): user report describing this practical alternative for ChatGPT; not a guarantee from maintainers.

```powershell
node .\dist\cli.js login --channel chrome
node .\dist\cli.js ask --adapter playwright --model "GPT-5.6 Sol" --headless --question "Use the required response structure and summarize 2 + 2."
```

- `--model` requests an **exact label** in the web model menu. No API aliases. Auto/Latest are rejected because they do not identify a fixed model. The current English model submenu is supported; other layouts can fail closed.
- Selection is checked using the menu's `aria-checked` state before sending and after receiving. Unavailable, ambiguous or unverifiable models produce `MODEL_UNVERIFIABLE`, with no automatic substitution. This confirms the web selection, not an independently verified backend model identity. A post-send verification failure means the request may already have run; do not retry blindly.
- Without `--model`, the browser default is used and explicitly reported as unverified.
- Playwright defaults to `headless: false`, `minimized: true`. Login remains visible and rejects `--headless true`. All modes use the same dedicated profile, without session copying or automation-concealment flags.
- MCP `chatgpt_delegate` accepts optional `model`, `headless` and `minimized` with the same defaults. Browser options require the Playwright adapter. No new environment variables or config files.
- Run one command at a time. If login, verification or limits block a run, use visible Chrome to resolve them manually. A response timeout is an error, even if partial text exists.
- The bridge retains upstream's local prompt/response storage. Never commit `.cgpt` or the dedicated browser profile.
- Tests require installed Chrome (or `CGPT_BROWSER_CHANNEL=msedge`) for the local model-selector fixture.

Verified on 2026-09-15: a real Chrome run selected and checked `GPT-5.6 Sol` before and after a harmless structured query, and retrieved the response successfully. The same headless test timed out before the prompt editor became available; no prompt was sent. **Headless compatibility with ChatGPT is not verified in this environment.** If needed, explicitly use `--headless false`. No challenge was bypassed and the cause of the unavailable editor was not established. The four local tests and TypeScript build passed. Other model labels, translated menus and Project-specific selectors remain unverified.

### Observed model menu (2026-09-15)

Snapshot from the dedicated Chrome profile; options can vary with account and rollout:

| Visible option | State / note |
| --- | --- |
| Latest | Selected during inspection; dynamic alias, rejected by explicit-model verification |
| GPT-5.6 Sol | Available; exact label supported and previously tested end to end |
| GPT-5.5 | Available, with `Leaving on October 14`; full accessible label is `GPT-5.5 Leaving on October 14`, not yet tested |

The selector button displayed `6 Pro`; its menu also showed `Power` with `Pro, 5 of 5`. These are displayed controls, not additional fixed model labels. `GPT-5.6 Luna` was absent. No broader availability claim is made.

Historical headless retest: with the former headless default, the editor did not appear within 30 seconds; the command returned `BROWSER_NOT_READY` before sending. The default has since been changed to normal Chrome minimized.

Diagnosis: the same dedicated profile returned HTTP 403 and a Cloudflare `Just a moment...` verification page in headless Chrome, while visible Chrome returned HTTP 200 with the editor available. A verification-domain request also failed DNS resolution in Chrome; a subsequent OS DNS check resolved the domain. This does not establish a permanent DNS fault. The bridge now rejects verification/403 and rate-limit/429 responses immediately. The default is normal Chrome minimized; headless compatibility remains unresolved.

[![Status](https://img.shields.io/badge/status-alpha-orange)](#status)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933)](./package.json)
[![Adapter](https://img.shields.io/badge/adapter-Playwright-2EAD33)](#adapters)

**Languages:** English | [Japanese](./README.ja.md)

A local experimental bridge that lets Codex ask ChatGPT Web for compact second opinions.

Codex stays the executor. ChatGPT stays the advisor. The bridge only moves small structured delegation packets between them.

```text
Codex -> cgpt CLI -> local browser bridge -> ChatGPT Project -> structured response -> Codex
```

## Status

This is an experimental, unofficial alpha tool.

It is not affiliated with, endorsed by, or supported by OpenAI. ChatGPT Web automation can break when the web UI changes. Use it for local experimentation only.

## Important Safety Notice

This project automates ChatGPT Web through a logged-in browser session. Before using or publishing derivatives, review the terms that apply to your ChatGPT account and use case. OpenAI's terms include restrictions around automated or programmatic extraction of Output.

This tool is not intended for scraping, bulk extraction, dataset generation, account sharing, or bypassing API access.

Recommended guardrails:

| Area | Recommendation |
| --- | --- |
| Usage | Keep this local, low-volume, and user-initiated. |
| Secrets | Do not delegate secrets, tokens, credentials, private logs, or sensitive personal data. |
| Session data | Browser login state is stored outside the repo by default under the user's home directory. |
| Debugging | Debug commands require `--unsafe-debug` because they can expose page text. |
| Verification | Treat ChatGPT output as advice. Codex must verify before editing files or running actions. |

## Why

Codex is strong at acting on the local machine: reading files, editing, running commands, and verifying changes. ChatGPT is often useful as a thinking partner for planning, research, critique, and summarization. This bridge explores a middle path: Codex sends a small delegation packet to ChatGPT and only reads back a short structured result.

The goal is to reduce Codex context usage for compact second opinions without giving ChatGPT control over your machine.

## Current Capabilities

| Capability | Current state |
| --- | --- |
| Manual prompt-packet workflow | Implemented |
| Playwright ChatGPT Web delegation | Implemented |
| Dedicated ChatGPT Project targeting | Implemented by URL, with name fallback |
| ChatGPT Project instructions template | Implemented |
| Structured response validation | Implemented |
| Local `doctor` checks | Implemented |
| Optional Playwright `doctor` reachability check | Implemented |
| stdio MCP wrapper | Implemented for delegation and project instructions |

## Current Limitations

- ChatGPT Web automation depends on the current web UI and can break without a code change in this project.
- Project targeting is verified before Playwright delegation and by `doctor --adapter playwright`, but there is not yet a separate post-submit Project membership smoke test.
- Invalid ChatGPT response schemas currently fail fast; automatic repair retry is not implemented yet.
- Context packets are not automatically redacted yet. Keep delegated context small and exclude secrets manually.
- There is no Chrome extension adapter yet; Playwright is the only automated browser adapter.

## Install

```powershell
npm install
npm run build
```

Requirements:

- Node.js 22+
- Chrome or Edge
- A ChatGPT account you can log into locally

## First Login

Use a dedicated browser profile for the bridge:

```powershell
node .\dist\cli.js login --channel chrome
```

If Chrome is not installed:

```powershell
node .\dist\cli.js login --channel msedge
```

The browser profile is stored outside the repository by default:

```text
~/.codex-chatgpt-bridge/browser-profile
```

Override it if needed:

```powershell
$env:CGPT_BROWSER_PROFILE_DIR="C:\path\to\profile"
```

## Recommended: Use a ChatGPT Project

Create a dedicated ChatGPT Project, for example `Codex Bridge`.

Save the project URL:

```powershell
node .\dist\cli.js project-set --url "https://chatgpt.com/g/g-p-.../project"
```

Or target the project by sidebar name:

```powershell
node .\dist\cli.js project-set --name "Codex Bridge"
```

Generate project instructions:

```powershell
node .\dist\cli.js project-instructions
```

Paste `.cgpt/project-instructions.md` into the ChatGPT Project instructions. This tells ChatGPT that incoming messages may be delegated by Codex rather than typed by the human user.

## Usage

Ask through the Playwright adapter:

```powershell
node .\dist\cli.js ask --adapter playwright --mode review --question "List the top 3 risks in this bridge design."
```

Use a one-off project target:

```powershell
node .\dist\cli.js ask --adapter playwright --project-name "Codex Bridge" --mode plan --question "What should be built next?"
```

Create a manual prompt packet:

```powershell
node .\dist\cli.js ask --adapter manual --mode research --question "What is the smallest useful architecture?"
```

Save a manual response:

```powershell
node .\dist\cli.js save --job <job-id> --from-file .\answer.md
```

Read a response:

```powershell
node .\dist\cli.js show --job <job-id>
```

## Doctor

Run local checks without sending a prompt to ChatGPT:

```powershell
node .\dist\cli.js doctor
```

Run browser and Project reachability checks:

```powershell
node .\dist\cli.js doctor --adapter playwright
```

The Playwright doctor opens ChatGPT with the configured browser profile, verifies that the prompt editor is reachable, and checks the configured Project target when one is set. It does not submit a delegation prompt.

## Modes

| Mode | Use for |
| --- | --- |
| `ask` | Small general questions |
| `research` | External or exploratory research summaries |
| `review` | Design and risk critique |
| `debug` | Error and failure analysis |
| `plan` | Implementation planning |
| `summarize` | Compressing long context |

## Response Contract

ChatGPT responses are validated before they are saved:

```markdown
verdict: proceed | revise | blocked

summary:
- concise bullet

risks:
- material risk only

sources:
- optional URL

next_action: one concrete sentence
```

If the response does not include a valid `verdict` and at least one `summary` item, the CLI fails instead of saving an ambiguous result.

## Adapters

| Adapter | Command | Notes |
| --- | --- | --- |
| Manual | `--adapter manual` | Generates a prompt file for copy/paste. |
| Playwright | `--adapter playwright` | Opens ChatGPT Web using a persistent local browser profile. |

## MCP Server

Build the project and run the stdio MCP server:

```powershell
npm run build
node .\dist\mcp.js
```

The server exposes:

| Tool | Purpose |
| --- | --- |
| `chatgpt_delegate` | Create a manual prompt packet or delegate directly through Playwright. |
| `chatgpt_project_instructions` | Return the recommended ChatGPT Project instructions. |

## Debugging

Debug commands can expose account names, chat titles, project names, and page content. They are gated:

```powershell
node .\dist\cli.js debug-page --unsafe-debug
node .\dist\cli.js debug-submit --unsafe-debug --text "hello"
```

Use these only in a private local environment.

Show the active browser profile path:

```powershell
node .\dist\cli.js profile-path
```

If ChatGPT appears to "forget" login, first check that `cgpt`, `cgpt-mcp`, and any manually opened browser window are using the same profile directory. The default is:

```text
~/.codex-chatgpt-bridge/browser-profile
```

## Codex Skill

The included skill lives at:

```text
skills/chatgpt-delegate/SKILL.md
```

It tells Codex when to delegate, how to keep context small, and how to treat ChatGPT output as non-authoritative advice.

## Local State

| Path | Purpose | Git status |
| --- | --- | --- |
| `.cgpt/jobs/` | Local prompt packets | ignored |
| `.cgpt/responses/` | Local response files | ignored |
| `.cgpt/config.json` | Project URL/name | ignored |
| `~/.codex-chatgpt-bridge/browser-profile` | Browser login profile | outside repo |

## Development

```powershell
npm run check
npm test
```

## Roadmap

- Chrome extension adapter for more stable DOM integration.
- Post-submit Project membership smoke test after each Playwright delegation.
- Retry-on-schema-failure with a repair prompt.
- Redaction helpers for context packets.
