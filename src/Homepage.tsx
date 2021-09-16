import { css } from '@emotion/css';
import { useEffect, useState } from 'react';
import Mic from './Mic';
import { IMicResult } from './typing';

const Homepage: React.FC = () => {
    const [mics, setMics] = useState<IMicResult[]>([]);

    const fetchMics = async () => {
        const res = await fetch('/mic/admin/mics');
        if (res.ok) setMics((await res.json()) as IMicResult[]);
    };

    useEffect(() => {
        fetchMics();
    }, []);

    return (
        <div
            className={css`
                overflow: auto;
            `}
        >
            {mics.map((mic) => (
                <Mic mic={mic} />
            ))}
        </div>
    );
};

export default Homepage;
