let focusEnabled = false;
let highlightEnabled = false;
let bionicObserver = null;
let highlightObserver = null;

// ─────────────────────────────────────────────────────────────────
// FOCUS MODE
// ─────────────────────────────────────────────────────────────────

const CLUTTER_SELECTORS = [
  "header", "footer", "nav", "aside",
  "[class*='sidebar']", "[id*='sidebar']",
  "[class*='navbar']", "[id*='navbar']",
  "[class*='header']", "[id*='header']",
  "[class*='footer']", "[id*='footer']",
  "[class*='ad']", "[id*='ad']",
  "[class*='ads']", "[id*='ads']",
  "[class*='advert']", "[id*='advert']",
  "[class*='banner']", "[id*='banner']",
  "[class*='cookie']", "[id*='cookie']",
  "[class*='newsletter']", "[id*='newsletter']",
  "[class*='subscribe']", "[id*='subscribe']",
  "[class*='social']", "[id*='social']",
  "[class*='share']", "[id*='share']",
  "[class*='related']", "[id*='related']",
  "[class*='recommended']", "[id*='recommended']",
  "[class*='promo']", "[id*='promo']",
  "[class*='sticky']", "[id*='sticky']",
  "[class*='floating']", "[id*='floating']",
  "[role='banner']", "[role='navigation']",
  "[role='complementary']", "[role='contentinfo']",
  "iframe", "ins",
].join(", ");

const CONTENT_CANDIDATES = [
  "article",
  "[role='main']",
  "main",
  "[class*='article-body']", "[id*='article-body']",
  "[class*='article-content']", "[id*='article-content']",
  "[class*='post-body']", "[class*='post-content']",
  "[class*='entry-content']",
  "[class*='story-body']", "[class*='story-content']",
  "[class*='main-content']", "[id*='main-content']",
  "[class*='content-body']",
  "[class*='news-content']",
  "#mw-content-text",
  ".mw-parser-output",
  "[class*='bodyContent']",
  "[class*='page-content']", "[id*='page-content']",
  "[class*='article']", "[id*='article']",
  "[class*='detail']",
];

function findMainContent() {
  for (const selector of CONTENT_CANDIDATES) {
    try {
      const el = document.querySelector(selector);
      if (el && el.innerText && el.innerText.trim().length > 200) return el;
    } catch(e) {}
  }
  let best = null, bestLen = 0;
  document.querySelectorAll("div, section, main").forEach(el => {
    const len = el.innerText ? el.innerText.trim().length : 0;
    if (len > bestLen && el.offsetParent !== null) { bestLen = len; best = el; }
  });
  return best;
}

