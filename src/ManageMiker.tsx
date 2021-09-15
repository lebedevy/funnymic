import {
    Button,
    FormGroup,
    Icon,
    Menu,
    MenuItem,
    Popover,
    Switch,
    Tag,
    Text,
} from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useCallback, useEffect, useState } from 'react';
import { useTimer } from 'react-timer-hook';
import { yfetch } from './commonComponents';
import { RowFlex } from './commonStyles';
import { IMicPerfomer, IMicResult } from './typing';

const ManageMiker: React.FC<{
    setMic: (m: IMicResult) => void;
    refreshMikers: () => void;
    mic: IMicResult;
    miker: IMicPerfomer;
}> = ({ setMic, mic, miker, refreshMikers }) => {
    const [setLength] = useState(mic.setLength);
    const [started, setStarted] = useState(false);
    const [autoMove, setAutoMove] = useState(false);

    const completeSet = useCallback(async () => {
        const res = await yfetch('/mic/completeset', {
            userId: miker.id,
            micId: mic.id,
        });
        if (res.ok) {
            setMic(await res.json());
            refreshMikers();
        }
    }, [miker.id, mic.id, refreshMikers, setMic]);

    const { seconds, minutes, isRunning, pause, resume, restart } = useTimer({
        expiryTimestamp: new Date(),
        autoStart: false,
        onExpire: () => (autoMove ? completeSet() : undefined),
    });

    const startTimer = () => {
        setStarted(true);
        const time = new Date();
        time.setSeconds(time.getSeconds() + setLength * 60);
        restart(time);
    };

    // DUPLICATE FROM MIKER LIST
    const checkinUser = async () => {
        const res = await yfetch('/mic/admin/checkin', { micId: mic.id, userId: miker.id });
        if (res.ok) refreshMikers();
    };

    useEffect(() => {
        pause();
        setStarted(false);
        // cannot add pause because it will force a reload everytime timer is updated
    }, [miker.id]);

    return (
        <div
            className={css`
                border: 1px solid #00000040;
                border-radius: 3px;
                padding: 1rem;
                margin: 0.5rem;
            `}
        >
            <RowFlex justify="space-between">
                <Text
                    className={css`
                        font-size: 1.2rem;
                    `}
                    ellipsize
                >
                    Current performer:{' '}
                    <label
                        className={css`
                            font-size: 1.2rem;
                            font-weight: 600;
                        `}
                    >
                        {miker.name}
                    </label>
                </Text>
                <Popover
                    minimal
                    content={
                        <Menu>
                            <MenuItem
                                text={
                                    <Switch
                                        checked={autoMove}
                                        onChange={(e) => setAutoMove(e.currentTarget.checked)}
                                        label="Move to next person on timer completion"
                                    />
                                }
                            />
                        </Menu>
                    }
                >
                    <Button icon="cog" minimal />
                </Popover>
            </RowFlex>
            <div>
                <RowFlex
                    justify="space-between"
                    className={css`
                        padding: 1rem 0;
                        font-size: 1.2rem;
                    `}
                >
                    Timer
                    <div
                        className={css`
                            padding-left: 1rem;
                            font-size: inherit;
                            ${minutes <= 0 && `color: orange;`}
                        `}
                    >
                        <label
                            className={css`
                                font-size: 2rem;
                            `}
                        >{`${started ? minutes : setLength}m ${started ? seconds : '00'}s`}</label>
                    </div>
                    <div>
                        <Button
                            icon={isRunning ? 'pause' : 'play'}
                            minimal
                            onClick={() =>
                                isRunning ? pause() : started ? resume() : startTimer()
                            }
                        />
                        <Button
                            icon="reset"
                            minimal
                            onClick={() => {
                                pause();
                                setStarted(false);
                            }}
                        />
                    </div>
                </RowFlex>
                <RowFlex justify="space-between">
                    <FormGroup>
                        {miker.checkedIn ? (
                            <Tag large intent="success">
                                <Icon
                                    className={css`
                                        padding-right: 0.5rem;
                                    `}
                                    icon="tick"
                                />
                                Checked in
                            </Tag>
                        ) : (
                            <Button
                                icon="tick"
                                minimal
                                text="Check in"
                                disabled={miker.checkedIn}
                                onClick={checkinUser}
                            />
                        )}
                    </FormGroup>
                    <FormGroup>
                        <Button
                            icon="tick-circle"
                            minimal
                            text="Set complete"
                            onClick={completeSet}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Button
                            icon="step-forward"
                            minimal
                            text="Skip"
                            onClick={async () => {
                                const res = await yfetch('/mic/skip', {
                                    userId: miker.id,
                                    micId: mic.id,
                                    setComplete: miker.checkedIn ? true : undefined,
                                });
                                if (res.ok) {
                                    setMic(await res.json());
                                    refreshMikers();
                                }
                            }}
                        />
                    </FormGroup>
                </RowFlex>
            </div>
        </div>
    );
};

export default ManageMiker;
