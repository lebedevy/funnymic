import { Button, Drawer, Switch, InputGroup, Spinner, Icon } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useEffect, useState } from 'react';
import { CenteredScreen } from './commonComponents';
import { RowFlex, SmallHeader } from './commonStyles';
import Mic from './Mic';
import { IMicResult } from './typing';

const Mics: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [mics, setMics] = useState<IMicResult[]>([]);

    const [search, setSearch] = useState('');

    const fetchMics = async () => {
        setLoading(true);
        const res = await fetch('/mic/mics');
        setMics((await res.json()) as IMicResult[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchMics();
    }, []);

    return (
        <>
            {!loading ? (
                <div
                    className={css`
                        overflow: auto;
                    `}
                >
                    {/* <MicListSettings search={search} setSearch={setSearch} /> */}
                    {mics.length > 0 ? (
                        mics
                            .filter(
                                (mic) =>
                                    !search || mic.name.toLowerCase().includes(search.toLowerCase())
                            )
                            .map((mic) => <Mic mic={mic} fetchMics={fetchMics} />)
                    ) : (
                        <SmallHeader>No mics to show</SmallHeader>
                    )}
                </div>
            ) : (
                <CenteredScreen>
                    <Spinner size={36} intent="primary" />
                </CenteredScreen>
            )}
        </>
    );
};

export default Mics;

const MicListSettings: React.FC<{ setSearch: (s: string) => void; search: string }> = ({
    setSearch,
    search,
}) => {
    const [openSearch, setOpenSearch] = useState(false);
    const [showFilter, setShowFilter] = useState(false);

    return (
        <RowFlex
            justify="space-between"
            className={css`
                margin: 0 1rem;
                position: relative;
            `}
        >
            <SmallHeader
                className={css`
                    ${openSearch && 'color: #00000020'}
                `}
            >
                Open mics
            </SmallHeader>

            {!openSearch && (
                <Button
                    intent={search ? 'warning' : 'none'}
                    icon="search"
                    minimal
                    onClick={() => setOpenSearch((prev) => !prev)}
                />
            )}
            {openSearch && (
                <RowFlex
                    className={css`
                        position: absolute;
                        right: 0;
                        top: 1rem;
                    `}
                >
                    <InputGroup
                        large
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        rightElement={
                            <Button minimal icon="delete" onClick={() => setSearch('')} />
                        }
                    />
                    <Button icon="filter" minimal onClick={() => setShowFilter((prev) => !prev)} />
                    <Button icon="cross" minimal onClick={() => setOpenSearch((prev) => !prev)} />
                </RowFlex>
            )}
            <Drawer
                className={css`
                    padding: 1rem;
                `}
                isOpen={showFilter}
                onClose={() => setShowFilter(false)}
            >
                <Switch label="Only show mics with open signup" />
            </Drawer>
        </RowFlex>
    );
};
