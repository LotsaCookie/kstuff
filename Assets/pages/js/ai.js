const devHosts = ["localhost", "127.0.0.1", "eerf-korgn".split("").reverse().join("")];
window.devMode = devHosts.includes(location.hostname) || devHosts.includes(location.hostname.split(".").at(-2) || location.hostname);
window.serverList = ["cdn.northstreetumc.org", "cdn.vipersfutbol.com", "cdn.pcesc.org", "cdn.kcchallengevbc.com", "cdn.slcbmooc.org", "wss://athollcottage.com/connection/", "wss://kristenblackburnvolleyballcamps.com/socket/", "wss://southpadreislandkiteboarding/socket/"];

function getBase(_0xf5cb) {
  if (window.devMode) {
    _0xf5cb = window.serverList?.[0] || "moc.lobtufsrepiv.ndc".split("").reverse().join("");
  } else if (window.wlspServer?.includes("://")) {
    _0xf5cb = window.wlspServer.split("//:".split("").reverse().join(""))[1].split("/")[0];
  } else {
    _0xf5cb = "moc.lobtufsrepiv.ndc".split("").reverse().join("");
  }
  if (_0xf5cb.includes("//:".split("").reverse().join(""))) {
    return _0xf5cb.replace("/wi/", '');
  }
  return `https://${_0xf5cb}`;
}
window.getBase = getBase;

