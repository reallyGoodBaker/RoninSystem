import { BehaviorsPath, DistPath, parseConf, ResourcesPath } from "../../engine/utils/tool/conf"
import path from 'path'

// @ts-ignore
const Zip = require('adm-zip')
const zip = new Zip()

export function bundleFiles() {
    const { resourceName, behaviorName, addonName } = parseConf()
    const behavior = path.join(BehaviorsPath, behaviorName)
    const resource = path.join(ResourcesPath, resourceName)

    zip.addLocalFolder(behavior, 'b')
    zip.addLocalFolder(resource, 'r')

    return zip.writeZipPromise(path.join(DistPath, addonName + '.mcaddon'))
}

bundleFiles()