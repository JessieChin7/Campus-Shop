import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getProductById, getShopeeReviews } from '../../services/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Carousel } from 'react-bootstrap';
import styles from '../../styles/ProductPage.module.css';
import { Button, Form } from 'react-bootstrap';

const ProductPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const [product, setProduct] = useState(null);
    const [isButtonClicked, setButtonClicked] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [selectedPart, setSelectedPart] = useState('');
    const [selectedQty, setSelectedQty] = useState(1);
    const [reviews, setReviews] = useState([]);

    const handleButtonClick = () => {
        if (isButtonClicked) {
            setButtonClicked(false);
        } else {
            setButtonClicked(true);
        }
    };
    const handleConfirmClick = () => {
        // If the user clicks the confirm button, add the product to the cart
        if (!selectedVersion || !selectedPart || !selectedQty) {
            alert("Please select version, part and quantity before adding to cart");
            return;
        }
        const variantKey = `${selectedVersion}_${selectedPart}`;
        const variant = product.variants.find(v => `${v.version}_${v.part}` === variantKey);
        if (!variant) {
            alert("Invalid version or part selected");
            return;
        }
        // Add the product to the cart
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.push({
            id: product.id,
            version: selectedVersion,
            part: selectedPart,
            qty: selectedQty,
            price: product.price,
            name: product.title,
            image: product.main_image,
            variant_id: variant.id
        });
        localStorage.setItem('cart', JSON.stringify(cart));
        // Trigger the storage event to update the cart in the header
        window.dispatchEvent(new Event('storage'));
    };
    useEffect(() => {
        if (id) {
            getProductById(id).then(response => {
                setProduct(response.data);
            });
        }
    }, [id]);

    useEffect(() => {
        if (product) {
            getShopeeReviews(product.shopee_id).then(response => {
                setReviews(response);
            });
        }
    }, [product]);


    if (!product) {
        return <div>Loading...</div>;
    }

    const images = product.images ? [product.main_image, ...JSON.parse(product.images)] : [];

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.productContainer}>
                <h1 className={styles.title}>{product.title}</h1>
                <p className={styles.hashtag}>{product.hashtag}</p>
                <div className={styles.carouselContainer}>
                    <div className={styles.buttonGroup}>
                        <Button variant="outline-dark" className={styles.roundButton}>筆記預覽</Button>
                        <Button
                            variant={isButtonClicked ? "dark" : "outline-dark"}
                            className={`${styles.roundButton} ${isButtonClicked ? styles.rotate : ''}`}
                            onClick={handleButtonClick}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = isButtonClicked ? "#ffffff" : "#E0DDC2"}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = isButtonClicked ? "#E0DDC2" : "#ffffff"}
                        >
                            <span
                                className={isButtonClicked ? styles.rotateBack : ''}
                                style={{ color: "#343a40" }}
                            // style={{ color: isButtonClicked ? "#ffffff" : "#343a40" }}
                            // onMouseOver={e => e.currentTarget.style.color = isButtonClicked ? "#343a40" : "#ffffff"}
                            // onMouseOut={e => e.currentTarget.style.color = isButtonClicked ? "#ffffff" : "#343a40"}
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
                                <option value="">Select a version...</option>
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
                                <option value="">Select a part...</option>
                                {Array.from(new Set(product.variants.map(v => v.part))).map(part => (
                                    <option key={part} value={part}>{part}</option>
                                ))}
                            </Form.Control>

                            <Form.Control
                                className={styles.selector}
                                type="number"
                                min="1"
                                value={selectedQty}
                                onChange={(e) => setSelectedQty(e.target.value)}
                            />
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
                        <h2>💰全套價格: NT${product.price}</h2>
                        <h2>👩🏻‍🎓筆記作者: {product.author}</h2>
                        <h2>✨筆記特色</h2>
                        <p className={styles.detail}>{product.description}</p>
                        <h2>🔔注意事項</h2>
                        <p className={styles.detail}>{product.note}</p>
                        <h2>🗃️主題目錄</h2>
                        <p className={styles.detail}>{product.catalog}</p>
                    </div>
                    <div className={styles.detailColumn}>
                        <h2>🫶🏻真心好評</h2>
                        <div className={styles.reviewContent}>
                            {reviews.map((review, index) => (
                                <div key={index} className={styles.review}>
                                    <div className={styles.review_username}>{review.author_username}: {'⭐'.repeat(review.rating_star)}</div>
                                    <div className={styles.review_comment}>{review.comment}</div>
                                    <div className={styles.review_time}>Posted: {new Date(review.ctime * 1000).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ProductPage;
