# Timeline Track Plugin 使用指南

## 安装步骤

1. 将整个 `blockbench_plugin` 文件夹复制到 Blockbench 的插件目录：
   - Windows: `%appdata%/Blockbench/plugins/`
   - macOS: `~/Library/Application Support/Blockbench/plugins/`
   - Linux: `~/.config/Blockbench/plugins/`

2. 重启 Blockbench

3. 在 Blockbench 中启用插件：
   - 转到 "文件" > "设置" > "插件"
   - 找到 "Timeline Track Plugin" 并启用它

## 基本使用方法

### 方法一：通过菜单添加轨道
1. 打开一个动画项目
2. 点击顶部菜单栏的 "动画" 菜单
3. 选择 "添加自定义轨道"
4. 在弹出的对话框中选择轨道类型和输入轨道名称
5. 点击确认添加

### 方法二：通过工具栏添加轨道
1. 打开时间轴面板（如果未打开，点击 "窗口" > "时间轴"）
2. 在时间轴工具栏中找到 "添加轨道" 按钮（图标为 +）
3. 点击按钮，选择轨道类型和名称
4. 点击确认添加

## 支持的轨道类型

- **自定义事件轨道**（绿色）：用于添加自定义动画事件
- **声音事件轨道**（橙色）：用于添加音效事件
- **粒子效果轨道**（蓝色）：用于添加粒子效果
- **脚本事件轨道**（紫色）：用于添加脚本执行事件

## 注意事项

- 必须先创建或打开一个动画才能添加轨道
- 轨道添加后可以在时间轴中看到，颜色根据类型区分
- 可以在轨道上添加关键帧来设置事件触发时间

## 故障排除

如果插件无法加载：
- 检查插件文件夹是否正确放置在 plugins 目录
- 确保在 Blockbench 设置中启用了插件
- 重启 Blockbench 后重试

如需更多高级用法，请参考 example_usage.md 文件。
