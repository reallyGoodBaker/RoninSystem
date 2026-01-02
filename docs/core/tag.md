**tag.ts — API 文档**

- **源文件**: `src/engine/core/tag.ts`
- **职责**: 提供 Tag 系统用于命名空间式标记、Taggable 接口与 `TaggableObject` 抽象实现，便于对对象做分组/查询/事件管理。

主要类型与类
- `interface Taggable`
  - `getTags(): string[]`
  - `addTag(tag: string): void`
  - `removeTag(tag: string): void`

- `type TagMapping<T>`
  - 通过类型映射把对象结构中的 `null` 标记位置转换为 Tag 实例（用于从对象定义生成 Tag 常量树）。

- `enum TagEventType { Add, Remove }`

- `class Tag`
  - 静态:
    - `isValid(tagStr: string): boolean` — 校验 tag 字符串是否合法（只允许字母数字、下划线、$ 和点分隔）。
    - `from(tagStr: string): Tag` — 在受控上下文中构造 Tag 实例。
    - `of(tag: string | Tag): Tag` — 从字符串或已有 Tag 获取 Tag 实例（从内部缓存查找）。
    - `hasTag(taggable, tag, exact?)` / `hasTagAll` / `hasTagAny` — 针对 `Taggable` 的匹配检查。
    - `addTag(taggable, tag)` / `removeTag(...)` / `addTags` / `removeTags` — 静态操作工具。
    - `discardTag(tag)` — 从缓存中丢弃 Tag 并尝试从所有玩家上移除该 tag（异步）。
    - `fromObject(object)` — 将对象结构中以 `null` 代表的字段转换为 `Tag`，返回一个冻结对象（使用 `Resources.with` 临时允许 Tag 构造）。

  - 实例方法/属性:
    - `tag: string`、`isValid`、`matchTag(comparator: Tag, exact?)`、`match(comparator: string, exact?)`。

- `abstract class TaggableObject implements Taggable`
  - 要求子类实现 `addTag/removeTag/getTags`。
  - 提供: `OnTagChange` 事件 (`EventSignal<[TagEventType, Tag]>`)、`hasTag`/`hasTagAll`/`hasTagAny`、`addTags`/`removeTags`/`discardTag`。

实现细节与建议
- `Tag` 使用内部缓存（Map）以确保相同字符串的 Tag 实例共享引用并支持更快的匹配。
- 使用 `Tag.fromObject()` 能把一个配置对象转换成 Tag 常量树（推荐用于集中定义 tag 架构）。

示例
```ts
const playerTag = Tag.from('player.human')
Tag.addTag(someTaggable, playerTag)
if (someTaggable.hasTag('player')) { /* 匹配子标签 */ }

// 使用对象定义生成 Tag tree
const T = Tag.fromObject({ enemy: { zombie: null, skeleton: null }, player: { human: null } })
// T.enemy.zombie 是 Tag 实例
```
