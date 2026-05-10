"use client";

import { useEffect, useState } from "react";
import styles from "./PageLoading.module.css";
import { useLoading } from "../../context/LoadingContext";

export default function PageLoading() {
  const { loading, setLoading } = useLoading();
  const [render, setRender] = useState(loading);


  useEffect(() => {
    if (loading) {
      setRender(true);
    } else {
      // wait for animation before unmount
      const timeout = setTimeout(() => setRender(false), 350);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  if (!render) return null;

  return (
    <div
      className={`${styles.overlay} ${
        loading ? styles.enter : styles.exit
      }`}
    >
      <div className={styles.container}>
        <div className={styles.spinner}>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
        </div>

        <p className={styles.text}>Loading</p>
      </div>
    </div>
  );
}