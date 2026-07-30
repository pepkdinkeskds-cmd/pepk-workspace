import { icon } from "./icons.js?v=0.9.5-feedback-pilot-01";
import { SUBMISSION_PORTAL_URL } from "./pages/submission-portal-bridge.js?v=0.9.5-quality-07";

const FEEDBACK = Object.freeze({
  action: "submit_feedback",
  appVersion: "0.9.5",
  maxMessageLength: 1500,
  minMessageLength: 10,
  storageKey: "pepk_feedback_browser_id_v1",
  messageType: "PEPK_FEEDBACK_RESULT",
  trustedHosts: Object.freeze([
    "script.google.com",
    "script.googleusercontent.com"
  ])
});

function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "dataset") {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        node.dataset[dataKey] = dataValue;
      });
    } else if (value === false || value === null || value === undefined) return;
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  });
  const values = Array.isArray(children) ? children : [children];
  values.filter((child) => child !== null && child !== undefined && child !== false)
    .forEach((child) => node.append(child instanceof Node ? child : document.createTextNode(String(child))));
  return node;
}

function randomId(prefix) {
  const cryptoApi = globalThis.crypto;
  const value = typeof cryptoApi?.randomUUID === "function"
    ? cryptoApi.randomUUID().replaceAll("-", "")
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${value.slice(0, 24)}`;
}

function browserId() {
  try {
    const existing = localStorage.getItem(FEEDBACK.storageKey);
    if (existing) return existing;
    const created = randomId("browser");
    localStorage.setItem(FEEDBACK.storageKey, created);
    return created;
  } catch {
    return randomId("session");
  }
}

function feedbackEndpoint() {
  try {
    const url = new URL(SUBMISSION_PORTAL_URL);
    return url.protocol === "https:" && url.hostname === "script.google.com" && url.pathname.endsWith("/exec")
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function trustedMessageOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && (
      FEEDBACK.trustedHosts.includes(url.hostname) ||
      url.hostname.endsWith(".googleusercontent.com")
    );
  } catch {
    return false;
  }
}

function hiddenInput(name, value) {
  return element("input", { type: "hidden", name, value });
}

function field({ id, name, label, type = "text", autocomplete, maxlength, placeholder, required = true }) {
  const input = element("input", {
    id,
    name,
    type,
    autocomplete,
    maxlength,
    placeholder,
    required
  });
  return {
    control: input,
    wrapper: element("div", { className: "feedback-field" }, [
      element("label", { htmlFor: id, text: label }),
      input
    ])
  };
}

function feedbackWidget() {
  const endpoint = feedbackEndpoint();
  if (!endpoint || document.querySelector("[data-feedback-widget]")) return null;

  const frameName = randomId("pepk-feedback-frame");
  const channelNonce = randomId("channel");
  const launcher = element("button", {
    className: "feedback-launcher",
    type: "button",
    "aria-expanded": "false",
    "aria-controls": "pepk-feedback-panel",
    html: `${icon("message")}<span>Kirim Masukan</span>`
  });
  const closeButton = element("button", {
    className: "feedback-panel__close",
    type: "button",
    "aria-label": "Tutup formulir masukan",
    html: icon("close")
  });
  const name = field({
    id: "pepk-feedback-name",
    name: "name",
    label: "Nama",
    autocomplete: "name",
    maxlength: 80,
    placeholder: "Nama Anda"
  });
  const email = field({
    id: "pepk-feedback-email",
    name: "email",
    label: "Email",
    type: "email",
    autocomplete: "email",
    maxlength: 160,
    placeholder: "nama@contoh.go.id"
  });
  const message = element("textarea", {
    id: "pepk-feedback-message",
    name: "message",
    rows: 5,
    maxlength: FEEDBACK.maxMessageLength,
    minlength: FEEDBACK.minMessageLength,
    required: true,
    placeholder: "Ceritakan kendala, saran, atau kebutuhan Anda…",
    "aria-describedby": "pepk-feedback-help pepk-feedback-count"
  });
  const messageCount = element("span", {
    id: "pepk-feedback-count",
    className: "feedback-field__count",
    text: `0/${FEEDBACK.maxMessageLength}`
  });
  const status = element("p", {
    className: "feedback-form__status",
    role: "status",
    "aria-live": "polite",
    text: ""
  });
  const submitButton = element("button", {
    className: "button button--primary feedback-form__submit",
    type: "submit",
    html: `${icon("send")}<span>Kirim Masukan</span>`
  });
  const honeypot = element("div", {
    className: "feedback-field feedback-field--website",
    "aria-hidden": "true"
  }, [
    element("label", { htmlFor: "pepk-feedback-website", text: "Website" }),
    element("input", {
      id: "pepk-feedback-website",
      name: "website",
      type: "text",
      tabindex: -1,
      autocomplete: "off"
    })
  ]);
  const form = element("form", {
    className: "feedback-form",
    method: "post",
    action: endpoint,
    target: frameName,
    autocomplete: "on"
  }, [
    hiddenInput("action", FEEDBACK.action),
    hiddenInput("channel_nonce", channelNonce),
    hiddenInput("browser_id", browserId()),
    hiddenInput("client_submission_id", randomId("client")),
    hiddenInput("form_started_at", String(Date.now())),
    hiddenInput("page_url", window.location.href),
    hiddenInput("page_path", `${window.location.pathname}${window.location.search}${window.location.hash}`),
    hiddenInput("page_title", document.title),
    hiddenInput("app_version", FEEDBACK.appVersion),
    name.wrapper,
    email.wrapper,
    element("div", { className: "feedback-field" }, [
      element("label", { htmlFor: "pepk-feedback-message", text: "Masukan" }),
      message,
      element("div", { className: "feedback-field__meta" }, [
        element("span", {
          id: "pepk-feedback-help",
          text: "Jangan mencantumkan kata sandi atau data kesehatan pribadi."
        }),
        messageCount
      ])
    ]),
    honeypot,
    status,
    submitButton
  ]);
  const success = element("div", {
    className: "feedback-success",
    hidden: true,
    tabindex: -1
  });
  const panel = element("section", {
    id: "pepk-feedback-panel",
    className: "feedback-panel",
    role: "dialog",
    "aria-labelledby": "pepk-feedback-title",
    hidden: true
  }, [
    element("div", { className: "feedback-panel__header" }, [
      element("div", {}, [
        element("span", { className: "feedback-panel__eyebrow", text: "PEPK Workspace" }),
        element("h2", { id: "pepk-feedback-title", text: "Kirim Masukan" })
      ]),
      closeButton
    ]),
    element("p", {
      className: "feedback-panel__intro",
      text: "Masukan Anda membantu kami memperbaiki layanan dan pengalaman penggunaan."
    }),
    form,
    success
  ]);
  const frame = element("iframe", {
    className: "feedback-response-frame",
    name: frameName,
    title: "Proses pengiriman masukan",
    tabindex: -1
  });
  const widget = element("div", {
    className: "feedback-widget",
    dataset: { feedbackWidget: "" }
  }, [panel, launcher, frame]);

  let submitting = false;
  let submissionTimer = 0;

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    launcher.classList.toggle("feedback-launcher--hidden", open);
    if (open) {
      if (!form.hidden && !submitting) {
        form.querySelector('[name="form_started_at"]').value = String(Date.now());
      }
      window.requestAnimationFrame(() => {
        const target = success.hidden ? name.control : success;
        target.focus({ preventScroll: true });
      });
    } else {
      launcher.focus({ preventScroll: true });
    }
  }

  function setSubmitting(value) {
    submitting = value;
    submitButton.disabled = value;
    name.control.readOnly = value;
    email.control.readOnly = value;
    message.readOnly = value;
    if (!value && submissionTimer) {
      window.clearTimeout(submissionTimer);
      submissionTimer = 0;
    }
    submitButton.innerHTML = value
      ? `<span class="feedback-spinner" aria-hidden="true"></span><span>Mengirim…</span>`
      : `${icon("send")}<span>Kirim Masukan</span>`;
  }

  function prepareNextSubmission() {
    form.reset();
    form.querySelector('[name="client_submission_id"]').value = randomId("client");
    form.querySelector('[name="form_started_at"]').value = String(Date.now());
    form.querySelector('[name="page_url"]').value = window.location.href;
    form.querySelector('[name="page_path"]').value = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    form.querySelector('[name="page_title"]').value = document.title;
    messageCount.textContent = `0/${FEEDBACK.maxMessageLength}`;
    status.textContent = "";
    success.hidden = true;
    success.replaceChildren();
    form.hidden = false;
    name.control.focus();
  }

  launcher.addEventListener("click", () => setOpen(true));
  closeButton.addEventListener("click", () => setOpen(false));
  message.addEventListener("input", () => {
    messageCount.textContent = `${message.value.length}/${FEEDBACK.maxMessageLength}`;
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  });
  form.addEventListener("submit", (event) => {
    if (submitting) {
      event.preventDefault();
      return;
    }
    const trimmed = message.value.trim();
    if (trimmed.length < FEEDBACK.minMessageLength) {
      event.preventDefault();
      message.setCustomValidity(`Masukan minimal ${FEEDBACK.minMessageLength} karakter.`);
      message.reportValidity();
      message.setCustomValidity("");
      return;
    }
    status.textContent = "Mengirim masukan…";
    setSubmitting(true);
    submissionTimer = window.setTimeout(() => {
      setSubmitting(false);
      status.textContent = "Respons layanan terlalu lama. Periksa koneksi, lalu coba kembali.";
    }, 30000);
  });
  window.addEventListener("message", (event) => {
    if (!trustedMessageOrigin(event.origin)) return;
    const result = event.data;
    if (!result || result.type !== FEEDBACK.messageType || result.channelNonce !== channelNonce) return;
    setSubmitting(false);
    if (!result.ok) {
      status.textContent = result.message || "Masukan belum dapat dikirim. Silakan coba kembali.";
      return;
    }
    form.hidden = true;
    success.hidden = false;
    success.replaceChildren(
      element("span", { className: "feedback-success__icon", html: icon("check") }),
      element("h3", { text: "Masukan berhasil dikirim" }),
      element("p", { text: "Terima kasih. Masukan Anda sudah masuk ke antrean operator." }),
      element("span", { className: "feedback-success__id", text: `ID: ${result.feedbackId}` }),
      element("button", {
        className: "button button--secondary",
        type: "button",
        text: "Kirim masukan lain"
      })
    );
    success.querySelector("button").addEventListener("click", prepareNextSubmission, { once: true });
    success.focus();
  });

  return widget;
}

function initializeFeedback() {
  const widget = feedbackWidget();
  if (widget) document.body.append(widget);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFeedback, { once: true });
} else {
  initializeFeedback();
}
