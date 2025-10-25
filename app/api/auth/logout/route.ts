import { NextResponse } from "next/server";

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const IS_PROD = process.env.NODE_ENV === "production";

export async function POST() {
  const res = NextResponse.json({ success: true });
  // clear cookie with same attributes used on set
  const cookieOptions = {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: IS_PROD,
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  } as Parameters<typeof res.cookies.set>[2];

  res.cookies.set("token", "", cookieOptions);
  return res;
}
