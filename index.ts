import axios from "axios";

require('dotenv').config();
import {App} from "@slack/bolt";
// import NerdGraph from "newrelic-nerdgraph-client"

const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN!;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
const CALLSTATS_PEER_REPORT = process.env.CALLSTATS_PEER_REPORT!;
const CALLSTATS_TOKEN = process.env.CALLSTATS_TOKEN!;
const PEER_ID = process.env.PEER_ID!;
const NR_API_KEY = process.env.NR_API_KEY!;

const app = new App({
    appToken: SLACK_APP_TOKEN,
    token: SLACK_BOT_TOKEN,
    socketMode: true,
});

const NerdGraph = require('newrelic-nerdgraph-client');
const nrApp = new NerdGraph(NR_API_KEY)

app.command("/findit", async ({client, respond, ack}) => {
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

    console.log("Findit: sent response")
    await ack()
    console.log("Findit: sent ack")
});

app.command("/callstats", async ({client, respond, ack, context}) => {
    await ack()
    console.log("Callstats: sent ack")
    const { data } = await axios.get(
        CALLSTATS_PEER_REPORT + PEER_ID,
        {headers: {"Authorization": `Bearer ${CALLSTATS_TOKEN}`}}
    )
    console.log("Callstats: data received")
    await client.files.uploadV2({
        filename: `peer_reports_${PEER_ID}.json`,
        content: JSON.stringify(data.data.peerReport),
        channel_id: process.env.GENERAL_CHANNEL,
    });
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

// async function nr_logs() {
//     const { data } = await axios.post(
//         "https://api.newrelic.com/graphql",
//         {
//             headers: {"API-Key": NR_API_KEY},
//             data: {
//             "query": "{\n   actor {\n      account(id: 3360475) {\n         nrql(query: \"SELECT * FROM Log where meetingMetadata.organizationId='7dddae64-5a93-4650-9eb0-1657d23d0bee' and metadata.error.kind='screenshare' and meetingMetadata.deviceInfo.osName='macOS' AND meetingMetadata.visitedUrl not like '%one_to_one%' SINCE 1 day AGO\") {\n            results\n         }\n      }\n   }\n}",
//             "variables": ""
//             }}
//             // data: {
//             //     "query": "{\n   actor {\n      account(id: 3360475) {\n         nrql(query: \"SELECT * FROM Log where meetingMetadata.organizationId='7dddae64-5a93-4650-9eb0-1657d23d0bee' and metadata.error.kind='screenshare' and meetingMetadata.deviceInfo.osName='macOS' AND meetingMetadata.visitedUrl not like '%one_to_one%' SINCE 1 day AGO\") {\n            results\n         }\n      }\n   }\n}",
//             //     "variables": ""
//             // }}
//     )
//     console.log(data)
// }
//
// nr_logs()

function nr_test() {
    const options = {
        account: 3360475,
        query: "SELECT meetingMetadata.roomName FROM Log WHERE service.name='web-core' SINCE 1 hour ago LIMIT 5"
    };

    nrApp.query(options)
        .then((data: any) => {
            console.log(data);
        })
        .catch((error: any) => {
            console.error(error);
        });
}

nr_test()

app.start().catch((error) => {
    console.error(error);
    process.exit(1);
});