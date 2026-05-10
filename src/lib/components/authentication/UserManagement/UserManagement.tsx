"use client";

import { useEffect, useState } from "react";
import styles from "./UserManagement.module.css";
import RegisterUser from "../RegisterUser/RegisterUser";
import UserSettings from "../UserSettings/UserSettings";
import { getAllUsers, setUserStatus } from "@/lib/dynamoDB/helper/UserHelper";
import User from "@/lib/dynamoDB/dynamoDbSchemaInterfaces/user";
import PageLoading from "../../Loading/PageLoading/PageLoading";
import { useLoading } from "../../context/LoadingContext";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";



export default function UserManagement() {
  const { user: currentUser } = useUser()
  const [users, setUsers] = useState<User[]>([]);

  const [openModal, setOpenModal] = useState(false)
  const [settingsModal, setSettingsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { loading, setLoading } = useLoading();
  const router = useRouter();

  async function toggleUser(targetUser: User) {
    const newActive = !targetUser.active;
    try {
      await setUserStatus(targetUser.email, newActive);
      setUsers((prev) =>
        prev.map((u) =>
          u.email === targetUser.email
            ? { ...u, active: newActive, statusSetToOff: newActive ? undefined : true }
            : u
        )
      );
    } catch {
      // future error handling
    }
  }

  useEffect(() => {
    async function getAndSetUsers() {
      if(!currentUser?.admin){
        router.push("/")
      }
      setLoading(true)
      try {
        const users = await getAllUsers();
        setUsers(users)
        setLoading(false)
      } catch (error) {
        // future error handling
        setLoading(false)
      }

    }

    getAndSetUsers()
  }, [currentUser])

  return (
    <div className={styles.wrapper}>
      <RegisterUser setUsers={setUsers} openModal={openModal} setOpenModal={setOpenModal} />
      <UserSettings openModal={settingsModal} setOpenModal={setSettingsModal} selectedUser={selectedUser} setUsers={setUsers} />
      <div className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
        <button
          onClick={() => {
            setOpenModal(true)
          }}
          className={styles.createButton}>
          + Register New User
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.listHeader}>
          <span>Name</span>
          <span>Email</span>
          <span>Status</span>
          <span></span>
        </div>

        {users.map((user) => {
          if (user.registrationLink) {
            return (
              <div key={user.email} className={styles.row}>
                <span className={styles.name}>{user.name}</span>
                <span className={styles.email}>{user.email}</span>
                <div>
                  <button
                    type="button"
                    onClick={async () => {
                      const fullLink = `${window.location.origin}/user-registration/${user.registrationLink}`;

                      try {
                        await navigator.clipboard.writeText(fullLink);
                      } catch (error) {
                        // future error handling
                      }
                    }}
                    className={styles.registrationButton}
                  >
                    Copy Registration Link
                  </button>
                </div>


              </div>
            )
          } else {
            return (
              <div key={user.email} className={styles.row}>
                <span className={styles.name}>{user.name}</span>
                <span className={styles.email}>{user.email}</span>

                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={user.active}
                    onChange={() => toggleUser(user)}
                    disabled={user.email === currentUser?.email || !!user.admin}
                  />
                  <span className={styles.slider}></span>
                </label>

                <button
                  className={styles.settingsButton}
                  onClick={() => {
                    setSelectedUser(user);
                    setSettingsModal(true);
                  }}
                >
                  Settings
                </button>
              </div>
            )
          }

        }

        )}
      </div>
    </div>
  );
}