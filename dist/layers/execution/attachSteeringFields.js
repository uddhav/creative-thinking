export function attachSteeringFields(response, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0)
        return;
    const parsed = JSON.parse(response.content[0].text);
    for (const key of keys) {
        parsed[key] = fields[key];
    }
    response.content[0].text = JSON.stringify(parsed, null, 2);
}
//# sourceMappingURL=attachSteeringFields.js.map