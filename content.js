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
    "article p, main p, section p, div p, li, span"
  );

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


 if(request.action === "bionic"){

  const elements = document.querySelectorAll(
    "article p, main p, section p, div p, li"
  );

  elements.forEach(el => {

    if(!el.dataset.originalHtml){

      el.dataset.originalHtml = el.innerHTML;

      const text = el.innerText;

      const modified = text.replace(/\b(\w{2,})(\w*)\b/g, (match, first, rest) => {

        const half = Math.ceil(first.length / 2);

        return "<b>" + first.slice(0, half) + "</b>" + first.slice(half) + rest;

      });

      el.innerHTML = modified;

    }
    else{

      el.innerHTML = el.dataset.originalHtml;
      delete el.dataset.originalHtml;

    }

  });

}

});