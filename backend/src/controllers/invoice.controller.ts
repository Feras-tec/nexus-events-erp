import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
} from "../schemas/invoice.schema.js";

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

    // Rechnung mit Positionen speichern
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: data.invoiceNo,
        status: data.status,
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

    return res.status(201).json(invoice);
  } catch (error) {
    console.error("Create invoice error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
// Alle Rechnungen abrufen
export async function getInvoices(req: Request, res: Response) {
  try {
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
      orderBy: {
        createdAt: "desc",
      },
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

  try {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        error: "Invoice not found",
      });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: result.data,
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

    return res.json(invoice);
  } catch (error) {
    console.error("Update invoice error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