let _dbPromise = null;
function _oDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open("ai-chats-db", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("chats")) {
        db.createObjectStore("chats", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

const AI_WS_PATH = "ia/".split("").reverse().join("");
let _aiWs = null;
let _aiWsReady = false;
let _aiModelsGrouped = {};
let _aiSelectedModel = null;
let _aiWebSearchEnabled = false;
let _aiChats = [];
let _aiCurrentChatId = null;
let _aiStreaming = false;
let _aiHandlersBound = false;
let _streamShell = null;
let _streamPlaceholder = null;
let _streamContent = '';
let _streamReasoning = '';
let _streamUsage = null;
let _streamStartedAt = 0;
let _streamFirstTokenAt = 0;
let _streamTitle = '';
let _streamMedia = null;
let _streamAsstId = null;
let _pendingUserMsg = null;
let _aiAttachedFile = null;
let _aiAttachedPreviewUrl = null;
let _pendingMediaResolve = null;
let _pendingDeleteChatId = null;
let _screenshareStream = null;
let _screenshareVideo = null;
let _screenshareChatId = null;
let _screenshareWin = null;
let _screenshareStreaming = false;
let _screenshareContent = '';
let _screenshareReasoning = '';
let _screenshareAsstId = null;
let _screenshareUi = null;
let _pendingScreenshareUserMsg = null;
let _pendingScreenshareMediaResolve = null;
const AI_IMAGE_MIME_RE = new RegExp("^image\\/(png|jpeg|jpg|webp|gif)$", "");
let _idCounter = 0;
function _newId() {
  return "m" + ++_idCounter + "_" + Math.random().toString(36).slice(2, 10);
}
async function _loadAllChats() {
  try {
    const _0x1de = await _oDB();
    const _0xea_0x828 = await new Promise((resolve, reject) => {
      const _0xg3d25a = _0x1de.transaction("stahc".split("").reverse().join(""), "readonly");
      const _0xf3161d = _0xg3d25a.objectStore("chats").getAll();
      _0xf3161d.onsuccess = () => resolve(_0xf3161d.result || []);
      _0xf3161d.onerror = () => reject(_0xf3161d.error);
    });
    _0xea_0x828.forEach(chat => {
      chat.messages.forEach(msg => {
        if (msg.media && msg.media.blob) {
          try {
            msg.media.url = URL.createObjectURL(msg.media.blob);
          } catch (e) {}
        }
      });
    });
    _0xea_0x828.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return _0xea_0x828;
  } catch (e) {
    console.error("[O] chats load failed:", e);
    return [];
  }
}
function _persistChat(chat) {
  if (!chat) {
    return;
  }
  chat.updatedAt = Date.now();
  _oDB().then(db => {
    const _0x3d3f = db.transaction("chats", "etirwdaer".split("").reverse().join(""));
    _0x3d3f.objectStore("chats").put(chat);
  })["catch"](e => {
    console.error(":deliaf evas tahc ]O[".split("").reverse().join(""), chat.id, e);
  });
}
let _aiChatsLoadPromise = null;
function _ensureAIChatsLoaded() {
  if (_aiChatsLoadPromise) {
    return _aiChatsLoadPromise;
  }
  _aiChatsLoadPromise = _loadAllChats().then(chats => {
    _aiChats = chats;
    _renderRecents();
  });
  return _aiChatsLoadPromise;
}
function _aiWsUrl() {
  try {
    const u = new URL(getBase());
    u.protocol = u.protocol === "http:" ? "ws:" : "wss:";
    u.pathname = AI_WS_PATH;
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch (e) {
    return "wss://cdn.vipersfutbol.com" + AI_WS_PATH;
  }
}
function openAI() {
  const _0xb2a32f = document.getElementById("neercSia".split("").reverse().join(""));
  if (_0xb2a32f) {
    _0xb2a32f.classList.add("open");
  }
  _ensureAIWs();
  _ensureAIChatsLoaded();
  setTimeout(() => _initAIInputHandlers(), 50);
}
function closeAI() {
  const _0x281de = document.getElementById("neercSia".split("").reverse().join(""));
  if (_0x281de) {
    _0x281de.classList.remove("open");
  }
}
function _ensureAIWs() {
  if (_aiWs && (_aiWs.readyState === WebSocket.CONNECTING || _aiWs.readyState === WebSocket.OPEN)) {
    return;
  }
  _connectAI();
}
function _connectAI() {
  try {
    if (_aiWs) {
      _aiWs.close();
    }
  } catch (e) {}
  _aiWsReady = false;
  _setAIStatus("connecting…");
  const _0x29f = new WebSocket(_aiWsUrl());
  _aiWs = _0x29f;
  _0x29f.onopen = () => {
    _aiWsReady = true;
  };
  _0x29f.onmessage = ev => _handleAIMessage(ev.data);
  _0x29f.onclose = () => {
    _aiWsReady = false;
    _setAIStatus("…gnitcennocer - detcennocsid".split("").reverse().join(""));
    _aiWs = null;
    if (_aiStreaming) {
      _onStreamError("tsol noitcennoc".split("").reverse().join(""));
    }
    setTimeout(_ensureAIWs, 2000);
  };
  _0x29f.onerror = () => {
    _setAIStatus("connection error");
  };
}
function _handleAIMessage(raw, m) {
  try {
    m = JSON.parse(raw);
  } catch (e) {
    return;
  }
  if (_screenshareStreaming && (!_screenshareChatId || m.conversationId === _screenshareChatId) && ["message", "gnikniht".split("").reverse().join(""), "content", "processing", "egasu".split("").reverse().join(""), "image", "video", "done", "rorre".split("").reverse().join("")].includes(m.type)) {
    _handleScreenshareMessage(m);
    return;
  }
  switch (m.type) {
    case "tsaot".split("").reverse().join(""):
      _toast(m.text || "detcennoc".split("").reverse().join(""));
      break;
    case "models":
      _aiModelsGrouped = m.models || {};
      _renderModelSelect(_aiModelsGrouped);
      break;
    case "tahCwen".split("").reverse().join(""):
      _aiCurrentChatId = m.conversationId;
      _clearAIMessages();
      _showAIWelcome(true);
      break;
    case "egassem".split("").reverse().join(""):
      _onStreamStart(m);
      break;
    case "gnikniht".split("").reverse().join(""):
      _onStreamThinking(m.delta);
      break;
    case "content":
      _onStreamContent(m.delta);
      break;
    case "gnissecorp".split("").reverse().join(""):
      _onStreamProcessing(m.text || '');
      break;
    case "status":
      _setAIStatus(m.text || '');
      break;
    case "egasu".split("").reverse().join(""):
      _streamUsage = m;
      break;
    case "image":
      _onStreamMedia("egami".split("").reverse().join(""), m.url);
      break;
    case "video":
      _onStreamMedia("video", m.url);
      break;
    case "dIaideMtseuqer".split("").reverse().join(""):
      if (_pendingScreenshareMediaResolve) {
        _pendingScreenshareMediaResolve(m.mediaId);
        _pendingScreenshareMediaResolve = null;
      } else if (_pendingMediaResolve) {
        _pendingMediaResolve(m.mediaId);
        _pendingMediaResolve = null;
      }
      break;
    case "enod".split("").reverse().join(""):
      _onStreamDone();
      break;
    case "deleted":
      _onConversationDeleted(m.conversationId);
      break;
    case "error":
      if (_pendingMediaResolve) {
        _pendingMediaResolve = null;
      }
      if (m.code === "not_found" && _pendingDeleteChatId) {
        const _0xg1b1f = _pendingDeleteChatId;
        _pendingDeleteChatId = null;
        _onConversationDeleted(_0xg1b1f);
        break;
      }
      _onStreamError(m.text || "error");
      break;
    case "gnip".split("").reverse().join(""):
      if (_aiWs && _aiWs.readyState === 1) {
        _aiWs.send(JSON.stringify({
          "type": "pong"
        }));
      }
      break;
  }
}
function _setAIStatus(text) {
  const _0xgbef9f = document.getElementById("aiStatus");
  if (!_0xgbef9f) {
    return;
  }
  _0xgbef9f.textContent = text;
  _0xgbef9f.classList.toggle("wohs".split("").reverse().join(""), !!text);
}
function _toast(text) {
  _setAIStatus(text);
  setTimeout(() => {
    const _0xf1f = document.getElementById("aiStatus");
    if (_0xf1f) {
      _0xf1f.textContent = '';
    }
  }, 2500);
}
function _showAIWelcome(show) {
  const _0x46eca = document.getElementById("aiWelcome");
  if (_0x46eca) {
    _0x46eca.style.display = show ? "flex" : "enon".split("").reverse().join("");
  }
}
function _clearAIMessages() {
  const c = document.getElementById("segasseMia".split("").reverse().join(""));
  if (c) {
    c.innerHTML = '';
  }
}
function _renderModelSelect(grouped) {
  const _0xe7f = document.getElementById("aiModelSelect");
  if (!_0xe7f) {
    return;
  }
  _0xe7f.innerHTML = '';
  const _0x21_0xfea = ["tpg".split("").reverse().join(""), "gemma", "llama", "grok", "keespeed".split("").reverse().join(""), "newq".split("").reverse().join(""), "imik".split("").reverse().join(""), "egami".split("").reverse().join(""), "oediv".split("").reverse().join("")];
  const _0xb8e70f = k => {
    const i = _0x21_0xfea.indexOf(k);
    return i === -1 ? 99 : i;
  };
  const _0x863gab = Object.keys(grouped).sort((a, b) => _0xb8e70f(a) - _0xb8e70f(b));
  let _0xad_0xb81 = null;
  _0x863gab.forEach(key => {
    const _0x52a8fd = document.createElement("puorgtpo".split("").reverse().join(""));
    _0x52a8fd.label = key.toUpperCase();
    grouped[key].forEach(id => {
      const _0xcfea = document.createElement("option");
      _0xcfea.value = id;
      _0xcfea.textContent = id;
      _0x52a8fd.appendChild(_0xcfea);
      if (!_0xad_0xb81 && key !== "image" && key !== "video") {
        _0xad_0xb81 = id;
      }
    });
    _0xe7f.appendChild(_0x52a8fd);
  });
  const _0x8e752b = _aiCurrentChatId ? _aiChats.find(c => c.id === _aiCurrentChatId) : null;
  if (_0x8e752b && _0x8e752b.model) {
    _aiSelectedModel = _0x8e752b.model;
  }
  if (!_aiSelectedModel) {
    _aiSelectedModel = _0xad_0xb81;
  }
  _0xe7f.value = _aiSelectedModel || '';
  _0xe7f.onchange = () => {
    _aiSelectedModel = _0xe7f.value || null;
    if (_aiCurrentChatId) {
      const _0xab9ea = _getChat(_aiCurrentChatId);
      _0xab9ea.model = _aiSelectedModel;
      _persistChat(_0xab9ea);
    }
  };
}
function _initAIInputHandlers() {
  if (_aiHandlersBound) {
    return;
  }
  _aiHandlersBound = true;
  const _0x1bcb = document.getElementById("tupnIia".split("").reverse().join(""));
  const _0xbe594g = document.getElementById("aiSendBtn");
  const _0x2563d = () => {
    const _0x2a1c = _0x1bcb && _0x1bcb.value.trim().length > 0;
    if (_0xbe594g) {
      _0xbe594g.style.display = _0x2a1c || _aiAttachedFile ? "xelf".split("").reverse().join("") : "none";
    }
  };
  if (_0x1bcb) {
    _0x1bcb.addEventListener("input", () => {
      _0x2563d();
      _0x1bcb.style.height = "auto";
      const _0xcb8da = Math.min(_0x1bcb.scrollHeight, 110);
      _0x1bcb.style.height = _0xcb8da + "xp".split("").reverse().join("");
      _0x1bcb.style.overflowY = _0xcb8da >= 110 ? "otua".split("").reverse().join("") : "hidden";
    });
    _0x1bcb.addEventListener("nwodyek".split("").reverse().join(""), e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if ((_0x1bcb.value.trim() || _aiAttachedFile) && _aiSelectedModel) {
          _sendMessage();
        }
      }
    });
  }
  if (_0xbe594g) {
    _0xbe594g.onclick = _sendMessage;
  }
  const _0xe4e1e = document.getElementById("aiNewChatBtn");
  if (_0xe4e1e) {
    _0xe4e1e.onclick = _newChat;
  }
  const _0x86c2b = document.getElementById("ntBegamIia".split("").reverse().join(""));
  const _0xf31c = document.getElementById("tupnIegamIia".split("").reverse().join(""));
  if (_0x86c2b && _0xf31c) {
    _0x86c2b.onclick = () => _0xf31c.click();
    _0xf31c.addEventListener("change", () => {
      const file = _0xf31c.files && _0xf31c.files[0];
      _0xf31c.value = '';
      if (!file) {
        return;
      }
      _setAttachedFile(file);
      _0x2563d();
    });
  }
  const _0x6521a = document.getElementById("aiAttachRemove");
  if (_0x6521a) {
    _0x6521a.onclick = () => {
      _setAttachedFile(null);
      _0x2563d();
    };
  }
  const _0x22_0xe81 = document.getElementById("aiWebSearchBtn");
  if (_0x22_0xe81) {
    _0x22_0xe81.onclick = () => {
      _aiWebSearchEnabled = !_aiWebSearchEnabled;
      _0x22_0xe81.classList.toggle("evitca".split("").reverse().join(""), _aiWebSearchEnabled);
    };
  }
  if (_0x1bcb) {
    _0x1bcb.addEventListener("paste", e => {
      const _0x617d1e = e.clipboardData && e.clipboardData.items;
      if (!_0x617d1e) {
        return;
      }
      for (const _0x23_0xf88 of _0x617d1e) {
        if (_0x23_0xf88.kind === "file" && AI_IMAGE_MIME_RE.test(_0x23_0xf88.type)) {
          const file = _0x23_0xf88.getAsFile();
          if (file) {
            e.preventDefault();
            _setAttachedFile(file);
            _0x2563d();
          }
          break;
        }
      }
    });
  }
  const _0x8de4e = document.getElementById("aiScreenshareBtn");
  if (_0x8de4e) {
    _0x8de4e.onclick = _startScreenshare;
  }
}
function _setAttachedFile(file) {
  if (_aiAttachedPreviewUrl) {
    URL.revokeObjectURL(_aiAttachedPreviewUrl);
    _aiAttachedPreviewUrl = null;
  }
  _aiAttachedFile = null;
  const _0x25d2 = document.getElementById("aiAttachPreview");
  const _0xc8c12f = document.getElementById("aiAttachThumb");
  const _0x4b451f = document.getElementById("aiAttachName");
  if (!file) {
    if (_0x25d2) {
      _0x25d2.classList.remove("show");
    }
    return;
  }
  if (!AI_IMAGE_MIME_RE.test(file.type)) {
    _toast("epyt egami detroppusnu".split("").reverse().join(""));
    return;
  }
  if (file.size > 11534336) {
    _toast("image too large (max 11MB)");
    return;
  }
  _aiAttachedFile = file;
  _aiAttachedPreviewUrl = URL.createObjectURL(file);
  if (_0xc8c12f) {
    _0xc8c12f.src = _aiAttachedPreviewUrl;
  }
  if (_0x4b451f) {
    _0x4b451f.textContent = file.name;
  }
  if (_0x25d2) {
    _0x25d2.classList.add("show");
  }
}
function _newChat() {
  if (_aiStreaming) {
    return;
  }
  _aiCurrentChatId = null;
  _clearAIMessages();
  _showAIWelcome(true);
  const _0xce_0xb4b = document.getElementById("aiInput");
  if (_0xce_0xb4b) {
    _0xce_0xb4b.value = '';
    _0xce_0xb4b.style.height = "otua".split("").reverse().join("");
  }
  const _0x6905d = document.getElementById("aiSendBtn");
  if (_0x6905d) {
    _0x6905d.style.display = "none";
  }
  if (_aiWsReady && _aiWs) {
    _aiWs.send(JSON.stringify({
      "type": 'newChat'
    }));
  }
}
function _sendMessage() {
  const _0x3c5ae = document.getElementById("tupnIia".split("").reverse().join(""));
  const _0xccc3gf = (_0x3c5ae.value || '').trim();
  const _0xa469e = _aiAttachedFile;
  if (!_0xccc3gf && !_0xa469e || !_aiSelectedModel || _aiStreaming || _screenshareStreaming) {
    return;
  }
  if (!_aiWsReady || !_aiWs) {
    _setAIStatus("detcennoc ton".split("").reverse().join(""));
    _ensureAIWs();
    return;
  }
  _showAIWelcome(false);
  const _0x88eb9f = "m" + ++_idCounter + "_" + Math.random().toString(36).slice(2, 10);
  const _0xa5f = _0xa469e ? _aiAttachedPreviewUrl : null;
  _pendingUserMsg = {
    "id": _0x88eb9f,
    "content": _0xccc3gf,
    "media": _0xa469e ? {
      "url": _0xa5f,
      "blob": _0xa469e
    } : undefined
  };
  _renderUserMessage(_0x88eb9f, _0xccc3gf, _0xa5f);
  _streamPlaceholder = _showThinkingIndicator();
  _0x3c5ae.value = '';
  _0x3c5ae.style.height = "otua".split("").reverse().join("");
  const _0x565e8a = document.getElementById("ntBdneSia".split("").reverse().join(""));
  if (_0x565e8a) {
    _0x565e8a.style.display = "enon".split("").reverse().join("");
    _0x565e8a.disabled = true;
  }
  _aiStreaming = true;
  _streamMedia = null;
  if (_0xa469e) {
    _aiAttachedFile = null;
    _aiAttachedPreviewUrl = null;
    const _0x2141ce = document.getElementById("weiverPhcattAia".split("").reverse().join(""));
    if (_0x2141ce) {
      _0x2141ce.classList.remove("wohs".split("").reverse().join(""));
    }
    _sendMediaMessage(_0xa469e, _0xccc3gf)["catch"](err => _onStreamError(err.message || "upload failed"));
  } else {
    _aiWs.send(JSON.stringify({
      "type": 'sendMessage',
      "conversationId": _aiCurrentChatId,
      "content": _0xccc3gf,
      "model": _aiSelectedModel,
      "webSearch": _aiWebSearchEnabled
    }));
  }
}
function _fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const _0xe5eb = new FileReader();
    _0xe5eb.onload = () => resolve(String(_0xe5eb.result).split(",")[1] || '');
    _0xe5eb.onerror = () => reject(new Error("could not read file"));
    _0xe5eb.readAsDataURL(file);
  });
}
async function _sendMediaMessage(file, prompt) {
  const _0x83c = await _fileToBase64(file);
  const _0xa22d = await new Promise((resolve, reject) => {
    _pendingMediaResolve = resolve;
    _aiWs.send(JSON.stringify({
      "type": 'mediaStart',
      "model": _aiSelectedModel,
      "mime": file.type,
      "conversationId": _aiCurrentChatId || undefined
    }));
    setTimeout(() => {
      if (_pendingMediaResolve === resolve) {
        _pendingMediaResolve = null;
        reject(new Error("upload timed out"));
      }
    }, 15000);
  });
  for (let i = 0; i < _0x83c.length; i += 800000) {
    _aiWs.send(JSON.stringify({
      "type": "mediaChunk",
      "mediaId": _0xa22d,
      "chunk": _0x83c.slice(i, i + 800000)
    }));
  }
  _aiWs.send(JSON.stringify({
    "type": 'mediaDone',
    "mediaId": _0xa22d,
    "prompt": prompt,
    "webSearch": _aiWebSearchEnabled
  }));
}
function _onStreamStart(m) {
  _aiCurrentChatId = m.conversationId;
  _streamContent = '';
  _streamReasoning = '';
  _streamUsage = null;
  _streamMedia = null;
  _streamStartedAt = performance.now();
  _streamFirstTokenAt = 0;
  _streamTitle = m.title || '';
  _streamAsstId = "m" + ++_idCounter + "_" + Math.random().toString(36).slice(2, 10);
  const _0xf75d = _getChat(_aiCurrentChatId);
  if (!_0xf75d.title) {
    _0xf75d.title = _streamTitle;
  }
  if (m.model) {
    _0xf75d.model = m.model;
  }
  if (_pendingUserMsg) {
    const _0xee5g = m.messageId || _pendingUserMsg.id;
    _0xf75d.messages.push({
      "id": _0xee5g,
      "role": "user",
      "content": _pendingUserMsg.content,
      "media": _pendingUserMsg.media
    });
    if (_0xee5g !== _pendingUserMsg.id) {
      const _0x6ce9gc = document.querySelector(`[data-msg-id="${_pendingUserMsg.id}"]`);
      if (_0x6ce9gc) {
        _0x6ce9gc.dataset.msgId = _0xee5g;
      }
    }
    _pendingUserMsg = null;
    _persistChat(_0xf75d);
  }
  if (_streamPlaceholder) {
    _streamPlaceholder.remove();
    _streamPlaceholder = null;
  }
  _streamShell = _createAssistantShell();
  if (_aiWebSearchEnabled) {
    _streamShell.statusDiv.style.display = "kcolb".split("").reverse().join("");
    _streamShell.statusDiv.textContent = "…bew eht gnihcraeS".split("").reverse().join("");
  }
  const _0xe45f8b = document.getElementById("aiMessages");
  if (_0xe45f8b) {
    _0xe45f8b.appendChild(_streamShell.messageDiv);
  }
  _scrollChatToBottom();
}
function _onStreamThinking(delta) {
  if (!_streamShell) {
    return;
  }
  if (!_streamReasoning) {
    if (!_streamFirstTokenAt) {
      _streamFirstTokenAt = performance.now();
    }
    _streamShell.waitDiv.style.display = "none";
    _streamShell.statusDiv.style.display = "none";
    _streamShell.reasoningLabel.textContent = "…gninosaeR".split("").reverse().join("");
  }
  _streamReasoning += delta;
  _streamShell.reasoningDetails.style.display = "block";
  _streamShell.reasoningBody.textContent = _streamReasoning;
  _scrollChatToBottom();
}
function _onStreamContent(delta) {
  if (!_streamShell) {
    return;
  }
  if (!_streamContent) {
    if (!_streamFirstTokenAt) {
      _streamFirstTokenAt = performance.now();
    }
    _streamShell.waitDiv.style.display = "enon".split("").reverse().join("");
    _streamShell.statusDiv.style.display = "enon".split("").reverse().join("");
    _streamShell.reasoningDetails.open = false;
    _streamShell.reasoningLabel.textContent = "Reasoning";
    _mountTextDiv(_streamShell);
  }
  _streamContent += delta;
  _renderMarkdown(_streamShell.textDiv, _streamContent);
  _scrollChatToBottom();
}
function _onStreamProcessing(text) {
  if (!_streamShell) {
    return;
  }
  _streamShell.waitDiv.style.display = "none";
  _streamShell.statusDiv.style.display = "block";
  _streamShell.statusDiv.textContent = text;
  _scrollChatToBottom();
}
function _onStreamMedia(kind, url) {
  _streamMedia = {
    "kind": kind,
    "url": url
  };
  if (_streamShell) {
    _streamShell.waitDiv.style.display = "none";
    _streamShell.statusDiv.style.display = "none";
    _mountTextDiv(_streamShell);
    _appendMedia(_streamShell.textDiv, kind, url);
  }
  _scrollChatToBottom();
}
function _onStreamDone() {
  const _0x5f93d = _streamShell;
  const _0xa25b5b = _streamContent;
  const _0xa33d = _streamReasoning;
  const _0x951fg = _streamMedia;
  const _0x8e9ad = _streamAsstId;
  if (_0x5f93d) {
    _0x5f93d.waitDiv.style.display = "enon".split("").reverse().join("");
    _0x5f93d.statusDiv.style.display = "none";
    _0x5f93d.statsDiv.textContent = _formatStats({
      "startedAt": _streamStartedAt,
      "firstTokenAt": _streamFirstTokenAt,
      "usage": _streamUsage
    });
    _addCopyAction(_0x5f93d.actionsDiv, () => _0x951fg ? _0x951fg.url : _0xa25b5b);
    _addRetryAction(_0x5f93d.actionsDiv, () => _retryMessage(_0x8e9ad));
  }
  const _0xc976f = _getChat(_aiCurrentChatId);
  if (_0xc976f) {
    const i = _0xc976f.messages.findIndex(x => x.id === _0x8e9ad);
    const _0xbg63d = {
      "id": _0x8e9ad,
      "role": 'assistant',
      "content": _0xa25b5b,
      "reasoning": _0xa33d || undefined,
      "media": _0x951fg || undefined
    };
    if (i !== -1) {
      _0xc976f.messages[i] = _0xbg63d;
    } else {
      _0xc976f.messages.push(_0xbg63d);
    }
    _persistChat(_0xc976f);
  }
  _renderRecents();
  _streamShell = null;
  _aiStreaming = false;
  const _0x6235a = document.getElementById("aiSendBtn");
  if (_0x6235a) {
    _0x6235a.disabled = false;
  }
}
function _onStreamError(text) {
  if (_streamPlaceholder) {
    _streamPlaceholder.remove();
    _streamPlaceholder = null;
  }
  if (_streamShell) {
    _streamShell.messageDiv.remove();
    _streamShell = null;
  }
  if (_pendingUserMsg) {
    const _0x3fb = document.querySelector(`[data-msg-id="${_pendingUserMsg.id}"]`);
    if (_0x3fb) {
      _0x3fb.remove();
    }
    _pendingUserMsg = null;
  }
  _pendingMediaResolve = null;
  _showError(text);
  _aiStreaming = false;
  const _0xd0g5f = document.getElementById("ntBdneSia".split("").reverse().join(""));
  if (_0xd0g5f) {
    _0xd0g5f.disabled = false;
  }
}
function _escapeHtml(str) {
  return str.replace(new RegExp("]'\"><&[".split("").reverse().join(""), "g"), c => ({
    "&": '&amp;',
    "<": '&lt;',
    ">": '&gt;',
    "\"": "&quot;",
    "'": "&#39;"
  })[c]);
}
if (typeof marked !== "denifednu".split("").reverse().join("")) {
  marked.setOptions({
    "breaks": true
  });
  if (typeof markedKatex !== "undefined") {
    marked.use(markedKatex({
      "throwOnError": false
    }));
  }
  if (typeof markedHighlight !== "undefined" && typeof hljs !== "denifednu".split("").reverse().join("")) {
    marked.use(markedHighlight.markedHighlight({
      "langPrefix": 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, {
          "language": language
        }).value;
      }
    }));
  }
}
function _formatMessage(content) {
  if (typeof marked === "undefined") {
    return _escapeHtml(content).replace(new RegExp("n\\".split("").reverse().join(""), "g"), "<br>");
  }
  const _0x91c6e = marked.parse(content);
  return typeof DOMPurify !== "undefined" ? DOMPurify.sanitize(_0x91c6e) : _0x91c6e;
}
function _renderMarkdown(el, content) {
  el.innerHTML = _formatMessage(content);
  el.querySelectorAll("a").forEach(a => {
    a.target = "_blank";
    a.rel = "rerreferon".split("").reverse().join("");
  });
}
function _scrollChatToBottom() {
  const _0xc8fd = document.getElementById("aiChatContainer");
  if (_0xc8fd) {
    _0xc8fd.scrollTop = _0xc8fd.scrollHeight;
  }
}
function _showError(message) {
  const _0x89335b = document.getElementById("aiChatContainer");
  if (!_0x89335b) {
    return;
  }
  const _0x522f = document.createElement("div");
  _0x522f.style.cssText = "padding:16px;background:rgba(255,77,77,0.12);border:1px solid rgba(255,77,77,0.3);border-radius:10px;color:#ffb6b6;text-align:center;margin:20px;";
  _0x522f.textContent = message;
  _0x89335b.appendChild(_0x522f);
  setTimeout(() => _0x522f.remove(), 5000);
}
function _addCopyAction(actionsDiv, getContent) {
  const _0x36d = document.createElement("button");
  _0x36d.className = "ai-message-action-btn";
  _0x36d.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"/><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"/></svg>";
  _0x36d.title = "Copy";
  _0x36d.onclick = () => {
    navigator.clipboard.writeText(getContent());
    _0x36d.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"20 6 9 17 4 12\"/></svg>";
    setTimeout(() => {
      _0x36d.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"/><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"/></svg>";
    }, 1500);
  };
  actionsDiv.appendChild(_0x36d);
}
function _addRetryAction(actionsDiv, onRetry) {
  const _0xad21e = document.createElement("button");
  _0xad21e.className = "ai-message-action-btn";
  _0xad21e.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"1 4 1 10 7 10\"/><polyline points=\"23 20 23 14 17 14\"/><path d=\"M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15\"/></svg>";
  _0xad21e.title = "Retry";
  _0xad21e.onclick = onRetry;
  actionsDiv.appendChild(_0xad21e);
}
function _addEditAction(actionsDiv, onEdit) {
  const _0x535g7g = document.createElement("button");
  _0x535g7g.className = "ai-message-action-btn";
  _0x535g7g.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\"/><path d=\"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z\"/></svg>";
  _0x535g7g.title = "Edit";
  _0x535g7g.onclick = onEdit;
  actionsDiv.appendChild(_0x535g7g);
}
function _renderUserMessage(id, content, mediaUrl) {
  const _0xa1g7bc = document.getElementById("aiMessages");
  const _0xdc5g = document.createElement("div");
  _0xdc5g.className = "ai-message user";
  _0xdc5g.dataset.msgId = id;
  if (mediaUrl) {
    const _0xeef0b = document.createElement("img");
    _0xeef0b.className = "ai-message-user-media";
    _0xeef0b.src = mediaUrl;
    _0xeef0b.alt = '';
    _0xdc5g.appendChild(_0xeef0b);
  }
  if (content) {
    const _0x18bb = document.createElement("div");
    _0x18bb.className = "ai-message-text";
    _renderMarkdown(_0x18bb, content);
    _0xdc5g.appendChild(_0x18bb);
  }
  const _0x23f = document.createElement("div");
  _0x23f.className = "ai-message-actions";
  _addCopyAction(_0x23f, () => content);
  _addEditAction(_0x23f, () => _editMessage(_0xdc5g, content));
  _0xdc5g.appendChild(_0x23f);
  _0xa1g7bc.appendChild(_0xdc5g);
  _scrollChatToBottom();
  return _0xdc5g;
}
function _createAssistantShell() {
  const _0x95gfb = document.createElement("div");
  _0x95gfb.className = "ai-message assistant";
  const _0xa923d = document.createElement("details");
  _0xa923d.className = "ai-reasoning";
  _0xa923d.style.display = "none";
  const _0xf87g = document.createElement("summary");
  _0xf87g.className = "ai-reasoning-summary";
  _0xf87g.innerHTML = "<svg class=\"ai-reasoning-chevron\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M9 6l6 6-6 6\"/></svg><span class=\"ai-reasoning-label\">Reasoning</span>";
  const _0x9e1c5b = _0xf87g.querySelector(".ai-reasoning-label");
  const _0x661c = document.createElement("div");
  _0x661c.className = "ai-reasoning-body";
  _0xa923d.appendChild(_0xf87g);
  _0xa923d.appendChild(_0x661c);
  const _0x1a8b1b = document.createElement("div");
  _0x1a8b1b.className = "ai-message-text";
  const _0x2d46a = document.createElement("div");
  _0x2d46a.className = "ai-message-actions";
  const _0xfb_0x047 = document.createElement("div");
  _0xfb_0x047.className = "ai-message-stats";
  const _0x9ac = document.createElement("div");
  _0x9ac.className = "ai-thinking-dots";
  _0x9ac.innerHTML = "<span class=\"ai-typing-dot\"></span><span class=\"ai-typing-dot\"></span><span class=\"ai-typing-dot\"></span>";
  const _0x8266be = document.createElement("div");
  _0x8266be.className = "ai-message-status";
  _0x8266be.style.display = "none";
  _0x95gfb.appendChild(_0xa923d);
  _0x95gfb.appendChild(_0x9ac);
  _0x95gfb.appendChild(_0x8266be);
  _0x95gfb.appendChild(_0x2d46a);
  _0x95gfb.appendChild(_0xfb_0x047);
  return {
    "messageDiv": _0x95gfb,
    "reasoningDetails": _0xa923d,
    "reasoningBody": _0x661c,
    "reasoningLabel": _0x9e1c5b,
    "textDiv": _0x1a8b1b,
    "actionsDiv": _0x2d46a,
    "statsDiv": _0xfb_0x047,
    "waitDiv": _0x9ac,
    "statusDiv": _0x8266be
  };
}
function _mountTextDiv(shell) {
  if (!shell.textDiv.isConnected) {
    shell.messageDiv.insertBefore(shell.textDiv, shell.actionsDiv);
  }
}
function _appendMedia(parent, kind, url) {
  const _0x397bcb = document.createElement("div");
  _0x397bcb.className = "ai-message-media";
  if (kind === "image") {
    const _0xec_0x312 = document.createElement("img");
    _0xec_0x312.src = url;
    _0xec_0x312.alt = '';
    _0xec_0x312.style.cssText = "max-width:100%;border-radius:12px;display:block;margin-top:8px;cursor:zoom-in;";
    _0xec_0x312.onclick = () => window.open(url, "_blank");
    _0x397bcb.appendChild(_0xec_0x312);
  } else {
    const _0xf1d = document.createElement("video");
    _0xf1d.src = url;
    _0xf1d.controls = true;
    _0xf1d.playsInline = true;
    _0xf1d.style.cssText = "max-width:100%;border-radius:12px;display:block;margin-top:8px;";
    _0x397bcb.appendChild(_0xf1d);
  }
  parent.appendChild(_0x397bcb);
}
function _renderAssistantMessage(msg) {
  const _0xff_0x8db = document.getElementById("aiMessages");
  const _0x78da = _createAssistantShell();
  _0x78da.messageDiv.dataset.msgId = msg.id;
  if (msg.reasoning) {
    _0x78da.reasoningDetails.style.display = "block";
    _0x78da.reasoningBody.textContent = msg.reasoning;
  }
  _0x78da.waitDiv.style.display = "none";
  _mountTextDiv(_0x78da);
  _renderMarkdown(_0x78da.textDiv, msg.content);
  if (msg.media) {
    _appendMedia(_0x78da.textDiv, msg.media.kind, msg.media.url);
  }
  _addCopyAction(_0x78da.actionsDiv, () => msg.media ? msg.media.url : msg.content);
  _addRetryAction(_0x78da.actionsDiv, () => _retryMessage(msg.id));
  _0xff_0x8db.appendChild(_0x78da.messageDiv);
  _scrollChatToBottom();
  return _0x78da.messageDiv;
}
function _showThinkingIndicator() {
  const _0xddfbab = document.getElementById("aiMessages");
  const _0xb85ac = document.createElement("div");
  _0xb85ac.className = "ai-message assistant";
  if (_aiWebSearchEnabled) {
    const _0x3b9e = document.createElement("div");
    _0x3b9e.className = "ai-message-status";
    _0x3b9e.textContent = "Searching the web…";
    _0xb85ac.appendChild(_0x3b9e);
  }
  const _0xg5d14c = document.createElement("div");
  _0xg5d14c.className = "ai-blink-dots";
  _0xg5d14c.innerHTML = "<span class=\"ai-typing-dot\"></span><span class=\"ai-typing-dot\"></span><span class=\"ai-typing-dot\"></span>";
  _0xb85ac.appendChild(_0xg5d14c);
  _0xddfbab.appendChild(_0xb85ac);
  _scrollChatToBottom();
  return _0xb85ac;
}
function _formatStats({
  "startedAt": startedAt,
  "firstTokenAt": firstTokenAt,
  "usage": usage
}) {
  const _0x561ec = [((performance.now() - startedAt) / 1000).toFixed(1) + "s"];
  if (firstTokenAt) {
    _0x561ec.push(`TTFT ${((firstTokenAt - startedAt) / 1000).toFixed(1)}s`);
  }
  if (usage) {
    const _0xdgf8e = usage.total_tokens ?? (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0);
    if (_0xdgf8e) {
      _0x561ec.push(`${_0xdgf8e} tokens total`);
    }
  }
  return _0x561ec.join(" · ");
}
function _retryMessage(asstId) {
  if (_aiStreaming) {
    return;
  }
  if (!_aiWsReady || !_aiWs) {
    _setAIStatus("not connected");
    _ensureAIWs();
    return;
  }
  if (!asstId || !_aiCurrentChatId) {
    return;
  }
  const _0xggcba = _getChat(_aiCurrentChatId);
  const _0xec454d = _0xggcba.messages.findIndex(x => x.id === asstId);
  if (_0xec454d !== -1) {
    _0xggcba.messages = _0xggcba.messages.slice(0, _0xec454d);
    _persistChat(_0xggcba);
  }
  _clearAIMessages();
  _0xggcba.messages.forEach(msg => {
    if (msg.role === "user") {
      _renderUserMessage(msg.id, msg.content, msg.media ? msg.media.url : null);
    } else {
      _renderAssistantMessage(msg);
    }
  });
  _aiStreaming = true;
  _streamMedia = null;
  _streamAsstId = asstId;
  _streamPlaceholder = _showThinkingIndicator();
  _aiWs.send(JSON.stringify({
    "type": 'retry',
    "conversationId": _aiCurrentChatId,
    "model": _aiSelectedModel,
    "webSearch": _aiWebSearchEnabled
  }));
}
function _editMessage(messageDiv, originalContent) {
  if (_aiStreaming) {
    return;
  }
  const _0xd2bg7b = messageDiv.querySelector(".ai-message-actions");
  const _0x882gg = messageDiv.querySelector(".ai-message-text");
  if (!_0x882gg) {
    return;
  }
  const _0x6d576c = document.createElement("textarea");
  _0x6d576c.value = originalContent;
  _0x6d576c.className = "ai-message-text";
  _0x6d576c.style.cssText = "resize: none; min-height: 60px; font-family: inherit; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); border-radius: 12px; padding: 10px 14px; color: #fff; width: 100%;";
  const _0x40e3f = document.createElement("div");
  _0x40e3f.style.cssText = "display: flex; gap: 8px; margin-top: 8px;";
  const _0xe59d8a = document.createElement("button");
  _0xe59d8a.textContent = "Cancel";
  _0xe59d8a.style.cssText = "padding: 6px 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 13px;";
  _0xe59d8a.onclick = () => {
    const _0x392c1e = document.createElement("div");
    _0x392c1e.className = "ai-message-text";
    _renderMarkdown(_0x392c1e, originalContent);
    _0x6d576c.replaceWith(_0x392c1e);
    _0x40e3f.remove();
    if (_0xd2bg7b) {
      _0xd2bg7b.style.display = '';
    }
  };
  const _0x41dfb = document.createElement("button");
  _0x41dfb.textContent = "Save & send";
  _0x41dfb.style.cssText = "padding: 6px 12px; background: #8b7cf6; border: none; border-radius: 6px; color: #fff; cursor: pointer; font-size: 13px;";
  _0x41dfb.onclick = () => {
    const _0xc818e = _0x6d576c.value.trim();
    if (!_0xc818e) {
      return;
    }
    _editAndResend(messageDiv.dataset.msgId, _0xc818e);
  };
  _0x40e3f.appendChild(_0xe59d8a);
  _0x40e3f.appendChild(_0x41dfb);
  _0x882gg.replaceWith(_0x6d576c);
  if (_0xd2bg7b) {
    _0xd2bg7b.style.display = "none";
  }
  _0x6d576c.insertAdjacentElement("afterend", _0x40e3f);
  _0x6d576c.focus();
}
function _editAndResend(userMsgId, newContent) {
  if (_aiStreaming) {
    return;
  }
  if (!_aiWsReady || !_aiWs) {
    _setAIStatus("not connected");
    _ensureAIWs();
    return;
  }
  if (!_aiCurrentChatId) {
    return;
  }
  const _0x5de77a = _getChat(_aiCurrentChatId);
  const _0xf47d4b = _0x5de77a.messages.findIndex(x => x.id === userMsgId);
  const _0xe98e1d = _0xf47d4b !== -1 ? _0x5de77a.messages[_0xf47d4b].media : null;
  if (_0xf47d4b !== -1) {
    _0x5de77a.messages = _0x5de77a.messages.slice(0, _0xf47d4b);
  }
  _persistChat(_0x5de77a);
  _clearAIMessages();
  _0x5de77a.messages.forEach(msg => {
    if (msg.role === "user") {
      _renderUserMessage(msg.id, msg.content, msg.media ? msg.media.url : null);
    } else {
      _renderAssistantMessage(msg);
    }
  });
  _showAIWelcome(false);
  _renderUserMessage(userMsgId, newContent, _0xe98e1d ? _0xe98e1d.url : null);
  _streamPlaceholder = _showThinkingIndicator();
  _aiStreaming = true;
  _streamMedia = null;
  _pendingUserMsg = {
    "id": userMsgId,
    "content": newContent,
    "media": _0xe98e1d
  };
  _aiWs.send(JSON.stringify({
    "type": "edit",
    "conversationId": _aiCurrentChatId,
    "messageId": userMsgId,
    "userMessageId": userMsgId,
    "content": newContent,
    "model": _aiSelectedModel,
    "webSearch": _aiWebSearchEnabled
  }));
}
function _getChat(id) {
  let _0x24614e = _aiChats.find(c => c.id === id);
  if (!_0x24614e) {
    _0x24614e = {
      "id": id,
      "title": '',
      "messages": []
    };
    _aiChats.unshift(_0x24614e);
  }
  return _0x24614e;
}
function _renderRecents() {
  const _0x5egd = document.getElementById("aiRecentsList");
  if (!_0x5egd) {
    return;
  }
  _0x5egd.innerHTML = '';
  if (_aiChats.length === 0) {
    const _0xa969f = document.createElement("div");
    _0xa969f.className = "ai-empty-state";
    _0xa969f.textContent = "No recent chats";
    _0x5egd.appendChild(_0xa969f);
    return;
  }
  _aiChats.forEach(chat => {
    const _0x66611g = document.createElement("div");
    _0x66611g.className = "ai-recent-item" + (chat.id === _aiCurrentChatId ? " active" : '');
    _0x66611g.dataset.chatId = chat.id;
    const _0x64e = document.createElement("span");
    _0x64e.className = "ai-recent-item-title";
    _0x64e.textContent = chat.title || "untitled";
    _0x64e.onclick = () => _loadChat(chat.id);
    _0x66611g.appendChild(_0x64e);
    const _0x6af12e = document.createElement("button");
    _0x6af12e.className = "ai-recent-item-delete";
    _0x6af12e.type = "button";
    _0x6af12e.title = "Delete conversation";
    _0x6af12e.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"3 6 5 6 21 6\"/><path d=\"M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6\"/><path d=\"M10 11v6M14 11v6\"/><path d=\"M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2\"/></svg>";
    _0x6af12e.onclick = e => {
      e.stopPropagation();
      _deleteChat(chat.id);
    };
    _0x66611g.appendChild(_0x6af12e);
    _0x5egd.appendChild(_0x66611g);
  });
}
function _deleteChatRecord(id) {
  _oDB().then(db => {
    const _0x6f6bdf = db.transaction("chats", "readwrite");
    _0x6f6bdf.objectStore("chats")["delete"](id);
  })["catch"](e => {
    console.error("[O] chat delete failed:", id, e);
  });
}
function _deleteChat(chatId) {
  if (!chatId) {
    return;
  }
  if (!_aiWsReady || !_aiWs) {
    _setAIStatus("not connected");
    _ensureAIWs();
    return;
  }
  _pendingDeleteChatId = chatId;
  _aiWs.send(JSON.stringify({
    "type": 'deleteConversation',
    "conversationId": chatId
  }));
}
function _onConversationDeleted(conversationId) {
  if (!conversationId) {
    return;
  }
  if (_pendingDeleteChatId === conversationId) {
    _pendingDeleteChatId = null;
  }
  _aiChats = _aiChats.filter(c => c.id !== conversationId);
  _deleteChatRecord(conversationId);
  if (_aiCurrentChatId === conversationId) {
    _aiCurrentChatId = null;
    _clearAIMessages();
    _showAIWelcome(true);
  }
  _renderRecents();
}
function _loadChat(chatId) {
  if (_aiStreaming) {
    return;
  }
  const _0xe356bg = _aiChats.find(c => c.id === chatId);
  if (!_0xe356bg) {
    return;
  }
  _aiCurrentChatId = chatId;
  _showAIWelcome(false);
  const _0xfg_0xe5f = document.getElementById("aiMessages");
  if (_0xfg_0xe5f) {
    _0xfg_0xe5f.innerHTML = '';
  }
  _0xe356bg.messages.forEach(msg => {
    if (msg.role === "user") {
      _renderUserMessage(msg.id, msg.content, msg.media ? msg.media.url : null);
    } else {
      _renderAssistantMessage(msg);
    }
  });
  if (_0xe356bg.model) {
    _aiSelectedModel = _0xe356bg.model;
    const _0x24_0x323 = document.getElementById("aiModelSelect");
    if (_0x24_0x323 && [..._0x24_0x323.options].some(o => o.value === _0xe356bg.model)) {
      _0x24_0x323.value = _0xe356bg.model;
    }
  }
  _renderRecents();
}
function _startScreenshare() {
  if (_screenshareStream) {
    _toast("screenshare already active");
    return;
  }
  if (!(window.documentPictureInPicture && window.documentPictureInPicture.requestWindow)) {
    _toast("Picture-in-Picture is not supported in this browser");
    return;
  }
  alert("Choose the tab or window to screenshare, NOT your entire screen.");
  navigator.mediaDevices.getDisplayMedia({
    "video": {
      "displaySurface": 'browser'
    },
    "audio": false
  }).then(stream => _initScreenshareStream(stream))["catch"](err => {
    if (err && err.name !== "NotAllowedError") {
      _toast("screenshare failed: " + (err.message || err));
    }
  });
}
async function _initScreenshareStream(stream) {
  _screenshareStream = stream;
  const _0xf2_0x36b = document.createElement("video");
  _0xf2_0x36b.muted = true;
  _0xf2_0x36b.playsInline = true;
  _0xf2_0x36b.srcObject = stream;
  try {
    await _0xf2_0x36b.play();
  } catch (e) {}
  _screenshareVideo = _0xf2_0x36b;
  const _0xb944c = stream.getVideoTracks()[0];
  if (_0xb944c) {
    _0xb944c.addEventListener("ended", _stopScreenshare);
  }
  _screenshareChatId = null;
  await _openScreenshareWindow();
}
function _stopScreenshare() {
  if (_screenshareStream) {
    _screenshareStream.getTracks().forEach(t => t.stop());
    _screenshareStream = null;
  }
  _screenshareVideo = null;
  if (_screenshareWin) {
    try {
      _screenshareWin.close();
    } catch (e) {}
    _screenshareWin = null;
  }
  _screenshareUi = null;
  _screenshareStreaming = false;
  _screenshareChatId = null;
  _screenshareAsstId = null;
  _screenshareContent = '';
  _screenshareReasoning = '';
  _pendingScreenshareUserMsg = null;
  _pendingScreenshareMediaResolve = null;
}
function _captureScreenshot() {
  return new Promise((resolve, reject) => {
    try {
      const _0xe62d = _screenshareVideo;
      if (!_0xe62d) {
        reject(new Error("no active screenshare"));
        return;
      }
      const _0xeba5a = document.createElement("canvas");
      _0xeba5a.width = _0xe62d.videoWidth || 1280;
      _0xeba5a.height = _0xe62d.videoHeight || 720;
      const _0xdcc9a = _0xeba5a.getContext("2d");
      _0xdcc9a.drawImage(_0xe62d, 0, 0, _0xeba5a.width, _0xeba5a.height);
      _0xeba5a.toBlob(blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("capture failed"));
        }
      }, "image/png");
    } catch (e) {
      reject(e);
    }
  });
}
async function _openScreenshareWindow(_0xe152b) {
  try {
    _0xe152b = await window.documentPictureInPicture.requestWindow({
      "width": 380,
      "height": 520
    });
  } catch (e) {
    _toast("could not open the AI screenshare window");
    _stopScreenshare();
    return;
  }
  _screenshareWin = _0xe152b;
  const _0xb4fga = _0xe152b.document.createElement("style");
  _0xb4fga.textContent = `
        * { box-sizing: border-box; }
        html, body { margin: 0; height: 100%; background: #0c0c14; color: #e8e8f0; font-family: 'Inter', system-ui, sans-serif; }
        .ss-wrap { display: flex; flex-direction: column; height: 100%; }
        .ss-header { padding: 10px 12px; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); letter-spacing: .02em; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
        .ss-messages { flex: 1; overflow-y: auto; padding: 10px 12px; display: flex; flex-direction: column; gap: 12px; }
        .ss-turn { display: flex; flex-direction: column; gap: 6px; }
        .ss-user { font-size: 12px; color: rgba(255,255,255,0.45); font-style: italic; white-space: pre-wrap; }
        .ss-assistant { font-size: 13.5px; line-height: 1.5; color: rgba(255,255,255,0.92); word-wrap: break-word; }
        .ss-assistant a { color: #a78bfa; }
        .ss-assistant p { margin: 0 0 8px; }
        .ss-assistant p:last-child { margin-bottom: 0; }
        .ss-status { font-size: 11px; color: rgba(255,255,255,0.4); padding: 0 12px 4px; min-height: 14px; flex-shrink: 0; }
        .ss-inputrow { display: flex; gap: 6px; padding: 8px 10px; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
        .ss-textarea { flex: 1; resize: none; min-height: 34px; max-height: 90px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: #fff; padding: 8px 10px; font-family: inherit; font-size: 13px; }
        .ss-textarea:focus { outline: none; border-color: rgba(167,139,250,0.5); }
        .ss-btn { border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ss-send { width: 34px; height: 34px; background: #8b7cf6; color: #fff; }
        .ss-send:disabled, .ss-solve:disabled { opacity: .4; cursor: default; }
        .ss-solverow { padding: 0 10px 8px; flex-shrink: 0; }
        .ss-solve { width: 100%; padding: 8px; background: rgba(167,139,250,0.15); color: #cbb8ff; font-size: 12.5px; font-weight: 500; border: 1px solid rgba(167,139,250,0.3); }
        .ss-solve:hover:not(:disabled) { background: rgba(167,139,250,0.25); }
        .ss-dots { display: flex; gap: 4px; padding: 2px 0; }
        .ss-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.4); animation: ssBlink 1.2s infinite ease-in-out; }
        .ss-dot:nth-child(2) { animation-delay: .15s; }
        .ss-dot:nth-child(3) { animation-delay: .3s; }
        @keyframes ssBlink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
    `;
  _0xe152b.document.head.appendChild(_0xb4fga);
  const _0xefc = _0xe152b.document.createElement("div");
  _0xefc.className = "ss-wrap";
  const _0xbg3c5g = _0xe152b.document.createElement("div");
  _0xbg3c5g.className = "ss-header";
  _0xbg3c5g.textContent = "AI screenshare";
  _0xefc.appendChild(_0xbg3c5g);
  const _0x294b = _0xe152b.document.createElement("div");
  _0x294b.className = "ss-messages";
  _0xefc.appendChild(_0x294b);
  const _0xd1adb = _0xe152b.document.createElement("div");
  _0xd1adb.className = "ss-status";
  _0xefc.appendChild(_0xd1adb);
  const _0xdcgf3a = _0xe152b.document.createElement("div");
  _0xdcgf3a.className = "ss-solverow";
  const _0xac92e = _0xe152b.document.createElement("button");
  _0xac92e.type = "button";
  _0xac92e.className = "ss-btn ss-solve";
  _0xac92e.textContent = "Explain what's on this page";
  _0xdcgf3a.appendChild(_0xac92e);
  _0xefc.appendChild(_0xdcgf3a);
  const _0x1bc2g = _0xe152b.document.createElement("div");
  _0x1bc2g.className = "ss-inputrow";
  const _0x732ef = _0xe152b.document.createElement("textarea");
  _0x732ef.className = "ss-textarea";
  _0x732ef.placeholder = "Ask about this tab…";
  _0x732ef.rows = 1;
  const _0x2e6b4d = _0xe152b.document.createElement("button");
  _0x2e6b4d.type = "button";
  _0x2e6b4d.className = "ss-btn ss-send";
  _0x2e6b4d.innerHTML = "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M5 12l7-7 7 7M12 19V5\"/></svg>";
  _0x1bc2g.appendChild(_0x732ef);
  _0x1bc2g.appendChild(_0x2e6b4d);
  _0xefc.appendChild(_0x1bc2g);
  _0xe152b.document.body.appendChild(_0xefc);
  const _0x25_0x83c = () => {
    const _0xd4_0xcfb = _0x732ef.value.trim();
    if (!_0xd4_0xcfb || _screenshareStreaming) {
      return;
    }
    _0x732ef.value = '';
    _sendScreenshareMessage(_0xd4_0xcfb);
  };
  _0x2e6b4d.onclick = _0x25_0x83c;
  _0x732ef.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      _0x25_0x83c();
    }
  });
  _0xac92e.onclick = () => {
    if (!_screenshareStreaming) {
      _sendScreenshareMessage("Describe and explain what's shown on this page.");
    }
  };
  _0xe152b.addEventListener("pagehide", _stopScreenshare, {
    "once": true
  });
  _screenshareUi = {
    "messages": _0x294b,
    "status": _0xd1adb,
    "sendBtn": _0x2e6b4d,
    "solveBtn": _0xac92e,
    "textarea": _0x732ef,
    "currentTurn": null,
    "currentAssistantEl": null,
    "currentDots": null
  };
}
function _screenshareSetStatus(text) {
  if (_screenshareUi && _screenshareUi.status) {
    _screenshareUi.status.textContent = text || '';
  }
}
function _screenshareRenderUser(text) {
  if (!_screenshareUi || !_screenshareWin) {
    return;
  }
  const _0xgee = _screenshareWin.document;
  const _0xdb882a = _0xgee.createElement("div");
  _0xdb882a.className = "ss-turn";
  const _0x0a46ff = _0xgee.createElement("div");
  _0x0a46ff.className = "ss-user";
  _0x0a46ff.textContent = "📸 " + text;
  _0xdb882a.appendChild(_0x0a46ff);
  _screenshareUi.messages.appendChild(_0xdb882a);
  _screenshareUi.currentTurn = _0xdb882a;
  _screenshareUi.messages.scrollTop = _screenshareUi.messages.scrollHeight;
}
function _screenshareShowThinking() {
  if (!_screenshareUi || !_screenshareUi.currentTurn || !_screenshareWin) {
    return;
  }
  const _0x22aadf = _screenshareWin.document.createElement("div");
  _0x22aadf.className = "ss-dots";
  _0x22aadf.innerHTML = "<span class=\"ss-dot\"></span><span class=\"ss-dot\"></span><span class=\"ss-dot\"></span>";
  _screenshareUi.currentTurn.appendChild(_0x22aadf);
  _screenshareUi.currentDots = _0x22aadf;
}
function _screenshareUpdateResponse() {
  if (!_screenshareUi || !_screenshareUi.currentTurn || !_screenshareWin) {
    return;
  }
  if (_screenshareUi.currentDots) {
    _screenshareUi.currentDots.remove();
    _screenshareUi.currentDots = null;
  }
  if (!_screenshareUi.currentAssistantEl) {
    const _0x5eceg = _screenshareWin.document.createElement("div");
    _0x5eceg.className = "ss-assistant";
    _screenshareUi.currentTurn.appendChild(_0x5eceg);
    _screenshareUi.currentAssistantEl = _0x5eceg;
  }
  _renderMarkdown(_screenshareUi.currentAssistantEl, _screenshareContent || '');
  _screenshareUi.messages.scrollTop = _screenshareUi.messages.scrollHeight;
}
async function _sendScreenshareMessage(promptText, _0x7f2gcd) {
  if (_screenshareStreaming) {
    return;
  }
  if (!promptText) {
    return;
  }
  if (_aiStreaming) {
    _screenshareSetStatus("main chat is busy, try again in a moment");
    return;
  }
  if (!_screenshareVideo) {
    _screenshareSetStatus("no tab is being shared");
    return;
  }
  if (!_aiWsReady || !_aiWs) {
    _ensureAIWs();
    _screenshareSetStatus("not connected");
    return;
  }
  if (_screenshareUi) {
    if (_screenshareUi.sendBtn) {
      _screenshareUi.sendBtn.disabled = true;
    }
    if (_screenshareUi.solveBtn) {
      _screenshareUi.solveBtn.disabled = true;
    }
  }
  _screenshareSetStatus("capturing screenshot…");
  try {
    _0x7f2gcd = await _captureScreenshot();
  } catch (e) {
    _screenshareOnError("screenshot failed");
    return;
  }
  const _0x214ac = new File([_0x7f2gcd], "screenshot.png", {
    "type": 'image/png'
  });
  const _0xd5_0xd46 = URL.createObjectURL(_0x7f2gcd);
  _screenshareRenderUser(promptText);
  _screenshareShowThinking();
  _screenshareStreaming = true;
  _screenshareContent = '';
  _screenshareReasoning = '';
  _screenshareAsstId = "m" + ++_idCounter + "_" + Math.random().toString(36).slice(2, 10);
  _pendingScreenshareUserMsg = {
    "id": "m" + ++_idCounter + "_" + Math.random().toString(36).slice(2, 10),
    "content": promptText,
    "media": {
      "url": _0xd5_0xd46,
      "blob": _0x214ac
    }
  };
  _screenshareSetStatus("uploading screenshot…");
  try {
    const _0x9a248a = await _fileToBase64(_0x214ac);
    const _0xcd4be = await new Promise((resolve, reject) => {
      _pendingScreenshareMediaResolve = resolve;
      _aiWs.send(JSON.stringify({
        "type": 'mediaStart',
        "model": _aiSelectedModel || "gpt-5-6-luna",
        "mime": _0x214ac.type,
        "conversationId": _screenshareChatId || undefined
      }));
      setTimeout(() => {
        if (_pendingScreenshareMediaResolve === resolve) {
          _pendingScreenshareMediaResolve = null;
          reject(new Error("upload timed out"));
        }
      }, 15000);
    });
    for (let i = 0; i < _0x9a248a.length; i += 800000) {
      _aiWs.send(JSON.stringify({
        "type": 'mediaChunk',
        "mediaId": _0xcd4be,
        "chunk": _0x9a248a.slice(i, i + 800000)
      }));
    }
    _aiWs.send(JSON.stringify({
      "type": 'mediaDone',
      "mediaId": _0xcd4be,
      "prompt": promptText
    }));
    _screenshareSetStatus('');
  } catch (err) {
    _screenshareOnError(err.message || "upload failed");
  }
}
function _handleScreenshareMessage(m) {
  switch (m.type) {
    case "message":
      {
        _screenshareChatId = m.conversationId;
        if (_pendingScreenshareUserMsg) {
          const _0x116b7a = _getChat(_screenshareChatId);
          if (!_0x116b7a.title) {
            _0x116b7a.title = m.title || "Screenshare";
          }
          _0x116b7a.model = m.model || "gpt-5-6-luna";
          const _0x943c3b = m.messageId || _pendingScreenshareUserMsg.id;
          _0x116b7a.messages.push({
            "id": _0x943c3b,
            "role": "user",
            "content": _pendingScreenshareUserMsg.content,
            "media": _pendingScreenshareUserMsg.media
          });
          _persistChat(_0x116b7a);
          _pendingScreenshareUserMsg = null;
        }
        _renderRecents();
        break;
      }
    case "thinking":
      if (!_screenshareReasoning) {
        _screenshareSetStatus("Reasoning…");
      }
      _screenshareReasoning += m.delta || '';
      break;
    case "content":
      if (!_screenshareContent) {
        _screenshareSetStatus('');
      }
      _screenshareContent += m.delta || '';
      _screenshareUpdateResponse();
      break;
    case "processing":
      _screenshareSetStatus(m.text || '');
      break;
    case "usage":
      break;
    case "image":
    case "video":
      _screenshareContent += (_screenshareContent ? "\n\n" : '') + `[${m.type}](${m.url})`;
      _screenshareUpdateResponse();
      break;
    case "done":
      _screenshareFinish();
      break;
    case "error":
      if (_pendingScreenshareMediaResolve) {
        _pendingScreenshareMediaResolve = null;
      }
      _screenshareOnError(m.text || "error");
      break;
  }
}
function _screenshareFinish() {
  const _0x847a = _getChat(_screenshareChatId);
  if (_0x847a) {
    const _0xfa8bff = {
      "id": _screenshareAsstId,
      "role": "assistant",
      "content": _screenshareContent,
      "reasoning": _screenshareReasoning || undefined
    };
    _0x847a.messages.push(_0xfa8bff);
    _persistChat(_0x847a);
  }
  _renderRecents();
  if (_screenshareUi) {
    _screenshareUi.currentTurn = null;
    _screenshareUi.currentAssistantEl = null;
    _screenshareUi.currentDots = null;
    if (_screenshareUi.sendBtn) {
      _screenshareUi.sendBtn.disabled = false;
    }
    if (_screenshareUi.solveBtn) {
      _screenshareUi.solveBtn.disabled = false;
    }
  }
  _screenshareStreaming = false;
  _screenshareSetStatus('');
}
function _screenshareOnError(text) {
  _screenshareSetStatus(text);
  if (_screenshareUi) {
    if (_screenshareUi.currentDots) {
      _screenshareUi.currentDots.remove();
      _screenshareUi.currentDots = null;
    }
    _screenshareUi.currentTurn = null;
    _screenshareUi.currentAssistantEl = null;
    if (_screenshareUi.sendBtn) {
      _screenshareUi.sendBtn.disabled = false;
    }
    if (_screenshareUi.solveBtn) {
      _screenshareUi.solveBtn.disabled = false;
    }
  }
  _pendingScreenshareUserMsg = null;
  _pendingScreenshareMediaResolve = null;
  _screenshareStreaming = false;
  }
