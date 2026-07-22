import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CATEGORIES, Category } from "@/lib/types";

export const runtime = "nodejs";

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && CATEGORIES.includes(value as Category);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);

  if (!body || !isCategory(body.category)) {
    return NextResponse.json(
      { error: "Se requiere una categoría válida." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: { category: body.category },
    });
    return NextResponse.json({ transaction: updated });
  } catch {
    return NextResponse.json(
      { error: "Transacción no encontrada." },
      { status: 404 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.transaction.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Transacción no encontrada." },
      { status: 404 }
    );
  }
}
