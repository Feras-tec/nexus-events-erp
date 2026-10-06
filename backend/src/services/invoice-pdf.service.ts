import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

type InvoicePdfInput = {
  invoiceNo: string;
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
  let y = height - 52;

  const drawText = (
    text: string,
    x: number,
    currentY: number,
    size = 10,
    font = regular,
  ) => {
    page.drawText(safeText(text), {
      x,
      y: currentY,
      size,
      font,
      color: rgb(0.12, 0.12, 0.12),
    });
  };

  drawText("NEXUS EVENTS", margin, y, 18, bold);
  drawText(
    "Event Production & Management",
    margin,
    y - 18,
    9,
  );

  drawText(
    "RECHNUNG",
    width - margin - 120,
    y,
    18,
    bold,
  );

  drawText(
    invoice.invoiceNo,
    width - margin - 120,
    y - 18,
    10,
    bold,
  );

  y -= 70;

  drawText("Rechnung an", margin, y, 9, bold);
  y -= 18;

  drawText(
    customerName(invoice.customer),
    margin,
    y,
    11,
    bold,
  );

  y -= 16;

  drawText(
    `Kundennummer: ${invoice.customer.customerNo}`,
    margin,
    y,
  );

  if (invoice.customer.email) {
    y -= 14;
    drawText(invoice.customer.email, margin, y);
  }

  if (invoice.customer.address) {
    y -= 14;
    drawText(invoice.customer.address, margin, y);
  }

  const metaX = width - margin - 190;
  let metaY = height - 122;

  drawText("Rechnungsdatum:", metaX, metaY, 9, bold);
  drawText(
    formatDate(invoice.issueDate),
    metaX + 95,
    metaY,
  );

  metaY -= 17;

  drawText("Fällig am:", metaX, metaY, 9, bold);
  drawText(
    formatDate(invoice.dueDate),
    metaX + 95,
    metaY,
  );

  if (invoice.event) {
    metaY -= 17;
    drawText("Event:", metaX, metaY, 9, bold);
    drawText(
      `${invoice.event.eventNo} - ${invoice.event.name}`,
      metaX + 95,
      metaY,
      8,
    );
  }

  if (invoice.quote) {
    metaY -= 17;
    drawText("Angebot:", metaX, metaY, 9, bold);
    drawText(
      invoice.quote.quoteNo,
      metaX + 95,
      metaY,
    );
  }

  y -= 45;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.75, 0.75, 0.75),
  });

  y -= 22;

  drawText("Beschreibung", margin, y, 9, bold);
  drawText("Menge", 330, y, 9, bold);
  drawText("Preis", 390, y, 9, bold);
  drawText("Gesamt", 475, y, 9, bold);

  y -= 14;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 18;

  for (const item of invoice.items) {
    const description =
      item.description.length > 42
        ? `${item.description.slice(0, 39)}...`
        : item.description;

    drawText(description, margin, y, 9);

    drawText(
      String(Number(item.quantity)),
      330,
      y,
      9,
    );

    drawText(
      formatCurrency(item.unitPrice),
      390,
      y,
      9,
    );

    drawText(
      formatCurrency(item.total),
      475,
      y,
      9,
      bold,
    );

    y -= 22;
  }

  y -= 10;

  page.drawLine({
    start: { x: 330, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: rgb(0.75, 0.75, 0.75),
  });

  y -= 22;

  drawText("Zwischensumme", 330, y, 9);
  drawText(
    formatCurrency(invoice.subtotal),
    475,
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

  y -= 22;

  drawText("Gesamt", 330, y, 11, bold);
  drawText(
    formatCurrency(invoice.total),
    475,
    y,
    11,
    bold,
  );

  if (invoice.notes) {
    y -= 50;

    drawText("Notizen", margin, y, 10, bold);

    y -= 18;

    const notes =
      invoice.notes.length > 100
        ? `${invoice.notes.slice(0, 97)}...`
        : invoice.notes;

    drawText(notes, margin, y, 9);
  }

  drawText(
    "Vielen Dank für Ihren Auftrag.",
    margin,
    48,
    9,
    bold,
  );

  drawText(
    "Nexus Events · Event Production & Management",
    margin,
    32,
    8,
  );

  const bytes = await pdf.save();

  return Buffer.from(bytes);
}
