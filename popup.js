document.getElementById("focusMode").addEventListener("click", () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "focus"});
  });
});

document.getElementById("dyslexiaFont").addEventListener("click", () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "font"});
  });
});

document.getElementById("highlightLines").addEventListener("click", () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "highlight"});
  });
});