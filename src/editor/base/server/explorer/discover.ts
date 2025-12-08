import { walk } from '../file'
import { behaviorPath } from '../conf'
import { FileDesc } from '@editor/base/browser/ui/explorer/files/fileView'
import fs from 'fs'
import path from 'path'

const explorerStore: Record<string, any> = {}

export class FileCategory {
    constructor(
        readonly name: string
    ) {
        explorerStore[this.name] = this.files
    }

    files: Record<string, string> = {}

    addFile(name: string, file: string) {
        this.files[name] = file
    }

    removeFile(name: string) {
        delete this.files[name]
    }

    getFile(name: string) {
        return this.files[name]
    }

    getFileEntries() {
        return Object.entries(this.files)
    }

    clear() {
        this.files = {}
    }

}

export interface FileMatcher {
    (file: string): boolean
}

const categories = new Map<string, FileMatcher>()
const categoryInsts: FileCategory[] = []

export function registerCompactFileCategory(
    category: string,
    matcher: FileMatcher,
) {
    categories.set(category, matcher)
}

export function handleFiles() {
    for (const [ category ] of categories.entries()) {
        const inst = new FileCategory(category)
        categoryInsts.push(inst)
    }

    walk(behaviorPath(''), filePath => {
        for (const [ category, matcher ] of categories.entries()) {
            if (matcher(filePath)) {
                const fileName = path.basename(filePath)
                categoryInsts.find(categoryInst => categoryInst.name === category)?.addFile(fileName, filePath)
            }
        }
    })
}

export function getCategory(categoryName: string) {
    return categoryInsts.find(categoryInst => categoryInst.name === categoryName)
}

export function getFilesFromCwd(cwd: string): FileDesc[] {
    if (cwd === '') {
        return categoryInsts.map(category => ({
            isDir: true,
            name: category.name,
        }))
    }

    const [ _, category, fileName ] = cwd.split('/')
    if (fileName) {
        throw new Error('Unexpected cwd: ' + cwd)
    }

    return getCategory(category)?.getFileEntries().map(([ name ]) => {
        return {
            isDir: false,
            name,
        }
    }) ?? []
}