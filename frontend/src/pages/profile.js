import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getUserProfile, getSelfOrders, getProductByVariantId, markOrderItemAsDownloaded } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/Profile.module.css';
import { message } from 'antd';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const router = useRouter();
    const [token, setToken] = useState(null);
    const [userId, setUserId] = useState(null);

    const fetchUserProfile = useCallback(async () => {
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
    }, [token, router]);

    const fetchUserOrders = useCallback(async () => {
        try {
            const response = await getSelfOrders(userId);
            if (response.status === 200) {
                const detailedOrders = await Promise.all(response.data.map(async (order) => {
                    const detailedOrderItems = await Promise.all(order.orderItems.map(async (orderItem) => {
                        const variantResponse = await getProductByVariantId(orderItem.variant_id);
                        if (variantResponse.status === 200) {
                            return { ...orderItem, product: variantResponse.data };
                        } else {
                            throw new Error(`Failed to fetch variant details for variant_id ${orderItem.variant_id}`);
                        }
                    }));

                    return { ...order, orderItems: detailedOrderItems };
                }));
                setOrders(detailedOrders);
            } else {
                message.error('Failed to fetch user orders ', response);
            }
        } catch (error) {
            message.error('Error fetching user orders ', error);
        }
    }, [userId]);

    useEffect(() => {
        const storedToken = localStorage.getItem('access_token');
        const storedUserId = localStorage.getItem('user_id');
        setToken(storedToken);
        setUserId(storedUserId);
        if (!storedToken || !storedUserId) {
            router.push('/');
            return;
        }
        fetchUserProfile();
        fetchUserOrders();
    }, [router, fetchUserOrders, fetchUserProfile]);


    const handleDownload = async (orderId, variantId, downloadUrl) => {
        try {
            // Open a new window to download the file
            window.open(downloadUrl, '_blank');

            // Mark the order item as downloaded
            await markOrderItemAsDownloaded(orderId, variantId);

            // Refresh the user profile and order items to show the updated status
            await fetchUserProfile();
            await fetchUserOrders();

            message.success('File has been opened in new tab');
        } catch (error) {
            message.error('Error downloading file ', error);
        }
    };

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
                <h2>Your Orders</h2>
                {orders.map(order => (
                    <div key={order.id} className={styles.orderItem}>
                        <p>Order ID: {order.id}</p>
                        <p>Payment Status: {order.status}</p>
                        {order.orderItems.map(orderItem => (
                            // set array index as key
                            <div key={orderItem.index}>
                                <p>Product Name: {orderItem.product[0].title}</p>
                                <img src={orderItem.product[0].main_image} alt={orderItem.title} className={styles.orderItemImage} />
                                <p>Quantity: {orderItem.qty}</p>
                                {order.status === 'paid' && orderItem.status !== 'downloaded' && (
                                    <button
                                        onClick={() => handleDownload(order.id, orderItem.variant_id, orderItem.file)}
                                    >
                                        Download
                                    </button>
                                )}
                                {orderItem.status === 'downloaded' && (
                                    <span>Downloaded</span>
                                )}
                            </div>
                        ))}            </div>
                ))}
                <button onClick={logout} className={styles.button}>Logout</button>
            </div>
            <Footer />
        </div>
    );
};

export default Profile;
