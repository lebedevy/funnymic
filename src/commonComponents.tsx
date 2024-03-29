import {
    Button,
    Dialog as BDialog,
    DialogProps,
    FormGroupProps,
    FormGroup as BFormGroup,
    InputGroup,
} from '@blueprintjs/core';
import { css } from '@emotion/css';
import styled from '@emotion/styled';
import { ChangeEvent, Fragment, useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchDetails } from './api';
import useMicStore from './micStore';
import { IMicResult } from './typing';

export const CenteredScreen = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: auto;
`;

type Props = {
    active: boolean;
};

const Circle = styled.div<Props>`
    border-radius: 50%;
    width: 10px;
    height: 10px;
    background-color: ${({ active }) => (active ? 'blue' : 'gray')};
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    color: white;
    padding: 10px;
    margin: 0 10px;
    font-size: 10px;
`;

const SpaceBetween = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;

export const MultiStep: React.FC<{
    controlStep: (n: number) => void;
    steps: { label: string }[];
    current: number;
    submit: () => void;
    valid: boolean;
}> = ({ steps, current, controlStep, submit, valid }) => {
    const lastStep = current === steps.length - 1;

    return (
        <SpaceBetween
            className={css`
                background-color: white;
                position: fixed;
                bottom: 0;
                border-top: 1px solid #00000040;
                padding: 1rem;
                align-items: center;
                flex-direction: column;
            `}
        >
            <SpaceBetween>
                <Button
                    text="Back"
                    disabled={current === 0}
                    onClick={() => controlStep(current - 1)}
                />
                <Button
                    text={lastStep ? 'Finish' : 'Next'}
                    intent="primary"
                    disabled={!valid}
                    onClick={() => {
                        lastStep ? submit() : controlStep(current + 1);
                    }}
                />
            </SpaceBetween>
        </SpaceBetween>
    );
};

export const StepLocation: React.FC<{
    steps: { label: string }[];
    current: number;
}> = ({ steps, current }) => {
    const [show, setShow] = useState(true);

    return show ? (
        <div
            className={css`
                padding: 1rem;
                border-bottom: 1px solid #00000020;
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `}
        >
            {steps.map(({ label }, ind) => (
                <Fragment key={ind}>
                    <div
                        className={css`
                            display: flex;
                            justify-content: center;
                            // flex-direction: column;
                            align-items: center;
                            margin: 0 1rem;
                            font-size: 12px;
                        `}
                    >
                        {label}
                        <Circle active={ind === current}>{ind + 1}</Circle>
                    </div>
                    {ind !== steps.length - 1 && (
                        <div
                            className={css`
                                width: 100%;
                                border: 1px solid black;
                            `}
                        />
                    )}
                </Fragment>
            ))}
            <Button icon="cross" minimal onClick={() => setShow(false)} />
        </div>
    ) : null;
};

export const Error = styled.label`
    color: red;
`;

export const LocationWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    border: 1px solid black;
    border-radius: 5px;
    padding: 1rem;
`;

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
        width,
        height,
    };
}

export function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}

export const Dialog: React.FC<DialogProps & { center?: boolean }> = ({
    center,
    children,
    ...props
}) => {
    return (
        <BDialog
            {...props}
            className={css`
                max-width: 90vw;
            `}
        >
            <div
                className={css`
                    padding: 1rem;
                    max-width: 90vw;
                    ${center &&
                    `display: flex;
                    justify-content: center;
                    flex-direction: column;
                    align-items: center;`}
                `}
            >
                {children}
            </div>
        </BDialog>
    );
};

export const validateEmail = (email: string) => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRe.test(email);
};

export const validatePassword = (phone: string) => {
    const phoneRe = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
    return phoneRe.test(phone);
};

export const FormGroup: React.FC<FormGroupProps & { error?: string }> = ({
    children,
    error,
    ...props
}) => {
    return (
        <BFormGroup helperText={error && <Error>{error}</Error>} {...props}>
            {children}
        </BFormGroup>
    );
};

export const PasswordInput: React.FC<{
    error?: string;
    value: string;
    onChange: (e: ChangeEvent<any>) => void;
}> = ({ onChange, value, error }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <FormGroup label="Password" error={error}>
            <InputGroup
                large
                id="password"
                onChange={onChange}
                value={value}
                placeholder="Enter your password..."
                rightElement={
                    <Button
                        icon={showPassword ? 'eye-off' : 'eye-open'}
                        minimal={true}
                        onClick={() => setShowPassword((prev) => !prev)}
                    />
                }
                type={showPassword ? 'text' : 'password'}
            />
        </FormGroup>
    );
};

export function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export const yfetch = (url: string, body: any) => {
    return fetch(url, {
        body: JSON.stringify(body),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

export const getMicSignupState = (mic: IMicResult): 'open' | 'waiting' | 'closed' | 'full' => {
    if (!mic.signupOpen) return 'closed';
    if (mic.slots <= mic.slotsFilled) {
        if (mic.waitingList) {
            if (mic.waitingList.slots + mic.slots > mic.slotsFilled) {
                return 'waiting';
            }
        }
        return 'full';
    }
    return 'open';
};

const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getFormattedDate(d: Date | string) {
    let date = d;
    if (typeof date === 'string') {
        date = new Date(d);
    }

    let hour = date.getHours();
    if (hour > 12) {
        hour %= 12;
    } else if (hour === 0) hour = 12;

    return `${days[date.getDay()]}, ${date.getDate()} ${
        months[date.getMonth()]
    } ${date.getFullYear()} ${formatTime(hour)}:${formatTime(date.getMinutes())}`;
}

export function getFormattedMicTime(s: Date | string, e: Date | string) {
    let start = s;
    let end = e;
    if (typeof start === 'string') {
        start = new Date(s);
    }
    if (typeof end === 'string') {
        end = new Date(e);
    }

    return `${formatTime(start.getHours())}:${formatTime(start.getMinutes())} - ${formatTime(
        end.getHours()
    )}:${formatTime(end.getMinutes())}`;
}

function formatTime(time: number) {
    const t = time + '';
    if (t.length < 2) return '0' + time;
    return t;
}

export const useMic = (
    micId: number | string
): [IMicResult | undefined, (mic: IMicResult) => void] => {
    let id = typeof micId === 'string' ? parseInt(micId, 10) : micId;
    let mic = useMicStore((store) => store.currentMic);

    const setCurrentMic = useMicStore((store) => store.setCurrentMic);
    const clearCurrentMic = useMicStore((store) => store.clearCurrentMic);
    if (mic?.id !== id) {
        mic = undefined;
        clearCurrentMic();
    }

    const getMic = useCallback(async () => {
        const mic = await fetchDetails(id);

        if (mic.ok) setCurrentMic(await mic.json());
    }, [id, setCurrentMic]);

    useEffect(() => {
        if (!mic) {
            console.log('here');
            getMic();
        }
    }, [getMic, mic, id]);

    return [mic, setCurrentMic];
};
