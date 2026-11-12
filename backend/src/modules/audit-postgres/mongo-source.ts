import mongoose from "mongoose";
import type { AuditSource } from "./transfer.js";
const { ObjectId } = mongoose.mongo;

// Der Adapter verwendet ausschließlich Leseoperationen; die Verbindung wird vom lokalen Werkzeug übergeben.
export function mongoAuditSource(collection: mongoose.mongo.Collection): AuditSource {
  function filter(after: string | null, upper: string | null) {
    if (!upper) return { _id: { $exists: false } };
    return { _id: { $lte: new ObjectId(upper), ...(after ? { $gt: new ObjectId(after) } : {}) } };
  }
  return {
    async snapshot() {
      // Gemischte oder nicht-ObjectId-Schlüssel niemals unbemerkt überspringen.
      if (await collection.countDocuments({ _id: { $not: { $type: "objectId" } } })) throw new Error("Unsupported source document ID type");
      const last = await collection.find().sort({ _id: -1 }).limit(1).next();
      const upperId = last ? last._id.toHexString() : null;
      return { upperId, count: await collection.countDocuments(filter(null, upperId)) };
    },
    async count(upper) { return collection.countDocuments(filter(null, upper)); },
    async page(after, upper, size) { return collection.find(filter(after, upper), { promoteValues: false }).sort({ _id: 1 }).limit(size).toArray(); },
  };
}
