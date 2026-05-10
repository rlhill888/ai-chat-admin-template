import { NextRequest, NextResponse } from "next/server";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "@/lib/dynamoDB/dynamodb";
import { getConversations, putConversation, setConversationAsRead } from "@/lib/dynamoDB/service/ConversationService";
import { authorizeUser } from "@/lib/dynamoDB/service/Authorization";


export async function POST(req: Request) {
    try {
        const authorization = await authorizeUser(req as NextRequest, true)
        if (authorization.authFailed) {
            return authorization.response as NextResponse
        }
        const body = await req.json()
        const conversation = await setConversationAsRead(
            body.id,
            body.timeStamp
        );

        return NextResponse.json({ success: true, ...conversation });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Failed to write item" }, { status: 500 });
    }
}