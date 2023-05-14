// pages/HomePage.js
import { useState, useEffect } from 'react';
import { getTopFiveProducts } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card } from 'react-bootstrap';

const HomePage = () => {
    const [topFiveProducts, setTopFiveProducts] = useState([]);

    useEffect(() => {
        getTopFiveProducts().then(response => setTopFiveProducts(response.data));
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Header />
            <section
                id="Hot-Notes"
                style={{
                    width: '100vw',
                    height: '100vh',
                    textAlign: 'center',
                    background: 'rgba(0,255,0,0.02)',
                    padding: '20px',
                }}
            >
                <h1>Top 5 Products</h1>
                <div className="d-flex justify-content-around flex-wrap">
                    {topFiveProducts.map(product => (
                        <Card style={{ width: '240px' }} key={product.id}>
                            <Card.Img variant="top" src={product.main_image} />
                            <Card.Body>
                                <Card.Title>{product.title}</Card.Title>
                                <Card.Text>
                                    Price: {product.price}
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default HomePage;
