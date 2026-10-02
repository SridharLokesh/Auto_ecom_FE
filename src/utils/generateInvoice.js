/**
 * generateInvoice.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Production-ready PDF invoice generator for TVS Parts e-commerce platform.
 * Uses jsPDF (already available via CDN / npm) — zero backend required.
 *
 * INSTALL (if not already in project):
 *   npm install jspdf
 *
 * USAGE (in ProfilePage.jsx):
 *   import { generateInvoice } from "../utils/generateInvoice";
 *   await generateInvoice(order, user);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { jsPDF } from "jspdf";

/* ── Brand constants ── */
const BRAND = {
  name:       "TVS Parts Hub",
  tagline:    "Genuine OEM Parts & Accessories",
  address:    "No. 12, Industrial Estate, Hosur Road, Bangalore – 560068, Karnataka",
  phone:      "+91 80 4567 8900",
  email:      "support@tvspartshub.in",
  website:    "www.tvspartshub.in",
  gstin:      "29AABCT1332L1ZX",
  cin:        "U51909KA2015PTC082345",
  pan:        "AABCT1332L",
  bankName:   "HDFC Bank Ltd.",
  bankAcc:    "50200012345678",
  bankIFSC:   "HDFC0001234",
  upi:        "tvspartshub@hdfcbank",
  logoText:   "TVS",                // Text-based logo fallback
};

/* ── Delivery partner commission rates ── */
const DELIVERY_PARTNERS = {
  "Delhivery":  { rate: 0.015, base: 45 },
  "Bluedart":   { rate: 0.018, base: 55 },
  "Xpressbees": { rate: 0.014, base: 40 },
  "DTDC":       { rate: 0.016, base: 42 },
  "Ekart":      { rate: 0.013, base: 38 },
};

/* ── Tax slabs (HSN-based, Indian GST) ── */
const GST_SLAB = 0.18;          // 18% — typical for auto parts (HSN 8714)
const CGST_RATE = GST_SLAB / 2; // 9%
const SGST_RATE = GST_SLAB / 2; // 9%
const IGST_RATE = GST_SLAB;     // 18% (inter-state)
const HSN_CODE = "8714";

/* ── Palette ── */
const C = {
  navy:      [10,  31,  68],
  red:       [222, 28,  14],
  lightBlue: [232, 240, 254],
  white:     [255, 255, 255],
  gray100:   [245, 245, 247],
  gray300:   [209, 213, 219],
  gray500:   [107, 114, 128],
  gray700:   [55,  65,  81],
  gray900:   [17,  24,  39],
  green:     [22,  163, 74],
  amber:     [217, 119, 6],
};

