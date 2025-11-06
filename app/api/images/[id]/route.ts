import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const user = await requireUser();
    const id = Number(resolvedParams.id);
    if (!id)
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const image = await prisma.image.findUnique({ where: { id } });
    if (!image)
      return NextResponse.json(
        { error: "Imagem não encontrada" },
        { status: 404 },
      );

    // Only owner can delete
    if (image.userId !== user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // If image url points to local uploads, remove file
    try {
      const uploadsPrefix = "/uploads/";
      if (image.url.includes(uploadsPrefix)) {
        const filename = path.basename(image.url);
        const p = path.join(process.cwd(), "public", "uploads", filename);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } else {
        // Try remove from S3 if configured
        const S3_BUCKET = process.env.S3_BUCKET;
        const S3_REGION = process.env.S3_REGION;
        if (S3_BUCKET && S3_REGION) {
          try {
            const s3Mod = await import("@aws-sdk/client-s3");
            const { S3Client, DeleteObjectCommand } = s3Mod;
            const s3 = new S3Client({ region: S3_REGION });
            // attempt to extract key from URL
            const key = image.url.split(`/${S3_BUCKET}/`).pop();
            if (key)
              await s3.send(
                new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }),
              );
          } catch (s3err) {
            // ignore s3 delete errors
            console.warn("S3 delete error:", getErrorMessage(s3err));
          }
        }
      }
    } catch (fileErr) {
      console.warn("error deleting file", getErrorMessage(fileErr));
    }

    await prisma.image.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
