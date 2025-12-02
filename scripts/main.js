
var animationWriter;
var quizWriter;
var character;
var isCharVisible;
var isOutlineVisible;

function updateCharacter() {
  $('#animation-target').html('');
  $('#quiz-target').html('');

  //var character = $('#character-select').val();
  var character = currentHanzi;
  $('.char-symbol').text(character);
  animationWriter = HanziWriter.create('animation-target', character, {
    width: 300,
    height: 300,
    showOutline: shouldShowOutline('animation'),
    showCharacter: false,
    radicalColor: '#32CD32', // 部首green
    strokeAnimationSpeed: 0.5, // 5x normal speed
    delayBetweenStrokes: 500 // milliseconds
  }); 

  quizWriter = HanziWriter.create('quiz-target', character, {
    width: 300,
    height: 300,
    showOutline: shouldShowOutline('quiz'),
    showCharacter: false,
    showHintAfterMisses: 1,
    drawingWidth:50,  //绘制线条的宽度
    drawingColor:'#00FFFF',//绘制线条的颜色
    strokeColor: '#FF6A6A' // 浅红色
  });
  quizWriter.quiz();

  // for easier debugging
  window.animationWriter = animationWriter;
  window.quizWriter = quizWriter;
}

function shouldShowOutline(demoType) {
  return $('#' + demoType + '-show-outline').prop('checked');
}

$(function() {
  updateCharacter();

  $('.js-char-form').on('submit', function(evt) {
    evt.preventDefault();
    updateCharacter();
  });

  $('#animate').on('click', function(evt) {
    evt.preventDefault();
    animationWriter.animateCharacter();
  });
  $('#quiz-reset').on('click', function(evt) {
    evt.preventDefault();
    quizWriter.quiz();
  });

  $('#animation-show-outline').on('click', function() {
    var method = shouldShowOutline('animation') ? 'showOutline' : 'hideOutline';
    animationWriter[method]();
  });
  $('#quiz-show-outline').on('click', function() {
    var method = shouldShowOutline('quiz') ? 'showOutline' : 'hideOutline';
    quizWriter[method]();
  });
});


/*
// 定义全局变量用于存储当前点击按钮对应的汉字
let currentHanzi = '';

// 获取页面中的相关元素
const inputHanzi = document.getElementById('input-hanzi');
const createButtons = document.getElementById('create-buttons');
const buttonContainer = document.getElementById('button-container');
const currentHanziDisplay = document.getElementById('current-hanzi-display');

// 为生成按钮添加点击事件监听器
createButtons.addEventListener('click', () => {
  const hanziArray = inputHanzi.value.trim().split('');
  buttonContainer.innerHTML = ''; // 清空按钮容器内容，防止重复添加

  // 遍历输入的每个汉字，创建对应的按钮并添加到容器中
  hanziArray.forEach((hanzi) => {
    const button = document.createElement('button');
    button.className = 'hanzi-button';
    button.textContent = hanzi;

    button.addEventListener('click', () => {
      currentHanzi = hanzi;
      currentHanziDisplay.textContent = `当前选中的汉字：${currentHanzi}`;
      const utterance = new SpeechSynthesisUtterance(hanzi);
      window.speechSynthesis.speak(utterance);
      updateCharacter();
    });
    buttonContainer.appendChild(button);
  });
});
*/
// 定义全局变量用于存储当前点击按钮对应的汉字
let currentHanzi = '';
// 用于标记语音功能是否可用
let speechSupported = false;
// 存储可用的中文语音
let chineseVoice = null;
// 标记语音是否已初始化
let voicesLoaded = false;

/**
 * 获取并选择最佳中文语音
 * 优先选择 zh-CN 或 zh-Hans 的语音
 */
function loadChineseVoice() {
    if (!('speechSynthesis' in window)) {
        console.log('当前浏览器不支持语音合成功能');
        speechSupported = false;
        return;
    }

    const voices = window.speechSynthesis.getVoices();
    console.log('可用语音列表：', voices.map(v => `${v.name} (${v.lang})`));

    if (voices.length === 0) {
        console.log('语音列表为空，等待加载...');
        return;
    }

    // 优先查找中文语音 (zh-CN, zh-Hans, zh-TW, zh-HK 等)
    chineseVoice = voices.find(voice => 
        voice.lang.startsWith('zh-CN') || voice.lang.startsWith('zh-Hans')
    );

    // 如果没找到简体中文，尝试查找其他中文语音
    if (!chineseVoice) {
        chineseVoice = voices.find(voice => voice.lang.startsWith('zh'));
    }

    // 如果还是没找到，使用默认语音
    if (!chineseVoice && voices.length > 0) {
        chineseVoice = voices[0];
        console.log('未找到中文语音，使用默认语音：', chineseVoice.name);
    }

    if (chineseVoice) {
        speechSupported = true;
        voicesLoaded = true;
        console.log('选择的语音：', chineseVoice.name, chineseVoice.lang);
    }
}

