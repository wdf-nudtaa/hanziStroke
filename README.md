# 汉字笔顺练习网页
为方便小学生在学习汉字时掌握正确的笔顺开发此小网页。

## 使用指南
1. 在输入框中多个要练习的汉字，点击"生成按钮"
2. 每个汉字都会生成一个按钮。
3. 逐个点击各汉字按钮，网页将朗读该汉字，并生成笔顺动画和测试动画。部首以绿色突出显示

## TTS语音发音功能
### 功能特点
- **智能语音合成**：优先使用浏览器原生Web Speech API，失败时自动回退到百度TTS API
- **移动端兼容**：支持Android手机、华为平板等移动设备浏览器
- **中文优化**：专门针对中文语音合成优化，发音清晰准确
- **错误处理**：完善的错误处理和故障恢复机制

### 技术架构
```
前端浏览器 → Nginx (80端口) → Flask TTS服务 (5000端口) → 百度TTS API → MP3音频 → 用户
```

## 优化项
本项目基于Hanzi-Writer库开发，为了提升网页访问效率，将部分css,js和各汉字的Json文件在服务器上做了缓存。
hanzi-writer.js文件中主要更改了defaultCharDataLoader函数，优先从服务器取汉字动画的json文件，如果没有再从互联网上查找。

## 维护信息
### 服务管理
- **TTS服务状态**：`sudo systemctl status tts-service`
- **重启TTS服务**：`sudo systemctl restart tts-service`
- **查看TTS日志**：`sudo journalctl -u tts-service -f`
- **重启Nginx**：`sudo systemctl restart nginx`

### 配置文件
- **Nginx配置**：`/etc/nginx/sites-available/hanzi`
- **TTS服务配置**：`/var/www/html/hanzi/api/tts-service.service`
- **Flask应用**：`/var/www/html/hanzi/api/tts_server.py`
- **前端代码**：`/var/www/html/hanzi/scripts/main.js`

### API配置
TTS服务使用百度语音合成API，需要配置以下环境变量：
```
BAIDU_API_KEY=LrXxEFCufYhy3xkchgl8hzpZ
BAIDU_SECRET_KEY=pPh420RhZTjVaJ2t38LlpNMBjo20HRRc
```
环境变量已配置在systemd服务文件中。

### 故障排除
1. **语音不工作**：检查浏览器控制台查看错误信息
2. **移动端问题**：已集成vConsole用于移动端调试（打开网页后右下角可见）
3. **缓存问题**：JavaScript文件使用版本参数避免缓存（index.html中的?v=4.0）
4. **服务状态**：确保tts-service和nginx服务都在运行状态

## 已完成的功能
- [x] 集成百度TTS语音合成API
- [x] 实现浏览器原生语音API的智能回退机制
- [x] 配置完整的系统服务（systemd + Nginx）
- [x] 优化移动端浏览器兼容性
- [x] 添加详细的错误处理和日志记录

## 开发记录
- **最新提交**：feat: 添加汉字TTS语音发音功能（commit 4322d85）
- **Git仓库**：https://github.com/wdf-nudtaa/hanziStroke.git
- **部署时间**：2025年12月2日
