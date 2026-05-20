/**
 * Лабораторная работа №8 — Блокчейн-шифрование файлов
 * Вариант 2: AES-256, SHA-256 + сжатие, GUI
 */

// ==================== Утилиты ====================

/** SHA-256 хэш строки (через CryptoJS) */
function sha256(str) {
  return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
}

/** SHA-256 хэш файла (ArrayBuffer → hex) */
function sha256File(arrayBuffer) {
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
}

/**
 * SHA-256 + сжатие: вычисляет SHA-256 хэш, затем «сжимает» его
 * до 32 символов (128 бит) путём XOR-свёртки двух половин.
 * Это имитирует «сжатие» в контексте задания.
 */
function sha256Compressed(str) {
  const full = sha256(str);
  const half = full.length / 2;
  let compressed = '';
  for (let i = 0; i < half; i++) {
    const a = parseInt(full[i], 16);
    const b = parseInt(full[i + half], 16);
    compressed += (a ^ b).toString(16);
  }
  return compressed;
}

function sha256FileCompressed(arrayBuffer) {
  const full = sha256File(arrayBuffer);
  const half = full.length / 2;
  let compressed = '';
  for (let i = 0; i < half; i++) {
    const a = parseInt(full[i], 16);
    const b = parseInt(full[i + half], 16);
    compressed += (a ^ b).toString(16);
  }
  return compressed;
}

function now() {
  return new Date().toISOString();
}

function formatBytes(bytes) {
  if (bytes === 0) return '0';
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(2) + ' МБ';
}

// ==================== Класс Block ====================

class Block {
  constructor(index, timestamp, data, previousHash) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const input = this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash;
    return sha256(input);
  }
}

// ==================== Класс Blockchain ====================

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block(0, now(), 'Genesis Block', '0'.repeat(64));
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data) {
    const prev = this.getLatestBlock();
    const newBlock = new Block(prev.index + 1, now(), data, prev.hash);
    this.chain.push(newBlock);
    return newBlock;
  }

  isChainValid() {
    const errors = [];
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      const recalculated = current.calculateHash();
      if (current.hash !== recalculated) {
        errors.push({
          blockIndex: i,
          type: 'hash_mismatch',
          message: `Блок #${i}: хэш не соответствует данным (ожидался ${recalculated.substring(0, 16)}..., получен ${current.hash.substring(0, 16)}...)`
        });
      }

      if (current.previousHash !== previous.hash) {
        errors.push({
          blockIndex: i,
          type: 'link_broken',
          message: `Блок #${i}: ссылка на предыдущий блок нарушена`
        });
      }
    }

    // Check genesis block
    const genesis = this.chain[0];
    const genesisRecalc = genesis.calculateHash();
    if (genesis.hash !== genesisRecalc) {
      errors.unshift({
        blockIndex: 0,
        type: 'hash_mismatch',
        message: `Генезис-блок: хэш не соответствует данным`
      });
    }

    return { valid: errors.length === 0, errors };
  }

  findBlockByFileHash(fileHash) {
    for (let i = this.chain.length - 1; i >= 0; i--) {
      const data = this.chain[i].data;
      if (data && typeof data === 'object' && data.file_hash === fileHash) {
        return this.chain[i];
      }
    }
    return null;
  }

  findBlockByEncryptedFilename(filename) {
    for (let i = this.chain.length - 1; i >= 0; i--) {
      const data = this.chain[i].data;
      if (data && typeof data === 'object' && data.encrypted_filename === filename) {
        return this.chain[i];
      }
    }
    return null;
  }

  toJSON() {
    return JSON.stringify(this.chain, null, 2);
  }

  static fromJSON(json) {
    const bc = new Blockchain();
    const parsed = JSON.parse(json);
    bc.chain = parsed.map(b => {
      const block = new Block(b.index, b.timestamp, b.data, b.previousHash);
      block.hash = b.hash;
      return block;
    });
    return bc;
  }
}

// ==================== FileEncryptor (AES-256) ====================

class FileEncryptor {
  /**
   * Генерирует случайный сессионный ключ (256 бит)
   */
  static generateSessionKey() {
    return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
  }

