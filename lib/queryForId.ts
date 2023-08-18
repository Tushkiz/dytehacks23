import { getEnvVars } from "./getEnvVars";

const NerdGraph = require('newrelic-nerdgraph-client');
const nrApp = new NerdGraph(getEnvVars().NR_API_KEY)

const LOG_LIMIT = 1

function formatDate(date: string) {
    return Intl.DateTimeFormat([], {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      }).format(new Date(date));
}

export async function queryNewRelicForOrgId(id: string) {
    const res = await queryNewRelic(`SELECT * FROM Log WHERE meetingMetadata.peerId='${id}' SINCE 24 HOURS AGO LIMIT ${LOG_LIMIT}`);
    // stats
    return {
        type: 'organization',

    }
}

export async function queryNewRelicForRoomName(id: string) {
    const res = await queryNewRelic(`SELECT * FROM Log WHERE meetingMetadata.roomName='${id}' SINCE 24 HOURS AGO LIMIT ${LOG_LIMIT}`);
    return {
        type: 'room',
        meetingId: res['meetingMetadata.roomName'],
        organizationId: res['meetingMetadata.organizationId'],
    }
}

export async function queryNewRelicForSessionId(id: string) {
    const res = await queryNewRelic(`SELECT * FROM Log WHERE metadata.params.sessionId='${id}' SINCE 24 HOURS AGO LIMIT 1`)
    return {
        type: 'session',
        sessionId: id,
        meetingTitle: res['metadata.params.meetingTitle'],
        meetingId: res['metadata.params.meetingId'] || res['meetingMetadata.roomName'],
        organizationId: res['metadata.params.organizationId'],
        startedAt: formatDate(res['metadata.params.startedAt']),
        endedAt: formatDate(res['metadata.params.endedAt']),
    }
}

export async function queryNewRelicForPeerId(id: string) {
    const res = await queryNewRelic(`SELECT * FROM Log WHERE meetingMetadata.peerId='${id}' SINCE 24 HOURS AGO LIMIT ${LOG_LIMIT}`);
    let details: any = {
        type: 'peer',
        peerId: id,
        meetingId: res['meetingMetadata.roomName'],
        organizationId: res['meetingMetadata.organizationId'],

    }
    if (res['service.name'] === 'web-core') {
        details = {
            ...details,
            browserName: res['meetingMetadata.deviceInfo.browserName'],
            browserVersion: res['meetingMetadata.deviceInfo.browserVersion'],
            osName: res['meetingMetadata.deviceInfo.osName'],
            sdkVersion: res['meetingMetadata.sdkVersion'],
            isMobile: res['meetingMetadata.deviceInfo.isMobile'],
            userId: res['meetingMetadata.userId'],
            visitedUrl: res['meetingMetadata.visitedUrl'],
        }
    } else if (res['service.name'] === 'mobile-core') {
        details = {
            ...details,
            deviceInfo: res['meetingMetadata.deviceInfo.deviceInfo'],
            deviceModel: res['meetingMetadata.deviceInfo.deviceModel'],
            deviceType: res['meetingMetadata.deviceInfo.deviceType'],
            batteryLevel: res['meetingMetadata.deviceInfo.batteryLevel'],
            osVersion: res['meetingMetadata.deviceInfo.osVersion'],
            sdkVersion: res['meetingMetadata.sdkVersion'],
            sdkType: res['meetingMetadata.deviceInfo.sdkType'],
        }
    }

    return details;
}

export async function queryNewRelicForUserId(id: string) {
    const res = await queryNewRelic(`SELECT * FROM Log WHERE metadata.params.userId='${id}' SINCE 24 HOURS AGO LIMIT ${LOG_LIMIT}`);
    return {
        type: 'user',
        userId: id,
        peerId: res['metadata.params.peerId'],
        meetingId: res['metadata.params.session.meetingId'],
        meetingTitle: res['metadata.params.session.meetingTitle'],
        organizationId: res['metadata.params.session.organizationId'],
        joinedAt: res['metadata.params.joinedAt'],
        leftAt: res['metadata.params.leftAt'],
        presetName: res['metadata.params.presetName'],
        displayName: res['metadata.params.displayName'],
    }
}

export async function queryNewRelicForErrors(id: string) {
    const res = await queryNewRelic(`SELECT message FROM Log WHERE allColumnSearch('${id}', insensitive: true) WHERE level = 'error' OR level = 'ERROR' SINCE 1 day ago`)
    return res;
}

export async function queryNewRelic(query: string): Promise<any> {
    const options = {
        account: getEnvVars().NR_API_KEY,
        query: query
    };

    const res = nrApp.query(options);
    if (res.length !== 0) return res[0];
}
