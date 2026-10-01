import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";

// Neues Produkt erstellen
export const createProduct = async (
  req: Request,
  res: Response,
) => {
  const result = createProductSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const product = await prisma.product.create({
      data: result.data,
    });

    return res.status(201).json({
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Alle Produkte abrufen
export const getProducts = async (
  _req: Request,
  res: Response,
) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventoryItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Ein Produkt anhand seiner ID abrufen
export const getProductById = async (
  req: Request,
  res: Response,
) => {
  const id = String(req.params.id);

  try {
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        inventoryItems: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    return res.status(200).json({
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Produktdaten teilweise aktualisieren
export const updateProduct = async (
  req: Request,
  res: Response,
) => {
  const id = String(req.params.id);
  const result = updateProductSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  try {
    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: result.data,
    });

    return res.status(200).json({
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Produkt deaktivieren statt endgültig löschen
export const deactivateProduct = async (
  req: Request,
  res: Response,
) => {
  const id = String(req.params.id);

  try {
    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      data: product,
    });
  } catch (error) {
    console.error("Deactivate product error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

