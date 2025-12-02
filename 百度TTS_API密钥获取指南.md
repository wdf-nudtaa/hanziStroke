# 百度语音合成API密钥获取指南

## 问题说明
当前使用的 BCE v3 格式密钥（`bce-v3/ALTAK-xxx/xxx`）不适用于语音合成API。
语音合成需要在百度AI开放平台创建专门的应用。

## 获取步骤

### 1. 访问百度AI开放平台
打开浏览器访问：https://console.bce.baidu.com/ai/#/ai/speech/overview/index

### 2. 创建语音合成应用
1. 点击左侧菜单 **"语音技术"** → **"语音合成"**
2. 点击 **"创建应用"** 按钮
3. 填写应用信息：
   - 应用名称：例如 `汉字笔顺练习TTS`
   - 应用描述：例如 `用于汉字学习网站的语音朗读功能`
   - 接口选择：勾选 **"短文本在线合成"**
4. 点击 **"立即创建"**

### 3. 获取API密钥
创建成功后，在应用列表中可以看到：
- **AppID**：应用ID（可能不需要）
- **API Key**：类似 `aBcDeFg1234567890xxxxx`
- **Secret Key**：类似 `XyZ9876543210abcdefxxxxxx`

### 4. 配置到系统中

#### 方法1：更新systemd服务配置（推荐）
编辑文件 `/var/www/html/hanzi/api/tts-service.service`：
```ini
[Service]
Environment="BAIDU_API_KEY=你的API_Key"
Environment="BAIDU_SECRET_KEY=你的Secret_Key"
```

然后重新加载服务：
```bash
sudo cp /var/www/html/hanzi/api/tts-service.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart tts-service
```

#### 方法2：设置用户环境变量
编辑 `~/.bashrc` 文件，添加：
```bash
export BAIDU_API_KEY="你的API_Key"
export BAIDU_SECRET_KEY="你的Secret_Key"
```

然后重新加载：
```bash
source ~/.bashrc
sudo systemctl restart tts-service
```

### 5. 测试API
配置完成后，可以通过以下命令测试：
```bash
curl "http://localhost:81/api/tts?text=你好" -o test.mp3
file test.mp3  # 应该显示: test.mp3: Audio file with ID3 version 2.3.0
```

## 重要说明

### 免费额度
- 百度语音合成提供每天5万次的免费调用额度
- 超出后会收取费用，请注意使用量

### API文档
- 官方文档：https://ai.baidu.com/ai-doc/SPEECH/Qk38y8lrl
- 开发者控制台：https://console.bce.baidu.com/ai/#/ai/speech/app/list

### 当前方案
在获取到正确的API密钥之前，系统会继续使用浏览器自带的 Web Speech API（如果浏览器支持）。
- ✅ Windows Edge/Chrome：支持良好
- ❓ 华为平板/手机浏览器：需要测试
- ❌ 不支持的浏览器：将无法播放语音

## 问题排查

如果配置后仍然不工作，请检查：
1. API Key 和 Secret Key 是否复制完整（没有多余空格）
2. 是否选择了正确的API接口（短文本在线合成）
3. 百度云账号是否已实名认证
4. 查看服务日志：`sudo journalctl -u tts-service -n 50`
