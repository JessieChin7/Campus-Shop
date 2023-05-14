// _app.js
import Modal from 'react-modal';
import { useEffect } from 'react';
import '../styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
function MyApp({ Component, pageProps }) {
    useEffect(() => {
        Modal.setAppElement('#__next');
    }, []);

    return (
        <Component {...pageProps} style={{ fontFamily: 'Darker Grotesque' }} />
    );
}

export default MyApp;
