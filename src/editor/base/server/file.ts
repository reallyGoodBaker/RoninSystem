import fs from 'fs'
import path from 'path'

export function discover(dir: string) {
    if (!fs.existsSync(dir)) {
        return []
    }

    if (!fs.statSync(dir).isDirectory()) {
        return []
    }

    return fs.readdirSync(dir)
}

export function walk(root: string, receiver: (filePath: string) => void = () => {}) {
    const files = discover(root)

    for (const file of files) {
        const _path = path.join(root, file)
        if (fs.statSync(_path).isDirectory()) {
            walk(_path, receiver)
        } else {
            receiver(_path)
        }
    }

}