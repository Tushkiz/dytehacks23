import axios from "axios";

require('dotenv').config();
import {App} from "@slack/bolt";

const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const CALLSTATS_PEER_REPORT = process.env.CALLSTATS_PEER_REPORT;
const CALLSTATS_TOKEN = process.env.CALLSTATS_TOKEN;
const PEER_ID = process.env.PEER_ID;

const app = new App({
    appToken: SLACK_APP_TOKEN,
    token: SLACK_BOT_TOKEN,
    socketMode: true,
});

app.command("/findit", async ({client, respond}) => {
    await respond({
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `NO!!!!`
                }
            },
        ],
        response_type: "in_channel", // change to "in_channel" to make it visible to others
    });
});

app.command("/callstats", async ({client, respond}) => {
    const peer_report = await axios.get(
        CALLSTATS_PEER_REPORT + PEER_ID,
        {headers: {"Authorization": `Bearer ${CALLSTATS_TOKEN}`}}
    )
    console.log(peer_report)

    await respond({
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `ACK`
                }
            },
        ],
        response_type: "in_channel", // change to "in_channel" to make it visible to others
    });
});

app.start().catch((error) => {
    console.error(error);
    process.exit(1);
});