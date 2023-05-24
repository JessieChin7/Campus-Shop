// _app.js
import Modal from 'react-modal';
import { useEffect } from 'react';
import '../styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Head from 'next/head'
// import 'antd/dist/antd.css';
function MyApp({ Component, pageProps }) {
    useEffect(() => {
        Modal.setAppElement('#__next');
    }, []);

    return (
        <div>
            <Head>
                <title>Campus Shop</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Component {...pageProps} style={{ fontFamily: 'Darker Grotesque' }} />
        </div>
    );
}

export default MyApp;
