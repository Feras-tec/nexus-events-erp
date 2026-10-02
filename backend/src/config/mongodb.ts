import mongoose from "mongoose";

// Verbindung zu MongoDB für Audit- und Aktivitätsprotokolle herstellen
export async function connectMongoDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn(
      "MongoDB connection skipped: MONGODB_URI is not configured.",
    );
    return;
  }

  try {
    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}
