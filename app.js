import { decryptLetter } from "./crypto.js";

const UNLOCK_MS = Date.parse("2027-11-25T00:00:00Z");
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");

// Countdown uses the device clock: this is display only, not a security check.
function renderCountdown() {
  const total = Math.max(0, Math.floor((UNLOCK_MS - Date.now()) / 1000));
  $("d").textContent = Math.floor(total / 86400);
  $("h").textContent = pad(Math.floor((total % 86400) / 3600));
  $("m").textContent = pad(Math.floor((total % 3600) / 60));
  $("s").textContent = pad(total % 60);
}
renderCountdown();
setInterval(renderCountdown, 1000);

// Before the day, hide the passphrase box. This is a display gate only;
// the letter still needs the passphrase, which is never in this file.
function applyDateGate() {
  const open = Date.now() >= UNLOCK_MS;
  $("unlock-form").hidden = !open;
  $("locked-note").hidden = open;
}
applyDateGate();
setInterval(applyDateGate, 15000);

let blob = null;
fetch("letter.enc.json", { cache: "no-store" })
  .then((r) => r.json())
  .then((b) => { blob = b; })
  .catch(() => { $("error").textContent = "Could not load the letter. Please refresh."; $("error").hidden = false; });

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!blob) return;
  const btn = $("submit");
  btn.disabled = true;
  try {
    const text = await decryptLetter(blob, $("pw").value);
    $("letter-text").textContent = text; // textContent, never innerHTML
    $("unlock-form").hidden = true;
    $("error").hidden = true;
    $("letter-view").hidden = false;
    $("letter-view").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {
    $("error").hidden = false;
    $("pw").select();
  } finally {
    btn.disabled = false;
  }
});
