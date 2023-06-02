import styles from '../styles/Cart.module.css';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Form, Button } from 'react-bootstrap';
import { createOrder, confirmOrder } from '../services/api';
import Web3 from 'web3';
const Cart = () => {
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('ether');

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
        // check token
        if (!localStorage.getItem('access_token')) {
            alert('Please sign in to checkout');
            return;
        }
        if (paymentMethod === 'ether') {
            const provider = window.ethereum;
            if (!provider) {
                alert('Please install MetaMask first');
                return;
            }

            const web3 = new Web3(provider);

            // Request user account address
            try {
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];

                // Set the recipient address
                const recipientAddress = '0x7cfB6ccE8bF766dF82fE601A2F145416f02f88bB';
                const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=ETH');
                const data = await response.json();
                const ethPrice = data.data.rates.TWD;
                const totalPriceInNTD = cart.reduce((total, item) => total + item.price * item.qty, 0);
                const ethAmount = totalPriceInNTD / ethPrice;
                const weiAmount = web3.utils.toWei((ethAmount).toString(), 'ether');
                const weiAmountInHex = web3.utils.toHex(weiAmount);
                // Create the transaction
                const transactionParameters = {
                    to: recipientAddress,
                    from: account,
                    value: weiAmountInHex,
                };

                // Send the transaction
                const hash_value = await provider.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters],
                });
                alert(`交易處理中，請稍等。請不要關閉視窗
                Transaction hash: ${hash_value}`);

                // Call checkout API with necessary parameters
                const res = await createOrder({
                    // chain: 'ethereum',
                    // hash_value,
                    // order: {
                    //     shipping: 'delivery',
                    //     payment: 'virtual',
                    //     subtotal: totalPriceInNTD,
                    //     total: totalPriceInNTD, // You might want to add shipping fees here
                    //     list: cart,
                    // },
                    items: cart,
                    total: cart.reduce((total, item) => total + item.price * item.qty, 0),
                    payment: 'virtual',
                    user_id: localStorage.getItem('user_id'),
                    // eth: weiAmountInHex,
                });
                const orderId = res.data.orderId;
                confirmOrder(orderId).catch(error => {
                    console.error('Error during checkout:', error);
                });

                // Clear the cart
                localStorage.setItem('cart', JSON.stringify([]));
                window.dispatchEvent(new Event('storage'));
                // reload the page
                window.location.reload();
                // Show chekcout processing message
                alert('Checkout is processing, you could found the note file in profile page when it is complete.');
            } catch (error) {
                console.error('Error during checkout:', error);
            }
        } else {
            try {
                const response = await createOrder({
                    items: cart,
                    total: cart.reduce((total, item) => total + item.price * item.qty, 0),
                    payment: 'paypal',
                    user_id: localStorage.getItem('user_id'),
                });

                const orderId = response.data.orderId;

                // Assume that the payment was successful and the user was redirected back to our site,
                // we confirm the order now without waiting for it.
                confirmOrder(orderId).catch(error => {
                    console.error('Error during checkout:', error);
                });

                // Clear the cart
                localStorage.setItem('cart', JSON.stringify([]));
                window.dispatchEvent(new Event('storage'));
                // reload the page
                window.location.reload();
                // Show chekcout processing message
                alert('Checkout is processing, you could found the note file in profile page when it is complete.');
            } catch (error) {
                console.error('Error during checkout:', error);
            }
        }
    };


    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        setCart(storedCart);
    }, []);

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.subContainer}>
                <div className={styles.CartContainer}>
                    <h1>購物車</h1>
                    {cart.length === 0 && <p className={styles.reminder}>你的購物車是空的哦！🥺快去逛逛吧🛒</p>}
                    {cart.map((item, index) => (
                        <div key={index} className={styles.cartItem}>
                            <img src={item.image} alt={item.title} className={styles.cartItemImage} />
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
                    <div className={styles.checkoutSub}>
                        <h2>總金額 TWD {cart.reduce((total, item) => total + item.price * item.qty, 0)}</h2>
                        {/* <div className={styles.checkoutDetail}>
                        <p>Total: TWD {cart.reduce((total, item) => total + item.price * item.qty, 0)}</p>
                    </div> */}
                        <h2 className={styles.paySection}>付款方式
                            <Form.Control as="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={styles.paySelect}>
                                <option value="paypal" disabled="true">PayPal</option>
                                <option value="ether">Ethereum</option>
                            </Form.Control>
                        </h2>
                    </div>
                    <Button variant="success" onClick={handleCheckout} className={styles.roundButton}>Checkout</Button>
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default Cart;
