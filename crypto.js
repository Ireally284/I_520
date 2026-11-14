// Shared by the browser page and the Node tests.
// PBKDF2-SHA256 derives an AES-256-GCM key from the password.
// The file letter.enc.json holds only salt, iv and ciphertext.

const ITER = 600000;

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function bytesToB64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

async function deriveKey(password, salt, iterations) {
  const base = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptLetter(plainText, password, iterations = ITER) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, iterations);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plainText))
  );
  return {
    v: 1,
    kdf: "PBKDF2-SHA256",
    iter: iterations,
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    ct: bytesToB64(ct),
  };
}

// Throws if the password is wrong (AES-GCM authentication fails).
export async function decryptLetter(blob, password) {
  const key = await deriveKey(password, b64ToBytes(blob.salt), blob.iter);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(blob.iv) },
    key,
    b64ToBytes(blob.ct)
  );
  return dec.decode(pt);
}
