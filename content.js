let focusEnabled = false;
let overlay = null;
let highlightEnabled = false;
let bionicObserver = null;
let highlightObserver = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ─────────────────────────────────────────────
  // FOCUS MODE
  // ─────────────────────────────────────────────
  if (request.action === "focus") {
    if (!focusEnabled) {
      overlay = document.createElement("div");
      overlay.className = "focus-overlay";

      const topShade = document.createElement("div");
      topShade.className = "focus-top";
      const bottomShade = document.createElement("div");
      bottomShade.className = "focus-bottom";
      const center = document.createElement("div");
      center.className = "focus-center";

      overlay.appendChild(topShade);
      overlay.appendChild(center);
      overlay.appendChild(bottomShade);
      document.body.appendChild(overlay);
      focusEnabled = true;
    } else {
      overlay.remove();
      focusEnabled = false;
    }
  }

  // ─────────────────────────────────────────────
  // DYSLEXIA FONT
  // ─────────────────────────────────────────────
  if (request.action === "font") {
    const className = "neuro-dyslexia-font";
    if (!document.body.classList.contains(className)) {
      const linkId = "dyslexic-font";
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=OpenDyslexic&display=swap";
        document.head.appendChild(link);
      }
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }
  }

  // ─────────────────────────────────────────────
  // HIGHLIGHT LINES
  // ─────────────────────────────────────────────
  if (request.action === "highlight") {

    // Broader selectors to catch IRCTC divs, spans, Angular components
    const HIGHLIGHT_SELECTORS =
      "p, li, h1, h2, h3, h4, h5, h6, td, th, " +
      "div[class*='content'], div[class*='text'], div[class*='desc'], " +
      "div[class*='info'], div[class*='detail'], div[class*='body'], " +
      "div[class*='para'], div[class*='msg'], div[class*='alert'], " +
      "div[class*='modal'], div[class*='popup'], div[class*='message'], " +
      "span[class*='text'], span[class*='label'], span[class*='content']";

    const applyHighlight = (root = document) => {
      const elements = root.querySelectorAll(HIGHLIGHT_SELECTORS);
      elements.forEach(el => {
        // Skip elements that only contain other block elements (not direct text)
        const hasDirectText = [...el.childNodes].some(
          n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
        );
        if (!hasDirectText && el.querySelectorAll("p, div, li").length > 0) return;

        if (!el.dataset.highlightOrigBg) {
          // Save original background (computed, so we can restore exactly)
          el.dataset.highlightOrigBg = el.style.backgroundColor || "__none__";
        }
        // Use !important via cssText to override IRCTC inline styles
        el.style.setProperty("background-color", "rgba(255,220,0,0.35)", "important");
        el.dataset.highlightActive = "1";
      });
    };

    const removeHighlight = (root = document) => {
      root.querySelectorAll("[data-highlight-active]").forEach(el => {
        const orig = el.dataset.highlightOrigBg;
        if (orig === "__none__") {
          el.style.removeProperty("background-color");
        } else {
          el.style.setProperty("background-color", orig);
        }
        delete el.dataset.highlightOrigBg;
        delete el.dataset.highlightActive;
      });
    };

    if (!highlightEnabled) {
      applyHighlight();

      // MutationObserver for dynamic content (Angular, React sites like IRCTC)
      highlightObserver = new MutationObserver(() => {
        applyHighlight();
      });
      highlightObserver.observe(document.body, { childList: true, subtree: true });

      highlightEnabled = true;
    } else {
      removeHighlight();
      if (highlightObserver) {
        highlightObserver.disconnect();
        highlightObserver = null;
      }
      highlightEnabled = false;
    }
  }

  // ─────────────────────────────────────────────
  // BIONIC READING
  // ─────────────────────────────────────────────
  if (request.action === "bionic") {

    // Very broad selectors — covers IRCTC Angular divs, wiki, news sites
    const BIONIC_SELECTORS =
      "p, li, h1, h2, h3, h4, h5, h6, td, th, dt, dd, " +
      "figcaption, blockquote, label, " +
      "div[class*='content'], div[class*='text'], div[class*='desc'], " +
      "div[class*='info'], div[class*='detail'], div[class*='body'], " +
      "div[class*='para'], div[class*='msg'], div[class*='alert'], " +
      "div[class*='modal'], div[class*='popup'], div[class*='message'], " +
      "span[class*='text'], span[class*='label'], span[class*='content']";

    const applyBionic = (el) => {
      if (el.dataset.bionicDone) return;

      // Skip elements that are purely structural (no direct text)
      const hasDirectText = [...el.childNodes].some(
        n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
      );
      if (!hasDirectText && el.querySelectorAll("p, div, li").length > 0) return;

      // Save original HTML for revert
      if (!el.dataset.originalHtml) {
        el.dataset.originalHtml = el.innerHTML;
      }

      const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName?.toLowerCase();
            // Skip scripts, styles, code blocks
            if (["script", "style", "code", "pre", "kbd", "textarea", "input"].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            // Skip already-processed spans
            if (parent.dataset.bionicSpan) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      // Collect first to avoid live DOM mutation issues
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
        if (el.dataset.originalHtml !== undefined) {
          el.innerHTML = el.dataset.originalHtml;
        }
        delete el.dataset.originalHtml;
        delete el.dataset.bionicDone;
      });
    };

    const alreadyApplied = document.querySelector("[data-bionic-done]");

    if (alreadyApplied) {
      // Turn off
      revertBionic();
      if (bionicObserver) {
        bionicObserver.disconnect();
        bionicObserver = null;
      }
    } else {
      // Apply to current DOM
      document.querySelectorAll(BIONIC_SELECTORS).forEach(applyBionic);

      // MutationObserver for Angular/React dynamic content (IRCTC modals etc.)
      bionicObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            // Apply to the new node itself + its children
            if (node.matches && node.matches(BIONIC_SELECTORS)) {
              applyBionic(node);
            }
            node.querySelectorAll && node.querySelectorAll(BIONIC_SELECTORS).forEach(applyBionic);
          });
        });
      });

      bionicObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

});