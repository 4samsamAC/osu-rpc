import net from 'net';
import os from 'os';
import path from 'path';
import { Activity, ActivityPayload } from './Activity';

export class rpc {
    clientId: string;
    pipe: string;
    client: net.Socket;
    heartbeatInterval: NodeJS.Timeout;
    activityPayload: ActivityPayload;
    
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
            console.error('Connexion error to IPC :', err.message);
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
        console.log("🔄 Setting activity:", activity);
        this.activityPayload = {
            cmd: 'SET_ACTIVITY',
            args: {
                pid: process.pid,
                activity: activity,
            },
            nonce: Math.random().toString()
        };
        this.sendFrame(1, this.activityPayload);
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
            console.warn("Réponse Discord non analysée :", str);
        }
    }


    destroy() {
        clearInterval(this.heartbeatInterval);
        this.client.end();
        console.log("🔌Disconnected from IPC.");
    }
}