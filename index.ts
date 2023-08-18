import axios from "axios";

require("dotenv").config();
import {App} from "@slack/bolt";
import {
    queryNewRelic,
    queryNewRelicForOrgId,
    queryNewRelicForPeerId,
    queryNewRelicForRoomName,
    queryNewRelicForSessionId,
    queryNewRelicForUserId,
} from "./lib/queryForId";
import {getEnvVars} from "./lib/getEnvVars";

enum ID_TYPE {
    ORG_ID,
    PEER_ID,
    ROOM_NAME,
    USER_ID,
    SESSION_ID,
}

const {
    SLACK_APP_TOKEN,
    SLACK_BOT_TOKEN,
    CALLSTATS_PEER_REPORT,
    CALLSTATS_TOKEN,
    PEER_ID,
    NR_API_KEY,
    SLACK_SIGNING_SECRET,
    DEV_PORTAL,
} = getEnvVars();

const app = new App({
    appToken: SLACK_APP_TOKEN,
    token: SLACK_BOT_TOKEN,
    socketMode: true,
    signingSecret: SLACK_SIGNING_SECRET,
});

const NerdGraph = require("newrelic-nerdgraph-client");
const nrApp = new NerdGraph(NR_API_KEY);

async function getPeerCallstats(peerId: string): Promise<string> {
    const {data} = await axios.get(CALLSTATS_PEER_REPORT + peerId, {
        headers: {Authorization: `Bearer ${CALLSTATS_TOKEN}`},
    });

    return JSON.stringify(data.data.peerReport, null, "\t");
}

app.command("/finditfenil", async ({context, ack, payload}) => {
    await ack();

    try {
        const pload: any = payload;

        // start threading details
        if (pload.text && pload.text !== "") {
            let ids = pload.text.match(/[a-z0-9]*-[-a-z0-9]*/g) as string[];
            const resultPromises = ids.map(async (id: string) => {
                let res;

                res = await queryNewRelicForPeerId(id);
                if (res) return res;

                res = await queryNewRelicForSessionId(id);
                if (res) return res;

                if (id.startsWith("aaa")) {
                    res = queryNewRelicForUserId(id);
                    if (res) return res;
                }

                if (id.startsWith("bbb")) {
                    res = queryNewRelicForRoomName(id);
                    if (res) return res;
                }

                res = await queryNewRelicForOrgId(id);
                if (res) return res;

                return null;
            });

            const rawResults = await Promise.all(resultPromises);
            const results = rawResults.filter((res) => res !== null);
            if (results.length !== 0) {
                await app.client.chat.postMessage({
                    channel: payload.channel_id!,
                    text: JSON.stringify(results, null, '\t'),
                });
            }
        } else {
            app.client.chat.postMessage({
                    channel: payload.channel_id!,
                    text: "Toh mai kya karu? Job chod du? <https://finditfenil.slack.com/files/U05N84YH6QJ/F05NEAFMVD0/image.png| >"
                }
            )
        }
    } catch (error) {
        console.log("err");
        console.error(error);
    }

});

app.command(
    "/callstats",
    async ({client, ack, payload}) => {
        await ack();
        const [peerId] = payload.text.split(" ");
        const reply = await getPeerCallstats(peerId);

        await client.files.uploadV2({
            filename: `peer_reports_${payload.text}.json`,
            content: reply,
            channel_id: payload.channel_id,
            thread_ts: payload.ts,
        });
    }
);

app.command("/newrelic", async ({client, ack, payload}) => {
    await ack()

    const res = await queryNewRelic(payload.text)
    await client.chat.postMessage({
        channel: payload.channel_id!,
        text: JSON.stringify(res, null, '\t'),
    });
});

app.command("/peerId", async ({client, ack, payload}) => {
    await ack()

    const [peerId] = payload.text.split(" ");

    const res = await queryNewRelicForPeerId(peerId)
    await client.chat.postMessage({
        channel: payload.channel_id!,
        text: JSON.stringify(res, null, '\t'),
    });
})

app.command("/meetingId", async ({client, ack, payload}) => {
    await ack()

    const [roomName] = payload.text.split(" ");

    const res = await queryNewRelicForRoomName(roomName)
    await client.chat.postMessage({
        channel: payload.channel_id!,
        text: JSON.stringify(res, null, '\t'),
    });
})

app.command("/organizationId", async ({client, ack, payload}) => {
    await ack()

    const [orgId] = payload.text.split(" ");

    const res = await queryNewRelicForOrgId(orgId)
    await client.chat.postMessage({
        channel: payload.channel_id!,
        text: JSON.stringify(res, null, '\t'),
    });
})

app.command("/userId", async ({client, ack, payload, command}) => {
    await ack()

    const [userId] = payload.text.split(" ");

    const res = await queryNewRelicForUserId(userId)

    await client.chat.postMessage({
        channel: payload.channel_id!,
        text: JSON.stringify(res, null, '\t'),
    });
})

app.command("/sessionId", async ({client, ack, payload}) => {
    await ack()

    const [sessionId] = payload.text.split(" ");

    const res = await queryNewRelicForSessionId(sessionId)
    await client.chat.postMessage({
        channel: payload.channel_id!,
        text: JSON.stringify(res, null, '\t'),
    });
})

app.message(/.*/, async ({context, payload}) => {
    if (payload.channel == process.env.GENERAL_CHANNEL!) return;

    try {
        const pload: any = payload;
        const has_files = pload.files != null;

        let file_permalinks = "";

        if (has_files) {
            pload.files.map((file: any) => {
                file_permalinks = file_permalinks + "<" + file.permalink + "| >";
            });
        }

        let channel_name = await get_channel_name(pload.channel);

        const channel_name_processed = `<slack://channel?team=${context.teamId}&id=${pload.channel}| #${channel_name}>`;
        const mainMessage = await app.client.chat.postMessage({
            channel: process.env.GENERAL_CHANNEL!,
            mrkdwn: true,
            text:
                "[" + channel_name_processed + "]\n\n" + pload.text + file_permalinks,
        });

        // start threading details
        if (pload.text && pload.text !== "") {
            let ids = pload.text.match(/[a-z0-9]*-[-a-z0-9]*/g) as string[];
            const resultPromises = ids.map(async (id: string) => {
                let res;

                res = await queryNewRelicForPeerId(id);
                if (res) return res;

                res = await queryNewRelicForSessionId(id);
                if (res) return res;

                if (id.startsWith("aaa")) {
                    res = queryNewRelicForUserId(id);
                    if (res) return res;
                }

                if (id.startsWith("bbb")) {
                    res = queryNewRelicForRoomName(id);
                    if (res) return res;
                }

                res = await queryNewRelicForOrgId(id);
                if (res) return res;

                return null;
            });

            const rawResults = await Promise.all(resultPromises);
            const results = rawResults.filter((res) => res !== null);
            if (results.length !== 0) {
                await app.client.chat.postMessage({
                    channel: mainMessage.channel!,
                    thread_ts: mainMessage.ts,
                    text: JSON.stringify(results, null, '\t'),
                });
            }
        }
    } catch (error) {
        console.log("err");
        console.error(error);
    }
});

async function get_channel_name(channel_id: string) {
    const res = await app.client.conversations.list();
    let channel = res.channels!.find((ele) => {
        return ele.id === channel_id;
    });

    return channel!.name;
}

app.start().catch((error) => {
    console.error(error);
    process.exit(1);
});
