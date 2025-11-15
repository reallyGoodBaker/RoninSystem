import fs from 'fs'
import path from 'path'

export function parseConf() {
    const conf = fs.readFileSync(path.join(import.meta.dirname, '../.conf'))
    const fields = conf.toString().split('\n').map(field => field.trim())
    const confObj = {}

    fields.filter(f => f && f.includes('=') && !f.startsWith('#') && !f.startsWith(';'))
        .forEach(field => {
            const [key, value] = field.split('=')
            confObj[key] = value
        })

    return {
        resourceName: confObj['asset.resource.name'],
        behaviorName: confObj['asset.behavior.name'],
        ...confObj
    }
}