  /**
   * Шифрует данные (строка) алгоритмом AES-256
   */
  static encrypt(data, key) {
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  /**
   * Расшифровывает данные
   */
  static decrypt(ciphertext, key) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Шифрует ArrayBuffer, возвращая base64 строку
   */
  static encryptArrayBuffer(arrayBuffer, key) {
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    const encrypted = CryptoJS.AES.encrypt(wordArray, key);
    return encrypted.toString();
  }

  /**
   * Расшифровывает base64 строку обратно в текст
   */
  static decryptToString(ciphertext, key) {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  }

  /**
   * Шифрует сессионный ключ мастер-ключом пользователя
   */
  static encryptSessionKey(sessionKey, masterKey) {
    return CryptoJS.AES.encrypt(sessionKey, masterKey).toString();
  }

  /**
   * Расшифровывает сессионный ключ мастер-ключом
   */
  static decryptSessionKey(encryptedKey, masterKey) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedKey, masterKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  }
}

// ==================== Приложение ====================

class App {
  constructor() {
    this.blockchain = new Blockchain();
    this.currentFile = null;        // { name, size, type, arrayBuffer, content }
    this.currentFileHash = null;
    this.currentFileHashCompressed = null;
    this.currentEncryptedData = null;
    this.currentSessionKey = null;
    this.currentEncryptedSessionKey = null;

    this.loadFromStorage();
    this.bindEvents();
    this.renderBlockchain();
    this.log('Система инициализирована. Блокчейн загружен: ' + this.blockchain.chain.length + ' блок(ов).', 'info');
  }

  // ---- Привязка событий ----
  bindEvents() {
    // Файл
    document.getElementById('file-input').addEventListener('change', (e) => this.onFileSelect(e));
    document.getElementById('btn-create-file').addEventListener('click', () => this.onCreateFile());
    document.getElementById('btn-hash').addEventListener('click', () => this.onHashFile());
    document.getElementById('btn-encrypt').addEventListener('click', () => this.onEncryptFile());
    document.getElementById('btn-add-block').addEventListener('click', () => this.onAddBlock());

    // Расшифровка
    document.getElementById('decrypt-file-input').addEventListener('change', (e) => this.onDecryptFileSelect(e));
    document.getElementById('btn-decrypt').addEventListener('click', () => this.onDecryptFile());

    // Верификация
    document.getElementById('verify-file-input').addEventListener('change', (e) => this.onVerifyFileSelect(e));
    document.getElementById('btn-verify').addEventListener('click', () => this.onVerifyFile());

    // Блокчейн
    document.getElementById('btn-validate').addEventListener('click', () => this.onValidateChain());
    document.getElementById('btn-tamper').addEventListener('click', () => this.onTamperBlock());
    document.getElementById('btn-export').addEventListener('click', () => this.onExport());
    document.getElementById('btn-reset').addEventListener('click', () => this.onReset());
  }

  // ---- Выбор файла ----
  async onFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const textContent = await this.tryReadAsText(file);

