# Timeline Track Plugin 使用示例

本文档提供插件的实际使用示例，帮助您快速上手。

## 基础使用示例

### 1. 添加自定义事件轨道

```javascript
// 在您的脚本中，可以通过以下方式使用插件
// 假设插件已经安装并启用

// 添加自定义事件轨道
plugin.addTrackToTimeline('custom_event')

// 在特定时间点添加关键帧
const customTrack = Timeline.animation.animators.find(animator => 
    animator.type === 'custom_event'
)

if (customTrack) {
    customTrack.keyframes.push({
        time: 1.5, // 1.5秒
        value: 'attack_start',
        customData: {
            damage: 10,
            effect: 'fire'
        }
    })
}
```

### 2. 配置声音事件轨道

```javascript
// 添加声音轨道
plugin.addTrackToTimeline('sound_event')

const soundTrack = Timeline.animation.animators.find(animator => 
    animator.type === 'sound_event'
)

if (soundTrack) {
    // 配置轨道属性
    soundTrack.properties = {
        soundFile: 'sounds/attack.wav',
        volume: 0.8,
        pitch: 1.2
    }

    // 添加关键帧
    soundTrack.keyframes.push({
        time: 0.5,
        value: 'play',
        customData: {
            loop: false,
            fadeIn: 0.1
        }
    })
}
```

## 高级使用示例

### 批量添加多个轨道

```javascript
// 批量添加轨道
const trackConfigs = [
    { type: 'custom_event', name: '攻击事件' },
    { type: 'sound_event', name: '音效轨道' },
    { type: 'particle_event', name: '粒子效果' }
]

trackConfigs.forEach(config => {
    plugin.addTrackToTimeline(config.type)
    
    // 重命名轨道
    const track = Timeline.animation.animators.find(animator => 
        animator.type === config.type
    )
    if (track) {
        track.name = config.name
    }
})
```

### 自定义轨道配置

```javascript
// 创建自定义轨道配置
const advancedTrackConfig = {
    custom_event: {
        eventType: 'damage',
        dataType: 'number',
        defaultValue: 5,
        validation: {
            min: 0,
            max: 100
        }
    },
    sound_event: {
        soundFile: 'custom/sound.wav',
        volume: 1.0,
        pitch: 1.0,
        spatial: true,
        attenuation: 0.5
    },
    particle_event: {
        particleType: 'explosion',
        count: 10,
        duration: 2.0,
        color: '#ff0000',
        size: 0.5
    },
    script_event: {
        script: 'function onEvent(time, data) { console.log("Event at", time, data); }',
        parameters: {
            target: 'player',
            scope: 'global'
        }
    }
}

// 应用高级配置
Object.keys(advancedTrackConfig).forEach(trackType => {
    const track = Timeline.animation.animators.find(animator => 
        animator.type === trackType
    )
    if (track) {
        track.properties = advancedTrackConfig[trackType]
    }
})
```

## 与Minecraft Bedrock动画集成

### 导出为Minecraft Bedrock格式

```javascript
// 导出自定义轨道数据用于Minecraft Bedrock动画
function exportForMinecraftBedrock() {
    const customTracksData = plugin.exportCustomTrackData()
    
    const bedrockAnimation = {
        format_version: "1.10.0",
        animations: {
            "animation.custom.attack": {
                animation_length: Timeline.animation.length,
                timeline: {}
            }
        }
    }

    // 将自定义轨道转换为timeline事件
    Object.values(customTracksData).forEach(track => {
        track.keyframes.forEach(keyframe => {
            const timeKey = keyframe.time.toFixed(4)
            
            if (!bedrockAnimation.animations["animation.custom.attack"].timeline[timeKey]) {
                bedrockAnimation.animations["animation.custom.attack"].timeline[timeKey] = []
            }
            
            bedrockAnimation.animations["animation.custom.attack"].timeline[timeKey].push(
                `// ${track.type}: ${keyframe.value}`
            )
        })
    })
    
    return bedrockAnimation
}

