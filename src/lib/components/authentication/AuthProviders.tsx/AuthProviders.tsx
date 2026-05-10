"use client";

import { useEffect } from "react";
import NavigationTopBar from "@/lib/components/Navigation/NavigationTopBar";
import LoadingProvider, { useLoading } from "@/lib/components/context/LoadingContext";
import UserProvider, { useUser } from "@/lib/components/context/UserContext";
import { useGetUserOrRedirect } from "@/lib/components/hooks/useGetUserOrRedirect";
import AblyProvider from "../../context/AblyContext";

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { getUserOrRedirect } = useGetUserOrRedirect();
  const { setLoading } = useLoading();
  const { setUser } = useUser();

  useEffect(() => {
    async function getData() {
      setLoading(true);

      try {
        const userRequest = await getUserOrRedirect();

        if (userRequest) {
          setUser(userRequest);
        }
      } catch (error) {
        // future error handling
      }
    }

    getData();
  }, []);

  return (
    <>
      {children}
    </>
  );
}

export default function AuthProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <AblyProvider>
        <AuthWrapper>{children}</AuthWrapper>
      </AblyProvider>
    </UserProvider>
  );
}