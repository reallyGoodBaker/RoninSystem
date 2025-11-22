import { createEffect } from '../common/responsive'
import { replicable } from './replicator'
import fs from 'fs'
import path from 'path'

const [ cwd, setCwd ] = replicable(
    'editor.cwd',
    'assets'
)

interface FileDesc {
    name: string,
    isDir: boolean
}

const [ files, setFiles ] = replicable<FileDesc[]>(
    'editor.files',
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

export {
    cwd,
    setCwd,
    files,
    setFiles
}