// components/Header.js
import Link from 'next/link';
import styles from '../styles/Header.module.css';

const Header = () => (
    <header className={styles.header}>
        <nav className={styles.menu}>
            <Link href="/" className={styles.logo}>
                Campus Shop
            </Link>
            <Link href="/#Hot-Notes" className={styles.menuItem}>
                Hot Notes
            </Link>
            <Link href="/#Categories" className={styles.menuItem}>
                Categories
            </Link>
            <Link href="/#All-Notes" className={styles.menuItem}>
                All Notes
            </Link>
        </nav>
        <nav className={styles.rightHeader}>
            <input className={`form-control ${styles.search}`} type="search" placeholder="Search" aria-label="Search" />
            <i className={`bi bi-bookmark ${styles.icon}`} />
            <i className={`bi bi-cart ${styles.icon}`} />
            <i className={`bi bi-person ${styles.icon}`} />
        </nav>
    </header>
);

export default Header;
