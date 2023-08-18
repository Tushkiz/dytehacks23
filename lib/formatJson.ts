export function formatJson(json: any) {
    const data = [json].flat();
    return data.map(t => Object.keys(t).map(k => { return `*${k}*: \`${t[k]}\`` }).join('\n'));
}

export function formatJsonBlock(json: any) {
    const data = formatJson(json);
    return data.map(d => {
        return [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": d
                }
            },
            {
                "type": "divider"
            }
        ]
    }).flat();
}