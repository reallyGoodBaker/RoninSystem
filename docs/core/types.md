**types.ts — API 文档**

- **源文件**: `src/engine/core/types.ts`
- **职责**: 常用类型定义集合。

类型
- `ConstructorOf<Inst, Args extends Array<any> = any[]>`
  - 定义: `new (...args: Args) => Inst`
  - 用途: 表示构造函数类型，常用于泛型约束，例如工厂/反射创建实例时传入构造函数类型。

示例
```ts
function make<T>(ctor: ConstructorOf<T>, ...args: any[]): T {
  return new ctor(...args)
}
```
