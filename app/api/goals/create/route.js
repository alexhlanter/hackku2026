import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { createEscrow } from "@/lib/xrpl";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
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

    const userId = body?.userId;
    const title = body?.title;
    const stakeAmount = body?.stakeAmount;
    const deadlineRaw = body?.deadline;

    if (!isNonEmptyString(userId) || !ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Field "userId" must be a valid MongoDB ObjectId string' },
        { status: 400 }
      );
    }

    if (!isNonEmptyString(title)) {
      return NextResponse.json(
        { error: 'Field "title" is required' },
        { status: 400 }
      );
    }

    const stake =
      typeof stakeAmount === "number" && Number.isFinite(stakeAmount)
        ? stakeAmount
        : typeof stakeAmount === "string"
          ? Number.parseFloat(stakeAmount)
          : NaN;

    if (!Number.isFinite(stake) || stake <= 0) {
      return NextResponse.json(
        { error: 'Field "stakeAmount" must be a positive number of XRP' },
        { status: 400 }
      );
    }

    const deadline =
      deadlineRaw instanceof Date
        ? deadlineRaw
        : typeof deadlineRaw === "string" || typeof deadlineRaw === "number"
          ? new Date(deadlineRaw)
          : null;

    if (!deadline || Number.isNaN(deadline.getTime())) {
      return NextResponse.json(
        { error: 'Field "deadline" must be a valid date string or timestamp' },
        { status: 400 }
      );
    }

    // XRPL requires the deadline to be comfortably in the future (see
    // createEscrow for the exact buffer).
    if (deadline.getTime() <= Date.now() + 15_000) {
      return NextResponse.json(
        { error: 'Field "deadline" must be at least ~15s in the future' },
        { status: 400 }
      );
    }

    // TODO: pull these from the user document once wallets are per-user.
    const userSeed = process.env.USER_WALLET_SEED;
    const potAddress = process.env.XRPL_POT_WALLET_ADDRESS;
    if (!userSeed || !potAddress) {
      return NextResponse.json(
        {
          error:
            "Server missing XRPL config (USER_WALLET_SEED / XRPL_POT_WALLET_ADDRESS)",
        },
        { status: 500 }
      );
    }

    const db = await getDb();
    const users = db.collection("users");
    const goals = db.collection("goals");

    const owner = await users.findOne({ _id: new ObjectId(userId) });
    if (!owner) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await goals.createIndex({ userId: 1 });

    // 1) Lock the stake on XRPL first. If this throws, nothing is persisted.
    const escrow = await createEscrow({
      userSeed,
      potAddress,
      amountXRP: String(stake),
      deadline,
    });

    // 2) Persist the goal with the escrow identifiers so we can finish/cancel
    //    it later from /api/goals/resolve.
    const createdAt = new Date();
    const doc = {
      userId: new ObjectId(userId),
      title: title.trim(),
      stakeAmount: stake,
      deadline,
      status: "active",
      createdAt,
      escrow: {
        sequence: escrow.escrowSequence,
        createTxHash: escrow.txHash,
        potAddress,
      },
    };

    let insertedId;
    try {
      const result = await goals.insertOne(doc);
      insertedId = result.insertedId;
    } catch (dbErr) {
      // Escrow already locked funds on-chain but DB write failed. The user
      // can still reclaim funds after the deadline via EscrowCancel, but we
      // surface the sequence so an operator can recover manually.
      console.error(
        "[POST /api/goals/create] DB insert failed AFTER escrow created",
        { escrowSequence: escrow.escrowSequence, txHash: escrow.txHash, dbErr }
      );
      return NextResponse.json(
        {
          error:
            "Escrow created on-chain but failed to save goal. Contact support with the escrow details.",
          escrowSequence: escrow.escrowSequence,
          txHash: escrow.txHash,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: insertedId.toString(),
        userId: doc.userId.toString(),
        title: doc.title,
        stakeAmount: doc.stakeAmount,
        deadline: doc.deadline.toISOString(),
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
        escrow: {
          sequence: doc.escrow.sequence,
          createTxHash: doc.escrow.createTxHash,
          potAddress: doc.escrow.potAddress,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/goals/create]", err);
    return NextResponse.json(
      { error: "Failed to create goal", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
