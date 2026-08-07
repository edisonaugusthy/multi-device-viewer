import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const localesDirectory = resolve("public/_locales");
const listingCopyPath = resolve("docs/chrome-web-store-listing-copy.md");
const expectedLocales = [
  "ar",
  "de",
  "en",
  "es",
  "fil",
  "fr",
  "hi",
  "it",
  "ja",
  "ko",
  "nl",
  "pt_BR",
  "ru",
  "vi",
  "zh_CN",
  "zh_TW",
];
const requiredKeys = [
  "extensionName",
  "extensionShortName",
  "extensionDescription",
  "actionTitle",
  "contextMenuTitle",
  "activeActionTitle",
];
const limits = {
  extensionName: 75,
  extensionShortName: 12,
  extensionDescription: 132,
};

const localeNames = (await readdir(localesDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const failures = [];
const listingCopy = await readFile(listingCopyPath, "utf8");

for (const locale of expectedLocales) {
  if (!localeNames.includes(locale)) {
    failures.push(`${locale}: missing locale directory`);
  }
  if (!listingCopy.includes(`## \`${locale}\``)) {
    failures.push(`${locale}: missing localized Chrome Web Store listing copy`);
  }
}

for (const locale of localeNames) {
  if (!expectedLocales.includes(locale)) {
    failures.push(`${locale}: locale directory is not in expectedLocales`);
  }
}

for (const locale of localeNames) {
  const file = resolve(localesDirectory, locale, "messages.json");
  let messages;

  try {
    messages = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    failures.push(`${locale}: invalid or missing messages.json (${error.message})`);
    continue;
  }

  for (const key of requiredKeys) {
    const message = messages[key]?.message;
    if (typeof message !== "string" || message.trim() === "") {
      failures.push(`${locale}: missing non-empty ${key}.message`);
      continue;
    }

    const limit = limits[key];
    if (limit && [...message].length > limit) {
      failures.push(
        `${locale}: ${key} is ${[...message].length} characters (limit ${limit})`,
      );
    }
  }

  for (const key of ["extensionName", "extensionDescription"]) {
    const message = messages[key]?.message;
    if (message && !listingCopy.includes(message)) {
      failures.push(`${locale}: ${key} does not match the localized Store copy`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Locale validation passed: ${localeNames.length} locales with complete Chrome metadata and Store copy.`,
  );
}
