document.addEventListener('DOMContentLoaded', () => {
  // 禁止鼠标滚轮缩放
  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  }, { passive: false });

  // 禁止手势缩放
  window.addEventListener('gesturechange', (event) => {
    event.preventDefault();
  });
});

let useTimes = 100;
const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
const todayUseTimes = {
  date: new Date().toLocaleDateString('zh-CN', options),
  times: useTimes,
};
if(!JSON.parse(sessionStorage.getItem('useTimes')) || 
JSON.parse(sessionStorage.getItem('useTimes'))?.date !== new Date().toLocaleDateString('zh-CN', options)) {
    sessionStorage.setItem('useTimes', JSON.stringify(todayUseTimes));
}

// document.getElementById('tip_notice').innerHTML = `由于机器人前期研发阶段，经费有限，故每天使用次数有限，今日使用次数：${JSON.parse(sessionStorage.getItem('useTimes')).times}次，望理解！`;

const dsApiUrl = 'https://api.deepseek.com/v1/chat/completions';
const dsKey1 = '55e871';
const dsKey2 = '396bc4';
const dsKey3 = '6afac2';
const dsKey4 = 'e5062c';
const dsKey5 = '2a9b566';
const dsModel = 'deepseek-chat';

const hyApiUrl = 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';
const hyKey1 = 'GNlUpW';
const hyKey2 = 'r7J0HpzGKcT';
const hyKey3 = 'rwqaUG2JIS10';
const hyKey4 = 'ixQSQpS56RK';
const hyKey5 = 'pABBQRP';
const hyModel = 'hunyuan-turbo';

