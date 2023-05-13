// pages/HomePage.js
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
// import { getHotNotes, getCategories, getAllNotes } from '../services/api';

const HomePage = () => {
    const [hotNotes, setHotNotes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allNotes, setAllNotes] = useState([]);

    // useEffect(() => {
    //     getHotNotes().then(response => setHotNotes(response.data));
    //     getCategories().then(response => setCategories(response.data));
    //     getAllNotes().then(response => setAllNotes(response.data));
    // }, []);

    return (
        <div>
            <Header />
            <section
                id="Hot-Notes"
                style={{
                    width: '100vw',
                    height: '100vh',
                    textAlign: 'center',
                    background: 'rgba(0,255,0,0.02)',
                }}
            />
            <section
                id="Categories"
                style={{
                    width: '100vw',
                    height: '100vh',
                    textAlign: 'center',
                    background: 'rgba(0,0,255,0.02)',
                }}
            />
            <section
                id="All-Notes"
                style={{ width: '100vw', height: '100vh', textAlign: 'center', background: '#FFFBE9' }}
            />

            <Footer />
        </div>
    );
};

export default HomePage;
