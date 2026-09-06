// توکن‌های رنگی این صفحه دقیقاً از طراحی اصلی (Claude Design canvas) کپی
// شده‌اند — مستقل از سیستم رنگ عمومی برنامه (index.css)، چون طراحی درخواستی
// یک پالت کاملاً متفاوت (کرم/زرشکی گرم برای روشن، سرمه‌ای برای تاریک) دارد.
export const LIGHT = {
  vars: {
    "--bg": "#FBF9F5", "--card": "#EEECE8", "--card2": "#FFFFFF", "--ink": "#1F3A5F",
    "--ink2": "#3C5876", "--muted": "#6B7E96", "--faint": "#8A9AB0", "--dim": "#A8B3C2",
    "--line": "#DDD9D2", "--line2": "#E7E3DC", "--track": "#D9D5CE", "--track2": "#E4E0D9",
    "--accent": "#E08A5B", "--accentDeep": "#C9622F", "--pos": "#2E9E6B", "--posBg": "#E8F1EA",
    "--posBorder": "#B9D6C4", "--posInk": "#2F5A45", "--sel": "#E3DFD8", "--over": "#E6E1D8",
  },
  ramp: ["#E4E0D9", "#F2D4BE", "#EEB894", "#E4966A", "#D6743F", "#B9531F"],
  grid: "#D9D5CE", pos: "#2E9E6B", mapEdge: "#FBF9F5", sel: "#1F3A5F", hover: "#6B7E96",
  lab: "#1F3A5F", labDim: "#8A9AB0", val: "#3C5876", valDim: "#A8B3C2", barA: "#E08A5B", barB: "#C9622F",
};

export const DARK = {
  vars: {
    "--bg": "#0F1216", "--card": "#171B21", "--card2": "#1D222A", "--ink": "#E8EDF4",
    "--ink2": "#B4C0CE", "--muted": "#93A1B2", "--faint": "#75839A", "--dim": "#5D6B7E",
    "--line": "#262C35", "--line2": "#222831", "--track": "#2A313B", "--track2": "#2A313B",
    "--accent": "#E8955F", "--accentDeep": "#F0A472", "--pos": "#3FBF86", "--posBg": "#14251D",
    "--posBorder": "#23553C", "--posInk": "#8FD3AF", "--sel": "#232A33", "--over": "#1E242C",
  },
  ramp: ["#232A33", "#3A2C25", "#5A3A26", "#8A4F2B", "#BC6B33", "#E8955F"],
  grid: "#262C35", pos: "#3FBF86", mapEdge: "#0F1216", sel: "#E8EDF4", hover: "#93A1B2",
  lab: "#E8EDF4", labDim: "#75839A", val: "#B4C0CE", valDim: "#5D6B7E", barA: "#E8955F", barB: "#F0A472",
};

export function varsToStyle(vars) {
  return Object.fromEntries(Object.entries(vars));
}
