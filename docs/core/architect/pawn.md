**Pawn — API 文档**

- **源文件**: `src/engine/core/architect/pawn.ts`
- **职责**: Pawn 是绑定到游戏原生 `Entity` 的 Actor。实现 `Possessable` 接口，提供对原生实体组件（装备、背包等）的访问便捷方法。

类
- Pawn extends Actor implements Possessable
  - constructor(entityRef: Entity)
    - 参数: `entityRef`：原生 `Entity` 引用。
  - static isPawn(actor: Actor)
  - controller: Controller | null
  - onPossess(controller: Controller)
  - onUnPossess()
  - getController<T extends IController>()
  - get entity() — 访问当前原生实体（若实体无效将返回 null 并清除内部引用）
  - getNativeComponent<T extends string>(componentId: T)
    - 返回原生实体上的组件（若存在且有效），否则 undefined。
  - setEquipment(slot: EquipmentSlot, equipment: ItemStack)
  - getEquipment(slot: EquipmentSlot)
  - inventory getter — 快捷获取 Entity 的 Inventory component（缓存后复用）

示例
```ts
const pawn = new Pawn(entity)
pawn.setEquipment(EquipmentSlot.head, someItem)
const inv = pawn.inventory
```

详细参考 — 方法与注意事项

- `constructor(entityRef: Entity)`
  - 创建一个绑定到原生 `Entity` 的 Pawn。`id` 使用 `entityRef.id`。

- `get entity()`
  - 返回当前原生实体引用。如果实体失效（`isValid` 为 false），返回 `null` 并清除内部引用以避免悬挂引用。

- `getNativeComponent<T extends string>(componentId: T): EntityComponentReturnType<T> | undefined`
  - 返回原生实体上的组件实例（如果存在且 `isValid`）。常用 componentId 如 `entity.getComponent(EntityInventoryComponent.componentId)`。

- 装备/背包快捷方法
  - `setEquipment(slot: EquipmentSlot, equipment: ItemStack): boolean` — 设置装备并返回成功状态。
  - `getEquipment(slot: EquipmentSlot)` — 获取指定槽位的 ItemStack（若存在）。
  - `inventory` getter — 缓存 `EntityInventoryComponent` 实例以避免多次查找。

示例 — 检查实体是否有效并操作
```ts
const pawn = new Pawn(entity)
if (pawn.entity) {
  pawn.setEquipment(EquipmentSlot.chest, someItem)
  const inv = pawn.inventory
}

// 安全读取原生组件
const comp = pawn.getNativeComponent(EntityInventoryComponent.componentId)
if (comp && comp.isValid) {
  // 操作
}
```
