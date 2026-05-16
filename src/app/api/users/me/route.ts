import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, phone },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  if (url.pathname.endsWith("/change-password")) {
    try {
      const { currentPassword, newPassword } = await req.json();

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: newHash },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
