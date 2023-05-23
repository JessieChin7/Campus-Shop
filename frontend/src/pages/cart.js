import styles from '../styles/Cart.module.css';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Form, Button } from 'react-bootstrap';
import { createOrder } from '../services/api';
const Cart = () => {
    const [cart, setCart] = useState([]);

    const handleRemove = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('storage'));
    };

    const handleQtyChange = (index, newQty) => {
        const newCart = [...cart];
        newCart[index].qty = newQty;
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('storage'));
    };

    const handleCheckout = async () => {
        try {
            const response = await createOrder({
                items: cart,
                total: cart.reduce((total, item) => total + item.price * item.qty, 0),
                payment: 'paypal',
                user_id: localStorage.getItem('user_id'),
            });
            console.log({
                items: cart,
                total: cart.reduce((total, item) => total + item.price * item.qty, 0),
                payment: 'paypal',
                user_id: localStorage.getItem('user_id'),
            });
            // Redirect to the PayPal checkout page
            // Show chekcout success message
            alert('Checkout success');
            // Clear the cart
            localStorage.setItem('cart', JSON.stringify([]));
            window.dispatchEvent(new Event('storage'));
            // reload the page
            window.location.reload();
        } catch (error) {
            console.error('Error during checkout:', error);
        }
    };

    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        setCart(storedCart);
    }, []);

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.CartContainer}>
                <h1>Shopping Cart</h1>
                {cart.length === 0 && <p>Your cart is empty</p>}
                {cart.map((item, index) => (
                    <div key={index} className={styles.cartItem}>
                        <img src={item.image} alt={item.name} className={styles.cartItemImage} />
                        <h2 className={styles.cartItemName}>{item.name}</h2>
                        <p>Version: {item.version}</p>
                        <p>Part: {item.part}</p>
                        <Form.Control
                            className={styles.qtyInput}
                            placeholder="Qty"
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleQtyChange(index, e.target.value)}
                        />
                        <Button variant="danger" onClick={() => handleRemove(index)} className={`bi bi-x ${styles.removeButton}`}></Button>
                    </div>
                ))}
            </div>
            <div className={styles.checkoutSection}>
                <h2>Total: ${cart.reduce((total, item) => total + item.price * item.qty, 0)}</h2>
                <Button variant="success" onClick={handleCheckout}>Checkout</Button>
            </div>
            <Footer />
        </div>
    );
};

export default Cart;