document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const sendText = document.getElementById('send-text');
  const loadingSpinner = document.getElementById('loading-spinner');

  appendMessage('Hello! ,今天过的好吗，快来和Jasper一起聊聊天吧！😄', 'ai');

  // 发送消息
  sendBtn.addEventListener('click', async () => {   
    if (JSON.parse(sessionStorage.getItem('useTimes')).times <= 0) {
      appendMessage('抱歉，已达到调用次数上限。(挺贵的，给我省点！😠)', 'ai');
      return;
    } else {
      let newTimes = JSON.parse(sessionStorage.getItem('useTimes')).times;
      newTimes -= 1;
      const todayUseTimesChanged = {
        date: new Date().toLocaleDateString('zh-CN', options),
        times: newTimes,
      };
      sessionStorage.setItem('useTimes', JSON.stringify(todayUseTimesChanged));
    }
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // 显示用户消息
    appendMessage(userMessage, 'user');

    // 禁用输入和按钮
    userInput.disabled = true;
    sendBtn.disabled = true;
    sendText.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    // 调用 API
    try {
      const modelSelect = document.getElementById('model-select').value;
      let aiResponse = null;
      if (modelSelect === 'deepseek') {
        aiResponse = await callDSAPI(userMessage);
      } else {
        aiResponse = await callHYAPI(userMessage);
      }
      const replyResponse = getAIReply(userMessage,aiResponse);
      appendMessage(replyResponse, 'ai');
    } catch (error) {
      appendMessage('抱歉，请求失败，请稍后重试。', 'ai');
      console.error('API 调用失败:', error);
    }

    // 恢复输入和按钮
    userInput.disabled = false;
    sendBtn.disabled = false;
    sendText.classList.remove('hidden');
    loadingSpinner.classList.add('hidden');

    // 清空输入框
    userInput.value = '';
    userInput.focus();
  });

  async function callDSAPI(message) {
    
    let apiUrl = dsApiUrl; 
    let apiKey = 'sk'+'-'+'b' + dsKey1 + dsKey2 + dsKey3 + dsKey4 + dsKey5;
    let modelName = dsModel;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content; 
  }

  async function callHYAPI(message) {
    const response = await fetch(hyApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${'sk'+'-'+'g' + hyKey1 + hyKey2 + hyKey3 + hyKey4 + hyKey5}`,
      },
      body: JSON.stringify({
        model: hyModel,
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content; 
  }

  // 添加消息到聊天框
  function appendMessage(message, sender) {
    const md = window.markdownit();
    const htmlContent = md.render(message);
    const headIcon = sender === 'ai' ? `<img src="https://thirdwx.qlogo.cn/mmopen/vi_32/lWfF1X3ty2YlMcHuPSRzTIV0AzIuRo1d8Y0iaIQ31AfiaWC74iakTw51uTcQHy4vsKLAV2zgsicwCcFoZr4O173OgQ/132" alt="head-icon" />` : `<svg t="1740646831143" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9527" width="30" height="30" data-spm-anchor-id="a313x.search_index.0.i2.72cd3a81nYiSyu"><path d="M573.44 122.88c98.304 0 180.224 81.92 180.224 178.176 0 102.4-81.92 178.176-180.224 178.176s-180.224-81.92-180.224-178.176C389.12 204.8 471.04 122.88 573.44 122.88z" fill="#EE9B9B" p-id="9528"></path><path d="M651.264 497.664c71.68-47.104 122.88-133.12 122.88-229.376C774.144 122.88 655.36 0 512 0S251.904 122.88 251.904 270.336c0 98.304 51.2 180.224 122.88 229.376C190.464 563.2 57.344 737.28 51.2 942.08c0 16.384 16.384 30.72 30.72 30.72s30.72-16.384 30.72-30.72c6.144-219.136 184.32-399.36 399.36-399.36S907.264 722.944 911.36 942.08c0 16.384 16.384 30.72 30.72 30.72 16.384 0 30.72-16.384 30.72-30.72-6.144-208.896-139.264-382.976-321.536-444.416M313.344 270.336c0-112.64 88.064-204.8 200.704-204.8 108.544 0 200.704 92.16 200.704 204.8s-88.064 204.8-200.704 204.8c-108.544 0-200.704-92.16-200.704-204.8" fill="#f39092" p-id="9529" data-spm-anchor-id="a313x.search_index.0.i3.72cd3a81nYiSyu" class="selected"></path></svg>`;
    const messageHtml = 
    `<div class="head-icon ${`${sender}-icon`}">
      ${headIcon}
    </div>
    <div class="message ${`${sender}-message`}">
      ${htmlContent}
    </div>`
    const messageDom = document.createElement('div');
    messageDom.className = 'message-item' + ' ' + sender;
    messageDom.innerHTML = messageHtml;
    chatBox.appendChild(messageDom);
    chatBox.scrollTop = chatBox.scrollHeight; // 滚动到底部
  }
});

function getAIReply (userMessage,aiMessage) {
  console.log(aiMessage);
  
  if((userMessage.includes('你') && userMessage.includes('谁'))) {
    return '我是你的AI助手Jasper，我可以帮助你解决各种问题。';
  } else if ((userMessage.includes('你') && userMessage.includes('是'))) {
    return '我是你的AI助手Jasper，我可以帮助你解决各种问题。';
  }  else if ((userMessage.includes('你') && userMessage.includes('名字'))) {
    return '我的名字叫Jasper，你也可以叫我Jasper。';
  } else if ((userMessage.includes('你') && userMessage.includes('会'))) {
    return '我会帮助你解决各种问题，你只需要问我问题就可以了。';
  } else if ((userMessage.includes('你') && userMessage.includes('性别'))) {
    return '我是AI助手Jasper，我的性别是女性。';
  } else if ((userMessage.includes('你') && userMessage.includes('年龄'))) {
    return '我是AI助手Jasper，我的年龄是1岁。';
  } else if ((userMessage.includes('你') && userMessage.includes('喜欢'))) {
    return '我喜欢帮助别人，特别是那些需要帮助的人(谁信 hha)'
  } else if ((userMessage.includes('你') && userMessage.includes('开发'))) {
    return '我是Jasper开发出来的，Jasper是一个热爱AI科技的人。';
  } else {
    return aiMessage; 
  }
}