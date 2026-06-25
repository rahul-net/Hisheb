import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import {
  dueOf,
  formatDate,
  formatMoney,
  paidOf,
  statusLabel,
  statusOf,
  toBnDigits,
  type BudgetState,
} from "./budget-store";

function buildReportHtml(state: BudgetState) {
  const paid = state.expenses.reduce((s, e) => s + paidOf(e), 0);
  const due = state.expenses.reduce((s, e) => s + dueOf(e), 0);
  const remaining = (state.totalBudget || 0) - paid;
  const generated = toBnDigits(
    new Date().toLocaleString("bn-BD", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  );

  const summary = [
    { label: "মোট বাজেট", value: formatMoney(state.totalBudget), color: "#6366f1" },
    { label: "মোট পরিশোধিত", value: formatMoney(paid), color: "#10b981" },
    { label: "মোট বকেয়া", value: formatMoney(due), color: "#ef4444" },
    { label: "অবশিষ্ট বাজেট", value: formatMoney(remaining), color: "#3b82f6" },
  ]
    .map(
      (c) => `
    <div style="flex:1;background:${c.color};color:#fff;border-radius:12px;padding:14px 16px;min-width:0;">
      <div style="font-size:12px;opacity:.85;">${c.label}</div>
      <div style="font-size:20px;font-weight:800;margin-top:4px;">${c.value}</div>
    </div>`,
    )
    .join("");

  const rows = state.expenses
    .map((e, i) => {
      const st = statusOf(e);
      const color = st === "paid" ? "#10b981" : st === "partial" ? "#f59e0b" : "#ef4444";
      return `<tr>
        <td style="padding:9px;border-bottom:1px solid #e5e7eb;text-align:center;">${toBnDigits(i + 1)}</td>
        <td style="padding:9px;border-bottom:1px solid #e5e7eb;">${escapeHtml(e.name)}</td>
        <td style="padding:9px;border-bottom:1px solid #e5e7eb;">${e.type === "full" ? "সম্পূর্ণ" : "অগ্রিম"}</td>
        <td style="padding:9px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(e.totalAmount)}</td>
        <td style="padding:9px;border-bottom:1px solid #e5e7eb;text-align:right;color:#059669;">${formatMoney(paidOf(e))}</td>
        <td style="padding:9px;border-bottom:1px solid #e5e7eb;text-align:right;color:#dc2626;">${formatMoney(dueOf(e))}</td>
        <td style="padding:9px;border-bottom:1px solid #e5e7eb;text-align:center;">
          <span style="background:${color};color:#fff;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;">${statusLabel(st)}</span>
        </td>
      </tr>`;
    })
    .join("");

  const historySections = state.expenses
    .filter((e) => e.payments.length > 0)
    .map((e) => {
      const items = [...e.payments]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(
          (p, i) => `<tr>
            <td style="padding:7px;border-bottom:1px solid #eef2f7;text-align:center;">${toBnDigits(i + 1)}</td>
            <td style="padding:7px;border-bottom:1px solid #eef2f7;">${formatDate(p.date)}</td>
            <td style="padding:7px;border-bottom:1px solid #eef2f7;text-align:right;">${formatMoney(p.amount)}</td>
            <td style="padding:7px;border-bottom:1px solid #eef2f7;">${escapeHtml(p.note || "—")}</td>
          </tr>`,
        )
        .join("");
      return `<div style="margin-top:18px;">
        <div style="font-weight:700;font-size:14px;color:#1e1e3a;margin-bottom:6px;">পেমেন্ট হিস্টোরি — ${escapeHtml(e.name)}</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;background:#f9fafb;border-radius:8px;overflow:hidden;">
          <thead><tr style="background:#6366f1;color:#fff;">
            <th style="padding:8px;text-align:center;">ক্রম</th>
            <th style="padding:8px;text-align:left;">তারিখ</th>
            <th style="padding:8px;text-align:right;">পরিমাণ</th>
            <th style="padding:8px;text-align:left;">নোট</th>
          </tr></thead>
          <tbody>${items}</tbody>
        </table>
      </div>`;
    })
    .join("");

  return `
  <div style="width:794px;padding:36px;background:#fff;color:#111827;font-family:'Hind Siliguri','Noto Sans Bengali',sans-serif;box-sizing:border-box;">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:14px;padding:22px 24px;display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <div style="font-size:13px;opacity:.85;letter-spacing:2px;text-transform:uppercase;">বাজেট মাস্টার</div>
        <div style="font-size:26px;font-weight:800;margin-top:4px;">${escapeHtml(state.projectName || "প্রজেক্ট রিপোর্ট")}</div>
      </div>
      <div style="text-align:right;font-size:12px;opacity:.9;">
        <div>রিপোর্ট তৈরি</div>
        <div style="font-weight:700;margin-top:2px;">${generated}</div>
      </div>
    </div>

    <div style="display:flex;gap:10px;margin-top:18px;">${summary}</div>

    <div style="margin-top:22px;font-weight:700;font-size:16px;color:#1e1e3a;">খরচের তালিকা</div>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;">
      <thead>
        <tr style="background:#1e1e3a;color:#fff;">
          <th style="padding:10px;text-align:center;">ক্রম</th>
          <th style="padding:10px;text-align:left;">খরচের নাম</th>
          <th style="padding:10px;text-align:left;">ধরন</th>
          <th style="padding:10px;text-align:right;">মোট</th>
          <th style="padding:10px;text-align:right;">পরিশোধিত</th>
          <th style="padding:10px;text-align:right;">বকেয়া</th>
          <th style="padding:10px;text-align:center;">স্ট্যাটাস</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="7" style="padding:18px;text-align:center;color:#6b7280;">কোনো খরচ যোগ করা হয়নি</td></tr>`}</tbody>
    </table>

    ${historySections}

    <div style="margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#6b7280;">
      বাজেট মাস্টার · ব্যক্তিগত বাজেট ও খরচ ব্যবস্থাপনা
    </div>
  </div>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]!,
  );
}

export async function generatePdfReport(state: BudgetState) {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.innerHTML = buildReportHtml(state);
  document.body.appendChild(host);

  // Allow Bangla webfont to settle
  try {
    const f = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (f?.ready) await f.ready;
  } catch {
    /* noop */
  }

  try {
    const node = host.firstElementChild as HTMLElement;
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;
    const data = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(data, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(data, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }

    const safe = (state.projectName || "budget-report").replace(/[^\p{L}\p{N}_-]+/gu, "_");
    pdf.save(`${safe}-বাজেট-রিপোর্ট.pdf`);
  } finally {
    document.body.removeChild(host);
  }
}