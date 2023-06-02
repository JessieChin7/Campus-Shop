// components/ProductCard.js
import { Card } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/ProductCard.module.css';

const ProductCard = ({ product }) => (
    <Link href={`/products/${product.id}`} className={styles.cardlinks}>
        <Card className={styles.card}>
            <div className={styles.cardImage}>
                <Image
                    src={product.main_image}
                    alt={product.title}
                    // layout="fill"
                    // objectFit="cover"
                    className={styles.cardImage}
                />
            </div>
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
