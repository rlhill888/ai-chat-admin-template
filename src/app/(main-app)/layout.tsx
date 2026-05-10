"use client"

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavigationTopBar from "@/lib/components/Navigation/NavigationTopBar";
import { useGetUserOrRedirect } from "@/lib/components/hooks/useGetUserOrRedirect";
import { useEffect } from "react";
import { useLoading } from "@/lib/components/context/LoadingContext";
import UserProvider, { useUser } from "@/lib/components/context/UserContext";
import AuthProviders from "@/lib/components/authentication/AuthProviders.tsx/AuthProviders";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <>
    <AuthProviders>
      <NavigationTopBar />
      {children}
    </AuthProviders>
      
    </>

  );
}
