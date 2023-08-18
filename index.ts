import axios from "axios";

require('dotenv').config();
import {App} from "@slack/bolt";

const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN!;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
const CALLSTATS_PEER_REPORT = process.env.CALLSTATS_PEER_REPORT!;
const CALLSTATS_TOKEN = process.env.CALLSTATS_TOKEN!;
const PEER_ID = process.env.PEER_ID!;
const DEV_PORTAL = process.env.DEV_PORTAL


interface Response {
	data: UserWrapper;
}

interface UserWrapper {
    loggedUser: User
}

interface User {
    id: string,
    name: string,
    ownedOrgs: Org[]
}

interface Org {
    name: String
}

getOrgs()


// axios.post({
//     url: "https://api.dyte.io/graphql",
//     headers: {
//       accept: "*/*",
//       "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
//       authorization:
//         `Bearer ${DEV_PORTAL}`,
//       "cache-control": "no-cache",
//       "content-type": "application/json",
//       pragma: "no-cache",
//       "sec-ch-ua":
//         '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
//       "sec-ch-ua-mobile": "?0",
//       "sec-ch-ua-platform": '"macOS"',
//       "sec-fetch-dest": "empty",
//       "sec-fetch-mode": "cors",
//       "sec-fetch-site": "same-site",
//     },
//     referrer: "https://dev.dyte.io/",
//     referrerPolicy: "strict-origin-when-cross-origin",
//     body: '{"query":"\\n    query {\\n        loggedUser {\\n            id\\n            name\\n            ownedOrgs {\\n                id\\n                name\\n                accessToken\\n            }\\n        }\\n    }\\n"}',
//     method: "POST",
//     mode: "cors",
//     credentials: "include",
//   }).then(() => {});
function getOrgs() {
    const options = {
        method: 'POST',
        url: 'https://api.dyte.io/graphql',
        headers: {
            "accept": "*/*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "authorization": `Bearer ${DEV_PORTAL}`,
          "cache-control": "no-cache",
          "content-type": "application/json",
          "pragma": "no-cache",
          "sec-ch-ua":'"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
        },
        data: '{"query":"\\n    query {\\n        loggedUser {\\n            id\\n            name\\n            ownedOrgs {\\n                id\\n                name\\n                accessToken\\n            }\\n        }\\n    }\\n"}',
        mode: "cors",
        credentials: "include"
    };
    
    axios
            .request(options)
            .then(function ({ data } : {data:Response}) {
                console.log(data);
                console.log(data.data.loggedUser.name)
                for (let org of data.data.loggedUser.ownedOrgs) {
                    console.log(org);
                }
                console.log(data.data.loggedUser.ownedOrgs.length)
            })
            .catch(function (error: any) {
                console.error(error);
            });
}



