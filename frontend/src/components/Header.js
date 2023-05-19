// components/Header.js
import Link from 'next/link';
import styles from '../styles/Header.module.css';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { signInUser, signUpUser } from '../services/api';
import { useRouter } from 'next/router';
import { message } from 'antd';
const Header = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const role = 'user';
    const [isLogin, setIsLogin] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const router = useRouter();

    const openModal = () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            router.push('/profile');
        } else {
            setModalIsOpen(true);
        }
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const handleLogin = async () => {
        try {
            const response = await signInUser({ email, password, provider: 'native' });
            if (response.status === 200) {
                closeModal();
                router.push('/profile');
            } else {
                // Show error message
                message.error(response.data.message);
            }
        } catch (error) {
            // Handle error here
            message.error('An error occurred while trying to log in');
        }
    };

    const handleSignUp = async () => {
        try {
            const response = await signUpUser({ role, email, password, provider: 'native' });
            if (response.status === 200) {
                closeModal();
                router.push('/profile');
            } else {
                // Show error message
                message.error(response.data.message);
            }
        } catch (error) {
            // Show error message
            message.error('An error occurred while trying to sign up');
        }
    };

    useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            setCartCount(cart.reduce((sum, item) => sum + Number(item.qty), 0));
        };

        updateCartCount();
        window.addEventListener('storage', updateCartCount);
        return () => window.removeEventListener('storage', updateCartCount);
    }, []);

    return (<header className={styles.header}>
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
            <button className={`bi bi-bookmark ${styles.icon}`}></button>
            <Link href="/cart" className={styles.cart}>
                <div className={styles.cart}>
                    <button className={`bi bi-cart ${styles.icon}`}></button>
                    <span className={styles.cartCount}>{cartCount}</span>
                </div>
            </Link>
            <button onClick={openModal} className={`bi bi-person ${styles.icon}`}></button>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={{
                    content: {
                        width: '50%',
                        height: '50%',
                        alignContent: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        margin: 'auto',
                    },
                    overlay: {
                        backgroundColor: 'rgba(0,0,0,0.5)',
                    }
                }}
            >
                <h2 className={styles.modalTitle}>{isLogin ? 'Login' : 'Sign Up'}</h2>
                <div className={styles.inputGroup}>
                    <label>
                        Email:
                        <input className={styles.input} type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </label>
                    <label>
                        Password:
                        <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </label>
                </div>
                <div className={styles.buttonGroup}>
                    {isLogin ? (
                        <button onClick={handleLogin} className={styles.button}>Login</button>
                    ) : (
                        <button onClick={handleSignUp} className={styles.button}>Sign Up</button>
                    )}
                    <button onClick={() => setIsLogin(!isLogin)} className={styles.button}>
                        {isLogin ? 'Need to create an account?' : 'Already have an account?'}
                    </button>
                    <button onClick={closeModal} className={styles.button}>Cancel</button>
                </div>
            </Modal>
        </nav>
    </header>)

};
export default Header;
