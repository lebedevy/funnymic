import { Button, Card, Tag } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { getFormattedDate, getFormattedMicTime, getMicSignupState } from './commonComponents';
import { RowFlex } from './commonStyles';
import GoogleLocation from './GoolgeLocation';
import { IMicResult } from './typing';
import useUserStore from './userStore';

const Mic: React.FC<{ mic: IMicResult }> = ({ mic }) => {
    const history = useHistory();
    const user = useUserStore((state) => state.user);

    const owner = user && user.id === mic.userId;

    console.log(mic);

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
                    <Button
                        icon="cog"
                        minimal
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    />
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
