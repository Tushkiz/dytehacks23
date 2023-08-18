import axios from "axios";

require('dotenv').config();
import {App} from "@slack/bolt";

enum ID_TYPE {
    ORG_ID,
    PEER_ID,
    ROOM_NAME,
    USER_ID,
    SESSION_ID
}

const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN!;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
const CALLSTATS_PEER_REPORT = process.env.CALLSTATS_PEER_REPORT!;
const CALLSTATS_TOKEN = process.env.CALLSTATS_TOKEN!;
const PEER_ID = process.env.PEER_ID!;
const NR_API_KEY = process.env.NR_API_KEY!;
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET!;

const app = new App({
    appToken: SLACK_APP_TOKEN,
    token: SLACK_BOT_TOKEN,
    socketMode: true,
    signingSecret: slackSigningSecret
});

const NerdGraph = require('newrelic-nerdgraph-client');
const nrApp = new NerdGraph(NR_API_KEY)

async function getPeerCallstats(peerId: string): Promise<string> {
    const {data} = await axios.get(
        CALLSTATS_PEER_REPORT + peerId,
        {headers: {"Authorization": `Bearer ${CALLSTATS_TOKEN}`}}
    )

    return JSON.stringify(data.data.peerReport)
}

app.command("/findit", async ({client, respond, ack, payload}) => {
    await ack()
    console.log("Findit: sent ack")
    // const res = await respond({
    //     blocks: [
    //         {
    //             "type": "section",
    //             "text": {
    //                 "type": "mrkdwn",
    //                 "text": `NO!!!!`
    //             }
    //         },
    //     ],
    //     response_type: "in_channel", // change to "in_channel" to make it visible to others
    // });
    const res = await client.chat.postMessage(
        {
            channel: process.env.GENERAL_CHANNEL!,
            text: "Callstats for PeerId: " + payload.text + " :thread:",
        }
    )

    const reply = await getPeerCallstats(payload.text)

    // await client.chat.postMessage(
    //     {
    //       channel: res.channel!,
    //       thread_ts: res.ts,
    //       text: reply
    //     }
    // )

    //console.log(payload)

    await client.files.uploadV2({
        filename: `peer_reports_${payload.text}.json`,
        content: reply,
        channel_id: res.channel,
        thread_ts: res.ts
    });

    console.log("Findit: sent response")
});

app.command("/callstats", async ({client, respond, ack, context}) => {
    await ack()
    console.log("Callstats: sent ack")
    const {data} = await axios.get(
        CALLSTATS_PEER_REPORT + PEER_ID,
        {headers: {"Authorization": `Bearer ${CALLSTATS_TOKEN}`}}
    )
    console.log("Callstats: data received")
    const res = await client.files.uploadV2({
        filename: `peer_reports_${PEER_ID}.json`,
        content: JSON.stringify(data.data.peerReport),
        channel_id: process.env.GENERAL_CHANNEL,
    });
    console.log(res)
    console.log("Callstats: file uploaded")
});

app.command("/newrelic", async ({client, respond, ack, context}) => {
    // const { data } = await axios.get(
    //     "https://api.newrelic.com/graphql",
    //     {
    //         headers: {"API-Key": NR_API_KEY},
    //         data: {
    //             "query": "{\n   actor {\n      account(id: 3360475) {\n         nrql(query: \"SELECT * FROM Log where meetingMetadata.organizationId='7dddae64-5a93-4650-9eb0-1657d23d0bee' and metadata.error.kind='screenshare' and meetingMetadata.deviceInfo.osName='macOS' AND meetingMetadata.visitedUrl not like '%one_to_one%' SINCE 1 day AGO\") {\n            results\n         }\n      }\n   }\n}",
    //             "variables": ""
    //         }}
    // )
    // console.log(data)
    // await client.files.uploadV2({
    //     filename: `peer_reports_${PEER_ID}.json`,
    //     content: JSON.stringify(data.data.peerReport),
    //     channel_id: process.env.GENERAL_CHANNEL,
    // });

    await ack()
});

// function nr_test() {
//     const options = {
//         account: 3360475,
//         query: "SELECT meetingMetadata.roomName FROM Log WHERE service.name='web-core' SINCE 1 hour ago LIMIT 5"
//     };
//
//     nrApp.query(options)
//         .then((data: any) => {
//             console.log(data);
//         })
//         .catch((error: any) => {
//             console.error(error);
//         });
// }
//
// nr_test()

// async function test() {
//   console.log(await app.client.conversations.list())
// }
//
// test()

async function query_nr(query: string): Promise<any> {
    const options = {
        account: 3360475,
        query: query
    };

    return nrApp.query(options)
}

app.message(/.*/, async ({context, payload}) => {
    if (payload.channel == process.env.GENERAL_CHANNEL!) return

    try {
        const pload: any = payload
        const has_files = (pload.files != null)

        let file_permalinks = ""

        if (has_files) {
            pload.files.map((file: any) => {
                file_permalinks = file_permalinks + "<" + file.permalink + "| >"
            })
        }

        let channel_name = await get_channel_name(pload.channel)

        // const channel_name_processed = "<" + "https://slack.com/app_redirect?channel=" + channel_name + "|#" + channel_name + ">"
        const channel_name_processed = `<slack://channel?team=${context.teamId}&id=${pload.channel}| #${channel_name}>`
        const res = await app.client.chat.postMessage(
            {
                channel: process.env.GENERAL_CHANNEL!,
                mrkdwn: true,
                text: "[" + channel_name_processed + "]\n\n" + pload.text + file_permalinks,
            }
        )

        if (pload.text != null && pload.text != "") {
            let ids = pload.text.match(/[a-z0-9]*-[-a-z0-9]*/g)
            ids.forEach(async (id: string) => {
                let res
                if (id.startsWith("aaa")) {
                    console.log("meetingMetadata.userId")
                    // roomName, orgId, peerId, sdk, etc
                } else if (id.startsWith("bbb")) {
                    console.log("meetingMetadata.roomName")
                } else {
                    res = await query_nr(`SELECT * FROM Log WHERE meetingMetadata.peerId='${id}' SINCE 24 HOURS AGO LIMIT 1`)
                    if (res.length !== 0) {
                        console.log("meetingMetadata.peerId")
                    } else {
                        res = await query_nr(`SELECT * FROM Log WHERE meetingMetadata.organizationId='${id}' SINCE 24 HOURS AGO LIMIT 1`)
                        if (res.length !== 0) {
                            console.log("meetingMetadata.orgId")
                        } else {
                            console.log("sessionId")
                        }
                    }
                }
            })
        }


        // await app.client.chat.postMessage(
        //     {
        //         channel: res.channel,
        //         thread_ts: res.ts,
        //         text: "Hi :wave:"
        //     }
        // )
    } catch (error) {
        console.log("err")
        console.error(error);
    }
});

async function get_channel_name(channel_id: string) {
    const res = await app.client.conversations.list()
    let channel = res.channels!.find((ele) => {
        return ele.id === channel_id;
    });

    return channel!.name
}

app.start().catch((error) => {
    console.error(error);
    process.exit(1);
});