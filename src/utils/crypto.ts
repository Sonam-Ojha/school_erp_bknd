import crypto from "crypto";

const APP_KEY = process.env.LARAVEL_CRYPTO_KEY;
if (!APP_KEY) throw new Error("Set LARAVEL_CRYPTO_KEY in .env");

// Remove base64: prefix if present
const keyRaw = APP_KEY.startsWith("base64:")
  ? Buffer.from(APP_KEY.replace("base64:", ""), "base64")
  : Buffer.from(APP_KEY);

// Laravel uses SHA256 of APP_KEY as key
const key = crypto.createHash("sha256").update(keyRaw).digest();

export const decryptText = (encrypted: string | null | undefined): string => {
  if (!encrypted) return "";

  try {
    // Step1: base64 decode DB value
    const decoded = Buffer.from(encrypted, "base64").toString("utf-8");

    // Step2: parse JSON
    const obj = JSON.parse(decoded);

    const iv = Buffer.from(obj.iv, "base64");
    const value = Buffer.from(obj.value, "base64");

    // Step3: AES-256-CBC decrypt
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(value);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf-8");
  } catch (err: any) {
    console.error("Decryption failed:", err.message);
    return encrypted || "";
  }
};
