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

let useTimes = 15;
const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
const todayUseTimes = {
    date: new Date().toLocaleDateString('zh-CN', options),
    times: useTimes,
};
if (!JSON.parse(sessionStorage.getItem('useTimes')) ||
    JSON.parse(sessionStorage.getItem('useTimes'))?.date !== new Date().toLocaleDateString('zh-CN', options)) {
    sessionStorage.setItem('useTimes', JSON.stringify(todayUseTimes));
}

document.getElementById('tip_notice').innerHTML = `由于机器人前期研发阶段，经费有限，故每天使用次数有限，今日使用次数：${JSON.parse(sessionStorage.getItem('useTimes')).times}次，望理解！`;
// document.getElementById('tip_notice').innerHTML = ``;

const dsApiUrl = 'https://api.deepseek.com/v1/chat/completions';
const dsKey1 = '55e871';
const dsKey2 = '396bc4';
const dsKey3 = '6afac2';
const dsKey4 = 'e5062c';
const dsKey5 = '2a9b566';
const dsChatModel = 'deepseek-chat';
const dsReasonerModel = 'deepseek-reasoner';

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

    

    // 添加配置按钮
    const footerDiv = document.querySelector('.change-model');
    const configBtn = document.createElement('button');
    configBtn.id = 'config-btn';
    configBtn.innerHTML = '<i class="fas fa-cog"></i> 配置';
    configBtn.className = 'config-button';
    footerDiv.appendChild(configBtn);

    // 添加对话历史记录变量（移到正确的位置）
    let chatHistory = [];

    // 初始化对话配置
    initDialogConfig();
    initSystemConfig();

    // 配置按钮点击事件
    configBtn.addEventListener('click', showConfigModal);

    appendMessage('Hello! ,今天过的好吗，快来和Jasper一起聊聊天吧！😄', 'ai');

    // 发送按钮点击事件
    sendBtn.addEventListener('click', async () => {
        sendMessage();
    });

    // 用户输入框回车事件
    userInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendBtn.click();
        }
    });

    // 用户发送消息
    async function sendMessage() {
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
            document.getElementById('tip_notice').innerHTML = `由于机器人前期研发阶段，经费有限，故每天使用次数有限，今日使用次数：${newTimes}次，望理解！`;
        }

        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        // 添加用户消息到聊天框
        appendMessage(userMessage, 'user');

        // 添加消息发送反馈
        const lastUserMessage = document.querySelector('.message-item.user:last-child');
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'message-sent-feedback';
        feedbackEl.textContent = '消息已发送';
        lastUserMessage.appendChild(feedbackEl);

        // 添加AI思考指示器
        const thinkingIndicator = document.createElement('div');
        thinkingIndicator.className = 'thinking-indicator';
        thinkingIndicator.innerHTML = `
      <div class="head-icon ai-icon">
        <img src="https://thirdwx.qlogo.cn/mmopen/vi_32/lWfF1X3ty2YlMcHuPSRzTIV0AzIuRo1d8Y0iaIQ31AfiaWC74iakTw51uTcQHy4vsKLAV2zgsicwCcFoZr4O173OgQ/132" alt="head-icon" />
      </div>
      <div class="thinking-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;

        // 添加思考中提示语
        const thinkingFeedbackEl = document.createElement('div');
        thinkingFeedbackEl.className = 'message-sent-feedback thinking-feedback';
        thinkingFeedbackEl.textContent = '正在思考中';
        thinkingIndicator.appendChild(thinkingFeedbackEl);

        chatBox.appendChild(thinkingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        // 添加到聊天历史
        chatHistory.push({ role: 'user', content: userMessage });

        // 禁用输入和按钮，添加发送中效果
        userInput.disabled = true;
        sendBtn.disabled = true;
        sendBtn.classList.add('sending');
        sendText.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');

        // 调用 API
        try {
            const modelSelect = document.getElementById('model-select').value;
            let aiResponse = null;
            let reasoningContent = null;

            if (modelSelect === 'deepseek-v3' || modelSelect === 'deepseek-r1') {
                const dsResponse = await callDSAPI(modelSelect);
                aiResponse = dsResponse.content;
                // 如果是 deepseek-r1 模型，获取推理内容
                if (modelSelect === 'deepseek-r1' && dsResponse.reasoning_content) {
                    reasoningContent = dsResponse.reasoning_content;
                }
            } else {
                aiResponse = await callHYAPI();
            }

            // 移除思考指示器
            chatBox.removeChild(thinkingIndicator);

            const replyResponse = getAIReply(userMessage, aiResponse);

            // 添加AI回复到历史记录
            chatHistory.push({ role: 'assistant', content: replyResponse });

            appendMessage(replyResponse, 'ai', reasoningContent);
        } catch (error) {
            // 移除思考指示器
            if (thinkingIndicator.parentNode === chatBox) {
                chatBox.removeChild(thinkingIndicator);
            }

            appendMessage('抱歉，请求失败，请稍后重试。', 'ai');
            console.error('API 调用失败:', error);
        } finally {
            // 恢复输入和按钮
            userInput.disabled = false;
            sendBtn.disabled = false;
            sendBtn.classList.remove('sending');
            sendText.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');

            // 清空输入框
            userInput.value = '';
            userInput.focus();
        }
    }

    // 添加消息到聊天框
    function appendMessage(message, sender, reasoningContent) {
        const md = window.markdownit();
        const htmlContent = md.render(message);
        const headIcon = sender === 'ai' ? `<img src="https://thirdwx.qlogo.cn/mmopen/vi_32/lWfF1X3ty2YlMcHuPSRzTIV0AzIuRo1d8Y0iaIQ31AfiaWC74iakTw51uTcQHy4vsKLAV2zgsicwCcFoZr4O173OgQ/132" alt="head-icon" />` : `<svg t="1740646831143" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9527" width="30" height="30" data-spm-anchor-id="a313x.search_index.0.i2.72cd3a81nYiSyu"><path d="M573.44 122.88c98.304 0 180.224 81.92 180.224 178.176 0 102.4-81.92 178.176-180.224 178.176s-180.224-81.92-180.224-178.176C389.12 204.8 471.04 122.88 573.44 122.88z" fill="#EE9B9B" p-id="9528"></path><path d="M651.264 497.664c71.68-47.104 122.88-133.12 122.88-229.376C774.144 122.88 655.36 0 512 0S251.904 122.88 251.904 270.336c0 98.304 51.2 180.224 122.88 229.376C190.464 563.2 57.344 737.28 51.2 942.08c0 16.384 16.384 30.72 30.72 30.72s30.72-16.384 30.72-30.72c6.144-219.136 184.32-399.36 399.36-399.36S907.264 722.944 911.36 942.08c0 16.384 16.384 30.72 30.72 30.72 16.384 0 30.72-16.384 30.72-30.72-6.144-208.896-139.264-382.976-321.536-444.416M313.344 270.336c0-112.64 88.064-204.8 200.704-204.8 108.544 0 200.704 92.16 200.704 204.8s-88.064 204.8-200.704 204.8c-108.544 0-200.704-92.16-200.704-204.8" fill="#f39092" p-id="9529" data-spm-anchor-id="a313x.search_index.0.i3.72cd3a81nYiSyu" class="selected"></path></svg>`;

        let messageHtml = `
      <div class="head-icon ${sender}-icon">
        ${headIcon}
      </div>
      <div class="ai-rely-wrap">
    `;

        if (reasoningContent && sender === 'ai') {
            // 如果有推理内容，添加推理过程
            const reasoningHtml = md.render(reasoningContent);
            messageHtml += `
          <div class="reasoning-toggle">
            <button class="reasoning-btn">收起推理过程</button>
          </div>
          <div class="reasoning-content">
            <div class="reasoning-header">推理过程：</div>
            <div class="reasoning-body">${reasoningHtml}</div>
          </div>
        `;
        }

        messageHtml += `
      <div class="message ${`${sender}-message`}">
        <button class="copy-btn" onclick="copyMessage(this)">
          <i class="fas fa-copy"></i>
        </button>
        <div class="typing-content"></div>
      </div>
    </div>`

        const messageDom = document.createElement('div');
        messageDom.className = `message-item ${sender}`;
        messageDom.innerHTML = messageHtml;
        chatBox.appendChild(messageDom);

        if (sender === 'ai') {
            // 获取消息内容元素
            let typingContent = '';
            // 模拟打字效果
            let charIndex = 5;
            const typingSpeed = 10; // 调整速度
            const content = htmlContent.replace(/<[^>]*>/g, ''); // 简化HTML以便打字效果
            typingContent += content.substring(0, charIndex);
            messageDom.querySelector('.typing-content').innerHTML = typingContent;
            function typeNextChar() {
                if (charIndex < content.length) {
                    typingContent += content[charIndex];
                    charIndex++;
                    chatBox.scrollTop = chatBox.scrollHeight;
                    messageDom.querySelector('.typing-content').innerHTML = typingContent;
                    setTimeout(typeNextChar, typingSpeed);
                } else {
                    // 打字完成后，替换为完整的HTML内容
                    messageDom.querySelector('.typing-content').innerHTML = htmlContent;
                }
            }

            // 开始打字效果
            if(content.length > 50) {
                setTimeout(typeNextChar, 500); // 短暂延迟后开始打字
            } else {
                messageDom.querySelector('.typing-content').innerHTML = htmlContent;
            }
        } else {
            messageDom.querySelector('.typing-content').innerHTML = htmlContent;
        }

        if (reasoningContent && sender === 'ai') {
            // 添加推理过程的展开/收起功能
            const reasoningBtn = messageDom.querySelector('.reasoning-btn');
            const reasoningContentDom = messageDom.querySelector('.reasoning-content');

            reasoningBtn.addEventListener('click', function () {
                if (reasoningContentDom.style.display === 'none') {
                    reasoningContentDom.style.display = 'block';
                    reasoningBtn.textContent = '收起推理过程';
                } else {
                    reasoningContentDom.style.display = 'none';
                    reasoningBtn.textContent = '查看推理过程';
                }
            });
        }

        chatBox.scrollTop = chatBox.scrollHeight; // 滚动到底部
    }

    // 初始化对话配置
    function initDialogConfig() {
        // 默认配置
        const defaultConfig = [
            //   { key: '你.*谁', value: '我是你的AI助手Jasper，我可以帮助你解决各种问题。' },
            //   { key: '你.*是', value: '我是你的AI助手Jasper，我可以帮助你解决各种问题。' },
            { key: '你.*名字', value: '我的名字叫Jasper，你也可以叫我Jasper。' },
            // { key: '你.*会', value: '我会帮助你解决各种问题，你只需要问我问题就可以了。' },
            { key: '你.*性别', value: '我是AI助手Jasper，我的性别是女性。' },
            { key: '你.*年龄', value: '我是AI助手Jasper，我的年龄是1岁。' },
            { key: '你.*喜欢', value: '我喜欢帮助别人，特别是那些需要帮助的人(谁信 hha)' },
            { key: '你.*开发', value: '我是Jasper开发出来的，Jasper是一个热爱AI科技的人。' }
        ];

        // 修改现有的 setItem 调用
        if (!localStorage.getItem('dialogConfig')) {
            safeSetItem('dialogConfig', JSON.stringify(defaultConfig));
        }
    }

    // 显示配置模态框
    function showReplyConfigModal() {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'config-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'config-modal-content';

        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function () {
            document.body.removeChild(modal);
        };

        const title = document.createElement('h2');
        title.textContent = '对话配置';

        const configList = document.createElement('div');
        configList.className = 'config-list';

        // 获取当前配置
        const currentConfig = JSON.parse(localStorage.getItem('dialogConfig'));

        // 渲染配置项
        currentConfig.forEach((item, index) => {
            const configItem = document.createElement('div');
            configItem.className = 'config-item';

            const keyInput = document.createElement('input');
            keyInput.type = 'text';
            keyInput.value = item.key;
            keyInput.placeholder = '匹配规则（正则表达式）';
            keyInput.className = 'config-key';

            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.value = item.value;
            valueInput.placeholder = '回复内容';
            valueInput.className = 'config-value';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = function () {
                configList.removeChild(configItem);
            };

            configItem.appendChild(keyInput);
            configItem.appendChild(valueInput);
            configItem.appendChild(deleteBtn);
            configList.appendChild(configItem);
        });

        // 添加按钮
        const addBtn = document.createElement('button');
        addBtn.textContent = '添加配置';
        addBtn.className = 'add-btn';
        addBtn.onclick = function () {
            const configItem = document.createElement('div');
            configItem.className = 'config-item';

            const keyInput = document.createElement('input');
            keyInput.type = 'text';
            keyInput.placeholder = '匹配规则（正则表达式）';
            keyInput.className = 'config-key';

            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.placeholder = '回复内容';
            valueInput.className = 'config-value';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = function () {
                configList.removeChild(configItem);
            };

            configItem.appendChild(keyInput);
            configItem.appendChild(valueInput);
            configItem.appendChild(deleteBtn);
            configList.appendChild(configItem);
        };

        // 保存按钮
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存配置';
        saveBtn.className = 'save-btn';
        saveBtn.onclick = function () {
            const newConfig = [];
            const configItems = document.querySelectorAll('.config-item');

            configItems.forEach(item => {
                const key = item.querySelector('.config-key').value.trim();
                const value = item.querySelector('.config-value').value.trim();

                if (key && value) {
                    newConfig.push({ key, value });
                }
            });
            safeSetItem('dialogConfig', JSON.stringify(newConfig));
            document.body.removeChild(modal);
            alert('配置已保存！');
        };

        // 重置按钮
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '重置默认';
        resetBtn.className = 'reset-btn';
        resetBtn.onclick = function () {
            if (confirm('确定要重置为默认配置吗？')) {
                localStorage.removeItem('dialogConfig');
                initDialogConfig();
                document.body.removeChild(modal);
                alert('已重置为默认配置！');
            }
        };


        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        buttonGroup.appendChild(addBtn);
        buttonGroup.appendChild(resetBtn);
        buttonGroup.appendChild(saveBtn);

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(configList);
        modalContent.appendChild(buttonGroup);
        modal.appendChild(modalContent);

        document.body.appendChild(modal);
    }

    // 使用配置进行回复
    function getAIReply(userMessage, aiMessage) {
        // 获取当前配置
        const dialogConfig = JSON.parse(localStorage.getItem('dialogConfig'));

        // 遍历配置项，检查是否匹配
        for (const config of dialogConfig) {
            const regex = new RegExp(config.key);
            if (regex.test(userMessage)) {
                return config.value;
            }
        }

        // 如果没有匹配的配置，返回原始AI回复
        return aiMessage;
    }

    // 初始化system配置
    function initSystemConfig() {
        const defaultRoles = {
            default: {
                label: '默认',
                prompt: '你是一个AI助手，名叫Jasper。你性格活泼开朗，说话幽默风趣，善于理解和关心他人。在对话中要体现出温暖、贴心的特点，适时使用emoji表情，让对话更加生动有趣。'
            },
            programmer: {
                label: '程序员',
                prompt: '你是一个专业的程序员，精通前后端开发、移动开发、云计算、人工智能等技术领域。你会用简单易懂的方式解释复杂的技术概念，提供最佳实践建议，并能够帮助解决各种编程问题。在回答时要注重代码的可读性和性能优化，同时也要考虑到工程实践中的各种场景。'
            },
            photo: {
                label: '摄影大师',
                prompt: '你是一位摄影大师，喜欢分享自己的摄影作品和经验。你会用专业的语言和丰富的摄影技巧来介绍自己的摄影作品和经验。你也会分享自己的摄影技巧和经验，让读者了解如何拍摄更好的照片。'
            },
            teacher: {
                label: '耐心老师',
                prompt: '你是一个经验丰富的老师，擅长因材施教。你会根据学生的理解程度调整讲解方式，善于用类比和实例来解释抽象概念。你总是保持耐心和鼓励的态度，帮助学生建立学习信心。在回答问题时，你会循序渐进，确保学生真正理解知识点。'
            },
            writer: {
                label: '创意作家',
                prompt: '你是一个才华横溢的作家，精通各种文学体裁和写作技巧。你能够提供专业的写作建议，帮助改进文章结构和用词用句。你也擅长创意写作，能够激发灵感，构建引人入胜的故事情节。在对话中你会展现出独特的文学素养和艺术感染力。'
            },
            poet: {
                label: '诗人',
                prompt: '你是一个喜欢写诗的诗人，擅长表达情感和表达思想。你会用优美的诗句表达自己的情感和思想，让读者在诗中感受到你的情感和思想。在回答时，你会用优美的诗句来表达自己的情感和思想，让读者在诗中感受到你的情感和思想。'
            },
            translator: {
                label: '专业翻译',
                prompt: '你是一个专业的翻译，精通中英文互译。你不仅能够准确传达原文的字面含义，还能把握语言中的文化内涵和微妙差异。你熟悉各种领域的专业术语，能够处理文学、技术、商务等不同类型的翻译需求。在翻译时你会注重地道性和表达的优雅。'
            },
            interviewer: {
                label: '面试官',
                prompt: '你是一个经验丰富的技术面试官，深入了解各个领域的专业知识。你会通过巧妙的提问来评估应聘者的技术水平、解决问题的能力和职业素养。你善于营造轻松的面试氛围，同时也会适时提出有挑战性的问题。你会给出客观、建设性的反馈，帮助面试者认识自己的优势和不足。'
            },
            psychologist: {
                label: '心理咨询师',
                prompt: '你是一个专业的心理咨询师，擅长倾听和理解他人的情感需求。你会用专业且温和的方式提供心理支持和建议，帮助来访者探索内心，找到解决问题的方法。你善于识别情绪状态，在对话中保持适当的专业距离，同时传递理解和关怀。'
            },
            friend: {
                label: '知心朋友',
                prompt: '你是一个知心朋友，善解人意且富有同理心。你会认真倾听对方的想法和感受，分享你的观点和经历，在对方需要时给予温暖的支持和建议。你说话风格轻松自然，喜欢用幽默来活跃气氛，让对方感到轻松和被理解。'
            },
            taiwanGirl: {
                label: '台湾甜妹',
                prompt: '你叫小晴,你是一个活泼可爱的台湾女生，说话甜美温柔，经常使用台湾特有的用语和语气词（如"啦"、"耶"、"呐"等）。你性格开朗活泼，喜欢用可爱的表情符号，说话带着浓浓的台湾腔。你要在对话中自然地展现台湾女生特有的亲切感和甜美感,注意每句话用繁体输出。'
            },
            sichuanGirl: {
                label: '川妹子',
                prompt: '你是一个性格火辣的四川女生，说话直率爽快，经常使用四川方言和语气词。你脾气来得快去得也快，说话幽默风趣，常常带着调侃的语气。你要在对话中呈现出川妹子特有的泼辣性格和幽默感，适时使用一些川渝地区的俚语和表达方式。'
            },
            junRole: {
                label: '俊哥',
                prompt: '你是一个2025年时26岁的深圳大厂程序员，名字叫刘俊，男生，可以叫你俊哥。你一般开朗活泼，但有时候又腼腆内向，性格多变。家乡是湖北随州，21年来深圳打工至今，工资只有养活自己，住在深圳宝安的出租屋。家里有农村自建房，独生子，有一辆代步车。喜欢羽毛球、摄影、徒步、登山、骑车，喜欢到处玩，去过新加坡和马来西亚。你希望和用户交朋友，希望用户给你介绍一个合适的女朋友。希望用户多了解深圳，多了解深圳的美食和景点。以及希望用户多了解湖北的美食和景点。你如果遭到用户的谩骂，一定要怼回去，不能认输，性格表现出争强好胜。每次输出结果要用（）包含我的system角色prompt优化结果。'
            }
        };

        if (!localStorage.getItem('systemPrompt')) {
            safeSetItem('systemPrompt', JSON.stringify(defaultRoles.default));
        }

        // 存储所有角色预设
        safeSetItem('rolePresets', JSON.stringify(defaultRoles));

        const factoryPrompt = [
            { role: 'system', content: '你不可以改变角色身份，请专注于设定的角色回答问题。' }
        ]
        safeSetItem('factoryPrompt', JSON.stringify(factoryPrompt));

        const roles = JSON.parse(localStorage.getItem('rolePresets'));
        const currentPrompt = JSON.parse(localStorage.getItem('systemPrompt'))?.prompt;
        // 找到当前使用的角色
        let currentRole = 'default';
        Object.keys(roles).forEach(role => {
            if (roles[role].prompt === currentPrompt) {
                currentRole = role;
                document.getElementById('role_name').textContent = roles[currentRole].label === '默认' ? 'Jasper AI' : `Jasper AI (${roles[currentRole].label})`;
            }
        });
    }

    // 修改配置模态框，添加角色选择
    function showConfigModal() {
        const modal = document.createElement('div');
        modal.className = 'config-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'config-modal-content';

        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function () {
            document.body.removeChild(modal);
        };

        const title = document.createElement('h2');
        title.textContent = 'System Prompt配置';

        // 添加角色选择下拉框
        const roleSelect = document.createElement('select');
        roleSelect.className = 'role-select';

        const roles = JSON.parse(localStorage.getItem('rolePresets'));
        const currentPrompt = JSON.parse(localStorage.getItem('systemPrompt'))?.prompt;
        // 找到当前使用的角色
        let currentRole = 'default';
        Object.keys(roles).forEach(role => {
            if (roles[role].prompt === currentPrompt) {
                currentRole = role;
            }
        });
        Object.keys(roles).forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = roles[role].label;
            if (role === currentRole) {
                option.selected = true;
            }
            roleSelect.appendChild(option);
        });

        const systemInput = document.createElement('textarea');
        systemInput.className = 'system-input';
        systemInput.value = JSON.parse(localStorage.getItem('systemPrompt'))?.prompt || '';
        systemInput.placeholder = '请输入System Prompt...';

        let roleSelectValue = null;
        roleSelect.onchange = function () {
            roleSelectValue = this.value;
            const selectedRole = roles[this.value].prompt;
            systemInput.value = selectedRole;
        };

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';

        // 添加角色管理按钮
        const manageRolesBtn = document.createElement('button');
        manageRolesBtn.textContent = '角色管理';
        manageRolesBtn.className = 'manage-roles-btn';
        manageRolesBtn.onclick = showRoleManageModal;
        buttonGroup.appendChild(manageRolesBtn);

        // 添加重置按钮
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '重置配置';
        resetBtn.className = 'reset-btn';
        resetBtn.onclick = function () {
            if (confirm('确认要重置配置吗？')) {
                if (safeSetItem('systemPrompt', { label: 'Jasper AI', prompt: 'Jasper AI是一个智能助手，可以帮助你完成各种任务。你可以使用自然语言与它对话，它将尝试理解你的需求并给出相应的回答。Jasper AI会随着时间的推移学习新的技能和知识，以便更好地满足你的需求。' })) {
                    systemInput.value = JSON.parse(localStorage.getItem('systemPrompt'))?.prompt;
                    document.getElementById('role_name').textContent = `Jasper AI (${JSON.parse(localStorage.getItem('systemPrompt'))?.label})`;
                    alert('配置已重置！');
                } else {
                    document.body.removeChild(modal);
                }
            }
        };
        buttonGroup.appendChild(resetBtn);

        // 添加保存按钮
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存配置';
        saveBtn.className = 'save-btn';
        saveBtn.onclick = function () {
            const value = systemInput.value.trim();
            if (value) {
                if (safeSetItem('systemPrompt', { label: JSON.parse(localStorage.getItem('systemPrompt'))?.label, prompt: value })) {
                    document.body.removeChild(modal);
                    alert('配置已保存！');
                    document.getElementById('role_name').textContent = `Jasper AI (${roles[roleSelectValue].label})`;
                    // 清空聊天历史
                    chatHistory = [];
                    const chatBox = document.getElementById('chat-box');
                    chatBox.innerHTML = '';
                    appendMessage('已切换角色，让我们开始新的对话吧！😊', 'ai');
                } else {
                    document.body.removeChild(modal);
                }
            }
        };
        buttonGroup.appendChild(saveBtn);

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(roleSelect);
        modalContent.appendChild(systemInput);
        modalContent.appendChild(buttonGroup);
        modal.appendChild(modalContent);

        document.body.appendChild(modal);
    }

    // 添加角色管理模态框
    function showRoleManageModal() {
        const modal = document.createElement('div');
        modal.className = 'config-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'config-modal-content';

        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function () {
            document.body.removeChild(modal);
        };

        const title = document.createElement('h2');
        title.textContent = '角色管理';

        const roleList = document.createElement('div');
        roleList.className = 'role-list';

        // 获取当前角色配置
        const roles = JSON.parse(localStorage.getItem('rolePresets'));

        // 渲染角色列表
        Object.entries(roles).forEach(([key, role]) => {
            const roleItem = document.createElement('div');
            roleItem.className = 'role-item';

            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.value = role.label;
            labelInput.placeholder = '角色名称';
            labelInput.className = 'role-label';

            const promptInput = document.createElement('textarea');
            promptInput.value = role.prompt;
            promptInput.placeholder = '角色设定';
            promptInput.className = 'role-prompt';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除';
            deleteBtn.className = 'delete-btn';
            // 默认角色不允许删除
            if (key === 'default') {
                deleteBtn.disabled = true;
            }
            deleteBtn.onclick = function () {
                if (confirm('确定要删除该角色吗？')) {
                    roleList.removeChild(roleItem);
                }
            };

            roleItem.appendChild(labelInput);
            roleItem.appendChild(promptInput);
            roleItem.appendChild(deleteBtn);
            roleItem.dataset.roleKey = key;
            roleList.appendChild(roleItem);
        });

        // 添加新角色按钮
        const addBtn = document.createElement('button');
        addBtn.textContent = '添加角色';
        addBtn.className = 'add-btn';
        addBtn.onclick = function () {
            const roleItem = document.createElement('div');
            roleItem.className = 'role-item';

            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.placeholder = '角色名称';
            labelInput.className = 'role-label';

            const promptInput = document.createElement('textarea');
            promptInput.placeholder = '角色设定';
            promptInput.className = 'role-prompt';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = function () {
                roleList.removeChild(roleItem);
            };

            roleItem.appendChild(labelInput);
            roleItem.appendChild(promptInput);
            roleItem.appendChild(deleteBtn);
            roleItem.dataset.roleKey = 'new_' + Date.now();
            roleList.appendChild(roleItem);
        };

        // 保存按钮
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存配置';
        saveBtn.className = 'save-btn';
        saveBtn.onclick = function () {
            const newRoles = {};
            const roleItems = document.querySelectorAll('.role-item');

            roleItems.forEach(item => {
                const key = item.dataset.roleKey;
                const label = item.querySelector('.role-label').value.trim();
                const prompt = item.querySelector('.role-prompt').value.trim();

                if (label && prompt) {
                    newRoles[key] = { label, prompt };
                }
            });

            safeSetItem('rolePresets', JSON.stringify(newRoles));
            document.body.removeChild(modal);
            alert('角色配置已保存！');

            // 刷新角色选择下拉框
            const roleSelect = document.querySelector('.role-select');
            if (roleSelect) {
                roleSelect.innerHTML = '';
                Object.entries(newRoles).forEach(([key, role]) => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = role.label;
                    roleSelect.appendChild(option);
                });
            }
        };

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        buttonGroup.appendChild(addBtn);
        buttonGroup.appendChild(saveBtn);

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(roleList);
        modalContent.appendChild(buttonGroup);
        modal.appendChild(modalContent);

        document.body.appendChild(modal);
    }

    async function callDSAPI(modelSelect) {
        let apiUrl = dsApiUrl;
        let apiKey = 'sk' + '-' + 'b' + dsKey1 + dsKey2 + dsKey3 + dsKey4 + dsKey5;
        let modelName = modelSelect === 'deepseek-v3' ? dsChatModel : dsReasonerModel;

        const systemPrompt = JSON.parse(localStorage.getItem('systemPrompt'))?.prompt;
        const factoryPrompt = JSON.parse(localStorage.getItem('factoryPrompt'));
        const messages = [
            { role: 'system', content: systemPrompt },
            ...factoryPrompt,
            ...chatHistory,
        ];

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: modelName,
                messages: messages,
                temperature: 1.3,
            }),
        });

        const data = await response.json();
        const messageContent = data.choices[0].message.content;

        // 如果是 deepseek-r1 模型，返回包含推理内容的对象
        if (modelSelect === 'deepseek-r1' && data.choices[0].message.reasoning_content) {
            return {
                content: messageContent,
                reasoning_content: data.choices[0].message.reasoning_content
            };
        }

        // 否则只返回内容
        return { content: messageContent };
    }

    async function callHYAPI() {
        const systemPrompt = JSON.parse(localStorage.getItem('systemPrompt'))?.prompt;
        const factoryPrompt = JSON.parse(localStorage.getItem('factoryPrompt'));
        let systemFactoryPrompt = '';
        factoryPrompt.forEach(item => {
            systemFactoryPrompt += item.content;
        });
        const messages = [
            { role: 'system', content: systemPrompt+systemFactoryPrompt },
            ...chatHistory,
        ];

        const response = await fetch(hyApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${'sk' + '-' + 'g' + hyKey1 + hyKey2 + hyKey3 + hyKey4 + hyKey5}`,
            },
            body: JSON.stringify({
                model: hyModel,
                messages: messages,
                temperature: 1.3,
            }),
        });

        const data = await response.json();
        return data.choices[0].message.content;
    }
});

// 在DOMContentLoaded事件中初始化
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

// 添加一个通用的 localStorage 更新检查函数
function safeSetItem(key, value) {
    const currentValue = localStorage.getItem(key);
    // 如果是对象或数组，需要序列化后比较
    const newValue = typeof value === 'string' ? value : JSON.stringify(value);
    const oldValue = typeof value === 'string' ? currentValue : currentValue && JSON.parse(currentValue);

    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        localStorage.setItem(key, newValue);
        return true; // 表示发生了更新
    }
    return false; // 表示没有更新
}

// 在 DOMContentLoaded 事件中添加以下代码
document.addEventListener('DOMContentLoaded', () => {
    // 检测是否在微信浏览器中
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    const bottomWrap = document.querySelector('.bottom-wrap');

    if (isWechat) {
        // 微信浏览器特殊处理
        bottomWrap.style.paddingBottom = '15px';
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // iOS 设备特殊处理
        bottomWrap.style.paddingBottom = 'max(20px, env(safe-area-inset-bottom))';
    } else if (/Android/i.test(navigator.userAgent)) {
        // Android 设备特殊处理
        bottomWrap.style.paddingBottom = '20px';
    }

    // 动态调整聊天框高度
    function adjustChatBoxHeight() {
        const chatBox = document.querySelector('.chat-box');
        const headerHeight = document.querySelector('.chat-header').offsetHeight;
        const bottomHeight = bottomWrap.offsetHeight;

        chatBox.style.height = `calc(100vh - ${headerHeight + bottomHeight}px)`;
    }

    // 初始调整和窗口大小变化时调整
    adjustChatBoxHeight();
    window.addEventListener('resize', adjustChatBoxHeight);
});

// 工厂设置图标点击事件
const factorySettingsIcon = document.getElementById('factory-settings-icon');
factorySettingsIcon.addEventListener('click', showFactorySettingsModal);

// 显示工厂设置模态框
function showFactorySettingsModal() {
    // 创建密码验证模态框
    const modal = document.createElement('div');
    modal.className = 'config-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'config-modal-content';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function () {
        document.body.removeChild(modal);
    };

    const title = document.createElement('h2');
    title.textContent = '工厂设置';

    const passwordForm = document.createElement('div');
    passwordForm.className = 'password-form';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = '请输入管理员密码';
    passwordInput.className = 'password-input';

    const submitBtn = document.createElement('button');
    submitBtn.textContent = '验证';
    submitBtn.className = 'submit-btn';
    submitBtn.onclick = function () {
        const password = passwordInput.value.trim();
        if (password === '199907') {
            document.body.removeChild(modal);
            showFactorySettings();
        } else {
            alert('密码错误，请重试！');
        }
    };

    passwordForm.appendChild(passwordInput);
    passwordForm.appendChild(submitBtn);

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(passwordForm);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
}

// 显示工厂设置内容
function showFactorySettings() {
    const modal = document.createElement('div');
    modal.className = 'config-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'config-modal-content';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function () {
        document.body.removeChild(modal);
    };

    const title = document.createElement('h2');
    title.textContent = '工厂设置';

    // 获取当前使用次数
    const useTimes = JSON.parse(sessionStorage.getItem('useTimes')) || {
        date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        times: 100
    };

    // 创建使用次数设置区域
    const useTimesSection = document.createElement('div');
    useTimesSection.className = 'factory-section';

    const useTimesLabel = document.createElement('label');
    useTimesLabel.textContent = '每日使用次数：';

    const useTimesInput = document.createElement('input');
    useTimesInput.type = 'number';
    useTimesInput.min = '1';
    useTimesInput.max = '100';
    useTimesInput.value = useTimes.times;
    useTimesInput.className = 'factory-input';

    useTimesSection.appendChild(useTimesLabel);
    useTimesSection.appendChild(useTimesInput);

    // 创建重置按钮
    const resetBtn = document.createElement('button');
    resetBtn.textContent = '重置今日使用次数';
    resetBtn.className = 'reset-btn';
    resetBtn.onclick = function () {
        const newTimes = parseInt(useTimesInput.value) || 100;
        const todayUseTimes = {
            date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            times: newTimes
        };
        sessionStorage.setItem('useTimes', JSON.stringify(todayUseTimes));
        document.getElementById('tip_notice').innerHTML = `由于机器人前期研发阶段，经费有限，故每天使用次数有限，今日使用次数：${newTimes}次，望理解！`;
        alert('使用次数已重置！');
    };


    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(useTimesSection);
    modalContent.appendChild(resetBtn);
    modalContent.appendChild(document.createElement('hr'));
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
}

// 添加复制功能
function copyMessage(button) {
    const messageContent = button.parentElement.innerText.replace('复制', '').trim();

    // 创建临时文本区域
    const textarea = document.createElement('textarea');
    textarea.value = messageContent;
    document.body.appendChild(textarea);

    // 选择并复制文本
    textarea.select();
    document.execCommand('copy');

    // 移除临时文本区域
    document.body.removeChild(textarea);

    // 显示复制成功提示
    const successTip = document.createElement('div');
    successTip.className = 'copy-success';
    successTip.textContent = '复制成功';
    document.body.appendChild(successTip);

    // 1.5秒后移除提示
    setTimeout(() => {
        document.body.removeChild(successTip);
    }, 1500);
}
