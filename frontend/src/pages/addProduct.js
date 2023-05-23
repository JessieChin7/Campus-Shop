import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/NewProduct.module.css';
import { createProduct } from '../services/api';
export default function NewProduct() {
    const [formState, setFormState] = useState({
        category: '',
        title: '',
        description: '',
        price: '',
        note: '',
        author: '',
        main_image: null,
        images: [],
        file: null,
        catalog: '',
        hashtag: '',
        shopee_id: '',
        status: '',
        variants: [
            { version: '', stock: '', part: '' },
        ],
    });

    const handleInputChange = (event) => {
        if (event.target.files) {
            if (event.target.files.length > 1) { // 如果是檔案集
                setFormState({
                    ...formState,
                    [event.target.name]: Array.from(event.target.files),
                });
            } else { // 如果只有一個檔案
                setFormState({
                    ...formState,
                    [event.target.name]: event.target.files[0],
                });
            }
        } else {
            setFormState({
                ...formState,
                [event.target.name]: event.target.value,
            });
        }
    };


    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('category', formState.category);
        formData.append('title', formState.title);
        formData.append('description', formState.description);
        formData.append('price', formState.price);
        formData.append('note', formState.note);
        formData.append('author', formState.author);
        formData.append('main_image', formState.main_image);
        if (formState.images) {
            if (Array.isArray(formState.images)) { // 多張圖片的情況
                for (let file of formState.images) {
                    formData.append('images', file);
                }
            } else { // 只有一張圖片的情況
                formData.append('images', formState.images);
            }
        }
        formData.append('catalog', formState.catalog);
        formData.append('hashtag', formState.hashtag);
        formData.append('file', formState.file);
        formData.append('variants', JSON.stringify(formState.variants));

        // try api and catch error
        try {
            console.log(formData);
            const result = await createProduct(formData);
            console.log(result);
            alert('Product created successfully!');
        } catch (error) {
            console.log(error);
            alert('Error creating product!');
        }
    };

    const handleVariantChange = (index, event) => {
        const newVariants = [...formState.variants];
        newVariants[index][event.target.name] = event.target.value;
        setFormState({ ...formState, variants: newVariants });
    };

    const handleAddVariant = () => {
        setFormState({
            ...formState,
            variants: [...formState.variants, { version: '', stock: '', part: '' }],
        });
    };

    return (
        <div className={styles.container}>
            <Header />
            <h1>Add New Product</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <input type="text" name="category" id="category" className="form-control" onChange={handleInputChange} required />

                    <label htmlFor="title">Title</label>
                    <input type="text" name="title" id="title" className="form-control" onChange={handleInputChange} required />

                    <label htmlFor="description">Description</label>
                    <input type="text" name="description" id="description" className="form-control" onChange={handleInputChange} required />

                    <label htmlFor="price">Price</label>
                    <input type="text" name="price" id="price" className="form-control" onChange={handleInputChange} required />

                    <label htmlFor="note">Note</label>
                    <input type="text" name="note" id="note" className="form-control" onChange={handleInputChange} required />

                    <label htmlFor="author">Author</label>
                    <input type="text" name="author" id="author" className="form-control" onChange={handleInputChange} required />

                    <label htmlFor="main_image">Main Image</label>
                    <input type="file" name="main_image" id="main_image" className="form-control" onChange={handleInputChange} required />

                    <label htmlFor="images">Images</label>
                    <input type="file" name="images" id="images" multiple className="form-control" onChange={handleInputChange} required />

                    <label htmlFor="catalog">Catalog</label>
                    <input type="text" name="catalog" id="catalog" className="form-control" onChange={handleInputChange} required />

                    <label htmlFor="hashtag">Hashtag</label>
                    <input type="text" name="hashtag" id="hashtag" className="form-control" onChange={handleInputChange} required />

                    <label htmlFor="file">File</label>
                    <input type="file" name="file" id="file" className="form-control" onChange={handleInputChange} required />

                    {formState.variants.map((variant, index) => (
                        <div key={index}>
                            <label htmlFor={`variant${index}Version`}>Variant {index + 1} Version</label>
                            <input type="text" name="version" id={`variant${index}Version`} value={variant.version} className="form-control" onChange={(event) => handleVariantChange(index, event)} required />

                            <label htmlFor={`variant${index}Stock`}>Stock</label>
                            <input type="number" name="stock" id={`variant${index}Stock`} value={variant.stock} className="form-control" onChange={(event) => handleVariantChange(index, event)} required />

                            <label htmlFor={`variant${index}Part`}>Part</label>
                            <input type="text" name="part" id={`variant${index}Part`} value={variant.part} className="form-control" onChange={(event) => handleVariantChange(index, event)} required />
                        </div>
                    ))}
                    <button type="button" className="btn btn-secondary" onClick={handleAddVariant}>Add Variant</button>


                </div>
                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
            <Footer />
        </div>
    );
}
