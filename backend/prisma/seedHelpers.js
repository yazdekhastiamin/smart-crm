// شماره تلفن نمونه‌ی قطعی (deterministic) برای مخاطبین دمو — فقط برای
// واقعی‌تر بودن دمو، نه داده‌ی واقعی.
export function samplePhoneFor(seed) {
  let hash = 0;
  for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) % 10000000;
  return `0912${String(hash).padStart(7, "0")}`;
}
