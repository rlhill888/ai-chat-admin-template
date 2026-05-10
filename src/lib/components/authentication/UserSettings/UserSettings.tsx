"use client";

import { useEffect, useState } from "react";
import styles from "./UserSettings.module.css";
import { Modal } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import User from "@/lib/dynamoDB/dynamoDbSchemaInterfaces/user";
import { setUserAdmin } from "@/lib/dynamoDB/helper/UserHelper";
import { useUser } from "../../context/UserContext";

export default function UserSettings({
  openModal,
  setOpenModal,
  selectedUser,
  setUsers,
}: {
  openModal: boolean;
  setOpenModal: Function;
  selectedUser: User | null;
  setUsers: Function;
}) {
  const { user: currentUser } = useUser();
  const isSelf = currentUser?.email === selectedUser?.email;
  const [form, setForm] = useState({ name: "", admin: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setForm({ name: selectedUser.name, admin: !!selectedUser.admin });
    }
  }, [selectedUser]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      await setUserAdmin(selectedUser.email, form.admin);
      setUsers((prev: User[]) =>
        prev.map((u) =>
          u.email === selectedUser.email
            ? { ...u, name: form.name, admin: form.admin }
            : u
        )
      );
      setOpenModal(false);
    } catch {
      // future error handling
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      id={styles.wrapper}
      open={openModal}
      onClose={() => setOpenModal(false)}
    >
      <div className={styles.card}>
        <h1 className={styles.title}>User Settings</h1>
        <p className={styles.subtitle}>{selectedUser?.email}</p>

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
              disabled={saving}
            />
          </label>

          <label className={styles.checkboxLabel}>
            <input
              name="admin"
              type="checkbox"
              checked={form.admin}
              onChange={handleChange}
              disabled={saving || isSelf}
              className={styles.checkbox}
            />
            Admin privileges
          </label>

          <button type="submit" className={styles.button} disabled={saving}>
            {saving ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
}
