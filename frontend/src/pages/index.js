// pages/HomePage.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTopFiveProducts, getAllProducts } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card } from 'react-bootstrap';
import styles from '../styles/HomePage.module.css';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import ProductCard from '../components/ProductCard';
const HomePage = () => {
    const [topFiveProducts, setTopFiveProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    function SampleNextArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
                className={className}
                style={{ ...style, display: "block", color: "black", fontSize: "2rem" }}
                onClick={onClick}
            >
                <FontAwesomeIcon icon={faChevronRight} />
            </div>
        );
    }

    function SamplePrevArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
                className={className}
                style={{ ...style, display: "block", color: "black", fontSize: "2rem" }}
                onClick={onClick}
            >
                <FontAwesomeIcon icon={faChevronLeft} />
            </div>
        );
    }

    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 5,
        slidesToScroll: 1,
        autoplay: true,
        arrows: true,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />
    };

    useEffect(() => {
        getTopFiveProducts().then(response => setTopFiveProducts(response.data));
        getAllProducts().then(response => setAllProducts(response.data));
    }, []);

    return (
        <div className={styles.container}>
            <Header />
            <section id="Hot-Notes" className={styles.hotNotesContainer}>
                <h1>Hot Notes</h1>
                <Slider {...settings}>
                    {topFiveProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </Slider>
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
                    <Slider {...settings}>
                        {allProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </Slider>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default HomePage;
