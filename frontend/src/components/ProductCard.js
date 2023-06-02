// components/ProductCard.js
import { Card } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/ProductCard.module.css';

const ProductCard = ({ product }) => (
    <Link href={`/products/${product.id}`} className={styles.cardlinks}>
        <Card className={styles.card}>
            <div className={styles.imageContainer}>
                <Image
                    src={product.main_image}
                    alt={product.title}
                    layout="responsive"
                    width={240}
                    height={240}
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