// 使用示例
const bedrockData = exportForMinecraftBedrock()
console.log(JSON.stringify(bedrockData, null, 2))
```

### 事件处理示例

```javascript
// 在游戏代码中处理自定义事件
class AnimationEventHandler {
    constructor() {
        this.eventHandlers = new Map()
        this.setupEventHandlers()
    }

    setupEventHandlers() {
        // 自定义事件处理
        this.eventHandlers.set('custom_event', (time, data) => {
            switch (data.value) {
                case 'attack_start':
                    this.onAttackStart(time, data.customData)
                    break
                case 'attack_hit':
                    this.onAttackHit(time, data.customData)
                    break
                case 'attack_end':
                    this.onAttackEnd(time, data.customData)
                    break
            }
        })

        // 声音事件处理
        this.eventHandlers.set('sound_event', (time, data) => {
            if (data.value === 'play') {
                this.playSound(data.customData.soundFile, data.customData)
            }
        })

        // 粒子事件处理
        this.eventHandlers.set('particle_event', (time, data) => {
            this.spawnParticles(data.customData.particleType, data.customData)
        })

        // 脚本事件处理
        this.eventHandlers.set('script_event', (time, data) => {
            try {
                eval(data.customData.script)
            } catch (error) {
                console.error('脚本执行错误:', error)
            }
        })
    }

    onAttackStart(time, data) {
        console.log(`攻击开始于 ${time}秒`, data)
        // 实现攻击开始逻辑
    }

    onAttackHit(time, data) {
        console.log(`攻击命中于 ${time}秒`, data)
        // 实现攻击命中逻辑
        if (data.damage) {
            this.applyDamage(data.damage)
        }
    }

    onAttackEnd(time, data) {
        console.log(`攻击结束于 ${time}秒`, data)
        // 实现攻击结束逻辑
    }

    playSound(soundFile, options) {
        console.log(`播放音效: ${soundFile}`, options)
        // 实现音效播放逻辑
    }

    spawnParticles(particleType, options) {
        console.log(`生成粒子: ${particleType}`, options)
        // 实现粒子生成逻辑
    }

    applyDamage(amount) {
        console.log(`造成伤害: ${amount}`)
        // 实现伤害应用逻辑
    }

    handleAnimationEvent(eventType, time, data) {
        const handler = this.eventHandlers.get(eventType)
        if (handler) {
            handler(time, data)
        }
    }
}

// 使用事件处理器
const eventHandler = new AnimationEventHandler()

// 模拟动画播放
function simulateAnimationPlayback(animationData) {
    animationData.keyframes.forEach(keyframe => {
        setTimeout(() => {
            eventHandler.handleAnimationEvent(
                keyframe.trackType,
                keyframe.time,
                keyframe
            )
        }, keyframe.time * 1000)
    })
}
```

## 实用工具函数

### 轨道管理工具

```javascript
// 轨道管理工具类
class TrackManager {
    static getAllCustomTracks() {
        return Timeline.animation.animators.filter(animator => 
            animator.id && animator.id.startsWith('custom_track_')
        )
    }

    static getTrackByType(type) {
        return Timeline.animation.animators.find(animator => 
            animator.type === type
        )
    }

    static getTracksByTypes(types) {
        return Timeline.animation.animators.filter(animator => 
            types.includes(animator.type)
        )
    }

    static removeTrack(trackId) {
        const index = Timeline.animation.animators.findIndex(animator => 
            animator.id === trackId
        )
        if (index !== -1) {
            Timeline.animation.animators.splice(index, 1)
            Timeline.update()
            return true
        }
        return false
    }

    static duplicateTrack(trackId) {
        const originalTrack = Timeline.animation.animators.find(animator => 
            animator.id === trackId
        )
        if (originalTrack) {
            const duplicatedTrack = JSON.parse(JSON.stringify(originalTrack))
            duplicatedTrack.id = `custom_track_${Date.now()}`
            duplicatedTrack.name = `${originalTrack.name} (副本)`
            
            Timeline.animation.animators.push(duplicatedTrack)
            Timeline.update()
            return duplicatedTrack
        }
        return null
    }
}

