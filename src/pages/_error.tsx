import { NextPage } from 'next';

interface ErrorProps {
    statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#1a1a2e',
            color: 'white',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <h1 style={{ fontSize: '4rem', margin: 0, color: '#8b5cf6' }}>
                {statusCode || 'Error'}
            </h1>
            <p style={{ color: '#9ca3af', marginTop: '1rem' }}>
                {statusCode === 404
                    ? 'Page Not Found'
                    : 'An error occurred'}
            </p>
            <a
                href="/"
                style={{
                    color: '#818cf8',
                    marginTop: '1.5rem',
                    textDecoration: 'none'
                }}
            >
                Return Home
            </a>
        </div>
    );
};

Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default Error;
