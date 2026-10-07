import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

type InvoicePdfInput = {
  invoiceNo: string;
  createdAt: Date;
  issueDate: Date | null;
  dueDate: Date | null;
  notes: string | null;
  subtotal: unknown;
  discount: unknown;
  tax: unknown;
  total: unknown;

  customer: {
    customerNo: string;
    companyName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    address: string | null;
    vatId: string | null;
  };

  event: {
    eventNo: string;
    name: string;
  } | null;

  quote: {
    quoteNo: string;
  } | null;

  items: Array<{
    type: string;
    description: string;
    quantity: unknown;
    unitPrice: unknown;
    discount: unknown;
    total: unknown;
  }>;
};

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
}

function formatDate(value: Date | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("de-DE").format(value);
}

function customerName(
  customer: InvoicePdfInput["customer"],
) {
  return (
    customer.companyName ||
    [customer.firstName, customer.lastName]
      .filter(Boolean)
      .join(" ") ||
    "—"
  );
}

function safeText(value: string) {
  return value
    .replace(/€/g, "EUR")
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
) {
  const words = safeText(text).split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine
      ? `${currentLine} ${word}`
      : word;

    const width = font.widthOfTextAtSize(
      testLine,
      fontSize,
    );

    if (width <= maxWidth) {
      currentLine = testLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawWrappedText({
  page,
  text,
  x,
  y,
  font,
  fontSize,
  maxWidth,
  lineHeight,
}: {
  page: PDFPage;
  text: string;
  x: number;
  y: number;
  font: PDFFont;
  fontSize: number;
  maxWidth: number;
  lineHeight: number;
}) {
  const lines = wrapText(
    text,
    font,
    fontSize,
    maxWidth,
  );

  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * lineHeight,
      size: fontSize,
      font,
      color: rgb(0.12, 0.12, 0.12),
    });
  });

  return y - lines.length * lineHeight;
}

