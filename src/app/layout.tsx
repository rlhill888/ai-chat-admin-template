"use client"
import { createContext, useEffect, useState } from "react";
import { getMe } from "@/lib/dynamoDB/helper/Me";
import LoadingProvider from "@/lib/components/context/LoadingContext";
import PageLoading from "@/lib/components/Loading/PageLoading/PageLoading";


export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" style={{
            margin: "0"
        }}>
            <body
                style={{
                    margin: "0"
                }}
            >
                <LoadingProvider>
                    <PageLoading />
                    {children}
                </LoadingProvider>
            </body>
        </html>
    );
}