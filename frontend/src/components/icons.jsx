// آیکون‌های خطی خنثی (بدون رنگ ثابت، currentColor می‌گیرند) — برای هر
// کسب‌وکار B2B معنا دارند، نه فقط صنعت خاصی. بدون هیچ پیکتوگرام صنعتی.

const common = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconTrendUp(props) {
  return (
    <svg {...common} {...props}>
      <path d="M3 17l6-6 4 4 8-9" />
      <path d="M15 6h6v6" />
    </svg>
  );
}

export function IconNodes(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="5" cy="12" r="2.5" />
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <circle cx="19" cy="12" r="2.5" />
      <path d="M7.2 10.8 9.8 7.8M7.2 13.2l2.6 3M14.2 7.8l2.6 3M14.2 16.2l2.6-3" />
    </svg>
  );
}

export function IconTarget(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function IconClock(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  );
}

export function IconFlag(props) {
  return (
    <svg {...common} {...props}>
      <path d="M5 3v18" />
      <path d="M5 4.5c2-1.2 4-1.2 6 0s4 1.2 6 0v8c-2 1.2-4 1.2-6 0s-4-1.2-6 0z" />
    </svg>
  );
}
