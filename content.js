chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if(request.action === "focus"){
    document.body.style.backgroundColor = "#fdf6e3";
    document.body.style.lineHeight = "1.8";
  }

  if(request.action === "font"){
    document.body.style.fontFamily = "OpenDyslexic, Arial";
  }

  if(request.action === "highlight"){
    let paragraphs = document.querySelectorAll("p");

    paragraphs.forEach(p => {
      p.style.background = "rgba(255,255,0,0.2)";
    });
  }

});