    this.currentFile = {
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      arrayBuffer: arrayBuffer,
      content: textContent
    };
    this.currentFileHash = null;
    this.currentEncryptedData = null;
    this.showFileInfo();
    this.updateButtons();
    this.log(`Файл выбран: ${file.name} (${formatBytes(file.size)})`, 'info');
  }

  async tryReadAsText(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
  }

  onCreateFile() {
    const text = document.getElementById('text-input').value.trim();
    const filename = document.getElementById('text-filename').value.trim() || 'test.txt';
    if (!text) {
      this.log('Введите текст для создания файла.', 'error');
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    this.currentFile = {
      name: filename,
      size: data.byteLength,
      type: 'text/plain',
      arrayBuffer: data.buffer,
      content: text
    };
    this.currentFileHash = null;
    this.currentEncryptedData = null;
    this.showFileInfo();
    this.updateButtons();
    this.log(`Текстовый файл создан: ${filename} (${formatBytes(data.byteLength)})`, 'success');
  }

  showFileInfo() {
    const el = document.getElementById('file-info');
    el.classList.remove('hidden');
    document.getElementById('fi-name').textContent = this.currentFile.name;
    document.getElementById('fi-size').textContent = this.currentFile.size;
    document.getElementById('fi-type').textContent = this.currentFile.type;
    const preview = document.getElementById('fi-preview');
    const wrap = document.getElementById('fi-preview-wrap');
    if (this.currentFile.content) {
      wrap.classList.remove('hidden');
      preview.textContent = this.currentFile.content.substring(0, 500) +
        (this.currentFile.content.length > 500 ? '...' : '');
    } else {
      wrap.classList.add('hidden');
    }
    // Reset hash/encrypt results
    document.getElementById('hash-result').classList.add('hidden');
    document.getElementById('encrypt-result').classList.add('hidden');
  }

  updateButtons() {
    const hasFile = !!this.currentFile;
    document.getElementById('btn-hash').disabled = !hasFile;
    document.getElementById('btn-encrypt').disabled = !hasFile;
    document.getElementById('btn-add-block').disabled = !this.currentFileHash;
  }

  // ---- Хэширование ----
  onHashFile() {
    if (!this.currentFile) return;

    const fullHash = sha256File(this.currentFile.arrayBuffer);
    const compressedHash = sha256FileCompressed(this.currentFile.arrayBuffer);

    this.currentFileHash = fullHash;
    this.currentFileHashCompressed = compressedHash;

    document.getElementById('hash-result').classList.remove('hidden');
    document.getElementById('hash-value').textContent = 'SHA-256: ' + fullHash;
    document.getElementById('hash-compressed-value').textContent = 'SHA-256 + сжатие (XOR-свёртка): ' + compressedHash;

    this.updateButtons();
    this.log(`Хэш вычислен для ${this.currentFile.name}: ${fullHash.substring(0, 32)}...`, 'success');
  }

  // ---- Шифрование ----
  onEncryptFile() {
    if (!this.currentFile) return;

    const masterKey = document.getElementById('master-key').value;
    if (!masterKey) {
      this.log('Введите мастер-ключ для шифрования.', 'error');
      return;
    }

    // Вычислить хэш если ещё не вычислен
    if (!this.currentFileHash) {
      this.onHashFile();
    }

    // Генерация сессионного ключа
    this.currentSessionKey = FileEncryptor.generateSessionKey();

    // Шифрование файла AES-256
    this.currentEncryptedData = FileEncryptor.encryptArrayBuffer(
      this.currentFile.arrayBuffer,
      this.currentSessionKey
    );

    // Шифрование сессионного ключа мастер-ключом
    this.currentEncryptedSessionKey = FileEncryptor.encryptSessionKey(
      this.currentSessionKey,
      masterKey
    );

    // Показать результат
    document.getElementById('encrypt-result').classList.remove('hidden');
    document.getElementById('enc-status').textContent = 'Файл зашифрован алгоритмом AES-256';
    document.getElementById('enc-key').textContent = this.currentEncryptedSessionKey;

    // Предложить скачать зашифрованный файл
    const blob = new Blob([this.currentEncryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const encName = this.currentFile.name.replace(/(\.[^.]+)$/, '_encrypted$1');
    const a = document.createElement('a');
    a.href = url;
    a.download = encName;
    a.textContent = 'Скачать зашифрованный файл: ' + encName;
    a.className = 'btn btn-secondary';
    a.style.display = 'inline-block';
    a.style.marginTop = '0.5rem';
    const container = document.getElementById('encrypt-result');
    const existing = container.querySelector('a');
    if (existing) existing.remove();
    container.appendChild(a);

    this.updateButtons();
    this.log(`Файл ${this.currentFile.name} зашифрован AES-256. Сессионный ключ защищён мастер-ключом.`, 'success');
  }

  // ---- Добавление в блокчейн ----
  onAddBlock() {
    if (!this.currentFile || !this.currentFileHash) return;

    const blockData = {
      filename: this.currentFile.name,
      file_hash: this.currentFileHash,
      file_hash_compressed: this.currentFileHashCompressed,
      file_size: this.currentFile.size,
      timestamp: now()
    };

    // Если файл зашифрован — добавить ключ в блок
    if (this.currentEncryptedData && this.currentEncryptedSessionKey) {
      blockData.encryption_key = this.currentEncryptedSessionKey;
      blockData.encrypted_filename = this.currentFile.name.replace(/(\.[^.]+)$/, '_encrypted$1');
      blockData.encryption_time = now();
      blockData.encryption_algorithm = 'AES-256';
    }

    const newBlock = this.blockchain.addBlock(blockData);
    this.saveToStorage();
    this.renderBlockchain();
    this.log(`Блок #${newBlock.index} добавлен в цепочку: ${this.currentFile.name}`, 'success');

    // Сброс
    this.currentFile = null;
    this.currentFileHash = null;
    this.currentFileHashCompressed = null;
    this.currentEncryptedData = null;
    this.currentSessionKey = null;
    this.currentEncryptedSessionKey = null;
    document.getElementById('file-info').classList.add('hidden');
    document.getElementById('hash-result').classList.add('hidden');
    document.getElementById('encrypt-result').classList.add('hidden');
    document.getElementById('file-input').value = '';
    this.updateButtons();
  }

  // ---- Расшифровка ----
  decryptFile = null;
  decryptFileContent = null;

  async onDecryptFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    this.decryptFile = file;
    this.decryptFileContent = await file.text();
    document.getElementById('btn-decrypt').disabled = false;
    this.log(`Файл для расшифровки выбран: ${file.name}`, 'info');
  }

  onDecryptFile() {
    if (!this.decryptFileContent) {
      this.log('Выберите зашифрованный файл.', 'error');
      return;
    }

    const masterKey = document.getElementById('decrypt-master-key').value;
    if (!masterKey) {
      this.log('Введите мастер-ключ для расшифровки.', 'error');
      return;
    }

    // Ищем блок по имени зашифрованного файла
    const encFilename = this.decryptFile.name;
    const block = this.blockchain.findBlockByEncryptedFilename(encFilename);

    const resultEl = document.getElementById('decrypt-result');
    const statusEl = document.getElementById('decrypt-status');
    const previewEl = document.getElementById('decrypt-preview');
    resultEl.classList.remove('hidden');

    if (!block) {
      statusEl.innerHTML = '<span style="color:var(--danger)">Блок с информацией о шифровании не найден в блокчейне для файла: ' + encFilename + '</span>';
      previewEl.textContent = '';
      this.log('Расшифровка невозможна: блок не найден.', 'error');
      return;
    }

    // Извлекаем зашифрованный сессионный ключ
    const encSessionKey = block.data.encryption_key;

    // Расшифровываем сессионный ключ мастер-ключом
    const sessionKey = FileEncryptor.decryptSessionKey(encSessionKey, masterKey);
    if (!sessionKey) {
      statusEl.innerHTML = '<span style="color:var(--danger)">Неверный мастер-ключ. Расшифровка не удалась.</span>';
      previewEl.textContent = '';
      this.log('Расшифровка не удалась: неверный мастер-ключ.', 'error');
      return;
    }

    // Расшифровываем файл сессионным ключом
    const decrypted = FileEncryptor.decryptToString(this.decryptFileContent, sessionKey);
    if (!decrypted) {
      statusEl.innerHTML = '<span style="color:var(--danger)">Ошибка расшифровки данных. Возможно, повреждён файл или использован неверный ключ.</span>';
      previewEl.textContent = '';
      this.log('Ошибка расшифровки данных.', 'error');
      return;
    }

    // Проверяем хэш расшифрованных данных
    const encoder = new TextEncoder();
    const decryptedBuffer = encoder.encode(decrypted).buffer;
    const decryptedHash = sha256File(decryptedBuffer);
    const hashMatch = decryptedHash === block.data.file_hash;

    statusEl.innerHTML = hashMatch
      ? '<span style="color:var(--success)">Файл успешно расшифрован! Хэш совпадает с оригиналом.</span>'
      : '<span style="color:var(--warning)">Файл расшифрован, но хэш НЕ совпадает с оригиналом. Возможно повреждение данных.</span>';

    previewEl.textContent = decrypted.substring(0, 1000) +
      (decrypted.length > 1000 ? '...' : '');

    // Предложить скачать расшифрованный файл
    const blob = new Blob([decrypted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const decName = this.decryptFile.name.replace('_encrypted', '_decrypted');
    const a = document.createElement('a');
    a.href = url;
    a.download = decName;
    a.textContent = 'Скачать расшифрованный файл: ' + decName;
    a.className = 'btn btn-secondary';
    a.style.display = 'inline-block';
    a.style.marginTop = '0.5rem';
    const existing = resultEl.querySelector('a');
    if (existing) existing.remove();
    resultEl.appendChild(a);

    this.log(`Файл расшифрован: ${decName}. Хэш ${hashMatch ? 'совпадает' : 'НЕ совпадает'}.`, hashMatch ? 'success' : 'warn');
  }

  // ---- Верификация ----
  verifyFile = null;
  verifyFileBuffer = null;

  async onVerifyFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    this.verifyFile = file;
    this.verifyFileBuffer = await file.arrayBuffer();
    document.getElementById('btn-verify').disabled = false;
    this.log(`Файл для верификации выбран: ${file.name}`, 'info');
  }

  onVerifyFile() {
    if (!this.verifyFileBuffer) return;

    const currentHash = sha256File(this.verifyFileBuffer);
    const block = this.blockchain.findBlockByFileHash(currentHash);
    const resultEl = document.getElementById('verify-result');
    const statusEl = document.getElementById('verify-status');
    resultEl.classList.remove('hidden');

    if (!block) {
      statusEl.className = 'invalid';
      statusEl.innerHTML = `
        <p style="color:var(--danger); font-weight:600;">Файл НЕ зарегистрирован в блокчейне.</p>
        <p style="color:var(--text-dim);">Текущий хэш: ${currentHash}</p>
        <p style="color:var(--text-dim);">Файл либо никогда не добавлялся, либо был изменён после регистрации.</p>
      `;
      this.log(`Верификация ${this.verifyFile.name}: файл НЕ найден в блокчейне.`, 'error');
      return;
    }

    // Проверяем целостность цепочки от найденного блока до генезис-блока
    const chainResult = this.blockchain.isChainValid();

    if (chainResult.valid) {
      statusEl.className = 'valid';
      statusEl.innerHTML = `
        <p style="color:var(--success); font-weight:600;">Файл подлинный! Целостность подтверждена.</p>
        <p>Найден в блоке #${block.index}</p>
        <p>Хэш файла: <span class="mono">${currentHash}</span></p>
        <p>Цепочка блокчейна целостна.</p>
      `;
      this.log(`Верификация ${this.verifyFile.name}: подлинность подтверждена (блок #${block.index}).`, 'success');
    } else {
      statusEl.className = 'invalid';
      const errorMsgs = chainResult.errors.map(e => `<li>${e.message}</li>`).join('');
      statusEl.innerHTML = `
        <p style="color:var(--danger); font-weight:600;">Файл найден в блоке #${block.index}, но цепочка блокчейна нарушена!</p>
        <p style="color:var(--warning);">Нельзя доверять результату проверки.</p>
        <ul style="margin-top:.5rem; font-size:.85rem;">${errorMsgs}</ul>
      `;
      this.log(`Верификация ${this.verifyFile.name}: цепочка нарушена! Результату нельзя доверять.`, 'error');
    }
  }

  // ---- Валидация цепочки ----
  onValidateChain() {
    const result = this.blockchain.isChainValid();
    const el = document.getElementById('chain-status');
    el.classList.remove('hidden', 'valid', 'invalid');

    if (result.valid) {
      el.classList.add('valid');
      el.innerHTML = '<span class="status-icon" style="color:var(--success);">&#10004;</span> Цепочка блокчейна целостна. Все блоки прошли проверку.';
      this.log('Проверка цепочки: целостность подтверждена.', 'success');
    } else {
      el.classList.add('invalid');
      const msgs = result.errors.map(e => `<li>${e.message}</li>`).join('');
      el.innerHTML = `<span class="status-icon" style="color:var(--danger);">&#10008;</span> Цепочка нарушена!<ul style="margin-top:.5rem;font-size:.85rem;">${msgs}</ul>`;
      this.log('Проверка цепочки: НАРУШЕНИЕ обнаружено!', 'error');
    }

    this.renderBlockchain();
  }

  // ---- Подмена данных (тест) ----
  onTamperBlock() {
    if (this.blockchain.chain.length <= 1) {
      this.log('Нет блоков данных для изменения (только генезис-блок).', 'warn');
      return;
    }

    // Изменяем последний блок данных на один символ
    const targetIdx = this.blockchain.chain.length - 1;
    const block = this.blockchain.chain[targetIdx];
    const data = block.data;

    if (typeof data === 'object' && data.filename) {
      const original = data.filename;
      data.filename = data.filename.substring(0, data.filename.length - 1) +
        String.fromCharCode(data.filename.charCodeAt(data.filename.length - 1) + 1);
      this.log(`Блок #${targetIdx}: поле filename изменено с "${original}" на "${data.filename}" (один символ).`, 'warn');
    } else if (typeof data === 'string') {
      const original = data;
      block.data = data.substring(0, data.length - 1) +
        String.fromCharCode(data.charCodeAt(data.length - 1) + 1);
      this.log(`Блок #${targetIdx}: данные изменены с "${original}" на "${block.data}" (один символ).`, 'warn');
    }

    this.saveToStorage();
    this.renderBlockchain();
    this.log('Данные в блокчейне принудительно изменены! Проверьте целостность цепочки.', 'warn');
  }

  // ---- Экспорт ----
  onExport() {
    const json = this.blockchain.toJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blockchain_export.json';
    a.click();
    URL.revokeObjectURL(url);
    this.log('Блокчейн экспортирован в JSON.', 'info');
  }

  // ---- Сброс ----
  onReset() {
    if (!confirm('Вы уверены? Вся цепочка блокчейна будет удалена.')) return;
    this.blockchain = new Blockchain();
    this.saveToStorage();
    this.renderBlockchain();
    document.getElementById('chain-status').classList.add('hidden');
    this.log('Блокчейн сброшен. Создан новый генезис-блок.', 'warn');
  }

  // ---- Рендеринг блокчейна ----
  renderBlockchain() {
    const container = document.getElementById('blockchain-view');
    container.innerHTML = '';

    const validation = this.blockchain.isChainValid();
    const invalidBlocks = new Set(validation.errors.map(e => e.blockIndex));

    this.blockchain.chain.forEach((block, i) => {
      if (i > 0) {
        const link = document.createElement('div');
        link.className = 'block-link';
        link.textContent = '⬇';
        container.appendChild(link);
      }

      const card = document.createElement('div');
      const isGenesis = block.index === 0;
      const isInvalid = invalidBlocks.has(block.index);
      card.className = `block-card ${isGenesis ? 'genesis' : 'normal'} ${isInvalid ? 'invalid' : ''}`;

      const dataStr = typeof block.data === 'object'
        ? this.formatBlockData(block.data)
        : `<span>${block.data}</span>`;

      card.innerHTML = `
        <div class="block-header">
          <span class="block-index">${isGenesis ? 'Генезис-блок' : 'Блок #' + block.index}</span>
          <span class="block-time">${new Date(block.timestamp).toLocaleString('ru-RU')}</span>
        </div>
        <div class="block-field"><strong>Хэш:</strong> <span class="hash-val">${block.hash}</span></div>
        <div class="block-field"><strong>Хэш предыдущего:</strong> <span class="hash-val">${block.previousHash}</span></div>
        <div class="block-field"><strong>Данные:</strong> ${dataStr}</div>
        ${isInvalid ? '<div style="color:var(--danger);font-weight:600;margin-top:.3rem;">⚠ Блок повреждён!</div>' : ''}
      `;
      container.appendChild(card);
    });
  }

  formatBlockData(data) {
    let html = '<div style="margin-top:.3rem;">';
    if (data.filename) html += `<div>Файл: <strong>${data.filename}</strong></div>`;
    if (data.file_size !== undefined) html += `<div>Размер: ${formatBytes(data.file_size)}</div>`;
    if (data.file_hash) html += `<div>Хэш файла: <span class="mono" style="font-size:.7rem;">${data.file_hash}</span></div>`;
    if (data.file_hash_compressed) html += `<div>Хэш (сжатый): <span class="mono" style="font-size:.7rem;">${data.file_hash_compressed}</span></div>`;
    if (data.encryption_algorithm) html += `<div>Алгоритм: ${data.encryption_algorithm}</div>`;
    if (data.encrypted_filename) html += `<div>Зашифрованный файл: ${data.encrypted_filename}</div>`;
    if (data.encryption_key) html += `<div>Ключ (зашифрован): <span class="mono" style="font-size:.65rem;">${data.encryption_key.substring(0, 60)}...</span></div>`;
    if (data.timestamp) html += `<div>Время: ${new Date(data.timestamp).toLocaleString('ru-RU')}</div>`;
    html += '</div>';
    return html;
  }

  // ---- Логирование ----
  log(message, type = 'info') {
    const container = document.getElementById('log-entries');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString('ru-RU')}</span>${message}`;
    container.prepend(entry);
  }

  // ---- Хранение ----
  saveToStorage() {
    try {
      localStorage.setItem('blockchain_lab8', this.blockchain.toJSON());
    } catch {}
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('blockchain_lab8');
      if (saved) {
        this.blockchain = Blockchain.fromJSON(saved);
      }
    } catch {}
  }
}

// ==================== Запуск ====================
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
