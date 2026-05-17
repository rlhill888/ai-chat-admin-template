import { getAbly } from "@/lib/ably/ably";
import { NextRequest, NextResponse } from "next/server";
import { authorizeUser } from "@/lib/dynamoDB/service/Authorization";

export async function GET(req: NextRequest) {
  try {
    const authorization = await authorizeUser(req as NextRequest, true)
    if (authorization.authFailed) {
      return authorization.response as NextResponse
    }

    const ably = await getAbly();
    const tokenRequestData = await ably.auth.createTokenRequest({
      clientId: "COMPANY_NAME_PLACEHOLDER-dashboard",
    });

    return NextResponse.json(tokenRequestData);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Failed to create Ably token" },
      { status: 500 }
    );
  }
}