// 使用示例
const customTracks = TrackManager.getAllCustomTracks()
console.log('所有自定义轨道:', customTracks)

const eventTracks = TrackManager.getTracksByTypes(['custom_event', 'script_event'])
console.log('事件相关轨道:', eventTracks)
```

### 关键帧工具

```javascript
// 关键帧管理工具
class KeyframeManager {
    static addKeyframe(trackId, time, value, customData = {}) {
        const track = Timeline.animation.animators.find(animator => 
            animator.id === trackId
        )
        if (track) {
            track.keyframes.push({
                time,
                value,
                customData,
                interpolation: 'linear' // 可以配置插值类型
            })
            
            // 按时间排序
            track.keyframes.sort((a, b) => a.time - b.time)
            Timeline.update()
            return true
        }
        return false
    }

    static removeKeyframe(trackId, time) {
        const track = Timeline.animation.animators.find(animator => 
            animator.id === trackId
        )
        if (track) {
            const index = track.keyframes.findIndex(kf => kf.time === time)
            if (index !== -1) {
                track.keyframes.splice(index, 1)
                Timeline.update()
                return true
            }
        }
        return false
    }

    static getKeyframesInRange(trackId, startTime, endTime) {
        const track = Timeline.animation.animators.find(animator => 
            animator.id === trackId
        )
        if (track) {
            return track.keyframes.filter(kf => 
                kf.time >= startTime && kf.time <= endTime
            )
        }
        return []
    }

    static moveKeyframe(trackId, oldTime, newTime) {
        const track = Timeline.animation.animators.find(animator => 
            animator.id === trackId
        )
        if (track) {
            const keyframe = track.keyframes.find(kf => kf.time === oldTime)
            if (keyframe) {
                keyframe.time = newTime
                track.keyframes.sort((a, b) => a.time - b.time)
                Timeline.update()
                return true
            }
        }
        return false
    }
}

// 使用示例
KeyframeManager.addKeyframe('custom_track_123', 2.5, 'special_attack', {
    damage: 25,
    element: 'lightning'
})
```

## 调试和故障排除

### 调试工具

```javascript
// 调试工具函数
class DebugTools {
    static logTrackInfo() {
        const customTracks = TrackManager.getAllCustomTracks()
        console.group('自定义轨道信息')
        customTracks.forEach(track => {
            console.group(`轨道: ${track.name} (${track.type})`)
            console.log('ID:', track.id)
            console.log('属性:', track.properties)
            console.log('关键帧数量:', track.keyframes.length)
            console.log('关键帧:', track.keyframes)
            console.groupEnd()
        })
        console.groupEnd()
    }

    static validateTracks() {
        const issues = []
        const customTracks = TrackManager.getAllCustomTracks()
        
        customTracks.forEach(track => {
            // 检查关键帧时间是否有效
            track.keyframes.forEach((kf, index) => {
                if (kf.time < 0) {
                    issues.push(`轨道 ${track.name}: 关键帧 ${index} 时间不能为负数`)
                }
                if (kf.time > Timeline.animation.length) {
                    issues.push(`轨道 ${track.name}: 关键帧 ${index} 时间超出动画长度`)
                }
            })
            
            // 检查关键帧时间顺序
            for (let i = 1; i < track.keyframes.length; i++) {
                if (track.keyframes[i].time < track.keyframes[i-1].time) {
                    issues.push(`轨道 ${track.name}: 关键帧时间顺序错误`)
                    break
                }
            }
        })
        
        return issues
    }

    static exportDebugInfo() {
        return {
            timestamp: new Date().toISOString(),
            pluginVersion: '1.0.0',
            customTracks: TrackManager.getAllCustomTracks().map(track => ({
                id: track.id,
                name: track.name,
                type: track.type,
                keyframeCount: track.keyframes.length,
                properties: track.properties
            })),
            issues: this.validateTracks()
        }
    }
}

// 使用调试工具
console.log('轨道调试信息:', DebugTools.exportDebugInfo())
```

这些示例展示了插件的各种使用场景，从基础操作到高级集成。您可以根据实际需求调整这些代码。
