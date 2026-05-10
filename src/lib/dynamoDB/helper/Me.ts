import * as Sentry from "@sentry/nextjs";

export async function getMe() {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", 
      });
  
      const data = await res.json();
      if (!res.ok && res.status !== 401) {
        throw new Error(data?.error || "Failed to fetch session");
      }
  
      return data;
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag("helper", "getMe");
        scope.setLevel("error");
  
        Sentry.captureException(error);
      });
  
      throw error;
    }
  }