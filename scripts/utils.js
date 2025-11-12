import fs from 'fs'
import path from 'path'
import os from 'os'

const legacyMinecraftPath = 'AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang'
const mcRoot = path.join(os.homedir(), legacyMinecraftPath)

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