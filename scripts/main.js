
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
 * 朗读汉字
 * @param {string} text - 要朗读的文字
 */
function speakText(text) {
    if (!speechSupported || !chineseVoice) {
        console.log('语音功能不可用');
        return;
    }

    try {
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
        };

        utterance.onend = function() {
            console.log('语音播放完成');
        };

        window.speechSynthesis.speak(utterance);
        console.log('正在朗读：', text);
    } catch (error) {
        console.error('朗读时发生错误：', error);
    }
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
        console.log('当前浏览器不支持语音合成功能');
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