function applyFocusMode() {
  const mainContent = findMainContent();
  if (!mainContent) return;

  // ── Extract clean text+headings only (no tables, infoboxes, nav) ──
  const clone = mainContent.cloneNode(true);

  // Remove noise inside clone
  const noiseSelectors = [
    "table", "figure", "aside", "nav", ".infobox", ".navbox",
    ".reflist", ".references", ".toc", "#toc",
    "[class*='sidebar']", "[class*='ad']", "[class*='banner']",
    "[class*='share']", "[class*='social']", "[class*='related']",
    "[class*='footer']", "[class*='cookie']", "[class*='popup']",
    "script", "style", "iframe", "ins", "noscript",
    ".mw-editsection",  // Wikipedia edit links
    ".thumb",           // Wikipedia image thumbs (optional, remove if you want images)
    ".hatnote",
  ];
  noiseSelectors.forEach(sel => {
    try { clone.querySelectorAll(sel).forEach(el => el.remove()); } catch(e) {}
  });

  // Strip ALL inline styles from every element in clone
  clone.querySelectorAll("*").forEach(el => {
    el.removeAttribute("style");
    el.removeAttribute("class"); // nuke classes so site CSS can't bleed in
    el.removeAttribute("id");
  });

  // ── Build the full-screen reader shell ──
  const reader = document.createElement("div");
  reader.id = "neuro-focus-reader";
  // Inline critical styles directly on the element so nothing overrides
  reader.setAttribute("style", [
    "all: initial",                 // RESET everything
    "display: block",
    "position: fixed",
    "inset: 0",
    "width: 100vw",
    "height: 100vh",
    "z-index: 2147483647",
    "background: #111111",
    "overflow-y: auto",
    "box-sizing: border-box",
    "font-family: Georgia, serif",
    "color: #dedad5",
  ].join(" !important; ") + " !important;");

  // Inner column wrapper
  const column = document.createElement("div");
  column.setAttribute("style", [
    "display: block",
    "max-width: 720px",
    "margin: 64px auto 120px auto",
    "padding: 0 32px",
    "box-sizing: border-box",
  ].join(" !important; ") + " !important;");

  column.appendChild(clone);
  reader.appendChild(column);
  document.body.appendChild(reader);

  // ── Scoped styles for content INSIDE the reader only ──
  const style = document.createElement("style");
  style.id = "neuro-focus-styles";
  style.textContent = `
    body.neuro-focus-active { overflow: hidden !important; }

    #neuro-focus-reader * {
      all: revert;
      font-family: Georgia, Cambria, 'Times New Roman', serif !important;
      color: #dedad5 !important;
      background: transparent !important;
      line-height: 1.9 !important;
      letter-spacing: 0.012em !important;
      border-color: #2e2e2e !important;
      float: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
      max-width: 100% !important;
    }
    #neuro-focus-reader h1,
    #neuro-focus-reader h2,
    #neuro-focus-reader h3,
    #neuro-focus-reader h4,
    #neuro-focus-reader h5,
    #neuro-focus-reader h6 {
      color: #ffffff !important;
      line-height: 1.35 !important;
      margin: 1.6em 0 0.4em !important;
    }
    #neuro-focus-reader h1 { font-size: 2rem !important; }
    #neuro-focus-reader h2 { font-size: 1.55rem !important; border-bottom: 1px solid #2a2a2a !important; padding-bottom: 6px !important; }
    #neuro-focus-reader h3 { font-size: 1.2rem !important; }
    #neuro-focus-reader p  { font-size: 1.1rem !important; margin: 0 0 1.3em !important; }
    #neuro-focus-reader a  { color: #7eb8f7 !important; text-decoration: underline !important; }
    #neuro-focus-reader img { max-width: 100% !important; height: auto !important; border-radius: 6px !important; display: block !important; margin: 1.2em auto !important; opacity: 0.88 !important; }
    #neuro-focus-reader ul,
    #neuro-focus-reader ol { padding-left: 1.6em !important; margin-bottom: 1.2em !important; }
    #neuro-focus-reader li { margin-bottom: 0.45em !important; }
    #neuro-focus-reader blockquote { border-left: 3px solid #7eb8f7 !important; padding-left: 1.1em !important; margin-left: 0 !important; color: #9c9890 !important; font-style: italic !important; }
    #neuro-focus-reader sup { font-size: 0.65em !important; color: #666 !important; }

    /* Exit button */
    #neuro-focus-close {
      all: initial !important;
      display: block !important;
      position: fixed !important;
      top: 14px !important;
      right: 18px !important;
      z-index: 2147483648 !important;
      background: #1e1e1e !important;
      color: #dedad5 !important;
      border: 1px solid #3a3a3a !important;
      border-radius: 8px !important;
      padding: 7px 14px !important;
      font-size: 13px !important;
      font-family: sans-serif !important;
      cursor: pointer !important;
      letter-spacing: 0.05em !important;
    }
    #neuro-focus-close:hover { background: #2a2a2a !important; }

    /* Progress bar */
    #neuro-focus-progress {
      all: initial !important;
      display: block !important;
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      height: 3px !important;
      width: 0% !important;
      background: #7eb8f7 !important;
      z-index: 2147483648 !important;
      transition: width 0.1s linear !important;
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add("neuro-focus-active");

  // Exit button
  const closeBtn = document.createElement("button");
  closeBtn.id = "neuro-focus-close";
  closeBtn.textContent = "✕ Exit Focus";
  closeBtn.addEventListener("click", removeFocusMode);
  document.body.appendChild(closeBtn);

  // Progress bar
  const bar = document.createElement("div");
  bar.id = "neuro-focus-progress";
  document.body.appendChild(bar);
  reader.addEventListener("scroll", () => {
    const pct = reader.scrollHeight - reader.clientHeight > 0
      ? (reader.scrollTop / (reader.scrollHeight - reader.clientHeight)) * 100 : 0;
    bar.style.width = pct + "%";
  });

  focusEnabled = true;
}

function removeFocusMode() {
  ["neuro-focus-reader","neuro-focus-styles","neuro-focus-close","neuro-focus-progress"]
    .forEach(id => document.getElementById(id)?.remove());
  document.body.classList.remove("neuro-focus-active");
  focusEnabled = false;
}
// ─────────────────────────────────────────────
// MESSAGE LISTENER
// ─────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "focus") {
    focusEnabled ? removeFocusMode() : applyFocusMode();
  }

  if (request.action === "font") {
    const className = "neuro-dyslexia-font";
    if (!document.body.classList.contains(className)) {
      const linkId = "dyslexic-font";
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId; link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=OpenDyslexic&display=swap";
        document.head.appendChild(link);
      }
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }
  }

  if (request.action === "highlight") {
    const HIGHLIGHT_SELECTORS =
      "p, li, h1, h2, h3, h4, h5, h6, td, th, " +
      "div[class*='content'], div[class*='text'], div[class*='desc'], " +
      "div[class*='info'], div[class*='detail'], div[class*='body'], " +
      "div[class*='para'], div[class*='msg'], div[class*='alert'], " +
      "div[class*='modal'], div[class*='popup'], div[class*='message'], " +
      "span[class*='text'], span[class*='label'], span[class*='content']";

    const applyHighlight = (root = document) => {
      root.querySelectorAll(HIGHLIGHT_SELECTORS).forEach(el => {
        const hasDirectText = [...el.childNodes].some(
          n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
        );
        if (!hasDirectText && el.querySelectorAll("p, div, li").length > 0) return;
        if (!el.dataset.highlightOrigBg)
          el.dataset.highlightOrigBg = el.style.backgroundColor || "__none__";
        el.style.setProperty("background-color", "rgba(255,220,0,0.35)", "important");
        el.dataset.highlightActive = "1";
      });
    };

    const removeHighlight = () => {
      document.querySelectorAll("[data-highlight-active]").forEach(el => {
        const orig = el.dataset.highlightOrigBg;
        orig === "__none__"
          ? el.style.removeProperty("background-color")
          : el.style.setProperty("background-color", orig);
        delete el.dataset.highlightOrigBg;
        delete el.dataset.highlightActive;
      });
    };

    if (!highlightEnabled) {
      applyHighlight();
      highlightObserver = new MutationObserver(() => applyHighlight());
      highlightObserver.observe(document.body, { childList: true, subtree: true });
      highlightEnabled = true;
    } else {
      removeHighlight();
      highlightObserver?.disconnect(); highlightObserver = null;
      highlightEnabled = false;
    }
  }

  if (request.action === "bionic") {
    const BIONIC_SELECTORS =
      "p, li, h1, h2, h3, h4, h5, h6, td, th, dt, dd, figcaption, blockquote, label, " +
      "div[class*='content'], div[class*='text'], div[class*='desc'], " +
      "div[class*='info'], div[class*='detail'], div[class*='body'], " +
      "div[class*='para'], div[class*='msg'], div[class*='alert'], " +
      "div[class*='modal'], div[class*='popup'], div[class*='message'], " +
      "span[class*='text'], span[class*='label'], span[class*='content']";

    const applyBionic = (el) => {
      if (el.dataset.bionicDone) return;
      const hasDirectText = [...el.childNodes].some(
        n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
      );
      if (!hasDirectText && el.querySelectorAll("p, div, li").length > 0) return;
      if (!el.dataset.originalHtml) el.dataset.originalHtml = el.innerHTML;

      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName?.toLowerCase();
          if (["script","style","code","pre","kbd","textarea","input"].includes(tag))
            return NodeFilter.FILTER_REJECT;
          if (parent.dataset.bionicSpan) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) textNodes.push(node);

      textNodes.forEach(textNode => {
        if (!textNode.nodeValue.trim()) return;
        const words = textNode.nodeValue.split(/(\s+)/);
        const newHTML = words.map(word => {
          if (word.trim().length < 2) return word;
          const half = Math.ceil(word.length / 2);
          return `<strong data-bionic-span="1" style="font-weight:900 !important;color:inherit !important;background:none !important;text-decoration:inherit !important;">${word.slice(0, half)}</strong>${word.slice(half)}`;
        }).join("");
        const span = document.createElement("span");
        span.dataset.bionicSpan = "1";
        span.innerHTML = newHTML;
        textNode.replaceWith(span);
      });
      el.dataset.bionicDone = "1";
    };

    const revertBionic = () => {
      document.querySelectorAll("[data-bionic-done]").forEach(el => {
        if (el.dataset.originalHtml !== undefined) el.innerHTML = el.dataset.originalHtml;
        delete el.dataset.originalHtml;
        delete el.dataset.bionicDone;
      });
    };

    if (document.querySelector("[data-bionic-done]")) {
      revertBionic();
      bionicObserver?.disconnect(); bionicObserver = null;
    } else {
      document.querySelectorAll(BIONIC_SELECTORS).forEach(applyBionic);
      bionicObserver = new MutationObserver(mutations => {
        mutations.forEach(m => m.addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (node.matches?.(BIONIC_SELECTORS)) applyBionic(node);
          node.querySelectorAll?.(BIONIC_SELECTORS).forEach(applyBionic);
        }));
      });
      bionicObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ─────────────────────────────────────────────
// TEXT EXTRACTION FOR AI
// ─────────────────────────────────────────────

  if (request.action === "extractText") {

    let mainText = document.body.innerText;

    if (mainText.length > 20000) {
      mainText = mainText.slice(0, 20000);
    }

    sendResponse({ text: mainText });

  }

});

