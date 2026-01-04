import { ControlKitComponent } from "@ronin/plugins/ronin/control"
import { IPlugin } from "@ronin/core/architect/plugin"
import { registerPlayerComponent, registerPlayerController, registerPlayerSpawnClass } from "@ronin/core/architect/config"
import { DeterminationHudComponent } from "@ronin/plugins/ronin/determination"
import { ActionBarComponent } from "@ronin/hud/screenDisplay"
import { RoninModPlayer } from "./player"
import { RoninPlayerController } from "./roninController"
import { IApplication } from "@ronin/core/architect/application"
import { AnimationSequencePlugin } from "../animSeq/animPlugin"
import { FinateStateMachinePlugin } from "../fsm/plugin"

export class RoninPlugin implements IPlugin {
    name = 'RoninBase'
    description = '浪人系统的基础插件 (默认情况只提供最小功能)'

    startModule(): void {
        registerPlayerSpawnClass(
            RoninModPlayer
        )

        registerPlayerController(
            RoninPlayerController
        )

        registerPlayerComponent(
            ActionBarComponent,
            DeterminationHudComponent,
            ControlKitComponent,
        )
    }
}

export class RoninSwordSystem implements IPlugin {
    name = 'RoninSwordSystem'
    description = '浪人动作系统的完整插件'

    startModule(app: IApplication): void {
        registerPlayerSpawnClass(
            RoninModPlayer
        )

        registerPlayerController(
            RoninPlayerController
        )

        registerPlayerComponent(
            ActionBarComponent,
            DeterminationHudComponent,
            ControlKitComponent,
        )

        app.loadPlugin(
            AnimationSequencePlugin,
            FinateStateMachinePlugin,
        )
    }
}