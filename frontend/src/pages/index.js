// pages/HomePage.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTopFiveProducts } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card } from 'react-bootstrap';
import styles from '../styles/HomePage.module.css';  // 引入 CSS 模組

const HomePage = () => {
    const [topFiveProducts, setTopFiveProducts] = useState([]);

    useEffect(() => {
        getTopFiveProducts().then(response => setTopFiveProducts(response.data));
    }, []);

    return (
        <div className={styles.container}>
            <Header />
            <section id="Hot-Notes" className={styles.hotNotesContainer}>
                <h1>Hot Notes</h1>
                <div className={styles.cardContainer}>
                    {topFiveProducts.map(product => (
                        <Link href={`/products/${product.id}`} key={product.id}>
                            <Card className={styles.card}>
                                <Card.Img className={styles.cardImage} variant="top" src={product.main_image} />
                                <Card.Body>
                                    <Card.Title>{product.title}</Card.Title>
                                    <Card.Text>
                                        NT$ {product.price}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default HomePage;
