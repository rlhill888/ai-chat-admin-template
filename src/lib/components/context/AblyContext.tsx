"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as Ably from "ably";
import { createAblyClient } from "@/lib/ably/ablyFrontendClient";

type AblyContextType = {
  ably: Ably.Realtime | null;
};

const AblyContext = createContext<AblyContextType | null>(null);

export default function AblyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [ably, setAbly] = useState<Ably.Realtime | null>(null);

  useEffect(() => {
    const client = createAblyClient();
    if (!client) return;

    client.connection.on("connected", () => {
      console.log("Ably connected successfully");
    });
    client.connection.on("failed", (err) => {
      console.log("Ably connection failed:", err);
    });
    client.connection.on("disconnected", (err) => {
      console.log("Ably disconnected:", err);
    });
    client.connection.on("suspended", (err) => {
      console.log("Ably suspended:", err);
    });

    setAbly(client);

    return () => {
      setAbly(null);
      try {
        client.close();
      } catch {
        // connection may already be closed
      }
    };
  }, []);

  return (
    <AblyContext.Provider value={{ ably }}>
      {children}
    </AblyContext.Provider>
  );
}

export function useAbly() {
  const context = useContext(AblyContext);

  if (!context) {
    throw new Error("useAbly must be used inside of an AblyProvider");
  }

  return context;
}