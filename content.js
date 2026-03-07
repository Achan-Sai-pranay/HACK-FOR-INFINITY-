let focusEnabled = false;
let overlay = null;
let highlightEnabled = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

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


  if(request.action === "font"){

  const className = "neuro-dyslexia-font";

  if(!document.body.classList.contains(className)){

    const linkId = "dyslexic-font";

    if(!document.getElementById(linkId)){
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=OpenDyslexic&display=swap";
      document.head.appendChild(link);
    }

    document.body.classList.add(className);

  }
  else{

    document.body.classList.remove(className);

  }

}

  if(request.action === "highlight"){

  const elements = document.querySelectorAll(
"article p, main p, section p, div p, li"  );

  if(!highlightEnabled){

    elements.forEach(el => {
      el.style.backgroundColor = "rgba(255,255,0,0.25)";
    });

    highlightEnabled = true;

  } 
  else{

    elements.forEach(el => {
      el.style.backgroundColor = "";
    });

    highlightEnabled = false;

  }

}


 if (request.action === "bionic") {

  const elements = document.querySelectorAll(
    "p, li, span, a, h1, h2, h3, h4, h5, h6"
  );

  elements.forEach(el => {

    if (!el.dataset.originalHtml) {

      el.dataset.originalHtml = el.innerHTML;

      const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;

      while (node = walker.nextNode()) {

        const words = node.nodeValue.split(/(\s+)/);

        const newHTML = words.map(word => {

          if (word.trim().length < 4) return word;

          const half = Math.ceil(word.length / 2);

          return "<strong style='color:inherit'>" +
                 word.slice(0, half) +
                 "</strong>" +
                 word.slice(half);

        }).join("");

        const span = document.createElement("span");
        span.innerHTML = newHTML;

        node.replaceWith(span);

      }

    } else {

      el.innerHTML = el.dataset.originalHtml;
      delete el.dataset.originalHtml;

    }

  });

}

});