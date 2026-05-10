"use client";

import { useEffect, useState } from "react";
import styles from "./Login.module.css";
import { login } from "@/lib/dynamoDB/helper/AuthHelper";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import { useGetUserOrRedirect } from "../../hooks/useGetUserOrRedirect";
import { useLoading } from "../../context/LoadingContext";

export default function Login() {
  const { setLoading } = useLoading();
  const { getUserOrRedirect } = useGetUserOrRedirect();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ showLogin, setShowLogin ] = useState(false)
  const [requestingLogin, setRequestingLogin] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setLoading(true)
    async function checkForUser() {
      const user = await getUserOrRedirect()
      if (user) {
        return router.push("/")
      }
      setLoading(false)
      setShowLogin(true)
    }
    checkForUser()

  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setRequestingLogin(true);

    try {
      const loginAttempt = await login({ email, password });
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setRequestingLogin(false);
    }
  }
  if (!showLogin) {
    return (
      <div></div>
    )
  } else {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <h1 className={styles.title}>COMPANY_NAME_PLACEHOLDER Ai Chat Portal</h1>
          <p className={styles.subtitle}>Sign in</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>
              Email
              <input
                disabled={requestingLogin}
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
              />
            </label>

            <label className={styles.label}>
              Password
              <input
                disabled={requestingLogin}
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
              />
            </label>

            {error && <p className={styles.errorMessage}>{error}</p>}

            <button
              disabled={requestingLogin}
              className={styles.button}
              type="submit"
            >
              {requestingLogin ? (
                <CircularProgress
                  size={24}
                  sx={{
                    color: "white",
                  }}
                />
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    );


  }
}