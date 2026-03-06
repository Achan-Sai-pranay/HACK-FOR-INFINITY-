let focusEnabled = false;
let overlay = null;

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

  const fontId = "dyslexic-font";

  if(!document.getElementById(fontId)){

    const link = document.createElement("link");
    link.id = fontId;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=OpenDyslexic&display=swap";

    document.head.appendChild(link);

    document.body.style.fontFamily = "'OpenDyslexic', Arial";

  } else {

    document.body.style.fontFamily = "";

    document.getElementById(fontId).remove();

  }

}

  let highlightEnabled = false;

if(request.action === "highlight"){

  const paragraphs = document.querySelectorAll("p");

  if(!highlightEnabled){

    paragraphs.forEach(p => {
      p.style.background = "rgba(255,255,0,0.2)";
    });

    highlightEnabled = true;

  } else {

    paragraphs.forEach(p => {
      p.style.background = "";
    });

    highlightEnabled = false;

  }

}

 if(request.action === "bionic"){

  const elements = document.querySelectorAll("article p, main p, p");

  elements.forEach(el => {

    // skip if already processed
    if(el.dataset.bionicApplied) return;

    let text = el.innerText;

    let words = text.split(" ");

    let modified = words.map(word => {

      if(word.length < 4) return word;

      let half = Math.ceil(word.length / 2);

      return "<b>" + word.slice(0, half) + "</b>" + word.slice(half);

    });

    el.innerHTML = modified.join(" ");

    // mark paragraph as processed
    el.dataset.bionicApplied = true;

  });

}

});