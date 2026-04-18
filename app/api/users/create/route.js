import { NextResponse } from "next/server";
import { Wallet } from "xrpl";
import { getDb } from "@/lib/mongodb";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Cached so we don't re-derive the address on every request. The seed
// doesn't change within a process lifetime.
let cachedSharedWalletAddress = null;
function getSharedWalletAddress() {
  if (cachedSharedWalletAddress) return cachedSharedWalletAddress;
  const seed = process.env.USER_WALLET_SEED;
  if (!seed) {
    throw new Error("USER_WALLET_SEED is not set");
  }
  cachedSharedWalletAddress = Wallet.fromSeed(seed).address;
  return cachedSharedWalletAddress;
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const email = body?.email;

    if (!isNonEmptyString(email)) {
      return NextResponse.json(
        { error: 'Field "email" is required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Decision #4: wallet address is derived server-side from USER_WALLET_SEED.
    // We ignore any client-supplied walletAddress to prevent user-controlled
    // junk from ever ending up on goal.ownerAddress.
    let walletAddress;
    try {
      walletAddress = getSharedWalletAddress();
    } catch (err) {
      console.error("[POST /api/users/create] wallet derivation failed", err);
      return NextResponse.json(
        { error: "Server XRPL config missing (USER_WALLET_SEED)" },
        { status: 500 }
      );
    }

    const db = await getDb();
    const users = db.collection("users");

    await users.createIndex({ email: 1 }, { unique: true });

    const createdAt = new Date();
    const doc = {
      email: trimmedEmail,
      walletAddress,
      createdAt,
    };

    const result = await users.insertOne(doc);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        email: doc.email,
        walletAddress: doc.walletAddress,
        createdAt: doc.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    console.error("[POST /api/users/create]", err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
