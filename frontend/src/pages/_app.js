// import '@/styles/globals.css';
import Modal from 'react-modal';
import { useEffect } from 'react';
function MyApp({ Component, pageProps }) {
    useEffect(() => {
        Modal.setAppElement('#__next');
    }, []);

    return (
        <Component {...pageProps} />
    );
}

export default MyApp;