import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getProductById } from '../../services/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Carousel } from 'react-bootstrap';
import styles from '../../styles/ProductPage.module.css';
import { Button } from 'react-bootstrap';
// import StackCards from '../../components/StackCards';
const ProductPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const [product, setProduct] = useState(null);

    useEffect(() => {
        if (id) {
            getProductById(id).then(response => {
                setProduct(response.data[0]);
            });
        }
    }, [id]);  // Include id in the dependency array

    if (!product) {
        return <div>Loading...</div>;
    }

    // Parse the images from the product and add the main image at the first position
    const images = product.images ? [product.main_image, ...JSON.parse(product.images)] : [];


    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.productContainer}>
                <h1>{product.title}</h1>
                <p>{product.hashtag}</p>
                <div className={styles.carouselContainer}>
                    <div className={styles.buttonGroup}>
                        <Button variant="outline-dark" className={styles.roundButton}>筆記預覽</Button>
                        <Button variant="outline-dark" className={styles.roundButton}>加入購物車</Button>
                        <Button variant="outline-dark" className={styles.roundButton}>加入收藏</Button>
                        <Button variant="outline-dark" className={styles.roundButton}>直接購買</Button>
                    </div>
                    <Carousel className={styles.carousel}>
                        {images.map((image, index) => (
                            <Carousel.Item key={index}>
                                <img className="d-block w-100" src={image} alt={`Slide ${index}`} />
                            </Carousel.Item>
                        ))}
                    </Carousel>
                </div>
                <div className={styles.details}>
                    <div className={styles.detailColumn}>
                        <h2>Price: NT${product.price}</h2>
                        <h2>Author: {product.author}</h2>
                        <p>{product.description}</p>
                        <p>{product.note}</p>
                        <p>{product.catalog}</p>
                    </div>
                    <div className={styles.detailColumn}>
                        <h2>Price: NT${product.price}</h2>
                        <h2>Author: {product.author}</h2>
                        <p>{product.description}</p>
                        <p>{product.note}</p>
                        <p>{product.catalog}</p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ProductPage;