/* ── Helpers ── */
const rgb  = (arr) => ({ r: arr[0], g: arr[1], b: arr[2] });
const inr  = (n)   => `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct  = (n)   => `${(n * 100).toFixed(1)}%`;
const date = (d)   => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function pickDeliveryPartner(orderId = "") {
  const partners = Object.keys(DELIVERY_PARTNERS);
  const idx = orderId.charCodeAt(orderId.length - 1) % partners.length;
  return partners[idx];
}

function deriveFinancials(order) {
  const subtotalWithGST = order.itemsPrice || order.totalPrice || 0;
  const shippingCharges = order.shippingPrice ?? 0;
  const discountAmt     = order.discountAmount ?? 0;

  /* Back-calculate base price (price already includes GST in most Indian stores) */
  const baseAmount      = subtotalWithGST / (1 + GST_SLAB);
  const totalGST        = subtotalWithGST - baseAmount;

  /* For intra-state (Karnataka): CGST + SGST; else IGST */
  const isInterState    = false; // assume intra-state; toggle with user state detection
  const cgst            = isInterState ? 0 : totalGST * 0.5;
  const sgst            = isInterState ? 0 : totalGST * 0.5;
  const igst            = isInterState ? totalGST : 0;

  /* Delivery partner */
  const partnerKey      = pickDeliveryPartner(order._id);
  const partner         = DELIVERY_PARTNERS[partnerKey];
  const partnerComm     = partner.base + (subtotalWithGST * partner.rate);
  const partnerGST      = partnerComm * 0.18;
  const partnerTotal    = partnerComm + partnerGST;

  /* Platform fee */
  const platformFee     = subtotalWithGST * 0.02;   // 2% platform fee
  const platformGST     = platformFee * 0.18;

  const grandTotal      = (order.totalPrice || 0);

  return {
    baseAmount, totalGST, cgst, sgst, igst,
    shippingCharges, discountAmt,
    partnerKey, partnerComm, partnerGST, partnerTotal,
    platformFee, platformGST,
    grandTotal, isInterState,
  };
}

/* ════════════════════════════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════════════════════════════ */
export async function generateInvoice(order, user) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  let y = 0; // cursor

  /* ── Utility drawing functions ── */
  const setFont = (style = "normal", size = 10, colorArr = C.gray900) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...colorArr);
  };

  const fillRect = (x, fy, w, h, colorArr) => {
    doc.setFillColor(...colorArr);
    doc.rect(x, fy, w, h, "F");
  };

  const drawLine = (x1, ly, x2, colorArr = C.gray300, lw = 0.3) => {
    doc.setDrawColor(...colorArr);
    doc.setLineWidth(lw);
    doc.line(x1, ly, x2, ly);
  };

  const text = (str, x, ty, opts = {}) => {
    doc.text(String(str ?? ""), x, ty, opts);
  };

  const addNewPageIfNeeded = (neededHeight = 20) => {
    if (y + neededHeight > PAGE_H - 20) {
      doc.addPage();
      y = 18;
      drawPageHeader();
    }
  };

  /* ── Repeated page header (for multi-page) ── */
  const drawPageHeader = () => {
    fillRect(0, 0, PAGE_W, 8, C.navy);
    setFont("bold", 7, C.white);
    text(`${BRAND.name}  |  Invoice #${invoiceNo}`, MARGIN, 5.5);
    text("CONFIDENTIAL", PAGE_W - MARGIN, 5.5, { align: "right" });
  };

  /* ────────────────────────────────────────────────────────────────
     SECTION 1 — HEADER BANNER
  ─────────────────────────────────────────────────────────────────*/
  fillRect(0, 0, PAGE_W, 48, C.navy);

  /* Logo circle */
  doc.setFillColor(...C.red);
  doc.circle(MARGIN + 10, 20, 10, "F");
  setFont("bold", 11, C.white);
  text(BRAND.logoText, MARGIN + 10, 23.5, { align: "center" });

  /* Brand name & tagline */
  setFont("bold", 18, C.white);
  text(BRAND.name, MARGIN + 24, 17);
  setFont("normal", 8, [180, 200, 230]);
  text(BRAND.tagline, MARGIN + 24, 23);

  /* GSTIN badge */
  fillRect(MARGIN + 24, 27, 60, 6, [255, 255, 255, 30]);
  doc.setFillColor(255, 255, 255, 30);
  setFont("bold", 7, [200, 220, 255]);
  text(`GSTIN: ${BRAND.gstin}`, MARGIN + 26, 31.5);

  /* TAX INVOICE label (right side) */
  fillRect(PAGE_W - MARGIN - 44, 8, 44, 32, C.red);
  setFont("bold", 11, C.white);
  text("TAX INVOICE", PAGE_W - MARGIN - 22, 21, { align: "center" });
  setFont("normal", 7, [255, 200, 200]);
  text("ORIGINAL FOR RECIPIENT", PAGE_W - MARGIN - 22, 27, { align: "center" });

  y = 52;

  /* ────────────────────────────────────────────────────────────────
     SECTION 2 — INVOICE META + ADDRESSES (3 columns)
  ─────────────────────────────────────────────────────────────────*/
  fillRect(MARGIN, y, CONTENT_W, 44, C.gray100);
  doc.setDrawColor(...C.gray300);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y, CONTENT_W, 44);

  const invoiceNo = `TVSPH-${new Date().getFullYear()}-${order._id.slice(-8).toUpperCase()}`;
  const invoiceDate = date(order.deliveredAt || order.updatedAt || new Date());
  const orderDate   = date(order.createdAt);

  /* Col 1 — Invoice details */
  const c1x = MARGIN + 4;
  setFont("bold", 7, C.navy);
  text("INVOICE DETAILS", c1x, y + 7);
  drawLine(c1x, y + 9, c1x + 54, C.navy, 0.5);

  const metaRows = [
    ["Invoice No.",  invoiceNo],
    ["Invoice Date", invoiceDate],
    ["Order Date",   orderDate],
    ["Order ID",     `#${order._id.slice(-8).toUpperCase()}`],
    ["Payment",      order.paymentMethod || "Online"],
    ["Pay Status",   order.isPaid ? "PAID" : "PENDING"],
  ];
  metaRows.forEach(([label, val], i) => {
    const ry = y + 14 + i * 5;
    setFont("normal", 7, C.gray500);
    text(label, c1x, ry);
    setFont("bold", 7, i === 5 && !order.isPaid ? C.red : C.gray900);
    text(val, c1x + 28, ry);
  });

  /* Divider */
  doc.setDrawColor(...C.gray300);
  doc.setLineWidth(0.3);
  doc.line(MARGIN + 64, y + 4, MARGIN + 64, y + 40);

  /* Col 2 — Billed To */
  const c2x = MARGIN + 68;
  setFont("bold", 7, C.navy);
  text("BILLED TO", c2x, y + 7);
  drawLine(c2x, y + 9, c2x + 58, C.navy, 0.5);

  const shippingAddr = order.shippingAddress || {};
  setFont("bold", 8, C.gray900);
  text(user?.name || "Customer", c2x, y + 14);
  setFont("normal", 7, C.gray700);
  const addrLines = [
    shippingAddr.street || shippingAddr.address || "",
    [shippingAddr.city, shippingAddr.state].filter(Boolean).join(", "),
    shippingAddr.pincode ? `Pincode: ${shippingAddr.pincode}` : "",
    user?.phone ? `Ph: ${user.phone}` : "",
    user?.email || "",
  ].filter(Boolean);
  addrLines.forEach((line, i) => text(line, c2x, y + 20 + i * 4.5));

  /* Divider */
  doc.line(MARGIN + 130, y + 4, MARGIN + 130, y + 40);

  /* Col 3 — Shipped From */
  const c3x = MARGIN + 134;
  setFont("bold", 7, C.navy);
  text("SHIPPED FROM", c3x, y + 7);
  drawLine(c3x, y + 9, c3x + 46, C.navy, 0.5);

  setFont("bold", 8, C.gray900);
  text(BRAND.name, c3x, y + 14);
  setFont("normal", 7, C.gray700);
  const brandLines = doc.splitTextToSize(BRAND.address, 44);
  brandLines.forEach((line, i) => text(line, c3x, y + 20 + i * 4.5));
  text(`Ph: ${BRAND.phone}`, c3x, y + 35);
  text(BRAND.email, c3x, y + 40);

  y += 52;

  /* ────────────────────────────────────────────────────────────────
     SECTION 3 — ITEMS TABLE
  ─────────────────────────────────────────────────────────────────*/
  addNewPageIfNeeded(60);

  /* Table header */
  fillRect(MARGIN, y, CONTENT_W, 8, C.navy);
  setFont("bold", 7.5, C.white);
  const cols = {
    sno:      { x: MARGIN + 3,   w: 8,  label: "#",          align: "left" },
    desc:     { x: MARGIN + 12,  w: 60, label: "DESCRIPTION", align: "left" },
    hsn:      { x: MARGIN + 74,  w: 16, label: "HSN",         align: "center" },
    qty:      { x: MARGIN + 92,  w: 10, label: "QTY",         align: "center" },
    unit:     { x: MARGIN + 104, w: 22, label: "UNIT PRICE",  align: "right" },
    taxable:  { x: MARGIN + 128, w: 22, label: "TAXABLE AMT", align: "right" },
    gst:      { x: MARGIN + 152, w: 16, label: "GST 18%",     align: "right" },
    total:    { x: MARGIN + 170, w: 26, label: "TOTAL",        align: "right" },
  };

  Object.values(cols).forEach(({ x, label, align, w }) => {
    text(label, align === "right" ? x + w : align === "center" ? x + w / 2 : x,
      y + 5.5, { align });
  });

  y += 8;

  /* Table rows */
  let grandTaxable = 0;
  let grandGST     = 0;
  let grandItems   = 0;

  (order.orderItems || []).forEach((item, idx) => {
    addNewPageIfNeeded(12);
    const rowBg = idx % 2 === 0 ? C.white : [249, 250, 251];
    fillRect(MARGIN, y, CONTENT_W, 10, rowBg);

    const unitPrice    = item.price || 0;
    const qty          = item.quantity || 1;
    const lineTotal    = unitPrice * qty;
    const taxableAmt   = lineTotal / (1 + GST_SLAB);
    const gstAmt       = lineTotal - taxableAmt;

    grandTaxable += taxableAmt;
    grandGST     += gstAmt;
    grandItems   += lineTotal;

    setFont("normal", 7, C.gray700);
    text(`${idx + 1}`, cols.sno.x, y + 6.5);

    /* Product name (wrap if needed) */
    const nameLines = doc.splitTextToSize(item.title || "Product", cols.desc.w - 2);
    setFont("normal", 7.5, C.gray900);
    text(nameLines[0], cols.desc.x, y + 6.5);
    if (nameLines[1]) {
      setFont("normal", 6.5, C.gray500);
      text(nameLines[1], cols.desc.x, y + 10);
    }

    setFont("normal", 7, C.gray700);
    text(HSN_CODE,                      cols.hsn.x  + cols.hsn.w / 2, y + 6.5, { align: "center" });
    text(`${qty}`,                      cols.qty.x  + cols.qty.w / 2, y + 6.5, { align: "center" });

    setFont("normal", 7.5, C.gray900);
    text(inr(unitPrice),                cols.unit.x    + cols.unit.w,    y + 6.5, { align: "right" });
    text(inr(taxableAmt),               cols.taxable.x + cols.taxable.w, y + 6.5, { align: "right" });

    setFont("normal", 7, C.gray700);
    text(inr(gstAmt),                   cols.gst.x   + cols.gst.w,   y + 6.5, { align: "right" });

    setFont("bold", 7.5, C.gray900);
    text(inr(lineTotal),                cols.total.x + cols.total.w, y + 6.5, { align: "right" });

    drawLine(MARGIN, y + 10, MARGIN + CONTENT_W, C.gray300, 0.2);
    y += 10;
  });

  /* Table footer line */
  drawLine(MARGIN, y, MARGIN + CONTENT_W, C.navy, 0.5);
  y += 4;

  /* ────────────────────────────────────────────────────────────────
     SECTION 4 — FINANCIAL BREAKDOWN (right-aligned summary)
  ─────────────────────────────────────────────────────────────────*/
  addNewPageIfNeeded(80);

  const fin = deriveFinancials(order);
  const summaryX = PAGE_W - MARGIN - 80;
  const summaryW = 80;

  /* Left side — GST breakdown table */
  const gstTableX = MARGIN;
  const gstTableW = 90;
  fillRect(gstTableX, y, gstTableW, 7, C.navy);
  setFont("bold", 7, C.white);
  text("GST SUMMARY",       gstTableX + 4,           y + 5);
  text("TAXABLE",           gstTableX + 32,           y + 5, { align: "center" });
  text(fin.isInterState ? "IGST 18%" : "CGST 9%",
                             gstTableX + 60,           y + 5, { align: "center" });
  text(fin.isInterState ? "" : "SGST 9%",
                             gstTableX + 80,           y + 5, { align: "center" });
  y += 7;

  const gstRows = fin.isInterState
    ? [["Auto Parts (8714)", grandTaxable, 0, fin.totalGST]]
    : [["Auto Parts (8714)", grandTaxable, fin.cgst, fin.sgst]];

  gstRows.forEach(([desc, taxable, cgstVal, sgstVal], i) => {
    fillRect(gstTableX, y, gstTableW, 7, i % 2 === 0 ? C.white : C.gray100);
    setFont("normal", 7, C.gray700);
    text(desc,         gstTableX + 4,  y + 5);
    text(inr(taxable), gstTableX + 32, y + 5, { align: "center" });
    setFont("bold", 7, C.gray900);
    text(inr(cgstVal), gstTableX + 60, y + 5, { align: "center" });
    text(inr(sgstVal), gstTableX + 80, y + 5, { align: "center" });
    drawLine(gstTableX, y + 7, gstTableX + gstTableW, C.gray300, 0.2);
    y += 7;
  });

  /* Total row */
  fillRect(gstTableX, y, gstTableW, 7, C.lightBlue);
  setFont("bold", 7, C.navy);
  text("Total GST",              gstTableX + 4,  y + 5);
  text(inr(grandTaxable),        gstTableX + 32, y + 5, { align: "center" });
  text(inr(fin.cgst || fin.igst/2), gstTableX + 60, y + 5, { align: "center" });
  text(inr(fin.sgst || fin.igst/2), gstTableX + 80, y + 5, { align: "center" });
  y += 10;

  /* Delivery partner & platform fees section */
  addNewPageIfNeeded(50);

  fillRect(gstTableX, y, gstTableW, 7, [240, 244, 248]);
  setFont("bold", 7, C.navy);
  text("FEES & COMMISSIONS", gstTableX + 4, y + 5);
  y += 7;

  const feeRows = [
    [`Delivery Partner (${fin.partnerKey})`, inr(fin.partnerComm), `GST 18%: ${inr(fin.partnerGST)}`],
    ["Platform Service Fee (2%)",             inr(fin.platformFee),  `GST 18%: ${inr(fin.platformGST)}`],
  ];
  feeRows.forEach(([label, amt, gstNote], i) => {
    fillRect(gstTableX, y, gstTableW, 10, i % 2 === 0 ? C.white : C.gray100);
    setFont("normal", 7.5, C.gray800);
    text(label, gstTableX + 4, y + 5);
    setFont("bold", 7.5, C.gray900);
    text(amt, gstTableX + gstTableW - 4, y + 5, { align: "right" });
    setFont("normal", 6.5, C.gray500);
    text(gstNote, gstTableX + 4, y + 9);
    drawLine(gstTableX, y + 10, gstTableX + gstTableW, C.gray300, 0.2);
    y += 10;
  });

  /* Right side summary — position relative to where y was before left column */
  /* We need to re-sync y. Let's draw summary at fixed positions. */
  const summaryStartY = y - (7 + 7 + gstRows.length * 7 + 10 + 7 + feeRows.length * 10) - 4;
  let sy = summaryStartY;

  fillRect(summaryX, sy, summaryW, CONTENT_W > 100 ? 90 : 80, C.gray100);
  doc.setDrawColor(...C.gray300);
  doc.setLineWidth(0.3);
  doc.rect(summaryX, sy, summaryW, 90);

  setFont("bold", 8, C.navy);
  text("AMOUNT SUMMARY", summaryX + summaryW / 2, sy + 7, { align: "center" });
  drawLine(summaryX + 4, sy + 9, summaryX + summaryW - 4, C.navy, 0.5);
  sy += 13;

  const summaryRows = [
    ["Subtotal (excl. GST)",  inr(grandTaxable),    false],
    [fin.isInterState ? "IGST @ 18%" : "CGST @ 9%",
                               inr(fin.isInterState ? fin.igst : fin.cgst), false],
    ...(fin.isInterState ? [] : [["SGST @ 9%", inr(fin.sgst), false]]),
    ["Shipping Charges",       inr(fin.shippingCharges), false],
    ...(fin.discountAmt > 0 ? [["Discount", `-${inr(fin.discountAmt)}`, false]] : []),
    ["Platform Fee (2%)",      inr(fin.platformFee), false],
  ];

  summaryRows.forEach(([label, val]) => {
    setFont("normal", 7.5, C.gray700);
    text(label, summaryX + 4, sy + 5);
    setFont("normal", 7.5, C.gray900);
    text(val, summaryX + summaryW - 4, sy + 5, { align: "right" });
    drawLine(summaryX + 4, sy + 7, summaryX + summaryW - 4, C.gray300, 0.2);
    sy += 7;
  });

  /* Grand total */
  fillRect(summaryX, sy + 2, summaryW, 12, C.navy);
  setFont("bold", 8, C.white);
  text("GRAND TOTAL", summaryX + 4, sy + 10);
  setFont("bold", 10, C.white);
  text(inr(fin.grandTotal), summaryX + summaryW - 4, sy + 10, { align: "right" });

  sy += 16;
  if (order.isPaid) {
    fillRect(summaryX, sy, summaryW, 8, [220, 252, 231]);
    setFont("bold", 8, C.green);
    text("✓ PAYMENT RECEIVED", summaryX + summaryW / 2, sy + 5.5, { align: "center" });
    sy += 8;
  }

  y = Math.max(y, sy) + 6;

  /* ────────────────────────────────────────────────────────────────
     SECTION 5 — PAYMENT DETAILS
  ─────────────────────────────────────────────────────────────────*/
  addNewPageIfNeeded(40);

  fillRect(MARGIN, y, CONTENT_W, 7, C.navy);
  setFont("bold", 8, C.white);
  text("PAYMENT INFORMATION", MARGIN + 4, y + 5);
  y += 7;

  fillRect(MARGIN, y, CONTENT_W, 26, C.white);
  doc.setDrawColor(...C.gray300);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y, CONTENT_W, 26);

  const paymentMethod = order.paymentMethod || "Online";
  const payLeft  = MARGIN + 4;
  const payMid   = MARGIN + 62;
  const payRight = MARGIN + 120;

  setFont("bold", 7, C.navy);
  text("Payment Method",  payLeft, y + 7);
  text("Bank Account",    payMid,  y + 7);
  text("UPI / QR Pay",   payRight, y + 7);

  setFont("normal", 8, C.gray900);
  text(paymentMethod, payLeft, y + 13);
  if (order.paidAt) {
    setFont("normal", 7, C.gray500);
    text(`Paid on: ${date(order.paidAt)}`, payLeft, y + 18);
  }

  setFont("normal", 7, C.gray700);
  text(`Bank: ${BRAND.bankName}`,    payMid, y + 13);
  text(`A/C: ${BRAND.bankAcc}`,      payMid, y + 18);
  text(`IFSC: ${BRAND.bankIFSC}`,    payMid, y + 23);

  setFont("bold", 8, C.navy);
  text(BRAND.upi, payRight, y + 13);
  setFont("normal", 7, C.gray500);
  text("Scan QR or pay via UPI apps", payRight, y + 18);

  y += 32;

  /* ────────────────────────────────────────────────────────────────
     SECTION 6 — DELIVERY PARTNER DETAILS
  ─────────────────────────────────────────────────────────────────*/
  addNewPageIfNeeded(30);

  fillRect(MARGIN, y, CONTENT_W, 7, [240, 244, 248]);
  setFont("bold", 7.5, C.navy);
  text("DELIVERY PARTNER DETAILS", MARGIN + 4, y + 5);
  y += 7;

  fillRect(MARGIN, y, CONTENT_W, 22, C.white);
  doc.rect(MARGIN, y, CONTENT_W, 22);

  const partner = DELIVERY_PARTNERS[fin.partnerKey];
  const dpCols = [
    ["Partner Name",     fin.partnerKey],
    ["Delivery Charges", inr(fin.shippingCharges)],
    ["Partner Commission (base)", inr(partner.base)],
    ["Commission (variable)",     `${pct(partner.rate)} = ${inr(fin.partnerComm - partner.base)}`],
    ["GST on Commission (18%)",   inr(fin.partnerGST)],
    ["Total Payable to Partner",  inr(fin.partnerTotal)],
  ];

  const dpColW = CONTENT_W / 3;
  dpCols.forEach(([label, val], i) => {
    const cx = MARGIN + (i % 3) * dpColW + 4;
    const cy = y + Math.floor(i / 3) * 10 + 7;
    setFont("normal", 6.5, C.gray500);
    text(label, cx, cy);
    setFont("bold", 7.5, C.gray900);
    text(val, cx, cy + 5);
  });

  y += 28;

  /* ────────────────────────────────────────────────────────────────
     SECTION 7 — RETURN POLICY
  ─────────────────────────────────────────────────────────────────*/
  addNewPageIfNeeded(38);

  fillRect(MARGIN, y, CONTENT_W, 34, [255, 248, 248]);
  doc.setDrawColor(...C.red);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN, y + 34);
  doc.setLineWidth(0.3);
  doc.setDrawColor(...C.gray300);
  doc.rect(MARGIN, y, CONTENT_W, 34);

  setFont("bold", 8, C.red);
  text("7-DAY RETURN POLICY", MARGIN + 4, y + 7);

  setFont("normal", 7, C.gray700);
  const policyText = [
    "• Returns accepted within 7 days of delivery for unused, undamaged items in original packaging.",
    "• To initiate a return, log into your account and select 'Return Order' from Order Details.",
    "• Pickup will be arranged within 2–3 business days after approval.",
    "• Refund will be credited to original payment method within 5–7 business days after pickup.",
    "• Items damaged due to improper installation, wear & tear, or modification are NOT eligible for return.",
    "• For disputes or queries, contact us at support@tvspartshub.in or call +91 80 4567 8900.",
  ];
  policyText.forEach((line, i) => text(line, MARGIN + 4, y + 14 + i * 3.8));

  y += 38;

  /* ────────────────────────────────────────────────────────────────
     SECTION 8 — TERMS & FOOTER
  ─────────────────────────────────────────────────────────────────*/
  addNewPageIfNeeded(30);
  y += 2;

  setFont("bold", 7, C.gray500);
  text("TERMS & CONDITIONS", MARGIN, y + 5);
  drawLine(MARGIN, y + 7, MARGIN + CONTENT_W, C.gray300, 0.3);

  setFont("normal", 6.5, C.gray500);
  const terms = [
    "1. This is a computer-generated invoice and does not require a physical signature.",
    "2. All prices are inclusive of GST as applicable. HSN Code 8714 applies to auto parts.",
    "3. Warranty claims are subject to manufacturer's terms. TVS Parts Hub acts only as a marketplace.",
    "4. Disputes are subject to the exclusive jurisdiction of courts in Bangalore, Karnataka.",
    "5. CIN: " + BRAND.cin + "   |   PAN: " + BRAND.pan,
  ];
  terms.forEach((t, i) => text(t, MARGIN, y + 12 + i * 4));

  y += 35;

  /* Footer band */
  fillRect(0, PAGE_H - 14, PAGE_W, 14, C.navy);
  setFont("normal", 7, [180, 200, 230]);
  text(`${BRAND.name}  |  ${BRAND.website}  |  ${BRAND.phone}  |  ${BRAND.email}`, PAGE_W / 2, PAGE_H - 6, { align: "center" });

  /* Page numbers */
  const totalPages = doc.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    setFont("normal", 6.5, [180, 200, 230]);
    doc.text(`Page ${pg} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 6, { align: "right" });
  }

  /* ── Save ── */
  doc.save(`Invoice_${invoiceNo}.pdf`);
}