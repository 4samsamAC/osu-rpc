export interface Activity {
    details?: String,
    state?: String,
    assets?: {
        large_image?: String,
        large_text?: String,
        small_image?: String,
        small_text?: String
    },
    timestamps?: {
        start?: number
    }
}

export interface ActivityPayload {
    cmd: string,
    args: {
        pid: number,
        activity: Activity
    },
    nonce?: string
}

export class Activity implements Activity {
    details?: String;
    state?: String;
    assets?: {
        large_image?: String,
        large_text?: String,
        small_image?: String,
        small_text?: String
    };
    timestamps?: {
        start?: number
    };
    
    constructor(details?: string, state?: string, largeImageKey?: string, largeImageText?: string, smallImageKey?: string, smallImageText?: string, start?: number) {
        this.details = details;
        this.state = state;
        this.assets = {
            large_image: largeImageKey,
            large_text: largeImageText,
            small_image: smallImageKey,
            small_text: smallImageText
        };
        this.timestamps = {
            start: start
        };
    }
}