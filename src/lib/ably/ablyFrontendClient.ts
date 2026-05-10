import * as Ably from "ably";

export const createAblyClient = () => {
  if (typeof window === "undefined") return null;

  return new Ably.Realtime({
    authUrl: `${window.location.origin}/api/auth/ably/ably-token`,
  });
};