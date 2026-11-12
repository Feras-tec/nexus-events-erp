import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
} from "../schemas/invoice.schema.js";
import { sendEmail } from "../services/email.service.js";
import { generateInvoicePdf } from "../services/invoice-pdf.service.js";

// Kontrollierte Fehler aus einer Transaktion an den HTTP-Layer weitergeben.
class InvoiceRequestError extends Error {
  constructor(
    readonly statusCode: number,
    readonly payload: Record<string, unknown>,
  ) {
    super(
      typeof payload.error === "string"
        ? payload.error
        : "Invoice request failed",
    );
    this.name = "InvoiceRequestError";
  }
}

function isValidInvoiceStatusTransition(
  from: string,
  to: string,
) {
  if (from === to) return true;

  const allowedTransitions: Record<string, string[]> = {
    DRAFT: ["ISSUED", "CANCELLED"],
    ISSUED: ["PAID", "OVERDUE", "CANCELLED"],
    OVERDUE: ["PAID", "CANCELLED"],
    PAID: [],
    CANCELLED: [],
  };

  return allowedTransitions[from]?.includes(to) ?? false;
}

// Neue Rechnung erstellen
export async function createInvoice(req: Request, res: Response) {
  const result = createInvoiceSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid invoice data",
      details: result.error.flatten(),
    });
  }

  const data = result.data;

  try {
    // Kunde prüfen
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    // Event prüfen
    if (data.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
      });

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
        });
      }

      if (event.customerId !== data.customerId) {
        return res.status(400).json({
          error: "Event does not belong to this customer",
        });
      }
    }

    // Angebot prüfen
    if (data.quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: data.quoteId },
      });

      if (!quote) {
        return res.status(404).json({
          error: "Quote not found",
        });
      }

      if (quote.customerId !== data.customerId) {
        return res.status(400).json({
          error: "Quote does not belong to this customer",
        });
      }

      if (quote.status !== "ACCEPTED") {
        return res.status(409).json({
          error: "Only accepted quotes can be invoiced",
        });
      }
    }

    // Produkte prüfen
    const productIds = [
      ...new Set(
        data.items
          .map((item) => item.productId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
      });

      if (products.length !== productIds.length) {
        return res.status(404).json({
          error: "One or more products not found",
        });
      }
    }

    // Geldbeträge sicher auf Cent-Basis berechnen
    const calculatedItems = data.items.map((item) => {
      const unitPriceCents = Math.round(item.unitPrice * 100);
      const baseTotalCents = Math.round(item.quantity * unitPriceCents);

      const discountCents = Math.round(baseTotalCents * (item.discount / 100));

      const itemTotalCents = baseTotalCents - discountCents;

      return {
        ...item,
        total: itemTotalCents / 100,
      };
    });

    const subtotalCents = calculatedItems.reduce(
      (sum, item) => sum + Math.round(item.total * 100),
      0,
    );

    const invoiceDiscountCents = Math.round(
      subtotalCents * (data.discount / 100),
    );

    const netCents = subtotalCents - invoiceDiscountCents;

    const taxCents = Math.round(netCents * (data.tax / 100));

    const totalCents = netCents + taxCents;

    const subtotal = subtotalCents / 100;
    const total = totalCents / 100;

    // Rechnung mit Positionen speichern. Bei verknüpftem Angebot wird die
    // Angebotszeile gesperrt, damit parallele Anfragen serialisiert werden.
    const invoice = await prisma.$transaction(async (tx) => {
      if (data.quoteId) {
        await tx.$queryRaw`SELECT "id" FROM "Quote" WHERE "id" = ${data.quoteId} FOR UPDATE`;

        const lockedQuote = await tx.quote.findUnique({
          where: { id: data.quoteId },
        });

        if (!lockedQuote) {
          throw new InvoiceRequestError(404, {
            error: "Quote not found",
          });
        }

        if (lockedQuote.customerId !== data.customerId) {
          throw new InvoiceRequestError(400, {
            error: "Quote does not belong to this customer",
          });
        }

        if (lockedQuote.status !== "ACCEPTED") {
          throw new InvoiceRequestError(409, {
            error: "Only accepted quotes can be invoiced",
          });
        }

        const duplicateInvoice = await tx.invoice.findFirst({
          where: {
            quoteId: data.quoteId,
            status: { not: "CANCELLED" },
          },
          select: {
            invoiceNo: true,
          },
        });

        if (duplicateInvoice) {
          throw new InvoiceRequestError(409, {
            error: "Quote already has an active invoice",
            invoiceNo: duplicateInvoice.invoiceNo,
          });
        }
      }

      return tx.invoice.create({
        data: {
          invoiceNo: data.invoiceNo,
          // Neue Rechnungen starten immer als Entwurf.
          status: "DRAFT",
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          notes: data.notes,

          subtotal: Number(subtotal.toFixed(2)),
          discount: data.discount,
          tax: data.tax,
          total: Number(total.toFixed(2)),

          customerId: data.customerId,
          eventId: data.eventId,
          quoteId: data.quoteId,

          items: {
            create: calculatedItems.map((item) => ({
              type: item.type,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              total: item.total,
              productId: item.productId,
            })),
          },
        },

        include: {
          customer: true,
          event: true,
          quote: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof InvoiceRequestError) {
      return res.status(error.statusCode).json(error.payload);
    }

    console.error("Create invoice error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
// Minimale Auswahldaten für das Rechnungsformular. Eigener Endpunkt, damit
// Rollen mit Rechnungszugriff keine allgemeinen Kunden-/Produktlisten erhalten.
export async function getInvoiceFormOptions(
  _req: Request,
  res: Response,
) {
  try {
    const [customers, events, products, quotes] = await Promise.all([
      prisma.customer.findMany({
        where: { isActive: true },
        select: {
          id: true,
          customerNo: true,
          companyName: true,
          firstName: true,
          lastName: true,
        },
        orderBy: { customerNo: "asc" },
      }),
      prisma.event.findMany({
        select: {
          id: true,
          eventNo: true,
          name: true,
        },
        orderBy: { eventNo: "asc" },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          productNo: true,
          name: true,
        },
        orderBy: { productNo: "asc" },
      }),
      prisma.quote.findMany({
        where: { status: "ACCEPTED" },
        select: {
          id: true,
          quoteNo: true,
        },
        orderBy: { quoteNo: "asc" },
      }),
    ]);

    return res.json({
      customers,
      events,
      products,
      quotes,
    });
  } catch (error) {
    console.error("Get invoice form options error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

// Alle Rechnungen abrufen
export async function getInvoices(req: Request, res: Response) {
  try {
    const skip = req.query.skip !== undefined ? Number(req.query.skip) : undefined;
    const take = req.query.take !== undefined ? Number(req.query.take) : undefined;
    if (skip !== undefined && (!Number.isInteger(skip) || skip < 0)) {
      return res.status(400).json({ error: "Invalid skip value" });
    }
    if (take !== undefined && (!Number.isInteger(take) || take < 1)) {
      return res.status(400).json({ error: "Invalid take value" });
    }

    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        event: true,
        quote: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    });

    return res.json(invoices);
  } catch (error) {
    console.error("Get invoices error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

// Einzelne Rechnung abrufen
export async function getInvoiceById(req: Request, res: Response) {
  const id = req.params.id;

  if (typeof id !== "string") {
    return res.status(400).json({
      error: "Invalid invoice ID",
    });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        event: true,
        quote: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: "Invoice not found",
      });
    }

    return res.json(invoice);
  } catch (error) {
    console.error("Get invoice error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

// Rechnung aktualisieren
export async function updateInvoice(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Invalid invoice ID",
      });
    }

    const result = updateInvoiceSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid invoice data",
        details: result.error.flatten(),
      });
    }

    const data = result.data;

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        error: "Invoice not found",
      });
    }

    // Bei Teiländerungen müssen übernommene Datumswerte ebenfalls in die Prüfung eingehen.
    const effectiveIssueDate = data.issueDate ?? existingInvoice.issueDate;
    const effectiveDueDate = data.dueDate ?? existingInvoice.dueDate;
    if (effectiveIssueDate && effectiveDueDate && effectiveDueDate < effectiveIssueDate) {
      return res.status(400).json({ error: "Due date must not be before issue date" });
    }

    if (
      data.status !== undefined &&
      !isValidInvoiceStatusTransition(
        existingInvoice.status,
        data.status,
      )
    ) {
      return res.status(409).json({
        error: `Invalid invoice status transition: ${existingInvoice.status} → ${data.status}`,
      });
    }

    const customerId =
      data.customerId ?? existingInvoice.customerId;

    // Kunde prüfen, falls geändert
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        return res.status(404).json({
          error: "Customer not found",
        });
      }
    }

    // Event prüfen, falls geändert
    const effectiveEventId = data.eventId ?? existingInvoice.eventId;
    if (effectiveEventId && (data.eventId !== undefined || data.customerId !== undefined)) {
      const event = await prisma.event.findUnique({
        where: { id: effectiveEventId },
      });

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
        });
      }

      if (event.customerId !== customerId) {
        return res.status(400).json({
          error: "Event does not belong to this customer",
        });
      }
    }

    // Unveränderte Angebotsverknüpfungen dürfen durch Kundenwechsel nicht inkonsistent werden.
    if (data.customerId !== undefined && existingInvoice.quoteId && (!data.quoteId || data.quoteId === existingInvoice.quoteId)) {
      const linkedQuote = await prisma.quote.findUnique({ where: { id: existingInvoice.quoteId } });
      if (!linkedQuote || linkedQuote.customerId !== customerId) {
        return res.status(400).json({ error: "Quote does not belong to this customer" });
      }
    }

    // Angebot prüfen, falls geändert
    if (
      data.quoteId &&
      data.quoteId !== existingInvoice.quoteId
    ) {
      const quote = await prisma.quote.findUnique({
        where: { id: data.quoteId },
      });

      if (!quote) {
        return res.status(404).json({
          error: "Quote not found",
        });
      }

      if (quote.customerId !== customerId) {
        return res.status(400).json({
          error: "Quote does not belong to this customer",
        });
      }

      if (quote.status !== "ACCEPTED") {
        return res.status(409).json({
          error: "Only accepted quotes can be invoiced",
        });
      }
    }

    // Produkt-IDs prüfen, falls Positionen geändert werden
    if (data.items) {
      const productIds = [
        ...new Set(
          data.items
            .map((item) => item.productId)
            .filter((productId): productId is string =>
              Boolean(productId),
            ),
        ),
      ];

      if (productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: {
            id: {
              in: productIds,
            },
          },
          select: {
            id: true,
          },
        });

        if (products.length !== productIds.length) {
          return res.status(404).json({
            error: "One or more products not found",
          });
        }
      }
    }

    // Positionen auf Cent-Basis neu berechnen
    const calculatedItems = data.items?.map((item) => {
      const unitPriceCents = Math.round(item.unitPrice * 100);
      const baseTotalCents = Math.round(
        item.quantity * unitPriceCents,
      );

      const discountCents = Math.round(
        baseTotalCents * (item.discount / 100),
      );

      const itemTotalCents =
        baseTotalCents - discountCents;

      return {
        ...item,
        total: itemTotalCents / 100,
      };
    });

    const shouldRecalculateTotals =
      data.items !== undefined ||
      data.discount !== undefined ||
      data.tax !== undefined;

    let totalsUpdate:
      | {
          subtotal: number;
          total: number;
        }
      | undefined;

    if (shouldRecalculateTotals) {
      const itemsForTotals =
        calculatedItems ??
        existingInvoice.items.map((item) => ({
          total: Number(item.total),
        }));

      const subtotalCents = itemsForTotals.reduce(
        (sum, item) =>
          sum + Math.round(Number(item.total) * 100),
        0,
      );

      const discount =
        data.discount ?? Number(existingInvoice.discount);

      const tax =
        data.tax ?? Number(existingInvoice.tax);

      const invoiceDiscountCents = Math.round(
        subtotalCents * (discount / 100),
      );

      const netCents =
        subtotalCents - invoiceDiscountCents;

      const taxCents = Math.round(
        netCents * (tax / 100),
      );

      const totalCents = netCents + taxCents;

      totalsUpdate = {
        subtotal: subtotalCents / 100,
        total: totalCents / 100,
      };
    }

    const invoice = await prisma.$transaction(async (tx) => {
      // Beim Wechsel des Angebots gilt dieselbe Eindeutigkeitsregel wie beim
      // Anlegen: pro Angebot höchstens eine nicht stornierte Rechnung.
      if (
        data.quoteId &&
        data.quoteId !== existingInvoice.quoteId
      ) {
        await tx.$queryRaw`SELECT "id" FROM "Quote" WHERE "id" = ${data.quoteId} FOR UPDATE`;

        const lockedQuote = await tx.quote.findUnique({
          where: { id: data.quoteId },
        });

        if (!lockedQuote) {
          throw new InvoiceRequestError(404, {
            error: "Quote not found",
          });
        }

        if (lockedQuote.customerId !== customerId) {
          throw new InvoiceRequestError(400, {
            error: "Quote does not belong to this customer",
          });
        }

        if (lockedQuote.status !== "ACCEPTED") {
          throw new InvoiceRequestError(409, {
            error: "Only accepted quotes can be invoiced",
          });
        }

        const duplicateInvoice = await tx.invoice.findFirst({
          where: {
            quoteId: data.quoteId,
            id: { not: id },
            status: { not: "CANCELLED" },
          },
          select: {
            invoiceNo: true,
          },
        });

        if (duplicateInvoice) {
          throw new InvoiceRequestError(409, {
            error: "Quote already has an active invoice",
            invoiceNo: duplicateInvoice.invoiceNo,
          });
        }
      }

      if (calculatedItems) {
        await tx.invoiceItem.deleteMany({
          where: {
            invoiceId: id,
          },
        });
      }

      if (
        data.status !== undefined &&
        data.status !== existingInvoice.status
      ) {
        await tx.invoiceStatusHistory.create({
          data: {
            invoiceId: id,
            fromStatus: existingInvoice.status,
            toStatus: data.status,
          },
        });
      }

      return tx.invoice.update({
        where: { id },

        data: {
          ...(data.invoiceNo !== undefined && {
            invoiceNo: data.invoiceNo,
          }),

          ...(data.status !== undefined && {
            status: data.status,
          }),

          ...(data.issueDate !== undefined && {
            issueDate: data.issueDate,
          }),

          ...(data.dueDate !== undefined && {
            dueDate: data.dueDate,
          }),

          ...(data.notes !== undefined && {
            notes: data.notes,
          }),

          ...(data.customerId !== undefined && {
            customerId: data.customerId,
          }),

          ...(data.eventId !== undefined && {
            eventId: data.eventId,
          }),

          ...(data.quoteId !== undefined && {
            quoteId: data.quoteId,
          }),

          ...(data.discount !== undefined && {
            discount: data.discount,
          }),

          ...(data.tax !== undefined && {
            tax: data.tax,
          }),

          ...totalsUpdate,

          ...(calculatedItems && {
            items: {
              create: calculatedItems.map((item) => ({
                type: item.type,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                total: item.total,
                productId: item.productId,
              })),
            },
          }),
        },

        include: {
          customer: true,
          event: true,
          quote: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return res.json(invoice);
  } catch (error) {
    if (error instanceof InvoiceRequestError) {
      return res.status(error.statusCode).json(error.payload);
    }

    console.error("Update invoice error:", error);

    return res.status(500).json({
      error: "Failed to update invoice",
    });
  }
}

// Rechnung per E-Mail an den Kunden senden
export async function sendInvoiceEmail(
  req: Request,
  res: Response,
) {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Invalid invoice ID",
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        event: true,
        quote: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: "Invoice not found",
      });
    }

    if (!invoice.customer.email) {
      return res.status(400).json({
        error: "Customer has no email address",
      });
    }

    if (invoice.status === "CANCELLED") {
      return res.status(409).json({
        error: "Cancelled invoices cannot be sent",
      });
    }

    const pdf = await generateInvoicePdf(invoice);

    const customerName =
      invoice.customer.companyName ||
      [
        invoice.customer.firstName,
        invoice.customer.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      "Kunde";

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.6;">
        <p>Guten Tag ${customerName},</p>

        <p>
          anbei erhalten Sie die Rechnung
          <strong>${invoice.invoiceNo}</strong>
          von Nexus Events.
        </p>

        ${
          invoice.dueDate
            ? `<p>
                Bitte beachten Sie das Fälligkeitsdatum:
                <strong>${new Intl.DateTimeFormat("de-DE").format(
                  invoice.dueDate,
                )}</strong>.
              </p>`
            : ""
        }

        <p>
          Die Rechnung finden Sie als PDF im Anhang.
        </p>

        <p>
          Vielen Dank für Ihren Auftrag.
        </p>

        <p>
          Mit freundlichen Grüßen<br />
          <strong>Nexus Events</strong><br />
          Event Production & Management
        </p>
      </div>
    `;

    const email = await sendEmail({
      to: invoice.customer.email,
      subject: `Rechnung ${invoice.invoiceNo} – Nexus Events`,
      html,
      attachments: [
        {
          filename: `Rechnung-${invoice.invoiceNo}.pdf`,
          content: pdf,
        },
      ],
    });

    return res.json({
      message: "Invoice email sent successfully",
      recipient: invoice.customer.email,
      emailId: email?.id ?? null,
      sentAt: new Date(),
    });
  } catch (error) {
    console.error("Send invoice email error:", error);

    return res.status(500).json({
      error: "Failed to send invoice email",
    });
  }
}
