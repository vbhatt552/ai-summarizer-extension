document.getElementById("summarize").addEventListener("click", () => {
  const resultDiv = document.getElementById("result");
  const summaryType = document.getElementById("summary-type").value;
  resultDiv.innerHTML = '<div class = "loader" style = "display:block;margin: 20px auto;"></div>';
  //getting users api key
  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      resultDiv.textContent = "No API key set.click the gear icon to add one.";
      return;
    }
    //ask Content.js for the page text
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_ARTICLE_TEXT" },
        async ({ text }) => {
          if (!text) {
            resultDiv.textContent = "Couldn't extract text from this page";
            return;
          }
          try {
            const summary = await getGeminiSummary(
              text,
              summaryType,
              geminiApiKey
            );
            resultDiv.textContent = summary;
          } catch (error) {
            resultDiv.textContent = "GEMINI ERROR:" + error.message;
          }
        }
      );
    });
  });
});
async function getGeminiSummary(rawText, type, apiKey) {
  const max = 20000;
  const text = rawText.length > max ? rawText.slice(0, max) + "..." : rawText;

  const promptMap = {
    brief: `summarize in 5-6 sentences:\n\n${text}`,
    detailed: `Give a detailed summary:\n\n${text}`,
    bullets: `Summarize in 8-9 bullet points (start each line with "-->"):\n\n${text}`,
  };
  const prompt = promptMap[type] || promptMap.brief;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

if(!res.ok){
    const {error}  = await res.json();
    throw new Error(error?.message||"Request failed");
}
const data = await res.json();
return data.candidates?.[0]?.content?.parts?.[0]?.text;

}
document.getElementById("Copy").addEventListener("click", () => {
  const resultText = document.getElementById("result").textContent;
  navigator.clipboard.writeText(resultText).then(() => {
    const copyBtn = document.getElementById("Copy");
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1500);
  });
});
