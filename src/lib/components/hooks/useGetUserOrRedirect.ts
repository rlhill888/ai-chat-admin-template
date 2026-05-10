"use client";

import User from "@/lib/dynamoDB/dynamoDbSchemaInterfaces/user";
import { getMe } from "@/lib/dynamoDB/helper/Me";
import { useRouter } from "next/navigation";

export function useGetUserOrRedirect() {
    const router = useRouter();

    async function getUserOrRedirect(): Promise<User | null> {
        try {

            const user = await getMe()

            if (!user.authenticated) {
                router.push("/login");
                return null;
            }

            if (!user) {
                router.push("/login");

                // future error handling goes here
                return null;
            }

            return user.user;
        } catch (error) {
            // future error handling
            router.push("/login");
            return null;
        }
    }

    return { getUserOrRedirect };
}