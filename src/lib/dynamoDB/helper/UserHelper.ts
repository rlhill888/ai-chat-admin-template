import User from "../dynamoDbSchemaInterfaces/user";
import * as Sentry from "@sentry/nextjs";


export async function createNewUser(user: User) {
  try {
    const res = await fetch(`/api/user/create-new-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user)
    })
    return res.json()
  } catch (error) {

    Sentry.captureException(error, {
      tags: {
        helper: "createNewUser",
      }
    });
  }
}

export async function getAllUsers(){
  try{

    const res = await fetch(
      `/api/user/get-all-users`,
      {
        method: "GET",
      }
    );

    const data = await res.json();
    return data;

  }catch(error){

    Sentry.withScope((scope) => {
      scope.setTag("helper", "getAllUsers");

      Sentry.captureException(error);
    });

    throw error;

  }
}

export async function getUserByRegistrationLink(registrationLink: string) {
  try {
    if (!registrationLink) {
      throw new Error("registrationLink is required");
    }

    const res = await fetch(
      `/api/user/get-user-by-registration-link-id/?registrationLink=${encodeURIComponent(registrationLink)}`,
      {
        method: "GET",
      }
    );

    const data = await res.json();
    return data;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("helper", "fetchUserByRegistrationLink");
      scope.setContext("input", { registrationLink });

      Sentry.captureException(error);
    });

    throw error;
  }
}

export async function setUserStatus(email: string, active: boolean) {
  try {
    const res = await fetch("/api/user/set-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, active }),
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data?.message || "Failed to update user status");
      Sentry.captureException(error, {
        tags: { helper: "setUserStatus" },
        extra: { email, active, status: res.status },
      });
      throw error;
    }

    return data;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("helper", "setUserStatus");
      scope.setContext("input", { email, active });
      Sentry.captureException(error);
    });
    throw error;
  }
}

export async function setUserAdmin(email: string, admin: boolean) {
  try {
    const res = await fetch("/api/user/set-admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, admin }),
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data?.message || "Failed to update admin status");
      Sentry.captureException(error, {
        tags: { helper: "setUserAdmin" },
        extra: { email, admin, status: res.status },
      });
      throw error;
    }

    return data;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("helper", "setUserAdmin");
      scope.setContext("input", { email, admin });
      Sentry.captureException(error);
    });
    throw error;
  }
}

export async function registerUser(user: User) {
  try {
    const res = await fetch("/api/user/register-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    const responseData = await res.json();

    if (!res.ok) {
      const error = new Error(responseData?.message || "Failed to register user");

      Sentry.withScope((scope) => {
        scope.setTag("helper", "registerUserHelper");
        scope.setContext("api_response", {
          status: res.status,
          data: responseData,
        });
        Sentry.captureException(error);
      });

      throw error;
    }

    return responseData;
  } catch (error: any) {
    Sentry.withScope((scope) => {
      scope.setTag("helper", "registerUserHelper");
      Sentry.captureException(error);
    });

    throw error;
  }
}