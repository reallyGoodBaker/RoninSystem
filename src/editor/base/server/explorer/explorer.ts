import { createEffect } from '../../common/responsive'
import { getServer, replicable } from '../replicator'
import fs from 'fs'
import path from 'path'
import { alert } from '../alert'
import { ExplorerMode } from '@editor/config/explorerMode'
import { behaviorPath, resourcePath } from '../conf'
import { getFilesFromCwd, handleFiles, registerCompactFileCategory } from './discover'

const [ explorerMode, setExplorerMode ] = replicable<ExplorerMode>(
    'explorer.mode',
    ExplorerMode.BEHAVIOR
)

const [ cwd, setCwd ] = replicable(
    'explorer.cwd',
    [ '', '', '' ]
)

interface FileDesc {
    name: string,
    isDir: boolean
}

const [ files, setFiles ] = replicable<FileDesc[]>(
    'explorer.files',
    []
)

function getSortedFileDescs(filePath: string) {
    return fs.readdirSync(filePath)
        .map(name => ({
            name,
            isDir: fs.statSync(path.join(filePath, name)).isDirectory()
        }))
        .sort(({ isDir }, { isDir: isDir2 }) => isDir ? -1 : isDir2 ? 1 : 0)
}

const filePathResolver = {
    [ExplorerMode.BEHAVIOR]: behaviorPath,
    [ExplorerMode.RESOURCE]: resourcePath,
}

createEffect(() => {
    try {
        const _explorerMode = explorerMode()
        const _cwd = cwd()[_explorerMode] as string

        if (filePathResolver[_explorerMode as keyof typeof filePathResolver]) {
            const filePath = filePathResolver[_explorerMode as keyof typeof filePathResolver](_cwd)
            setFiles(getSortedFileDescs(filePath))   
            return
        }

        setFiles(getFilesFromCwd(_cwd))
    } catch {
        setFiles(getSortedFileDescs(behaviorPath('')))
        setCwd([ '', '', '' ])
    }
})

getServer().addErrorHandler(err => {
    alert.open('错误', err.message)
})

const [ contentFile, setContentFile ] = replicable<string>(
    'explorer.content',
    ''
)

export {
    cwd,
    setCwd,
    files,
    setFiles,
    contentFile,
    setContentFile,
}

export function registerFilePathResolver(mode: ExplorerMode, resolver: (uri: string) => string) {
    filePathResolver[mode as keyof typeof filePathResolver] = resolver
}

// 生物
registerCompactFileCategory(
    '生物',
    filePath => fs.readFileSync(filePath, 'utf-8').includes('"minecraft:entity"'),
)

// 物品
registerCompactFileCategory(
    '物品',
    filePath => fs.readFileSync(filePath, 'utf-8').includes('"minecraft:item"'),
)

// 方块
registerCompactFileCategory(
    '方块',
    filePath => fs.readFileSync(filePath, 'utf-8').includes('"minecraft:block"')
)


handleFiles()