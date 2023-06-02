import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getUserProfile, getSelfOrders, getProductByVariantId, markOrderItemAsDownloaded } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/Profile.module.css';
import { message, Collapse } from 'antd';
const { Panel } = Collapse;

const Profile = () => {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const router = useRouter();
    const [token, setToken] = useState(null);
    const [userId, setUserId] = useState(null);
    const [sortOrder, setSortOrder] = useState('desc');

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
                // document.querySelector('.orderSection').scrollTop = 0;
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
            <div className={styles.profileContainer}>
                <div className={styles.profile}>
                    <h2>會員資料</h2>
                    <div className={styles.profileSection}>
                        <p>會員姓名：{user.name}</p>
                        <p>電子郵件：{user.email}</p>
                        <p>會員種類：{user.provider}</p>
                        <button onClick={logout} className={styles.button}>Logout</button>
                    </div>
                </div>
                <div className={styles.order}>
                    <div className={styles.orderHead}>
                        <h2>歷史訂單</h2>
                        <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className={`bi bi-sort-up ${styles.icon}`} />
                    </div>
                    <div className={styles.orderSection}>

                        {orders.sort((a, b) => sortOrder === 'asc' ? a.id - b.id : b.id - a.id).map(order => (
                            <Collapse
                                className={styles.orderFrame}
                                onChange={() => {
                                    const orderSection = document.querySelector('.orderSection');
                                    if (orderSection) {
                                        orderSection.scrollTop = 0;
                                    }
                                }}
                            >
                                <Panel
                                    header={`Order ID: ${order.id} - Payment Status: ${order.status}`}
                                    key={order.id}
                                    className={`
                                        ${styles.orderItem}
                                        ${order.status === 'paid' ? styles.orderPaid : ''}
                                        ${order.status === 'unpaid' ? styles.orderUnpaid : ''}
                                        ${order.status === 'processing' ? styles.orderProcessing : ''}
                                    `}
                                >
                                    {order.orderItems.map(orderItem => (
                                        <div key={orderItem.index} className={styles.orderDetail}>
                                            <p>{orderItem.product[0].title}</p>
                                            <img src={orderItem.product[0].main_image} alt={orderItem.title} className={styles.orderItemImage} />
                                            <p>Quantity: {orderItem.qty}</p>
                                            {order.status === 'paid' && orderItem.status !== 'downloaded' && (
                                                <button
                                                    onClick={() => handleDownload(order.id, orderItem.variant_id, orderItem.file)}
                                                    className={styles.button}
                                                >
                                                    Download
                                                </button>
                                            )}
                                            {orderItem.status === 'downloaded' && (
                                                <span className={styles.downloaded}>Downloaded</span>
                                            )}
                                        </div>
                                    ))}
                                    <div className={styles.total}>
                                        <p>Total: {order.total}</p>
                                    </div>
                                </Panel>
                            </Collapse>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Profile;
