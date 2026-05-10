import { NextRequest, NextResponse } from "next/server";
import { getConversations, putConversation } from "@/lib/dynamoDB/service/ConversationService";
import { authorizeUser } from "@/lib/dynamoDB/service/Authorization";


export async function GET(req: Request) {
    try {
        const authorization = await authorizeUser(req as NextRequest, true)
        if (authorization.authFailed) {
            return authorization.response as NextResponse
        }
        const { searchParams } = new URL(req.url);

        const conversationMethod = searchParams.get("conversationMethod") as "Text" | "Email";
        const limit = Number(searchParams.get("limit") || 50);
        const cursorParam = searchParams.get("cursor");
        const cursor = cursorParam ? JSON.parse(cursorParam) : null;

        const conversations = await getConversations(
            conversationMethod,
            cursor,
            limit
        );

        return NextResponse.json({ success: true, ...conversations });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Failed to write item" }, { status: 500 });
    }
}