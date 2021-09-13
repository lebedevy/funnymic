import { Classes } from '@blueprintjs/core';
import { css, cx } from '@emotion/css';
import { IGoogleLocation } from './typing';

const GoogleLocation: React.FC<{
    condensed?: boolean;
    minimal?: boolean;
    location: IGoogleLocation;
}> = ({ location, minimal, condensed }) => {
    return (
        <div
            className={css`
                display: flex;
                flex-direction: column;
                max-width: 90%;
            `}
        >
            <label
                className={cx(
                    css`
                        font-weight: ${minimal ? 600 : 700};
                        font-size: ${minimal ? 0.8 : 1}rem;
                    `,
                    Classes.TEXT_OVERFLOW_ELLIPSIS
                )}
            >
                {location.name}
            </label>
            {!condensed && (
                <label
                    className={cx(
                        css`
                            font-size: ${minimal ? 0.7 : 0.8}rem;
                        `,
                        Classes.TEXT_OVERFLOW_ELLIPSIS
                    )}
                >
                    {location.formatted_address}
                </label>
            )}
        </div>
    );
};

export default GoogleLocation;
