require('dotenv').config();
import { App } from "@slack/bolt";

const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

const app = new App({
  appToken: SLACK_APP_TOKEN,
  token: SLACK_BOT_TOKEN,
  socketMode: true,
});

app.command("/findit", async ({ client, respond }) => {
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

app.start().catch((error) => {
  console.error(error);
  process.exit(1);
});