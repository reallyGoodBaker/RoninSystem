**Animation Sequence (animSeq)**
- **Description:**: 管理按“序列”播放的动画和动画层（`base` / `override`）。适用于需要精确帧/事件控制并在角色上播放复杂动作的场景。
- **Source:**: `src/engine/plugins/animSeq/`

- **主要类型与类与 API 签名:**
  - `class AnimationSequencePlugin implements IPlugin` (`animPlugin.ts`)
    - `name: string` — 插件名称
    - `description: string`
    - `startModule(app: IApplication): void` — 注册组件与调试命令
    - `static getAnimSeqComp(id: string): AnimationSequenceComponent | undefined`

  - `class AnimationSequenceComponent extends Component` (`anim.ts`)
    - `readonly allowTicking: boolean`
    - `readonly animLayers: AnimLayers`
    - `readonly animSeqs: Map<AnimSequenceCtor, AnimSequence>`
    - `static readonly animSeqRegistry: Map<string, AnimSequenceCtor>`
    - `update(): void`
    - `protected getOrCreateAnimSeq(cls: AnimSequenceCtor): AnimSequence`
    - `playAnimSeq(animName: string, base?: boolean): Promise<void>`
    - `stopAnimation(animName: string): void`
    - `getAnimation(animName: string): AnimSequence | null`
    - `getAnimationNames(): string[]`
    - `clearAnimation(): void`
    - `getPlayingAnimation(): AnimSequence | undefined`

  - `class AnimLayers` (`anim.ts`)
    - 管理两个层集合：`base: Set<AnimSequence>` 和 `override: Set<AnimSequence>`
    - `playAnimSeq(animSeq: AnimSequence, base?: boolean): Promise<boolean>`
    - `playAnimSeqList(base: boolean, ...animSeqList: AnimSequence[]): Promise<boolean[]>`
    - `stopAnimSeq(animSeq: AnimSequence): void`
    - `clearLayer(base?: boolean): void`
    - `clearAll(): void`
    - `update(): void`
    - `getPlayingAnimation(): AnimSequence | undefined`

  - `abstract class AnimSequence` (`sequence.ts`)
    - properties (must be provided by subclasses):
      - `readonly animation: string`
      - `readonly duration: number` (ticks)
      - `readonly playingType: AnimPlayingType`
      - `readonly override: boolean`
      - `readonly animNotifEvents: AnimSeqEvent[]`
      - `readonly notifies: Record<string, number>`
      - `readonly states: Record<string, number[]>`
      - `readonly options: PlayAnimationOptions`
    - runtime properties:
      - `ticksPlayed: number`, `isPlaying: boolean`, `finished: boolean`
      - `Onfinished: EventSignal<[boolean]>`
    - lifecycle methods:
      - `start(layers: AnimLayers): void`
      - `stop(): void`
      - `update(layers: AnimLayers): void`
      - `restore(): void`
      - `restart(layers: AnimLayers): void`
      - `findNotify(tick: number): AnimSeqEvent | undefined`
      - `callNotify(tick: number): void`
      - `getOwner(): Pawn | undefined`

  - `enum AnimPlayingType { Once, Loop, HoldOnLastFrame }` (`sequence.ts`)

- **Behavior notes:**
  - `AnimLayers` 在每帧调用 `update()`，按优先级处理 `override` 层（优先）再处理 `base` 层。
  - `playAnimSeq` 返回一个会在该序列完成或被取消时解析的 Promise。
  - `AnimSequence` 提供 `animNotifEvents` / `notifies` 字段与 `callNotify` 机制，使子类可以在指定 tick 自动调用同名方法实现事件回调。

- **示例:**
  - 定义并注册动画序列类
    ```ts
    import { AnimSequence, AnimPlayingType } from '@ronin/plugins/animSeq/sequence'
    import { AnimationSequence } from '@ronin/plugins/animSeq/anim'

    @AnimationSequence
    class WalkSequence extends AnimSequence {
      static animation = 'walk'
      readonly animation = 'walk'
      readonly duration = 20
      readonly playingType = AnimPlayingType.Loop
      readonly override = false
      readonly animNotifEvents = []
      readonly notifies = {}
      readonly states = {}
      readonly options = {}

      onStart(layers) { /* initial setup */ }
      onUpdate(layers) { /* per-tick update */ }
    }
    ```

  - 在运行时播放动画
    ```ts
    const comp = actor.getComponent(AnimationSequenceComponent)
    await comp?.playAnimSeq('walk', true)
    ```

- **扩展与工具:**
  - `tool/parseAnimSeq.ts` 和 `autoImport.ts`（如存在）用于从项目资源文件解析/导入动画定义，可用于批量注册动画类或从 JSON 定义生成 `AnimSequence` 子类。
