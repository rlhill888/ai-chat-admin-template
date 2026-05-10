import * as Sentry from "@sentry/nextjs";

export async function getConversations(
  conversationMethod: "Text" | "Email",
  limit: number = 20,
  cursor: Record<string, any> | null = null
): Promise<{
  success: boolean;
  items: Record<string, any>[];
  cursor: Record<string, any> | null;
}> {
  const params = new URLSearchParams();

  params.append("conversationMethod", conversationMethod);
  params.append("limit", String(limit));

  if (cursor) {
    params.append("cursor", JSON.stringify(cursor));
  }

  try {
    const res = await fetch(
      `/api/conversations/get-list-of-conversations?${params.toString()}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch conversations");
    }

    return res.json();
  } catch (error) {
    console.log(error);

    Sentry.captureException(error, {
      extra: {
        conversationMethod,
        limit,
        hasCursor: !!cursor,
      },
    });

    throw error;
  }
}

export async function setConversationAsRead(conversationId: string, timeStamp: string): Promise<{
    success: boolean;
    items: Record<string, any>[];
}>{
    try{
        const res = await fetch(`/api/conversations/set-conversation-as-read`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: conversationId, timeStamp: timeStamp })
        })
        return res.json()
    }catch(error){
        console.log(error)
        Sentry.captureException(error, {
            extra: {
                conversationId,
            }
        });
        throw error;
    }
}

export async function setConversationAiResponseToggle(
    conversationId: string,
    timeStamp: string,
    aiResponseToggle: boolean
  ): Promise<{
    success: boolean;
    conversation?: Record<string, any>;
    error?: string;
  }> {
    try {
      const res = await fetch(`/api/conversations/toggle-conversation-ai-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          timeStamp,
          aiResponseToggle,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || "Failed to update AI response toggle");
      }
  
      return data;
    } catch (error) {
      console.log(error);
  
      Sentry.captureException(error, {
        extra: {
          conversationId,
          timeStamp,
          aiResponseToggle,
        },
      });
  
      throw error;
    }
  }