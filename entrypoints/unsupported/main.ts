const localizedText = (key: string, fallback: string) =>
  chrome.i18n.getMessage(key) || fallback;

document.documentElement.lang = chrome.i18n.getUILanguage().split("-")[0] || "en";
document.title = localizedText("unsupportedActionTitle", "Open a website first");

const copy: Record<string, string> = {
  title: localizedText("unsupportedActionTitle", "Open a website first"),
  hint: localizedText(
    "unsupportedUrlHint",
    "Switch to the page you’re developing, then click the extension again.",
  ),
};

for (const [id, value] of Object.entries(copy)) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}
