import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getSearchResults } from '../services/api';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/Search.module.css';
const Search = () => {
    const router = useRouter();
    const keyword = router.query.keyword;
    const [products, setProducts] = useState([]);

    useEffect(() => {
        if (!keyword) return;
        const fetchSearchResults = async () => {
            const results = await getSearchResults(keyword);
            console.log(results.data);
            setProducts(results.data);
        };
        fetchSearchResults();
    }, [keyword]);

    return (
        <div className={styles.container}>
            <Header />
            <h1>Search Results for "{keyword}"</h1>
            <div className={styles.searchContainer}>
                {
                    // if no results or if have results
                    products.length === 0 ? <h2>No results found</h2> :
                        <div>
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                }
            </div>
            <Footer />
        </div>
    );
};

export default Search;
