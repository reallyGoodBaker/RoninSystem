import { system, world } from '@minecraft/server'
import { Resource, Resources } from './architect/resorce'
import { ObjectHelper } from '@ronin/utils/helpers/objectHelper'

const isTag = Symbol('isTag')

export interface Taggable {
    getTags(): string[]
    addTag(tag: string): void
    removeTag(tag: string): void
}

/**
 * 将一个对象类型映射到 Tag 类型
 * - 如果 T 是对象类型，递归地将所有属性值映射到 Tag 类型
 * - 如果属性值是对象，继续递归映射
 * - 如果属性值不是对象，映射到 Tag 类型
 */
export type TagMapping<T> = T extends object
    ? { [K in keyof T]: Readonly<
        T[K] extends null ? Tag
            : T[K] extends object ? TagMapping<T[K]>
            : never
    >}
    : never

export class Tag {
    private static readonly _tagMap = new Map<string, Tag>()
    private static readonly constructable: Resource & { allowTagConstruct: boolean } = {
        allowTagConstruct: false,
        enter() {
            this.allowTagConstruct = true
        },
        exit() {
            this.allowTagConstruct = false
        }
    }

    static isValid(tagStr: string): boolean {
        const container = tagStr.trim().split('.')
        return !container.some(v => !v.match(/[\w\$]+/))
    }

    static of(tag: string | Tag): Tag {
        // @ts-ignore
        return tag[isTag] === Object.prototype ? tag : Tag._tagMap.get(tag)
    }

    private _isValid: boolean
    private _childTag = new Set<Tag>()

    // 标记
    ;[isTag] = Object.prototype

    // create
    constructor(
        public readonly tag: string,
    ) {
        if (!Tag.constructable.allowTagConstruct) {
            throw new Error('Tag class is not allowed to construct')
        }

        if (this._isValid = Tag.isValid(tag)) {
            Tag._tagMap.set(tag, this)
        }
    }

    get isValid() {
        return this._isValid
    }

    toString() {
        if (this._isValid) {
            return this.tag
        }

        return ''
    }

    matchTag(comparator: Tag, exact = false) {
        // 无效的tag不进行匹配
        if (!this.isValid || !comparator.isValid) {
            return false
        }

        // 正常情况下相同字符串构造的tag引用是相同的
        if (exact) {
            return this === comparator
        }

        // 直接查找缓存
        if (this._childTag.has(comparator)) {
            return true
        }

        // 缓存未命中，进行匹配
        if (this.tag.startsWith(comparator.tag)) {
            this._childTag.add(comparator)
            return true
        }

        return false
    }

    match(comparator: string, exact = false): boolean {
        return this.matchTag(Tag.of(comparator), exact)
    }

    static hasTag(taggable: Taggable, tag: string | Tag, exact = false): boolean {
        const tagObj = Tag.of(tag)

        // 减少不必要的遍历
        return taggable.getTags()
            .some(t => Tag.of(t).matchTag(tagObj, exact))
    }

    static hasTagAll(taggable: Taggable, tags: (string | Tag)[], exact = false): boolean {
        return tags.every(tag => Tag.hasTag(taggable, tag, exact))
    }

    static hasTagAny(taggable: Taggable, tags: (string | Tag)[], exact = false): boolean {
        return tags.some(tag => Tag.hasTag(taggable, tag, exact))
    }

    static addTag(taggable: Taggable, tag: string | Tag): void {
        const tagObj = Tag.of(tag)

        if (tagObj.isValid) {
            taggable.addTag(tagObj.tag)
        }
    }

    static addTags(taggable: Taggable, tags: (string | Tag)[]): void {
        tags.forEach(tag => Tag.addTag(taggable, tag))
    }

    static removeTag(taggable: Taggable, tag: string | Tag): void {
        const tagObj = Tag.of(tag)

        taggable.removeTag(tagObj.tag)
        tagObj._childTag.delete(tagObj)
    }

    static removeTags(taggable: Taggable, tags: (string | Tag)[]): void {
        tags.forEach(tag => Tag.removeTag(taggable, tag))
    }

    static discardTag(tag: string | Tag): void {
        const tagObj = Tag.of(tag)

        Tag._tagMap.delete(tagObj.tag)
        // 清除缓存让gc回收
        tagObj._childTag.clear()
        tagObj._isValid = false

        system.run(() => {
            for (const player of world.getAllPlayers()) {
                player.removeTag(tagObj.tag)
            }
        })
    }

    /**
     * @param object 参数会被修改并返回
     */
    static fromObject<O extends object>(object: O): TagMapping<O> {
        return Resources.with(this.constructable, () => {
            ObjectHelper.traverse(object, (obj, key, parent, path) => {
                if (obj === null) {
                    const tag = this.of(path.join('.'))
                    if (!tag.isValid) {
                        return null
                    }
        
                    parent[key] = tag
                }
            })

            return Object.freeze(object)
        })[0] as TagMapping<O>
    }
}

export abstract class TaggableObject implements Taggable {
    abstract addTag(tag: string): void
    abstract removeTag(tag: string): void
    abstract getTags(): string[]

    hasTag(tag: string | Tag, exact = false): boolean {
        return Tag.hasTag(this, tag, exact)
    }

    hasTagAll(tags: (string | Tag)[], exact = false): boolean {
        return Tag.hasTagAll(this, tags, exact)
    }

    hasTagAny(tags: (string | Tag)[], exact = false): boolean {
        return Tag.hasTagAny(this, tags, exact)
    }

    addTags(tags: (string | Tag)[]): void {
        Tag.addTags(this, tags)
    }

    removeTags(tags: (string | Tag)[]): void {
        Tag.removeTags(this, tags)
    }

    discardTag(tag: string | Tag): void {
        Tag.discardTag(tag)
    }
}
