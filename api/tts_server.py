#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度语音合成API服务
提供文字转语音接口
"""

from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import requests
import json
import base64
import os

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 从环境变量读取百度API密钥
# 支持BCE v3格式: bce-v3/{AK}/{SK}
BAIDU_AK = os.getenv('BAIDU_AK', '')
if BAIDU_AK and BAIDU_AK.startswith('bce-v3/'):
    # 解析BCE v3格式
    parts = BAIDU_AK.split('/')
    if len(parts) == 3:
        API_KEY = parts[1]  # Access Key
        SECRET_KEY = parts[2]  # Secret Key
    else:
        API_KEY = os.getenv('BAIDU_API_KEY', '')
        SECRET_KEY = os.getenv('BAIDU_SECRET_KEY', '')
else:
    API_KEY = os.getenv('BAIDU_API_KEY', '')
    SECRET_KEY = os.getenv('BAIDU_SECRET_KEY', '')

# 百度语音合成API地址
TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token'
TTS_URL = 'https://tsn.baidu.com/text2audio'


def get_access_token():
    """获取百度API的access_token"""
    try:
        params = {
            'grant_type': 'client_credentials',
            'client_id': API_KEY,
            'client_secret': SECRET_KEY
        }
        response = requests.post(TOKEN_URL, params=params, timeout=5)
        result = response.json()
        
        if 'access_token' in result:
            return result['access_token']
        else:
            print(f"获取token失败: {result}")
            return None
    except Exception as e:
        print(f"获取token异常: {e}")
        return None


@app.route('/api/tts', methods=['GET', 'POST'])
def text_to_speech():
    """文字转语音接口"""
    try:
        # 获取要转换的文本
        if request.method == 'POST':
            data = request.get_json()
            text = data.get('text', '')
        else:
            text = request.args.get('text', '')
        
        if not text:
            return jsonify({'error': '文本不能为空'}), 400
        
        print(f"收到TTS请求，文本: {text}")
        
        # 获取access_token
        access_token = get_access_token()
        if not access_token:
            return jsonify({'error': '获取access_token失败'}), 500
        
        # 调用百度TTS API
        params = {
            'tex': text,
            'tok': access_token,
            'cuid': 'hanzi_app',
            'ctp': 1,  # 客户端类型
            'lan': 'zh',  # 语言
            'spd': 5,  # 语速，取值0-9，默认5
            'pit': 5,  # 音调，取值0-9，默认5
            'vol': 9,  # 音量，取值0-15，默认5
            'per': 0,  # 发音人，0女声，1男声，3情感合成-度逍遥，4情感合成-度丫丫
            'aue': 3,  # 音频格式，3-mp3，4-pcm-16k，5-pcm-8k，6-wav
        }
       
        response = requests.get(TTS_URL, params=params, timeout=10)
        
        # 检查返回内容类型
        content_type = response.headers.get('Content-Type', '')
        
        if 'audio' in content_type:
            # 成功返回音频
            print(f"TTS成功，返回音频数据")
            return Response(response.content, mimetype='audio/mp3')
        else:
            # 返回的是错误信息（JSON）
            try:
                error_msg = response.json()
                print(f"TTS失败: {error_msg}")
                return jsonify({'error': '语音合成失败', 'detail': error_msg}), 500
            except:
                print(f"TTS失败，未知错误")
                return jsonify({'error': '语音合成失败'}), 500
                
    except Exception as e:
        print(f"TTS服务异常: {e}")
        return jsonify({'error': f'服务异常: {str(e)}'}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'message': '百度TTS服务运行正常',
        'api_key_configured': bool(API_KEY)
    })


if __name__ == '__main__':
    print("=" * 50)
    print("百度语音合成服务启动")
    print(f"API Key: {API_KEY[:10]}...")
    print(f"Secret Key: {SECRET_KEY[:10]}...")
    print("监听端口: 5000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
