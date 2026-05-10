import { readFile } from "node:fs/promises";
import { validateChromeExtensionPackage } from "./validate-chrome-extension-package.mjs";

const {
  CHROME_CLIENT_ID,
  CHROME_CLIENT_SECRET,
  CHROME_REFRESH_TOKEN,
  CHROME_PUBLISHER_ID,
  CHROME_EXTENSION_ID,
  EXTENSION_ZIP,
  SUBMIT_FOR_REVIEW = "true"
} = process.env;

const required = {
  CHROME_CLIENT_ID,
  CHROME_CLIENT_SECRET,
  CHROME_REFRESH_TOKEN,
  CHROME_PUBLISHER_ID,
  CHROME_EXTENSION_ID,
  EXTENSION_ZIP
};

for (const [key, value] of Object.entries(required)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${url} failed with ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function getAccessToken() {
  const params = new URLSearchParams({
    client_id: CHROME_CLIENT_ID,
    client_secret: CHROME_CLIENT_SECRET,
    refresh_token: CHROME_REFRESH_TOKEN,
    grant_type: "refresh_token"
  });

  const token = await requestJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  if (!token.access_token) {
    throw new Error(`OAuth response did not include an access token: ${JSON.stringify(token)}`);
  }

  return token.access_token;
}

async function fetchStatus(accessToken) {
  return requestJson(
    `https://chromewebstore.googleapis.com/v2/publishers/${CHROME_PUBLISHER_ID}/items/${CHROME_EXTENSION_ID}:fetchStatus`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
}

async function waitForUpload(accessToken) {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const status = await fetchStatus(accessToken);
    const uploadState = status.item?.uploadState ?? status.uploadState;

    console.log(`Upload status attempt ${attempt}: ${uploadState ?? "unknown"}`);

    if (uploadState === "UPLOAD_SUCCESS") return status;
    if (uploadState === "UPLOAD_FAILED" || uploadState === "UPLOAD_STATE_UNSPECIFIED") {
      throw new Error(`Chrome Web Store upload failed: ${JSON.stringify(status)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }

  throw new Error("Timed out waiting for Chrome Web Store upload processing to finish.");
}

await validateChromeExtensionPackage(EXTENSION_ZIP);
const accessToken = await getAccessToken();
const zip = await readFile(EXTENSION_ZIP);

console.log(`Uploading ${EXTENSION_ZIP} to Chrome Web Store item ${CHROME_EXTENSION_ID}.`);
await requestJson(
  `https://chromewebstore.googleapis.com/upload/v2/publishers/${CHROME_PUBLISHER_ID}/items/${CHROME_EXTENSION_ID}:upload`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/zip"
    },
    body: zip
  }
);

await waitForUpload(accessToken);

if (SUBMIT_FOR_REVIEW === "true") {
  console.log("Submitting item for Chrome Web Store review.");
  await requestJson(
    `https://chromewebstore.googleapis.com/v2/publishers/${CHROME_PUBLISHER_ID}/items/${CHROME_EXTENSION_ID}:publish`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  console.log("Submitted for review. Chrome will publish after approval using the item's current visibility settings.");
} else {
  console.log("Upload complete. SUBMIT_FOR_REVIEW=false, so the item was not submitted for review.");
}
