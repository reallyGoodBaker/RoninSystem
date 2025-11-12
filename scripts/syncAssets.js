import { cpAssets } from "./utils.js"

export default function syncAssetsPlugin() {
    return {
        name: 'sync-assets',
        watchChange(id, changes) {
            cpAssets()
        }
    }
}