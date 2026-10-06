import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createQuoteSchema,
  updateQuoteSchema,
} from "../schemas/quote.schema.js";

// Neues Angebot mit Positionen erstellen
export async function createQuote(req: Request, res: Response) {
  try {
    const result = createQuoteSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid quote data",
        details: result.error.flatten(),
      });
    }

    const data = result.data;

    // Kunde prüfen
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    // Event prüfen, falls angegeben
    if (data.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
      });

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
        });
      }
    }

    // Produkt-IDs prüfen
    const productIds = data.items
      .map((item) => item.productId)
      .filter((id): id is string => id !== undefined);

    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: [...new Set(productIds)],
          },
        },
        select: {
          id: true,
        },
      });

      if (products.length !== new Set(productIds).size) {
        return res.status(404).json({
          error: "One or more products were not found",
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

    const quoteDiscountCents = Math.round(
      subtotalCents * (data.discount / 100),
    );

    const netCents = subtotalCents - quoteDiscountCents;

    const taxCents = Math.round(netCents * (data.tax / 100));

    const totalCents = netCents + taxCents;

    const subtotal = subtotalCents / 100;
    const total = totalCents / 100;

    const quote = await prisma.quote.create({
      data: {
        quoteNo: data.quoteNo,
        status: data.status,
        validUntil: data.validUntil,
        notes: data.notes,

        subtotal: Number(subtotal.toFixed(2)),
        discount: data.discount,
        tax: data.tax,
        total: Number(total.toFixed(2)),

        customerId: data.customerId,
        eventId: data.eventId,

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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.status(201).json(quote);
  } catch (error) {
    console.error("Create quote error:", error);

    return res.status(500).json({
      error: "Failed to create quote",
    });
  }
}
// Alle Angebote abrufen
export async function getQuotes(_req: Request, res: Response) {
  try {
    const quotes = await prisma.quote.findMany({
      include: {
        customer: true,
        event: true,
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

    return res.json(quotes);
  } catch (error) {
    console.error("Get quotes error:", error);

    return res.status(500).json({
      error: "Failed to get quotes",
    });
  }
}

// Einzelnes Angebot abrufen
export async function getQuoteById(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Invalid quote ID",
      });
    }

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        event: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({
        error: "Quote not found",
      });
    }

    return res.json(quote);
  } catch (error) {
    console.error("Get quote error:", error);

    return res.status(500).json({
      error: "Failed to get quote",
    });
  }
}
// Angebot aktualisieren
export async function updateQuote(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Invalid quote ID",
      });
    }

    const result = updateQuoteSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid quote data",
        details: result.error.flatten(),
      });
    }

    const data = result.data;

    const existingQuote = await prisma.quote.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingQuote) {
      return res.status(404).json({
        error: "Quote not found",
      });
    }

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
    if (data.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
      });

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
        });
      }
    }

    // Produkt-IDs prüfen, falls Positionen geändert werden
    if (data.items) {
      const productIds = data.items
        .map((item) => item.productId)
        .filter((productId): productId is string =>
          productId !== undefined,
        );

      if (productIds.length > 0) {
        const uniqueProductIds = [...new Set(productIds)];

        const products = await prisma.product.findMany({
          where: {
            id: {
              in: uniqueProductIds,
            },
          },
          select: {
            id: true,
          },
        });

        if (products.length !== uniqueProductIds.length) {
          return res.status(404).json({
            error: "One or more products were not found",
          });
        }
      }
    }

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

    // Für die Neuberechnung entweder neue oder bestehende Positionen verwenden
    const itemsForTotals =
      calculatedItems ??
      existingQuote.items.map((item) => ({
        total: item.total,
      }));

    const subtotalCents = itemsForTotals.reduce(
      (sum, item) =>
        sum + Math.round(Number(item.total) * 100),
      0,
    );

    const discount =
      data.discount ?? Number(existingQuote.discount);

    const tax =
      data.tax ?? Number(existingQuote.tax);

    const quoteDiscountCents = Math.round(
      subtotalCents * (discount / 100),
    );

    const netCents =
      subtotalCents - quoteDiscountCents;

    const taxCents = Math.round(
      netCents * (tax / 100),
    );

    const totalCents = netCents + taxCents;

    const quote = await prisma.$transaction(async (tx) => {
      if (calculatedItems) {
        await tx.quoteItem.deleteMany({
          where: {
            quoteId: id,
          },
        });
      }

      return tx.quote.update({
        where: { id },

        data: {
          ...(data.quoteNo !== undefined && {
            quoteNo: data.quoteNo,
          }),

          ...(data.status !== undefined && {
            status: data.status,
          }),

          ...(data.validUntil !== undefined && {
            validUntil: data.validUntil,
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

          ...(data.discount !== undefined && {
            discount: data.discount,
          }),

          ...(data.tax !== undefined && {
            tax: data.tax,
          }),

          subtotal: subtotalCents / 100,
          total: totalCents / 100,

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
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return res.json(quote);
  } catch (error) {
    console.error("Update quote error:", error);

    return res.status(500).json({
      error: "Failed to update quote",
    });
  }
}
