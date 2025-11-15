/// <reference types="blockbench-types" />


// Blockbench Timeline Track Plugin
// 为Blockbench时间轴添加新轨道的插件

let plugin

// 生成UUID的简单函数
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

// 插件注册
Plugin.register('timeline_track', plugin = {
    title: 'Timeline Track Plugin',
    author: 'RoninSystem',
    description: '为Blockbench时间轴添加新轨道的插件',
    icon: 'add',
    version: '1.0.0',
    tags: ['Timeline', 'Animation'],
    variant: 'both',
    
    onload() {
        console.log('Timeline Track Plugin 加载成功')
        plugin.setupMenu()
        plugin.setupToolbar()
    },
    
    onunload() {
        console.log('Timeline Track Plugin 卸载')
    },
    
    // 设置菜单
    setupMenu() {
        // 在动画菜单中添加选项
        const action = new Action('add_custom_track', {
            name: '添加自定义轨道',
            icon: 'add',
            description: '在时间轴中添加新的自定义轨道',
            click: () => {
                plugin.showTrackSelectionDialog()
            }
        })

        MenuBar.addAction(action, 'animation')
    },
    
    // 设置工具栏
    setupToolbar() {
        // 在动画工具栏中添加按钮
        const action = new Action('add_track_button', {
            name: '添加轨道',
            icon: 'add',
            description: '快速添加自定义轨道',
            click: () => {
                plugin.showTrackSelectionDialog()
            },
            condition: () => Animator.selected !== undefined
        })

        // 添加到动画工具栏
        if (Toolbars.animation) {
            const element = action.toElement(Toolbars.animation.node)
            Toolbars.animation.node.appendChild(element)
        }
    },
    
    // 显示轨道选择对话框
    showTrackSelectionDialog() {
        if (!Animator.selected) {
            Blockbench.showMessageBox({
                title: '错误',
                message: '请先选择一个动画',
                icon: 'error'
            })
            return
        }
        
        // 轨道类型定义
        const trackTypes = [
            {
                id: 'custom_event',
                name: '自定义事件轨道',
                color: 0x00ff00
            },
            {
                id: 'sound_event', 
                name: '声音事件轨道',
                color: 0xff9900
            },
            {
                id: 'particle_event',
                name: '粒子效果轨道',
                color: 0x0099ff
            },
            {
                id: 'script_event',
                name: '脚本事件轨道',
                color: 0xff00ff
            }
        ]
        
        // 创建对话框
        const dialog = new Dialog({
            id: 'track_selection_dialog',
            title: '选择轨道类型',
            width: 400,
            form: {
                track_type: {
                    label: '轨道类型',
                    type: 'select',
                    options: trackTypes.reduce((obj, track) => {
                        obj[track.id] = track.name
                        return obj
                    }, {})
                },
                track_name: {
                    label: '轨道名称',
                    type: 'text',
                    value: '新轨道'
                }
            },
            onConfirm: (formResult) => {
                plugin.addTrackToTimeline(formResult.track_type, formResult.track_name)
            }
        }).show()
    },
    
    // 添加轨道到时间轴
    addTrackToTimeline(trackType, trackName) {
        try {
            const animation = Animator.selected
            if (!animation) {
                throw new Error('没有选中的动画')
            }
            
            // 确保 animation.animators 对象存在
            if (!animation.animators) {
                animation.animators = {}
            }
            
            // 确保 Timeline.animators 数组存在
            if (!Timeline.animators || !Array.isArray(Timeline.animators)) {
                Timeline.animators = []
            }
            
            // 创建新的轨道UUID
            const trackUUID = generateUUID()
            
            // 创建新的EffectAnimator实例，它更适合自定义轨道
            const newTrack = new EffectAnimator(trackUUID, animation, trackName)
            
            // 设置轨道颜色
            newTrack.color = plugin.getTrackColor(trackType)
            
            // 确保轨道在时间轴中可见
            newTrack.visible = true
            newTrack.expanded = true
            newTrack.locked = false
            newTrack.enabled = true
            
            // 确保轨道名称正确显示
            newTrack.name = trackName
            
            // 为轨道添加一个基本通道，使其能够添加关键帧
            newTrack.channels = {
                value: {
                    name: 'Value',
                    transform: false,
                    mutable: true,
                    max_data_points: 1
                }
            }
            
            // 初始化关键帧数组
            newTrack.keyframes = []
            
            // 确保轨道有正确的类型
            newTrack.type = 'effect'
            
            // 添加到动画的animators对象
            animation.animators[trackUUID] = newTrack
            
            // 添加到时间轴的animators数组
            Timeline.animators.push(newTrack)
            
            // 刷新时间轴显示
            if (typeof Timeline.update === 'function') {
                Timeline.update()
            }
            
            Blockbench.showQuickMessage(`已添加 ${trackName}`)
            
            console.log('轨道添加成功:', newTrack)
        } catch (error) {
            console.error('添加轨道失败:', error)
            Blockbench.showMessageBox({
                title: '错误',
                message: `添加轨道失败: ${error.message}`,
                icon: 'error'
            })
        }
    },
    
    // 获取轨道颜色
    getTrackColor(trackType) {
        const colors = {
            custom_event: 0x00ff00, // 绿色
            sound_event: 0xff9900,  // 橙色
            particle_event: 0x0099ff, // 蓝色
            script_event: 0xff00ff   // 紫色
        }
        return colors[trackType] || 0xffffff
    }
})
