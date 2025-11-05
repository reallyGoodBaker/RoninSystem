import { ControlKitComponent } from "@ronin/plugins/ronin/control"
import { IPlugin } from "@ronin/core/architect/plugin"
import { registerPlayerComponent, registerPlayerController, registerPlayerSpawnClass } from "@ronin/core/config"
import { DeterminationHudComponent } from "@ronin/plugins/ronin/determination"
import { ActionBarComponent } from "@ronin/hud/screenDisplay"
import { RoninModPlayer } from "./player"
import { RoninPlayerController } from "./roninController"

export class RoninPlugin implements IPlugin {
    name = 'RoninBasePlugin'
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