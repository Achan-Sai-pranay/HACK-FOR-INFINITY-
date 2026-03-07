document.addEventListener("DOMContentLoaded", function () {

  // ─────────────────────────────────────────────
  // PREFILL API KEY
  // ─────────────────────────────────────────────
  chrome.storage.local.get(["openaiKey"], function(result) {
    if (result.openaiKey) {
      document.getElementById("apiKey").value = result.openaiKey;
    }
  });

  // ─────────────────────────────────────────────
  // TOGGLE READING MODES
  // ─────────────────────────────────────────────
  function send(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        console.log("No active tab found");
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { action: action });
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

  // ─────────────────────────────────────────────
  // AI SUMMARIZER
  // ─────────────────────────────────────────────
  document.getElementById("summarizeBtn").addEventListener("click", async () => {

    const apiKey = document.getElementById("apiKey").value.trim();
    chrome.storage.local.set({ openaiKey: apiKey });

    if (!apiKey) {
      document.getElementById("summaryBox").innerText = "Please enter OpenAI API key.";
      return;
    }

    document.getElementById("summaryBox").innerText = "Reading page...";

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "extractText" },
        function (response) {

          if (!response || !response.text) {
            document.getElementById("summaryBox").innerText = "Could not read page.";
            return;
          }

          const pageText = response.text.slice(0, 8000);

          document.getElementById("summaryBox").innerText = "Summarizing with AI...";

          chrome.runtime.sendMessage(
            { action: "callOpenAI", apiKey: apiKey, pageText: pageText },
            function (response) {

              if (!response || !response.success) {
                document.getElementById("summaryBox").innerText = "AI request failed: " + (response?.error || "Unknown error");
                return;
              }

              const data = response.data;

              if (data.error) {
                document.getElementById("summaryBox").innerText = "API error: " + data.error.message;
                return;
              }

              const summary = data.choices[0].message.content;
              document.getElementById("summaryBox").innerText = summary;

            }
          );

        }
      );

    });

  });

});