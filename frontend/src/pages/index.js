// pages/HomePage.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTopFiveProducts, getAllProducts } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card } from 'react-bootstrap';
import styles from '../styles/HomePage.module.css';

const HomePage = () => {
    const [topFiveProducts, setTopFiveProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    useEffect(() => {
        getTopFiveProducts().then(response => setTopFiveProducts(response.data));
        getAllProducts().then(response => setAllProducts(response.data));
    }, []);

    return (
        <div className={styles.container}>
            <Header />
            <section id="Hot-Notes" className={styles.hotNotesContainer}>
                <h1>Hot Notes</h1>
                <div className={styles.cardContainer}>
                    {topFiveProducts.map(product => (
                        <Link href={`/products/${product.id}`} key={product.id} className={styles.cardlinks}>
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
            <section id="Categories" className={styles.categoriesSection}>
                <div className={styles.categoryWrapper}>
                    <div className={styles.categoryItem}>
                        <div className={styles.categoryRectangle}><span>Institute</span></div>
                    </div>
                    <div className={styles.categoryItem}>
                        <div className={styles.categoryRectangle}><span>University</span></div>
                    </div>
                    <div className={styles.categoryItem}>
                        <div className={styles.categoryRectangle}>  <span>High School</span></div>
                    </div>
                    <div className={styles.categoryItem}>
                        <div className={styles.categoryRectangle}> <span>Junior High School</span></div>
                    </div>
                </div>
                <div className={styles.greenBox}> <span className={styles.categoriesLabel}>Categories</span></div>
            </section>
            <section id="All-Notes" className={styles.hotNotesContainer}>
                <h1>All Notes</h1>
                <div className={styles.cardContainer}>
                    {allProducts.map(product => (
                        <Link href={`/products/${product.id}`} key={product.id} className={styles.cardlinks}>
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
