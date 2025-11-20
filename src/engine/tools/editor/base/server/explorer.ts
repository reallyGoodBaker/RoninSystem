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

createEffect(() => {
    setFiles(
        fs.readdirSync(path.join(root, cwd()))
            .map(name => ({
                name,
                isDir: fs.statSync(path.join(root, cwd(), name)).isDirectory()
            }))
    )
})

export {
    cwd,
    setCwd,
    files,
    setFiles
}