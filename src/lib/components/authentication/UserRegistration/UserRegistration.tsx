"use client";

import { useEffect, useState } from "react";
import styles from "./UserRegistration.module.css";
import { createNewUser, getUserByRegistrationLink, registerUser } from "@/lib/dynamoDB/helper/UserHelper";
import { useParams, useRouter } from "next/navigation";
import PageLoading from "../../Loading/PageLoading/PageLoading";
import User from "@/lib/dynamoDB/dynamoDbSchemaInterfaces/user";
import { formatUSPhoneNumber } from "@/lib/util/stringUtil";
import { useLoading } from "../../context/LoadingContext";
import { useGetUserOrRedirect } from "../../hooks/useGetUserOrRedirect";
import { getMe } from "@/lib/dynamoDB/helper/Me";
import { login } from "@/lib/dynamoDB/helper/AuthHelper";

export default function UserRegistration({
  email
}
  :
  {
    email: string;
  }) {
  const params = useParams();
  const router = useRouter()

  const id = params.id;
  const { loading, setLoading } = useLoading();
  const [user, setUser] = useState<User | null>(null)
  const [noRegistrationLinkFound, setNoRegistrationLinkFound] = useState(false)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [renderComp, setRenderComp] = useState(false)

  useEffect(() => {
    setLoading(true)

    async function getUser() {
      try {

        const user = await getMe()
        if(user.user){
          router.push("/")
          return true
        }
      } catch (error) {
        // future error handling
      }
    }
    async function getRegistrationLinkUser() {
      try {
        if(await getUser()){
          return 
        }
        if (id) {
          const user = await getUserByRegistrationLink(id as string)
          if (user) {
            setUser(user)
          } else {
            setNoRegistrationLinkFound(true)
          }

        }
        setRenderComp(true)
        setLoading(false)
      } catch (error) {
        setLoading(false)
        // future error handling
      }
    }

    getRegistrationLinkUser()
  }, [])
  async function handleSubmit(e: React.FormEvent) {
    setLoading(true)
    e.preventDefault();

    if (password !== confirmPassword) {
      setLoading(false)
      setError("Passwords do not match");
      return;
    }
    try {
      const newRegisteredUser = await registerUser({
        ...user as User,
        password,
        phoneNumber: formatUSPhoneNumber(phoneNumber)

      })
      const loginRequest = await login({
        email: user!.email ,
        password: password
      })
      router.push("/")
    } catch (error) {
      // future error handling
      setLoading(false)
    }
  }
  if (!renderComp) {
    return (
      <></>
    )
  }
  if (noRegistrationLinkFound) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>⚠</div>

          <h1 className={styles.title}>Registration Not Found</h1>

          <p className={styles.text}>
            The registration link is invalid or has already been used.
          </p>
        </div>
      </div>
    )

  }
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Complete Your Registration</h1>
        <p className={styles.subtitle}>
          Set your password to activate your account
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Email
            <input className={styles.inputDisabled} value={user ? user.email : ""} disabled />
          </label>

          <label className={styles.label}>
            Phone Number
            <input
              type="tel"
              className={styles.input}
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </label>

          <label className={styles.label}>
            Password
            <input
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label className={styles.label}>
            Confirm Password
            <input
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.button}>
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

