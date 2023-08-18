export function getEnvVars() {
  const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN!;
  const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
  const CALLSTATS_PEER_REPORT = process.env.CALLSTATS_PEER_REPORT!;
  const CALLSTATS_TOKEN = process.env.CALLSTATS_TOKEN!;
  const PEER_ID = process.env.PEER_ID!;
  const NR_API_KEY = process.env.NR_API_KEY!;
  const NR_ACCOUNT_ID = process.env.NR_ACCOUNT_ID!;
  const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;
  const DEV_PORTAL = process.env.DEV_PORTAL!;
  return {
    SLACK_APP_TOKEN,
    SLACK_BOT_TOKEN,
    CALLSTATS_PEER_REPORT,
    CALLSTATS_TOKEN,
    PEER_ID,
    NR_API_KEY,
    NR_ACCOUNT_ID: parseInt(NR_ACCOUNT_ID, 10),
    SLACK_SIGNING_SECRET,
    DEV_PORTAL,
  };
}
