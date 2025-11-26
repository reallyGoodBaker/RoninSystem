import fs from 'fs'
import path from 'path'
import os from 'os'
import { parseConf } from './parser.js'

const { root } = parseConf()

const mcRoot = root ?? path.join(os.homedir(), 'AppData/Roaming/Minecraft Bedrock/Users/Shared/games/com.mojang')

const devBehaviorPath = path.join(mcRoot, 'development_behavior_packs')
const devResourcePath = path.join(mcRoot, 'development_resource_packs')

const assetsPath = path.join(import.meta.dirname, '../assets')
const behAssets = path.join(assetsPath, 'behaviors')
const resAssets = path.join(assetsPath, 'resources')

export function cpAssets() {
    fs.readdirSync(behAssets).forEach(file => {
        try {
            fs.cpSync(path.join(behAssets, file), path.join(devBehaviorPath, file), { recursive: true})
        } catch (error) {
            console.error(error)
        }
    })

    fs.readdirSync(resAssets).forEach(file => {
        try {
            fs.cpSync(path.join(resAssets, file), path.join(devResourcePath, file), { recursive: true })
        } catch (error) {
            console.error(error)
        }
    })
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}