import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getProductById } from '../../services/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Carousel } from 'react-bootstrap';
import styles from '../../styles/ProductPage.module.css';
import { Button, Form } from 'react-bootstrap';
// import StackCards from '../../components/StackCards';
const ProductPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const [product, setProduct] = useState(null);
    const [isButtonClicked, setButtonClicked] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [selectedPart, setSelectedPart] = useState('');
    const handleButtonClick = () => {
        if (isButtonClicked) {
            setButtonClicked(false);
        } else {
            setButtonClicked(true);
        }
    };
    const handleConfirmClick = () => {
        console.log(`Added items of version ${selectedVersion} part ${selectedPart} to the cart.`);
    };

    useEffect(() => {
        if (id) {
            getProductById(id).then(response => {
                setProduct(response.data);
            });
        }
    }, [id]);

    if (!product) {
        return <div>Loading...</div>;
    }

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
                        <Button
                            variant={isButtonClicked ? "dark" : "outline-dark"}
                            className={`${styles.roundButton} ${isButtonClicked ? styles.rotate : ''}`}
                            onClick={handleButtonClick}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = isButtonClicked ? "#ffffff" : "#343a40"}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = isButtonClicked ? "#343a40" : "#ffffff"}
                        >
                            <span
                                className={isButtonClicked ? styles.rotateBack : ''}
                                style={{ color: isButtonClicked ? "#ffffff" : "#343a40" }}
                                onMouseOver={e => e.currentTarget.style.color = isButtonClicked ? "#343a40" : "#ffffff"}
                                onMouseOut={e => e.currentTarget.style.color = isButtonClicked ? "#ffffff" : "#343a40"}
                            >
                                {/* {isButtonClicked ? 'V' : '加入購物車'} */}
                                加入購物車
                            </span>
                        </Button>
                        <Button variant="outline-dark" className={styles.roundButton}>加入收藏</Button>
                        <Button variant="outline-dark" className={styles.roundButton}>直接購買</Button>
                    </div>
                    <div className={`${styles.box}`}>
                        <div className={`${styles.variantBox} ${isButtonClicked ? styles.show : ''}`}>
                            <Form.Control
                                className={styles.selector}
                                as="select"
                                value={selectedVersion}
                                onChange={(e) => setSelectedVersion(e.target.value)}
                            >
                                {Array.from(new Set(product.variants.map(v => v.version))).map(version => (
                                    <option key={version} value={version}>{version}</option>
                                ))}
                            </Form.Control>
                            <Form.Control
                                className={styles.selector}
                                as="select"
                                value={selectedPart}
                                onChange={(e) => setSelectedPart(e.target.value)}
                            >
                                {Array.from(new Set(product.variants.map(v => v.part))).map(part => (
                                    <option key={part} value={part}>{part}</option>
                                ))}
                            </Form.Control>
                            <Button className={styles.button} variant="primary" onClick={handleConfirmClick}>確認</Button>
                        </div>
                        <Carousel className={`${styles.carousel} ${isButtonClicked ? '' : styles.carousel_move} `}>
                            {images.map((image, index) => (
                                <Carousel.Item key={index}>
                                    <img className="d-block w-100" src={image} alt={`Slide ${index}`} />
                                </Carousel.Item>
                            ))}
                        </Carousel>
                    </div>
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
                        {/* <h2>{product.variants}</h2> */}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ProductPage;
