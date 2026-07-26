import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const localesDirectory = resolve("public/_locales");
const requiredKeys = [
  "extensionName",
  "extensionShortName",
  "extensionDescription",
  "actionTitle",
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
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Locale validation passed: ${localeNames.length} locales with complete Chrome metadata.`,
  );
}
