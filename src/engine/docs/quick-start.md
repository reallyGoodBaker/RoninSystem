# Quick Start

## 武器制作

### 武器的输入检测

1. 继承自 `Component` 然后通过 `this.actor.getComponent<InputComponent>(InputComponent)` 来获取输入组件，

```ts
import { Component } from '@ronin/core/component'
import { InputComponent } from '@ronin/input/inputComponent'

@PlayerComponent // 用于告诉引擎这个组件应该在玩家生成时自动添加到玩家实体上
export class MyComponent extends Component {

    // 在每一刻都会调用一次
    update() {
        const input = this.actor.getComponent<InputComponent>(InputComponent)
        /// 做点什么...
    }
}
```

你有两种方式检测输入：

- 通过映射获得按键数据
- 通过监听特定输入事件

简单的演示如下
```ts
input.getInput('Jump') // 获取跳跃按键数据
```

- 添加 `ss:chargeable` 自定义组件和 `minecraft:use_modifiers` ，否则武器蓄力技能将无法正常工作。
- 为 `ss:chargeable` 添加 `triggerThreshold` 和 `holdThreshold` 自定义属性，用于设置蓄力技能的蓄力时间。
```json
{   // components
    "ss:chargeable": {
        "triggerThreshold": 6, // 触发蓄力技能的阈值，按下0.3秒触发蓄力
        "holdThreshold": 12     // 蓄力技能的持续时间，按下0.6秒蓄力完成
    }
}
```
- 通过 `getChargeEventStateFromMainhand` 方法获取当前蓄力状态。
```ts
import { Component } from '@ronin/core/component'
import { ChargingState, InputComponent } from '@ronin/input/inputComponent'
import { profiler } from "@ronin/core/profiler"


@PlayerComponent // 用于告诉引擎这个组件应该在玩家生成时自动添加到玩家实体上
export class MyComponent extends Component {

    // 在每一刻都会调用一次
    update() {
        const input = this.actor.getComponent<InputComponent>(InputComponent)
        /// 做点什么...
    }

    // 在组件开始时调用一次
    start() {
        const input = this.actor.getComponent<InputComponent>(InputComponent)
        input.addListener('Interact', (pressing, dt) => {
            // `getChargeEventStateFromMainhand` 的值只在松开时有意义, 
            // 想要获得按下时的状态，请使用 `getChargingStateFromMainhand`
            if (!pressing) {
                const chargingState = input.getChargeEventStateFromMainhand(dt)

                if (chargingState === ChargeEventState.Cancel) {
                    profiler.info('Canceled')
                }

                if (chargingState === ChargeEventState.Finish) {
                    profiler.info('Finished')
                }

                if (chargingState === ChargeEventState.Compelete) {
                    profiler.info('Compeleted')
                }
            }
        })
    }
}
```
