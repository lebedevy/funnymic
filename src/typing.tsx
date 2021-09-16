export type IGoogleLocation = {
    formatted_address: string;
    name: string;
    place_id: string;
};

export type IMicResult = {
    date: string;
    id: number;
    name: string;
    place_id?: string;
    location: ICustomPlace | IPlaceForm;
    slots: number;
    start: Date;
    end: Date;
    setLength: number;
    current: number;
    userId: number;
    waitingList?: { type: string; slots: number };
    signupConfig: ISignup;
    signupOpen: boolean;
    slotsFilled: number;
    checkinOpen: boolean;
    hide: boolean;
};

export type IPlaceForm = IGoogleLocation & { type: 'google' };

export type ICustomPlace = { type: 'custom'; name: string; address: string };

export type ISignupSetting = { use: boolean; required: boolean };

export type ISignup = {
    email: ISignupSetting;
    phone: ISignupSetting;
};

type IWait = {
    type: 'standby' | 'extra';
    slots: number;
};

export type IForm = {
    name: string;
    setLength: number;
    location?: IPlaceForm | ICustomPlace;
    start?: Date;
    end?: Date;
    slots: number;
    standby?: IWait;
    signupConfig: ISignup;
    signupOpen: boolean;
};

export type IMicPerfomer = {
    type: 'user' | 'anon';
    name: string;
    id: number;
    checkedIn: boolean;
    setComplete: boolean;
    skipped: boolean;
    order: number;
};
