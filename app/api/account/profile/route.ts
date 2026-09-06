import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_NAME_LENGTH = 80;

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.name !== "string") {
    return NextResponse.json({ error: "name must be a string" }, { status: 400 });
  }

  const name = body.name.trim().replace(/\s+/g, " ");
  if (!name) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data: { name, updated_at: new Date() },
      select: { name: true },
    });
    return NextResponse.json({ name: updated.name });
  } catch (err) {
    console.error("profile update failed", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
