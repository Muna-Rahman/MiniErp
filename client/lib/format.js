const fmt = new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

export const money = (n) => fmt.format(Number(n) || 0);
export const dateTime = (d) => new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
export const shortDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
