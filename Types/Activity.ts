interface Buttons {
    buttons: [{
        label?: String,
        url?: String
    },
    {
        label?: String,
        url?: String
    }]
}

export interface Activity {
    details?: String,
    state?: String,
    assets?: {
        large_image?: String,
        large_text?: String,
        small_image?: String,
        small_text?: String
    },
    buttons?: Buttons,
    timestamps?: {
        start?: Number
    }
}

export interface ActivityOptions {
    details?: String;
    state?: String;
    largeImageKey?: String;
    largeImageText?: String;
    smallImageKey?: String;
    smallImageText?: String;
    buttons?: Buttons;
    start?: Number;
}

export interface ActivityPayload {
    cmd: String,
    args: {
        pid: Number,
        activity: Activity
    },
    nonce?: String
}

export class Activity implements Activity {
    details?: String;
    state?: String;
    assets?: {
        large_image?: String;
        large_text?: String;
        small_image?: String;
        small_text?: String;
    };
    buttons?: Buttons;
    timestamps?: {
        start?: Number;
    };

    constructor({
        details,
        state,
        largeImageKey,
        largeImageText,
        smallImageKey,
        smallImageText,
        buttons,
        start
    }: ActivityOptions) {
        this.details = details;
        this.state = state;
        this.assets = {
            large_image: largeImageKey,
            large_text: largeImageText,
            small_image: smallImageKey,
            small_text: smallImageText
        };
        this.buttons = buttons;
        this.timestamps = {
            start
        };
    }
}
