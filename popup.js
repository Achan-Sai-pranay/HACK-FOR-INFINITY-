document.addEventListener("DOMContentLoaded", function () {

  function send(action) {

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

      chrome.tabs.sendMessage(tabs[0].id, {
        action: action
      });

    });

  }

  document.getElementById("focusMode")
    .addEventListener("change", () => send("focus"));

  document.getElementById("dyslexiaFont")
    .addEventListener("change", () => send("font"));

  document.getElementById("highlightLines")
    .addEventListener("change", () => send("highlight"));

  document.getElementById("bionicReading")
    .addEventListener("change", () => send("bionic"));

});