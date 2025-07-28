// Import necessary modules
const WebSocket = require("ws");
const cheerio = require('cheerio');
const wait = require('timers/promises').setTimeout;
const http = require('http');
const {
    spawn
} = require('child_process');

const discordrpc = require('./Types/RPC').rpc;
const {
    Activity
} = require('./Types/Activity');

const {
    readFileSync
} = require("fs");
const config = JSON.parse(readFileSync("./config.json", "utf-8"));


/** @type {WebSocket} */
let ws
let start = 0;
let who = {};

let process = spawn(config.path);

process.stdout.on('data', (data) => {
    const regex = /.*\[server\] Dashboard started on (https?:\/\/(\d+\.\d+\.\d+\.\d+):(\d+)$)/gm;
    const str = data.toString();
    console.log(str);
    let match;
    while ((match = regex.exec(str)) !== null) {
        console.log(`💻 Dashboard stared : ${match[1]} (IP : ${match[2]}, Port : ${match[3]})`);
        startWS(match[2], match[3]);
    }
});

process.on("exit", (code, signal) => {
    console.error(`[ERREUR] The process is stop (code: ${code}, signal: ${signal}).`);
    console.log("[INFO] Restart process...");
    process = spawn(config.path);
});

process.stderr.on('data', (data) => {
    console.error(`❌ Error std : ${data}`);
});

process.on('close', (code) => {
    console.log(`🛏️ Processus close error code : ${code}`);
});

async function startWS(ip, port) {
    try {
        console.log("[INFO] Starting WebSocket connection...");
        if (!process) throw new Error("Process missing.");
        ws = new WebSocket(`ws://${ip}:${port}/ws`);

        ws.on("close", async (code, reason) => {
            console.error(`[ERREUR] The WebSocket connection stop (code: ${code}, reason: ${reason}).`);
            console.log("[INFO] Waiting 5 seconds before reconnecting...");
            await wait(5000);
            console.log("[INFO] Restart connection...");
            startWS(ip, port);
        });

        ws.on("error", async (err) => {
            console.error(`[ERREUR] The WebSocket connection stop (error: ${err.message || err}).`);
            console.log("[INFO] Waiting 5 seconds before reconnecting...");
            await wait(5000);
            console.log("[INFO] Restart connection...");
            await startWS(ip, port);
        });

        ws.on('open', async () => {
            console.log("[INFO] WebSocket connection opened successfully!");
            main();
        });

    } catch (error) {
        console.error(`[ERREUR] WebSocket connection failed: ${error.message}`);
        console.log("[INFO] Waiting 5 seconds before retrying...");
        await wait(5000);
        startWS();
    }
}

async function main() {
    try {
        console.log("[INFO] Starting main loop...");

        const rpc = new discordrpc(config.applicationId);
        const cooldown = 1000;
        let data;
        start = Date.now();

        ws.on("message", (rd) => {
            try {
                data = JSON.parse(rd);
            } catch (error) {
                console.error(`[ERREUR] Failed to parse WebSocket message: ${error.message}`);
            }
        });

        let lastActivity = "";

        let setActivity = () => {
            if (!data) return;

            /** @type {Activity} */
            let newActivity;

            /**
             * 0 - Main Menu
             * 1 - Editing a beatmap
             * 2 - Playing/Watch Replay
             * 3 - ?
             * 4 - Edit Menu
             * 5 - Browsing
             * 6 - ?
             * 7 - Score Screen
             * 8 - ?
             * 9 - ?
             * 10 - ?
             * 11 - Multyplayer hall
             * 12 - In Multyplayer lobby
             * 13 - ?
             * 14 - In Multyplayer score screen
             */

            if (data.menu.state == 0) {
                newActivity = new Activity(
                    `${data.userProfile.name} ( #${data.userProfile.rank} - ${data.userProfile.accuracy}% - ${data.userProfile.performancePoints}pp )`,
                    `In main menu`,
                    "osu-logo2",
                    "osu!",
                    `https://assets.ppy.sh/beatmaps/${data.menu.bm.set}/covers/list.jpg`,
                    `Lystening to ${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title}`,
                    start
                )
            } else if (data.menu.state == 2) {
                newActivity = new Activity(
                    `${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title}`,
                    `Mapped by ${data.menu.bm.metadata.mapper}`,
                    `https://assets.ppy.sh/beatmaps/${data.menu.bm.set}/covers/list.jpg`,
                    "osu!",
                    "osu-logo",
                    "Playing",
                    start
                )
            } else if (data.menu.state == 5) {
                newActivity = new Activity(
                    `Browsing ${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title}`,
                    `Mapped by ${data.menu.bm.metadata.mapper}`,
                    `https://assets.ppy.sh/beatmaps/${data.menu.bm.set}/covers/list.jpg`,
                    `${data.menu.pp[100]}pp - AR ${data.menu.bm.stats.AR} - CS ${data.menu.bm.stats.CS} - OD ${data.menu.bm.stats.OD} - HP ${data.menu.bm.stats.HP}`,
                    "osu-logo",
                    "Browsing osu!",
                    start
                )
            } else {
                newActivity = new Activity(
                    `Playing osu!`,
                    `In Menu`,
                    "logo",
                    "osu!",
                    "menu",
                    "In Menu",
                    start
                );
            }

            const asString = JSON.stringify(newActivity);

            if (asString !== lastActivity) {
                rpc.setActivity(newActivity);
                lastActivity = asString;
            }
        };


        setActivity(); // Set initial activity
        let interval = setInterval(setActivity, cooldown); // Set activity at regular intervals

        // Handle WebSocket close event
        ws.on("close", () => {
            clearInterval(interval); // Clear the interval
        });
    } catch (error) {
        console.error(`[ERREUR] Failed to initialize main loop: ${error.message}`);
    }
}

// Function to get user ID from osu! username
async function whois(username) {
    try {
        const options = {
            'method': 'GET',
            'hostname': 'osu.ppy.sh',
            'path': `/users/${username}`,
            'maxRedirects': 20
        };

        const response = await new Promise((resolve, reject) => {
            const req = http.request(options, resolve);
            req.on('error', reject);
            req.end();
        });

        const chunks = [];
        response.on("data", chunk => chunks.push(chunk));
        await new Promise((resolve, reject) => {
            response.on("end", resolve);
            response.on("error", reject);
        });

        const body = Buffer.concat(chunks);
        const $ = cheerio.load(body.toString());

        const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
        if (metaRefresh) {
            const match = /url='(.*?)'/.exec(metaRefresh);
            if (match) {
                const targetURL = match[1];
                const regex = /\/(\d+)$/;
                const matchs = targetURL.match(regex);
                if (matchs) {
                    const userID = matchs[1];
                    const source = {
                        [username]: userID
                    };
                    who = Object.assign(who, source);
                } else {
                    throw new Error("No id found at the end of the URL.");
                }
            } else {
                throw new Error("URL not found in the metaRefresh.");
            }
        } else {
            throw new Error("metaRefresh not found.");
        }
    } catch (error) {
        console.error(`❌ Error searching for user ${username}: ${error.message}`);
    }
}