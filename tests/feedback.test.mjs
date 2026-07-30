import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index", "resources", "workspace", "information", "contribute", "monev", "about", "404"];

async function source(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("every public page loads the isolated Feedback module with the mobile cache key", async () => {
  for (const page of pages) {
    const html = await source(`${page}.html`);
    assert.match(html, /js\/feedback\.js\?v=0\.9\.5-mobile-access-01/);
    assert.match(html, /css\/main\.css\?v=0\.9\.5-mobile-access-01/);
  }
});

test("content security policy permits only the Apps Script form and response frame", async () => {
  for (const page of pages) {
    const html = await source(`${page}.html`);
    assert.match(html, /frame-src https:\/\/script\.google\.com https:\/\/script\.googleusercontent\.com https:\/\/\*\.googleusercontent\.com/);
    assert.match(html, /form-action 'self' https:\/\/script\.google\.com/);
  }
});

test("feedback uses the existing Submission Portal deployment", async () => {
  const feedback = await source("js/feedback.js");
  assert.match(feedback, /SUBMISSION_PORTAL_URL/);
  assert.match(feedback, /url\.hostname === "script\.google\.com"/);
  assert.match(feedback, /url\.pathname\.endsWith\("\/exec"\)/);
  assert.doesNotMatch(feedback, /docs\.google\.com\/forms|forms\.gle/);
});

test("feedback form contains only the requested identity and message fields", async () => {
  const feedback = await source("js/feedback.js");
  assert.match(feedback, /name:\s*"name"/);
  assert.match(feedback, /name:\s*"email"/);
  assert.match(feedback, /name:\s*"message"/);
  assert.match(feedback, /label:\s*"Nama"/);
  assert.match(feedback, /label:\s*"Email"/);
  assert.match(feedback, /text:\s*"Masukan"/);
  assert.doesNotMatch(feedback, /user_agent|geolocation|phone|telephone/);
});

test("client records source context without persisting name or email locally", async () => {
  const feedback = await source("js/feedback.js");
  assert.match(feedback, /hiddenInput\("page_url"/);
  assert.match(feedback, /hiddenInput\("page_path"/);
  assert.match(feedback, /hiddenInput\("page_title"/);
  assert.match(feedback, /hiddenInput\("app_version"/);
  assert.match(feedback, /localStorage\.setItem\(FEEDBACK\.storageKey, created\)/);
  assert.doesNotMatch(feedback, /localStorage\.setItem\([^,]+,\s*(?:name|email)/);
});

test("cross-origin response is bound to a trusted origin and channel nonce", async () => {
  const feedback = await source("js/feedback.js");
  assert.match(feedback, /trustedMessageOrigin\(event\.origin\)/);
  assert.match(feedback, /result\.channelNonce !== channelNonce/);
  assert.match(feedback, /script\.googleusercontent\.com/);
  assert.match(feedback, /\.endsWith\("\.googleusercontent\.com"\)/);
});

test("feedback has validation, timeout, idempotency input, and spam honeypot", async () => {
  const feedback = await source("js/feedback.js");
  assert.match(feedback, /maxMessageLength:\s*1500/);
  assert.match(feedback, /minMessageLength:\s*10/);
  assert.match(feedback, /hiddenInput\("client_submission_id"/);
  assert.match(feedback, /name:\s*"website"/);
  assert.match(feedback, /30000/);
});

test("feedback interaction restores focus and supports Escape", async () => {
  const feedback = await source("js/feedback.js");
  assert.match(feedback, /role:\s*"dialog"/);
  assert.match(feedback, /"aria-labelledby":\s*"pepk-feedback-title"/);
  assert.match(feedback, /event\.key === "Escape"/);
  assert.match(feedback, /launcher\.focus\(\{ preventScroll: true \}\)/);
  assert.match(feedback, /name\.control\.focus/);
});

test("feedback panel is responsive and excluded from print", async () => {
  const css = await source("css/main.css");
  assert.match(css, /FEEDBACK PILOT 01/);
  assert.match(css, /\.feedback-widget\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(css, /\.feedback-panel\s*\{[\s\S]*?max-height:\s*min\(42rem, calc\(100dvh - 2rem\)\)/);
  assert.match(css, /@media \(max-width:\s*40rem\)[\s\S]*?\.feedback-panel\s*\{[\s\S]*?width:\s*100%/);
  assert.match(css, /@media print[\s\S]*?\.feedback-widget\s*\{[\s\S]*?display:\s*none/);
});
