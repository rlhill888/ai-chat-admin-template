"use client";

import { useState } from "react";
import styles from "./RegisterUser.module.css";
import { Modal } from "@mui/material";
import { createNewUser } from "@/lib/dynamoDB/helper/UserHelper";
import CircularProgress from "@mui/material/CircularProgress";
import User from "@/lib/dynamoDB/dynamoDbSchemaInterfaces/user";

export default function RegisterUser({
  openModal,
  setOpenModal,
  setUsers
}:
  {
    openModal: boolean;
    setOpenModal: Function;
    setUsers: Function;
  }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [formState, setFormState] = useState<'Register User' | 'Copy Link'>("Register User")
  const [copied, setCopied] = useState(false);
  const [makingRequest, setMakingRequest] = useState(false)
  const [registrationLink, setRegistrationLink] = useState("")

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    setMakingRequest(true)
    e.preventDefault();
    try {
      const newUser = await createNewUser(
        {
          ...form,
          active: false
        })
      const link = `${window.location.origin}/user-registration/${newUser.$metadata.requestId}`;
      setRegistrationLink(link);
      setUsers((previous: User[])=>{
        let newArray = [...previous]
        newArray.push({
          name: form.name,
          email: form.email,
          password: "-",
          active: false,
          registrationLink: newUser.$metadata.requestId
        })
        return newArray
      })
      setForm({
        name: "",
        email: "",
        password: "",
      })
      setFormState('Copy Link')
      setMakingRequest(false)
    } catch (error) {
      setMakingRequest(false)
      // future error handling
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(registrationLink);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  }

  return (

    <Modal
      id={styles.wrapper}
      open={openModal}
      onClose={() => {
        setOpenModal(false)
        setFormState('Register User')
        setRegistrationLink('')
      }}
    >
      <div className={styles.card}>
        {
          formState === 'Copy Link'
            ?
            <div>
              <p className={styles.label}>
                Copy this link and send it to the person who is registering to complete the sign up process
              </p>

              <div className={styles.copyBox}>
                <span className={styles.link}>{registrationLink}</span>

                <button onClick={handleCopy} className={styles.copyButton}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            :
            <div>
              <h1 className={styles.title}>Create New User</h1>
              <p className={styles.subtitle}>Add a new user to your system</p>

              <form onSubmit={handleSubmit} className={styles.form}>
                <label className={styles.label}>
                  Full Name
                  <input
                    name="name"
                    className={styles.input}
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                    disabled={makingRequest}
                  />
                </label>

                <label className={styles.label}>
                  Email
                  <input
                    name="email"
                    type="email"
                    className={styles.input}
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    disabled={makingRequest}
                  />
                </label>

                <button
                  disabled={makingRequest}
                  type="submit" className={styles.button}>
                  {
                    makingRequest ?
                      <CircularProgress
                        size={24}
                        sx={{
                          color: "white",
                        }}
                      />
                      :
                      "Create User"
                  }
                </button>
              </form>
            </div>

        }
      </div>

    </Modal>
  );
}