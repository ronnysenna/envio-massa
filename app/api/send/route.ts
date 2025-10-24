import axios from "axios";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const WEBHOOK_URL = process.env.WEBHOOK_URL;
    if (!WEBHOOK_URL) {
      return NextResponse.json(
        { error: "WEBHOOK_URL not configured on server" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message, imageUrl } = body;
    if (!message) {
      return NextResponse.json(
        { error: "Invalid payload: message is required" },
        { status: 400 }
      );
    }

    // build reduced payload to n8n (n8n will fetch contacts from DB if needed)
    const payload = { message, imageUrl, userId: user.id };

    try {
      const response = await axios.post(WEBHOOK_URL, payload, {
        timeout: 30000,
      });
      return NextResponse.json(
        { success: true, status: response.status, data: response.data },
        { status: 200 }
      );
    } catch (axiosErr: unknown) {
      // if n8n responded with an error status, forward that information
      const upstreamErr = axiosErr as
        | { response?: { status?: number; data?: unknown } }
        | undefined;
      const upstreamStatus = upstreamErr?.response?.status ?? 502;
      const upstreamData = upstreamErr?.response?.data ?? null;
      return NextResponse.json(
        {
          error: "Upstream webhook error",
          status: upstreamStatus,
          data: upstreamData,
        },
        { status: upstreamStatus }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
