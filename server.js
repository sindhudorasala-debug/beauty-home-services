require("dotenv").config();
const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const TABLE_NAME = process.env.DYNAMODB_TABLE;
const REGION = process.env.AWS_REGION || "ap-southeast-2";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let db;
if (TABLE_NAME) {
  const client = new DynamoDBClient({ region: REGION });
  db = DynamoDBDocumentClient.from(client);
}

// Local in-memory mode lets the app run before DynamoDB is configured.
// On EC2, set DYNAMODB_TABLE and attach an IAM role with table permissions.
const localBookings = [];

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Beauty Home Services", database: TABLE_NAME ? "DynamoDB configured" : "local demo mode" });
});

app.get("/api/bookings", async (_req, res) => {
  try {
    if (!db) return res.json(localBookings);
    const result = await db.send(new ScanCommand({ TableName: TABLE_NAME, Limit: 100 }));
    const bookings = (result.Items || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(bookings);
  } catch (error) {
    console.error("Read bookings error:", error);
    res.status(500).json({ message: "Could not load bookings. Check DynamoDB table and EC2 IAM role." });
  }
});

app.post("/api/bookings", async (req, res) => {
  const { customerName, phone, address, service, bookingDate, notes } = req.body || {};
  if (![customerName, phone, address, service, bookingDate].every(v => typeof v === "string" && v.trim())) {
    return res.status(400).json({ message: "Please fill in all required fields." });
  }
  if (!/^[0-9+\-\s()]{8,20}$/.test(phone.trim())) {
    return res.status(400).json({ message: "Please enter a valid phone number." });
  }

  const booking = {
    bookingId: randomUUID(),
    customerName: customerName.trim(),
    phone: phone.trim(),
    address: address.trim(),
    service: service.trim(),
    bookingDate: bookingDate.trim(),
    notes: typeof notes === "string" ? notes.trim().slice(0, 500) : "",
    status: "Requested",
    createdAt: new Date().toISOString()
  };

  try {
    if (db) {
      await db.send(new PutCommand({ TableName: TABLE_NAME, Item: booking }));
    } else {
      localBookings.unshift(booking);
    }
    res.status(201).json({ message: "Your booking request was submitted!", booking });
  } catch (error) {
    console.error("Save booking error:", error);
    res.status(500).json({ message: "Could not save booking. Check DynamoDB configuration and IAM permissions." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Beauty Home Services running on port ${PORT}`);
});