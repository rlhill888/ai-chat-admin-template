"use client";

import * as Sentry from "@sentry/nextjs";

type LoginPayload = {
  email: string;
  password: string;
};

type AuthResponse = {
  success: boolean;
  message?: string;
};

export async function login( payload: LoginPayload): Promise<AuthResponse> {
  try {
    if (!payload.email || !payload.password) {
      throw new Error("Email and password are required");
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Login failed");
    }

    return data;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("helper", "login");
      Sentry.captureException(error);
    });

    throw error;
  }
}

export async function logout(): Promise<AuthResponse> {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Logout failed");
    }

    return data;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("helper", "logout");

      Sentry.captureException(error);
    });

    throw error;
  }
}