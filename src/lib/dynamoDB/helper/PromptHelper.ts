import * as Sentry from "@sentry/nextjs";

export async function getPrompt() {
  try {
    const res = await fetch(`/api/prompt`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch prompt");
    }

    return data;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("helper", "getPromptHelper");

      Sentry.captureException(error);
    });

    throw error;
  }
}

export async function updatePrompt(
  AIResponsePrompt: string,
  FlagUserInLoopRequirements: string
) {
  try {
    const res = await fetch("/api/prompt", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ promptId: "prompt", AIResponsePrompt, FlagUserInLoopRequirements }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update prompt");
    }

    return data;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("helper", "updatePromptHelper");
      scope.setContext("request", {
        AIResponsePrompt,
        FlagUserInLoopRequirements,
      });

      Sentry.captureException(error);
    });

    throw error;
  }
}