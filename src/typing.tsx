export type IGoogleLocation = {
    formatted_address: string;
    name: string;
    place_id: string;
};

export type ITime = {
    hour: number;
    minute: number;
    type: 'AM' | 'PM';
};

export type IMicTime = { start: ITime; end: ITime };

export type IMicResult = {
    date: string;
    id: number;
    name: string;
    place_id?: string;
    location: ICustomPlace | IPlaceForm;
    slots: number;
    time: { start: ITime; end: ITime };
    userId: number;
    waitingList?: { type: string; slots: number };
    signupConfig: ISignup;
    signupOpen: boolean;
    slotsFilled: number;
    checkinOpen: boolean;
};

export type IPlaceForm = IGoogleLocation & { type: 'google' };

export type ICustomPlace = { type: 'custom'; location: string };

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
    location?: IPlaceForm | ICustomPlace;
    date?: Date;
    time: IMicTime;
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
    setMissed: boolean;
};
