import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta name="google-site-verification" content="DREkIltWR-E4a8MHVYMICHi2oPpJw96_jhV1J6mOAdY" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="Campus Shop - 筆記、電子檔筆記、北一女台大筆記專賣" />
                <meta name="keywords" content="筆記,電子檔筆記,北一女,台大筆記,網路書店,Campus Shop" />
                <meta property="og:title" content="Campus Shop" />
                <meta property="og:description" content="我們主要賣筆記、電子檔筆記、北一女台大筆記" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://campusshop.live/" />
                <meta property="og:image" content="https://campusshop.live/logo.png" />
                <title>Campus Shop</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <body style={{ fontFamily: 'Darker Grotesque', margin: 0 }}>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
