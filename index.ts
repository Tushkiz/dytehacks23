import axios from "axios";

require("dotenv").config();
import { App } from "@slack/bolt";
import {
  queryNewRelic,
  queryNewRelicForOrgId,
  queryNewRelicForPeerId,
  queryNewRelicForRoomName,
  queryNewRelicForSessionId,
  queryNewRelicForUserId,
} from "./lib/queryForId";
import { getEnvVars } from "./lib/getEnvVars";

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
  const { data } = await axios.get(CALLSTATS_PEER_REPORT + peerId, {
    headers: { Authorization: `Bearer ${CALLSTATS_TOKEN}` },
  });

  return JSON.stringify(data.data.peerReport, null, "\t");
}

app.command("/findit", async ({ client, respond, ack, payload }) => {
  await ack();
  console.log("Findit: sent ack");
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
  const res = await client.chat.postMessage({
    channel: process.env.GENERAL_CHANNEL!,
    text: "Callstats for PeerId: " + payload.text + " :thread:",
  });

  const reply = await getPeerCallstats(payload.text);

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
    thread_ts: res.ts,
  });

  console.log("Findit: sent response");
});

app.command(
  "/callstats",
  async ({ client, respond, ack, context, payload, body }) => {
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

app.command("/newrelic", async ({ client, respond, ack, context }) => {
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

  await ack();
});

app.message(/.*/, async ({ context, payload }) => {
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
