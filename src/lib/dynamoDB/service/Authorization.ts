import { NextRequest, NextResponse } from "next/server";
import User from "../dynamoDbSchemaInterfaces/user";
import { getSession } from "./SessionService";
import { getUserByEmail } from "./UserService";

interface returnAuthorizeUser{
  authFailed: boolean;
  user: null | User | Record<string, any>;
  response: NextResponse | null;
}

export async function authorizeUser(
  req: NextRequest,
  returnUser?: boolean
): Promise<returnAuthorizeUser> {
  const sessionId = req.cookies.get("sessionId")?.value;

  const session = await getSession(sessionId);

  if (!session) {
    
    return {
      user: null,
      authFailed: true,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  if (session.expiresAt * 1000 < Date.now()) {
    return {
      user: null,
      authFailed: true,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }
  if(returnUser){
    const getUser = await getUserByEmail(session.email)
    if (getUser?.statusSetToOff) {
      return {
        user: null,
        authFailed: true,
        response: NextResponse.json({ error: "Account deactivated" }, { status: 403 })
      }
    }
   return {
    user: getUser as User,
    authFailed: false,
    response: null
   }
  }else{
    return { 
      user: session,
      authFailed: false,
      response: null
     }
  }
  
}