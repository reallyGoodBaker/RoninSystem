import { createEffect } from '../common/responsive'
import { getServer, replicable } from './replicator'
import fs from 'fs'
import path from 'path'
import { alert } from './alert'

const [ cwd, setCwd ] = replicable(
    'explorer.cwd',
    'assets'
)

interface FileDesc {
    name: string,
    isDir: boolean
}

const [ files, setFiles ] = replicable<FileDesc[]>(
    'explorer.files',
    []
)

const root = path.join(__dirname, '../../')

function getSortedFileDescs(filePath: string) {
    return fs.readdirSync(path.join(root, filePath))
        .map(name => ({
            name,
            isDir: fs.statSync(path.join(root, filePath, name)).isDirectory()
        }))
        .sort(({ isDir }, { isDir: isDir2 }) => isDir ? -1 : isDir2 ? 1 : 0)
}

createEffect(() => {
    try {
        setFiles(getSortedFileDescs(cwd()))
    } catch {
        setFiles(getSortedFileDescs('assets'))
        setCwd('assets')
    }
})

getServer().addErrorHandler(err => {
    alert.open('错误', err.message)
})

export {
    cwd,
    setCwd,
    files,
    setFiles
}