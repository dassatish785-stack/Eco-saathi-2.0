// Eco Saathi 2.0 - Saathi AI Shopping Assistant Widget
(function () {
  let chatSessionId = localStorage.getItem('ecosaathi_chat_session') || 'chat_' + Math.random().toString(36).substring(2, 10);
  localStorage.setItem('ecosaathi_chat_session', chatSessionId);

  let isOpen = false;
  let isSending = false;

  const chatContainer = document.createElement('div');
  chatContainer.id = 'ecosaathi-ai-widget';
  chatContainer.innerHTML = `
    <!-- Floating Trigger Button -->
    <div class="fixed bottom-6 right-6 z-50 flex items-center space-x-3">
      <button id="chatToggleBtn" class="chat-widget-btn flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-3.5 rounded-full shadow-2xl transition duration-200">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
        </span>
        <i class="fa-solid fa-sparkles text-amber-300"></i>
        <span class="font-semibold text-sm tracking-wide">Ask Saathi AI</span>
      </button>
    </div>

    <!-- Floating Chat Drawer -->
    <div id="chatDrawer" class="chat-drawer fixed bottom-24 right-4 sm:right-6 w-[94vw] sm:w-[420px] max-h-[82vh] h-[640px] bg-white rounded-3xl z-50 flex flex-col border border-emerald-100 hidden overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-700/80 flex items-center justify-center border border-emerald-500/50 text-amber-300 shadow-inner">
            <i class="fa-solid fa-seedling text-lg"></i>
          </div>
          <div>
            <div class="flex items-center space-x-1.5">
              <h3 class="font-bold text-sm tracking-wide">Saathi AI</h3>
              <span class="bg-emerald-700 text-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">Assistant</span>
            </div>
            <p class="text-[11px] text-emerald-200/90">Handcrafted in Odisha · 100% Verified Info</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button id="chatCloseBtn" class="w-8 h-8 rounded-full hover:bg-emerald-700/60 flex items-center justify-center text-emerald-200 hover:text-white transition">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      <!-- Messages Stream -->
      <div id="chatMessages" class="flex-1 p-4 overflow-y-auto space-y-4 text-sm bg-stone-50">
        <!-- Welcome Message -->
        <div class="flex space-x-2.5 items-start">
          <div class="w-7 h-7 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
            <i class="fa-solid fa-seedling"></i>
          </div>
          <div class="bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-stone-200 max-w-[85%] text-stone-800 leading-relaxed">
            <p class="font-medium text-emerald-900 mb-1">Namaste! 🙏</p>
            <p>I am your <strong>Saathi AI guide</strong>. I can recommend plastic-free items from our live Bhubaneswar workshop catalog, check your pincode delivery, or track an existing order.</p>
            <p class="text-xs text-stone-500 mt-2">What would you like to explore today?</p>
          </div>
        </div>

        <!-- Quick Prompts Chips -->
        <div id="quickChips" class="flex flex-wrap gap-1.5 pt-1">
          <button class="chip-btn text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium px-3 py-1.5 rounded-full border border-emerald-200 transition" data-msg="Find a sustainable gift under ₹500">
            🎁 Gift under ₹500
          </button>
          <button class="chip-btn text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium px-3 py-1.5 rounded-full border border-emerald-200 transition" data-msg="Plastic-free kitchen swaps">
            🍽️ Kitchen swaps
          </button>
          <button class="chip-btn text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium px-3 py-1.5 rounded-full border border-emerald-200 transition" data-msg="Mayurbhanj Sabai grass baskets">
            🧺 Sabai baskets
          </button>
          <button class="chip-btn text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium px-3 py-1.5 rounded-full border border-emerald-200 transition" data-msg="Track my order">
            📦 Track order
          </button>
          <button class="chip-btn text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium px-3 py-1.5 rounded-full border border-emerald-200 transition" data-msg="Talk to a person on WhatsApp">
            💬 Talk to human
          </button>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div id="typingIndicator" class="px-4 py-2 bg-stone-50 text-xs text-stone-500 flex items-center space-x-2 hidden">
        <div class="flex space-x-1">
          <div class="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></div>
          <div class="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></div>
          <div class="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></div>
        </div>
        <span>Saathi AI is searching live catalog...</span>
      </div>

      <!-- Input Footer -->
      <div class="p-3 bg-white border-t border-stone-200">
        <form id="chatForm" class="flex items-center space-x-2">
          <input
            id="chatInput"
            type="text"
            placeholder="Ask anything (e.g. neem comb, gift box, pincode)..."
            class="flex-1 bg-stone-100 focus:bg-white text-stone-800 placeholder-stone-400 text-sm px-4 py-2.5 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/50"
            autocomplete="off"
          />
          <button
            type="submit"
            id="chatSendBtn"
            class="w-10 h-10 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white flex items-center justify-center transition disabled:opacity-50"
          >
            <i class="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </form>
        <div class="flex justify-between items-center text-[10px] text-stone-400 mt-2 px-1">
          <span>Powered by Eco Saathi AI · DPDP 2023 Compliant</span>
          <a href="#gifting" onclick="window.location.hash='corporate'; document.getElementById('chatCloseBtn').click();" class="text-emerald-700 hover:underline">Corporate bulk quotes</a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(chatContainer);

  const toggleBtn = document.getElementById('chatToggleBtn');
  const closeBtn = document.getElementById('chatCloseBtn');
  const drawer = document.getElementById('chatDrawer');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const typing = document.getElementById('typingIndicator');

  // Open / Close toggle
  toggleBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      drawer.classList.remove('hidden');
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    } else {
      drawer.classList.add('hidden');
    }
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    drawer.classList.add('hidden');
  });

  // Handle Quick Chips click
  messages.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip-btn');
    if (chip) {
      const msg = chip.getAttribute('data-msg');
      if (msg) {
        input.value = msg;
        sendMessage(msg);
      }
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg || isSending) return;
    sendMessage(msg);
  });

  async function sendMessage(text) {
    appendUserMessage(text);
    input.value = '';
    isSending = true;
    typing.classList.remove('hidden');
    messages.scrollTop = messages.scrollHeight;

    try {
      const resp = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: chatSessionId,
          message: text,
          customerContext: {
            phone: localStorage.getItem('ecosaathi_phone') || '',
            email: localStorage.getItem('ecosaathi_email') || ''
          }
        })
      });

      const data = await resp.json();
      typing.classList.add('hidden');
      isSending = false;

      if (data.reply) {
        appendAssistantMessage(data.reply, data.productCards, data.toolCalls);
      } else {
        appendAssistantMessage("I'm having a brief connection pause. Please feel free to WhatsApp our Bhubaneswar team directly at +91 94370 12345.");
      }
    } catch (err) {
      console.error('Chat error:', err);
      typing.classList.add('hidden');
      isSending = false;
      appendAssistantMessage("I apologize, I could not connect to our catalog. Please try again or reach out on WhatsApp at +91 94370 12345.");
    }
  }

  function appendUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'flex justify-end';
    div.innerHTML = `
      <div class="bg-emerald-800 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] shadow-sm leading-relaxed text-sm">
        ${escapeHtml(text)}
      </div>
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendAssistantMessage(markdownText, productCards = [], toolCalls = []) {
    const div = document.createElement('div');
    div.className = 'flex space-x-2.5 items-start fade-in';

    const formattedText = renderMarkdownSimple(markdownText);

    let cardsHtml = '';
    if (productCards && productCards.length > 0) {
      cardsHtml = `
        <div class="mt-3 grid grid-cols-1 gap-2 pt-2 border-t border-stone-200">
          ${productCards.map(p => `
            <div class="flex items-center space-x-2.5 bg-stone-50 hover:bg-emerald-50/50 p-2 rounded-xl border border-stone-200 transition">
              <img src="${p.image}" alt="${p.title}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <a href="#product/${p.handle}" onclick="window.viewProductDetail('${p.handle}'); document.getElementById('chatCloseBtn').click();" class="text-xs font-semibold text-stone-900 hover:text-emerald-800 truncate block">
                  ${p.title}
                </a>
                <div class="flex items-center space-x-2 text-[11px] mt-0.5">
                  <span class="font-bold text-emerald-900">₹${p.price}</span>
                  ${p.mrp ? `<span class="line-through text-stone-400">₹${p.mrp}</span>` : ''}
                  <span class="text-emerald-700 font-medium">★ ${p.rating || 4.8}</span>
                </div>
              </div>
              <button
                onclick="window.quickAddToCart('${p.id}', '${escapeAttr(p.title)}', ${p.price}, '${p.image}')"
                class="bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 flex-shrink-0 transition"
              >
                <i class="fa-solid fa-cart-plus"></i>
                <span>Add</span>
              </button>
            </div>
          `).join('')}
        </div>
      `;
    }

    div.innerHTML = `
      <div class="w-7 h-7 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
        <i class="fa-solid fa-seedling"></i>
      </div>
      <div class="bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-stone-200 max-w-[88%] text-stone-800 leading-relaxed text-sm">
        ${formattedText}
        ${cardsHtml}
        <!-- Feedback Rating -->
        <div class="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 text-[11px] text-stone-400">
          <span>Was this helpful?</span>
          <div class="flex space-x-2">
            <button onclick="window.rateAssistantChat(5, this)" class="hover:text-emerald-700 p-1" title="Yes, very helpful">
              <i class="fa-regular fa-thumbs-up"></i>
            </button>
            <button onclick="window.rateAssistantChat(2, this)" class="hover:text-amber-700 p-1" title="Could be better">
              <i class="fa-regular fa-thumbs-down"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    return (text || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  function renderMarkdownSimple(md) {
    if (!md) return '';
    let html = escapeHtml(md);

    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-emerald-950">$1</strong>');
    // Bullet lists
    html = html.replace(/(?:^|\n)[•\-]\s+(.*?)(?=\n|$)/g, '<li class="ml-4 list-disc text-stone-700">$1</li>');
    // Backticks `code`
    html = html.replace(/`([^`]+)`/g, '<code class="bg-stone-100 text-emerald-900 text-xs px-1.5 py-0.5 rounded font-mono font-medium">$1</code>');
    // Markdown links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-emerald-700 font-semibold underline hover:text-emerald-900">$1</a>');
    // Newlines to <br>
    html = html.replace(/\n\n/g, '<p class="mt-2"></p>').replace(/\n/g, '<br/>');

    return html;
  }

  // Global helper: rate chat response
  window.rateAssistantChat = function (stars, btn) {
    fetch('/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: chatSessionId, rating: stars })
    });
    btn.parentElement.innerHTML = `<span class="text-emerald-700 font-semibold"><i class="fa-solid fa-check"></i> Thank you!</span>`;
  };
})();
