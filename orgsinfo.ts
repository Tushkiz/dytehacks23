import axios from "axios";

require('dotenv').config();

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
    name: string,
    id: string,
    accessToken: string
}

export function getOrgs() {
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
            .then(function ({ data }: {data: Response}) {
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

export function getOrgStats(orgId: string, apikey: string) {
    let date = new Date();
    let firstDay = Date.now() - 30*24*60*60*1000;
    let lastDay = Date.now();
    const options = {
        method: 'GET',
        url: `https://api.dyte.io/v1/organizations/${orgId}/stats?startTime=${firstDay}&endTime=${lastDay}`,
        headers: {
            "accept": "*/*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "authorization": `APIKEY ${apikey}`,
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
        mode: "cors",
        credentials: "include"
    };
    axios
            .request(options)
            .then(function ({ data }) {
                console.log(data);
            })
            .catch(function (error: any) {
                console.error(error);
            });
}
