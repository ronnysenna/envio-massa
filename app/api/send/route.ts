import axios from "axios";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

const WEBHOOK_URL = "https://n8n.ronnysenna.com.br/webhook/envio";

export async function POST(req: Request) {
  try {
    await requireUser();

    const body = await req.json();
    const { message, contacts, imageUrl } = body;
    if (!message || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // build payload to n8n
    const payload = { message, contacts, imageUrl };
    const response = await axios.post(WEBHOOK_URL, payload, { timeout: 30000 });

    return NextResponse.json({ success: true, data: response.data });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