/**
 * 使用本地TTS API朗读（通过后端调用百度API）
 * @param {string} text - 要朗读的文字
 */
function speakWithLocalAPI(text) {
    try {
        console.log('使用本地TTS API朗读：', text);
        
        // 使用POST方式调用API，避免URL编码问题
        fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {
            // 创建音频URL
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            
            audio.onloadeddata = function() {
                console.log('语音加载完成，开始播放');
            };
            
            audio.oncanplay = function() {
                console.log('语音可以播放了');
            };
            
            audio.onended = function() {
                console.log('语音播放完成');
                // 释放URL对象
                URL.revokeObjectURL(audioUrl);
            };
            
            audio.onerror = function(e) {
                console.error('本地API语音播放错误：', e);
                console.log('请检查：1) TTS服务是否运行 2) Nginx配置是否正确');
                URL.revokeObjectURL(audioUrl);
            };
            
            // 尝试播放
            audio.play().then(() => {
                console.log('开始播放语音');
            }).catch(err => {
                console.error('播放失败：', err);
                console.log('提示：某些浏览器限制自动播放，请先点击页面任意位置');
            });
        })
        .catch(error => {
            console.error('获取语音数据失败：', error);
            console.log('请检查TTS服务是否正常运行');
        });
        
    } catch (error) {
        console.error('本地API调用失败：', error);
    }
}


/**
 * 朗读汉字（智能选择语音方案）
 * @param {string} text - 要朗读的文字
 */
function speakText(text) {
    // 优先使用浏览器原生 Web Speech API
    if (speechSupported && chineseVoice) {
        try {
            console.log('使用浏览器原生语音API朗读：', text);
            
            // 取消当前正在播放的语音
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = chineseVoice;
            utterance.lang = chineseVoice.lang || 'zh-CN';
            utterance.rate = 0.9; // 稍微慢一点，更清晰
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // 添加错误处理
            utterance.onerror = function(event) {
                console.error('语音合成错误：', event.error);
                console.log('切换到本地TTS API');
                speakWithLocalAPI(text);
            };

            utterance.onend = function() {
                console.log('语音播放完成');
            };

            window.speechSynthesis.speak(utterance);
            return;
        } catch (error) {
            console.error('浏览器原生语音朗读失败：', error);
            console.log('切换到本地TTS API');
        }
    }
    
    // 如果浏览器不支持或出错，使用本地TTS API
    console.log('浏览器不支持 Web Speech API，使用本地TTS API');
    speakWithLocalAPI(text);
}



// 等待页面DOM结构加载完成后再执行后续代码
document.addEventListener('DOMContentLoaded', () => {
    // 获取页面中的相关元素
    const inputHanzi = document.getElementById('input-hanzi');
    const createButtons = document.getElementById('create-buttons');
    const buttonContainer = document.getElementById('button-container');
    const currentHanziDisplay = document.getElementById('current-hanzi-display');

    // 检查元素是否成功获取到
    if (!inputHanzi || !createButtons || !buttonContainer || !currentHanziDisplay) {
        console.error('页面元素未找到');
        return;
    }

    // 初始化语音功能
    if ('speechSynthesis' in window) {
        // 立即尝试加载语音
        loadChineseVoice();

        // 监听语音列表变化事件（重要！移动端浏览器需要）
        window.speechSynthesis.onvoiceschanged = () => {
            console.log('语音列表已更新');
            loadChineseVoice();
        };

        // 为了兼容某些浏览器，延迟再次尝试加载
        setTimeout(loadChineseVoice, 100);
        setTimeout(loadChineseVoice, 500);
    } else {
        console.log('当前浏览器不支持 Web Speech API');
        console.log('将自动使用百度语音API作为替代方案');
        speechSupported = false;
        voicesLoaded = false;
    }


    // 为生成按钮添加点击事件监听器
    createButtons.addEventListener('click', () => {
        const hanziArray = inputHanzi.value.trim().split('');
        buttonContainer.innerHTML = ''; // 清空按钮容器内容，防止重复添加

        if (hanziArray.length === 0 || (hanziArray.length === 1 && hanziArray[0] === '')) {
            console.log('请输入汉字');
            return;
        }

        // 遍历输入的每个汉字，创建对应的按钮并添加到容器中
        hanziArray.forEach((hanzi) => {
            const button = document.createElement('button');
            button.className = 'hanzi-button';
            button.textContent = hanzi;

            button.addEventListener('click', () => {
                currentHanzi = hanzi;
                currentHanziDisplay.textContent = `当前选中的汉字：${currentHanzi}`;

                // 如果语音还未加载，尝试重新加载
                if (!voicesLoaded) {
                    loadChineseVoice();
                }

                // 朗读汉字
                speakText(hanzi);

                // 更新笔顺显示
                try {
                    updateCharacter();
                } catch (error) {
                    console.error('在执行updateCharacter()函数时出现错误：', error);
                }
            });
            buttonContainer.appendChild(button);
        });

        console.log(`已生成 ${hanziArray.length} 个汉字按钮`);
    });
});
