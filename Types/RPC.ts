import net from 'net';
import os from 'os';
import path from 'path';
import { Activity, ActivityPayload } from './Activity';

export class rpc {
    clientId: string;
    pipe: string;
    client: net.Socket;
    activityPayload: ActivityPayload;

    lastSentTime: number = 0;

    heartbeatInterval: NodeJS.Timeout;
    scheduledUpdate: NodeJS.Timeout | null = null;
    
    constructor(clientId: string) {
        this.clientId = clientId;
        this.pipe = this.getPipe();
        this.client = net.createConnection(this.pipe, () => this.onConnect());
        this.activityPayload = {
            cmd: 'SET_ACTIVITY',
            args: {
                pid: process.pid,
                activity: {},
            },
            nonce: "0"
        };
        this.client.on('error', (err) => {
            console.error('❌ Connexion error to IPC :', err.message);
        });
    }

    getPipe() {
        if (os.platform() === 'win32') {
            return '\\\\.\\pipe\\discord-ipc-0';
        } else {
            return path.join(os.tmpdir(), 'discord-ipc-0');
        }
    }

    sendFrame(op: number, payload: object) {
        const data = Buffer.from(JSON.stringify(payload), 'utf8');
        const header = Buffer.alloc(8);
        header.writeInt32LE(op, 0);
        header.writeInt32LE(data.length, 4);
        this.client.write(Buffer.concat([header, data]));
    }

    onConnect() {
        console.log("✅ Connected to Discord IPC.");

        const handshake = {
            v: 1,
            client_id: this.clientId,
        };

        this.sendFrame(0, handshake);

        this.client.on('data', (data) => this.onData(data));

        this.heartbeatInterval = setInterval(() => {
            this.sendFrame(3, {});
        }, 15000);
    }

    setActivity(activity: Activity) {
        console.log("🔄 New activity");
        this.activityPayload = {
            cmd: 'SET_ACTIVITY',
            args: {
                pid: process.pid,
                activity: activity,
            },
            nonce: Math.random().toString()
        };

        const now = Date.now();
        const elapsed = now - this.lastSentTime;

        const delay = 15/5*1000;

        if (elapsed >= delay) {
            console.log("✅ Immediate update");
            this.sendFrame(1, this.activityPayload);
            this.lastSentTime = now;
        } else {
            const remaining = delay - elapsed;

            if (this.scheduledUpdate) clearTimeout(this.scheduledUpdate);

            console.log(`⏳ Scheduled update in ${remaining}ms`);
            this.scheduledUpdate = setTimeout(() => {
                this.sendFrame(1, this.activityPayload);
                this.lastSentTime = Date.now();
                this.scheduledUpdate = null;
            }, remaining);
        }
    }

    onData(data: Buffer) {
        const str = data.toString();
        try {
            const parsed = JSON.parse(str.slice(8));

            if (parsed.cmd === "DISPATCH" && parsed.evt === "READY") {
                console.log("🎉 Discord IPC ready");
                this.sendFrame(1, this.activityPayload);
            }

        } catch (e) {
            console.warn("⚠️ Discord response not analyse :", str);
        }
    }


    destroy() {
        clearInterval(this.heartbeatInterval);
        this.client.end();
        console.log("🔌 Disconnected from IPC.");
    }
}