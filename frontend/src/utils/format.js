export function formatToman(value) {
  return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
}

export function formatPercent(value) {
  return `${Math.round(value * 100)}٪`;
}
