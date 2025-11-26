import fs from 'fs'
import path from 'path'

export const RealRoot = path.join(__dirname, '../../')

export function parseConf() {
    const conf = fs.readFileSync(path.join(RealRoot, '.conf'))
    const fields = conf.toString().split('\n').map(field => field.trim())
    const confObj: Record<string, string> = {}

    fields.filter(f => f && f.includes('=') && !f.startsWith('#') && !f.startsWith(';'))
        .forEach(field => {
            const [key, value] = field.split('=')
            confObj[key] = value
        })

    return {
        resourceName: confObj['asset.resource.name'],
        behaviorName: confObj['asset.behavior.name'],
        addonName: confObj['addon.name'],
        ...confObj
    }
}

export const AssetsPath = path.join(RealRoot, 'assets')
export const BehaviorsPath = path.join(AssetsPath, 'behaviors')
export const ResourcesPath = path.join(AssetsPath, 'resources')
export const DistPath = path.join(RealRoot, 'dist')

const cachedConf = parseConf()

export function behaviorPath(...args: string[]) {
    return path.join(BehaviorsPath, cachedConf.behaviorName, ...args)
}

export function resourcePath(...args: string[]) {
    return path.join(ResourcesPath, cachedConf.resourceName, ...args)
}

export function distPath(...args: string[]) {
    return path.join(DistPath, ...args)
}