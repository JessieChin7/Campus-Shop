// components/Header.js
import Link from 'next/link';
import { Anchor } from 'antd';
const Header = () => (
    <header>
        <nav style={{ padding: '20px', flexDirection: 'row', display: 'flex' }}>
            <Link href="/">Campus Shop</Link>
            <Anchor
                direction="horizontal"
                items={[
                    {
                        key: 'Hot Notes',
                        href: '#Hot-Notes',
                        title: 'Hot Notes',
                    },
                    {
                        key: 'Categories',
                        href: '#Categories',
                        title: 'Categories',
                    },
                    {
                        key: 'All Notes',
                        href: '#All-Notes',
                        title: 'All Notes',
                    },
                ]}
            />
        </nav>
    </header>
);

export default Header;
