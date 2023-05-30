// components/ProductCard.js
import { Card } from 'react-bootstrap';
import Link from 'next/link';
import styles from '../styles/ProductCard.module.css';

const ProductCard = ({ product }) => (
    <Link href={`/products/${product.id}`} className={styles.cardlinks}>
        <Card className={styles.card}>
            <Card.Img className={styles.cardImage} variant="top" src={product.main_image} alt={product.title} />
            <Card.Body>
                <Card.Title>{product.title}</Card.Title>
                <Card.Text>
                    NT$ {product.price}
                </Card.Text>
            </Card.Body>
        </Card>
    </Link>
);

export default ProductCard;
