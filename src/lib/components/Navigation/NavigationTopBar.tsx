"use client";

import Link from "next/link";
import styles from "./NavigationTopBar.module.css";
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { logout } from "@/lib/dynamoDB/helper/AuthHelper";
import { useRouter } from "next/navigation";
import { useLoading } from "../context/LoadingContext";
import { useGetUserOrRedirect } from "../hooks/useGetUserOrRedirect";
import { useUser } from "../context/UserContext";
import { useState } from "react";



export default function Navigation() {

  const router = useRouter()
  const { setLoading } = useLoading();
  const { user } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogOut() {
    setLoading(true)
    setMobileMenuOpen(false)
    try {
      const logoutRequest = await logout()
      console.log(logoutRequest)
      setLoading(false)
      router.push('/login')
    } catch (error) {
      setLoading(false)
      console.log(error)
    }
  }

  if (!user) {
    return (<></>)
  }

  return (
    <div className={styles.hoverZone}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>COMPANY_NAME_PLACEHOLDER AI Chat Portal</div>

        {user.admin ? (
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="/user-management" className={styles.navLink}>User Management</Link>
            <Link href="/edit-ai-prompt" className={styles.navLink}>Edit Ai Prompt</Link>
            <button className={styles.logoutButton} onClick={handleLogOut}>
              <LogoutIcon />
            </button>
          </div>
        ) : (
          <div className={styles.navLinks}>
            <button className={styles.logoutButton} onClick={handleLogOut}>
              <LogoutIcon />
            </button>
          </div>
        )}

        <button
          className={styles.hamburger}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          {user.admin && (
            <>
              <Link href="/" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link href="/user-management" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>User Management</Link>
              <Link href="/edit-ai-prompt" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Edit AI Prompt</Link>
            </>
          )}
          <button className={styles.mobileLogoutButton} onClick={handleLogOut}>
            <LogoutIcon fontSize="small" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}