export async function generateInvoicePdf(
  invoice: InvoicePdfInput,
) {
  const pdf = await PDFDocument.create();

  const regular = await pdf.embedFont(
    StandardFonts.Helvetica,
  );

  const bold = await pdf.embedFont(
    StandardFonts.HelveticaBold,
  );

  const page = pdf.addPage([595.28, 841.89]);

  const { width, height } = page.getSize();

  const margin = 48;
  const rightEdge = width - margin;

  const drawText = (
    text: string,
    x: number,
    y: number,
    size = 10,
    font = regular,
  ) => {
    page.drawText(safeText(text), {
      x,
      y,
      size,
      font,
      color: rgb(0.12, 0.12, 0.12),
    });
  };

  const drawRightText = (
    text: string,
    rightX: number,
    y: number,
    size = 10,
    font = regular,
  ) => {
    const normalized = safeText(text);
    const textWidth = font.widthOfTextAtSize(
      normalized,
      size,
    );

    drawText(
      normalized,
      rightX - textWidth,
      y,
      size,
      font,
    );
  };

  // Header
  drawText(
    "NEXUS EVENTS",
    margin,
    height - 55,
    19,
    bold,
  );

  drawText(
    "Event Production & Management",
    margin,
    height - 75,
    9,
  );

  drawRightText(
    "RECHNUNG",
    rightEdge,
    height - 55,
    19,
    bold,
  );

  drawRightText(
    invoice.invoiceNo,
    rightEdge,
    height - 75,
    10,
    bold,
  );

  // Customer block
  const customerTop = height - 125;

  drawText(
    "Rechnung an",
    margin,
    customerTop,
    9,
    bold,
  );

  let customerY = customerTop - 20;

  customerY = drawWrappedText({
    page,
    text: customerName(invoice.customer),
    x: margin,
    y: customerY,
    font: bold,
    fontSize: 11,
    maxWidth: 220,
    lineHeight: 14,
  });

  drawText(
    `Kundennummer: ${invoice.customer.customerNo}`,
    margin,
    customerY - 2,
    9,
  );

  customerY -= 17;

  if (invoice.customer.email) {
    drawText(
      invoice.customer.email,
      margin,
      customerY,
      9,
    );

    customerY -= 17;
  }

  if (invoice.customer.address) {
    customerY = drawWrappedText({
      page,
      text: invoice.customer.address,
      x: margin,
      y: customerY,
      font: regular,
      fontSize: 9,
      maxWidth: 220,
      lineHeight: 13,
    });
  }

  if (invoice.customer.vatId) {
    drawText(
      `USt-IdNr.: ${invoice.customer.vatId}`,
      margin,
      customerY - 2,
      9,
    );
  }

  // Metadata block
  const metaX = 340;
  const metaValueX = 435;
  let metaY = customerTop;

  drawText(
    "Rechnungsdatum:",
    metaX,
    metaY,
    9,
    bold,
  );

  drawText(
    formatDate(invoice.issueDate),
    metaValueX,
    metaY,
    9,
  );

  metaY -= 18;

  drawText(
    "Fällig am:",
    metaX,
    metaY,
    9,
    bold,
  );

  drawText(
    formatDate(invoice.dueDate),
    metaValueX,
    metaY,
    9,
  );

  metaY -= 18;

  drawText(
    "Erstellt am:",
    metaX,
    metaY,
    9,
    bold,
  );

  drawText(
    new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(invoice.createdAt),
    metaValueX,
    metaY,
    9,
  );

  if (invoice.event) {
    metaY -= 18;

    drawText(
      "Event:",
      metaX,
      metaY,
      9,
      bold,
    );

    metaY = drawWrappedText({
      page,
      text: `${invoice.event.eventNo} - ${invoice.event.name}`,
      x: metaValueX,
      y: metaY,
      font: regular,
      fontSize: 8,
      maxWidth: rightEdge - metaValueX,
      lineHeight: 11,
    });
  }

  if (invoice.quote) {
    metaY -= 5;

    drawText(
      "Angebot:",
      metaX,
      metaY,
      9,
      bold,
    );

    drawText(
      invoice.quote.quoteNo,
      metaValueX,
      metaY,
      9,
    );
  }

  // Items table
  let y = Math.min(
    customerY,
    metaY,
  ) - 45;

  page.drawLine({
    start: { x: margin, y },
    end: { x: rightEdge, y },
    thickness: 1,
    color: rgb(0.75, 0.75, 0.75),
  });

  y -= 24;

  drawText(
    "Beschreibung",
    margin,
    y,
    9,
    bold,
  );

  drawText(
    "Menge",
    330,
    y,
    9,
    bold,
  );

  drawText(
    "Preis",
    390,
    y,
    9,
    bold,
  );

  drawRightText(
    "Gesamt",
    rightEdge,
    y,
    9,
    bold,
  );

  y -= 15;

  page.drawLine({
    start: { x: margin, y },
    end: { x: rightEdge, y },
    thickness: 0.5,
    color: rgb(0.82, 0.82, 0.82),
  });

  y -= 20;

  for (const item of invoice.items) {
    const descriptionLines = wrapText(
      item.description,
      regular,
      9,
      240,
    );

    const rowHeight = Math.max(
      24,
      descriptionLines.length * 13 + 7,
    );

    descriptionLines.forEach(
      (line, index) => {
        drawText(
          line,
          margin,
          y - index * 13,
          9,
        );
      },
    );

    drawText(
      String(Number(item.quantity)),
      330,
      y,
      9,
    );

    drawRightText(
      formatCurrency(item.unitPrice),
      455,
      y,
      9,
    );

    drawRightText(
      formatCurrency(item.total),
      rightEdge,
      y,
      9,
      bold,
    );

    y -= rowHeight;
  }

  y -= 4;

  page.drawLine({
    start: { x: 330, y },
    end: { x: rightEdge, y },
    thickness: 0.5,
    color: rgb(0.75, 0.75, 0.75),
  });

  // Totals
  y -= 24;

  drawText(
    "Zwischensumme",
    330,
    y,
    9,
  );

  drawRightText(
    formatCurrency(invoice.subtotal),
    rightEdge,
    y,
    9,
  );

  y -= 18;

  drawText(
    `Rabatt (${Number(invoice.discount)} %)`,
    330,
    y,
    9,
  );

  y -= 18;

  drawText(
    `MwSt. (${Number(invoice.tax)} %)`,
    330,
    y,
    9,
  );

  y -= 24;

  page.drawLine({
    start: { x: 330, y: y + 10 },
    end: { x: rightEdge, y: y + 10 },
    thickness: 0.5,
    color: rgb(0.82, 0.82, 0.82),
  });

  drawText(
    "Gesamt",
    330,
    y,
    12,
    bold,
  );

  drawRightText(
    formatCurrency(invoice.total),
    rightEdge,
    y,
    12,
    bold,
  );

  // Notes
  if (invoice.notes) {
    y -= 50;

    drawText(
      "Notizen",
      margin,
      y,
      10,
      bold,
    );

    y -= 20;

    drawWrappedText({
      page,
      text: invoice.notes,
      x: margin,
      y,
      font: regular,
      fontSize: 9,
      maxWidth: rightEdge - margin,
      lineHeight: 13,
    });
  }

  // Footer
  page.drawLine({
    start: { x: margin, y: 70 },
    end: { x: rightEdge, y: 70 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });

  drawText(
    "Vielen Dank für Ihren Auftrag.",
    margin,
    50,
    9,
    bold,
  );

  drawText(
    "Nexus Events · Event Production & Management",
    margin,
    34,
    8,
  );

  const bytes = await pdf.save();

  return Buffer.from(bytes);
}
