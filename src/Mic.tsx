import { Button, Card, Menu, MenuItem, Popover, Tag } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
    getFormattedDate,
    getFormattedMicTime,
    getMicSignupState,
    yfetch,
} from './commonComponents';
import { RowFlex } from './commonStyles';
import GoogleLocation from './GoolgeLocation';
import { IMicResult } from './typing';
import useUserStore from './userStore';

const Mic: React.FC<{ fetchMics: () => void; mic: IMicResult }> = ({ fetchMics, mic }) => {
    const history = useHistory();
    const user = useUserStore((state) => state.user);
    const [openSetting, setOpenSetting] = useState(false);

    const owner = user && user.id === mic.userId;

    return (
        <Card
            interactive
            className={css`
                margin: 1rem;
                display: flex;
                flex-direction: column;
            `}
            onClick={() =>
                history.push(owner ? `/managemic/${mic.id}` : `/mic/signup/${mic.id}`, { mic })
            }
        >
            <RowFlex
                className={css`
                    justify-content: space-between;
                `}
            >
                <h2>{mic.name}</h2>
                {owner && (
                    <Popover
                        isOpen={openSetting}
                        content={
                            <Menu>
                                <MenuItem
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const res = await yfetch('/mic/hide', {
                                            hide: !mic.hide,
                                            micId: mic.id,
                                        });
                                        if (res.ok) {
                                            fetchMics();
                                            setOpenSetting(false);
                                        }
                                    }}
                                    text={mic.hide ? 'Show' : 'Hide'}
                                />
                            </Menu>
                        }
                        onClose={() => setOpenSetting(false)}
                    >
                        <Button
                            icon="cog"
                            minimal
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenSetting(true);
                            }}
                        />
                    </Popover>
                )}
            </RowFlex>
            <RowFlex
                className={css`
                    margin-bottom: 0.6rem;
                `}
            >
                <div
                    className={css`
                        padding-right: 3rem;
                    `}
                >
                    {new Date(mic.start).toLocaleDateString()}
                </div>
                {getFormattedMicTime(mic.start, mic.end)}
            </RowFlex>
            <MicStatus mic={mic} />
            {mic.location.type === 'custom' ? (
                <GoogleLocation
                    condensed
                    minimal
                    location={{
                        place_id: '',
                        formatted_address: mic.location.address,
                        name: mic.location.name,
                    }}
                />
            ) : (
                <GoogleLocation condensed minimal location={mic.location} />
            )}
        </Card>
    );
};

export default Mic;

const MicStatus: React.FC<{ mic: IMicResult }> = ({ mic }) => {
    const micSignupState = getMicSignupState(mic);

    const status = useMemo(() => {
        if (mic.checkinOpen)
            return (
                <Tag large intent="success">
                    Check in open
                </Tag>
            );

        if (micSignupState === 'open')
            return <Tag large intent="success">{`${mic.slots - mic.slotsFilled} open slots`}</Tag>;

        if (micSignupState === 'waiting' && mic.waitingList)
            return (
                <Tag large intent="warning">{`${
                    mic.waitingList.slots + mic.slots - mic.slotsFilled
                } waiting slots`}</Tag>
            );

        if (micSignupState === 'full')
            return (
                <Tag large round active>
                    Full
                </Tag>
            );

        return (
            <Tag large round active>
                Signup closed
            </Tag>
        );
    }, [mic, micSignupState]);

    return (
        <RowFlex
            className={css`
                padding-bottom: 1rem;
            `}
        >
            {status}
        </RowFlex>
    );
};
