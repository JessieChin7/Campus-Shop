import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getUserProfile } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/Profile.module.css';
import { message } from 'antd';
const Profile = () => {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/');
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await getUserProfile(token);
                if (response.status === 200) {
                    setUser(response.data.data);
                } else {
                    message.error('Failed to fetch user profile ', response);
                    localStorage.removeItem('access_token');
                    router.push('/');
                }
            } catch (error) {
                message.error('Error fetching user profile ', error);
                localStorage.removeItem('access_token');
                router.push('/');
            }
        };

        fetchUserProfile();
    }, [router]);

    const logout = () => {
        // remove the access token from local storage
        localStorage.removeItem('access_token');
        // remove the cart from local storage
        localStorage.removeItem('cart');
        // redirect to the home page
        router.push('/');
    };


    if (!user) {
        return null;
    }

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.profileontainer}>
                <h1>Profile</h1>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <p>{user.provider}</p>
                {/* Add a logout button */}
                <button onClick={logout} className={styles.button}>Logout</button>
            </div>
            <Footer />
        </div>
    );
};

export default Profile;
