"""
Лабораторная работа №8 — Блокчейн-шифрование файлов
Вариант 2: AES-256, SHA-256 + сжатие, GUI (PyQt5)
"""

import sys
import os
import json
import hashlib
import time
from datetime import datetime

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QTextEdit, QLineEdit, QFileDialog,
    QGroupBox, QTableWidget, QTableWidgetItem, QHeaderView,
    QMessageBox, QSplitter, QTabWidget, QInputDialog, QScrollArea,
    QFrame
)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont, QColor, QPalette, QIcon

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
import base64


# ==================== Криптографический уровень ====================

def sha256_hash(data: bytes) -> str:
    """Вычисляет SHA-256 хэш от байтовых данных."""
    return hashlib.sha256(data).hexdigest()


def sha256_compressed(data: bytes) -> str:
    """
    SHA-256 + сжатие: вычисляет SHA-256, затем сжимает до 32 символов
    путём XOR-свёртки двух половин 64-символьного хэша.
    """
    full_hash = sha256_hash(data)
    half = len(full_hash) // 2
    compressed = ""
    for i in range(half):
        a = int(full_hash[i], 16)
        b = int(full_hash[i + half], 16)
        compressed += format(a ^ b, "x")
    return compressed


def hash_file(filepath: str) -> tuple:
    """Хэширует файл блоками по 4 КБ. Возвращает (full_hash, compressed_hash)."""
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while True:
            chunk = f.read(4096)
            if not chunk:
                break
            sha.update(chunk)
    full = sha.hexdigest()
    half = len(full) // 2
    compressed = ""
    for i in range(half):
        a = int(full[i], 16)
        b = int(full[i + half], 16)
        compressed += format(a ^ b, "x")
    return full, compressed


class FileEncryptor:
    """Шифрование/расшифровка файлов алгоритмом AES-256."""

    @staticmethod
    def generate_session_key() -> bytes:
        """Генерирует случайный 256-битный ключ."""
        return get_random_bytes(32)

    @staticmethod
    def encrypt_data(data: bytes, key: bytes) -> bytes:
        """Шифрует данные AES-256-CBC."""
        iv = get_random_bytes(16)
        cipher = AES.new(key, AES.MODE_CBC, iv)
        ct = cipher.encrypt(pad(data, AES.block_size))
        return iv + ct

    @staticmethod
    def decrypt_data(encrypted: bytes, key: bytes) -> bytes:
        """Расшифровывает данные AES-256-CBC."""
        iv = encrypted[:16]
        ct = encrypted[16:]
        cipher = AES.new(key, AES.MODE_CBC, iv)
        return unpad(cipher.decrypt(ct), AES.block_size)

    @staticmethod
    def encrypt_session_key(session_key: bytes, master_key: str) -> str:
        """Шифрует сессионный ключ мастер-ключом пользователя."""
        mk = hashlib.sha256(master_key.encode()).digest()
        encrypted = FileEncryptor.encrypt_data(session_key, mk)
        return base64.b64encode(encrypted).decode()

    @staticmethod
    def decrypt_session_key(encrypted_key_b64: str, master_key: str) -> bytes:
        """Расшифровывает сессионный ключ мастер-ключом."""
        mk = hashlib.sha256(master_key.encode()).digest()
        encrypted = base64.b64decode(encrypted_key_b64)
        return FileEncryptor.decrypt_data(encrypted, mk)


# ==================== Блокчейн ====================

class Block:
    """Блок в цепочке блокчейна."""

    def __init__(self, index: int, timestamp: str, data, previous_hash: str):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()

    def calculate_hash(self) -> str:
        content = str(self.index) + self.timestamp + json.dumps(self.data, ensure_ascii=False, sort_keys=True) + self.previous_hash
        return hashlib.sha256(content.encode()).hexdigest()

    def to_dict(self) -> dict:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
        }

    @staticmethod
    def from_dict(d: dict) -> "Block":
        b = Block(d["index"], d["timestamp"], d["data"], d["previous_hash"])
        b.hash = d["hash"]
        return b


class Blockchain:
    """Цепочка блоков."""

    def __init__(self):
        self.chain: list[Block] = [self._create_genesis()]

    def _create_genesis(self) -> Block:
        return Block(0, datetime.utcnow().isoformat(), "Genesis Block", "0" * 64)

    def latest(self) -> Block:
        return self.chain[-1]

    def add_block(self, data) -> Block:
        prev = self.latest()
        b = Block(prev.index + 1, datetime.utcnow().isoformat(), data, prev.hash)
        self.chain.append(b)
        return b

    def validate(self) -> list:
        errors = []
        genesis = self.chain[0]
        if genesis.hash != genesis.calculate_hash():
            errors.append((0, "Хэш генезис-блока не соответствует данным"))

        for i in range(1, len(self.chain)):
            cur = self.chain[i]
            prev = self.chain[i - 1]
            recalc = cur.calculate_hash()
            if cur.hash != recalc:
                errors.append((i, f"Хэш блока #{i} не соответствует данным"))
            if cur.previous_hash != prev.hash:
                errors.append((i, f"Блок #{i}: ссылка на предыдущий блок нарушена"))
        return errors

    def find_by_file_hash(self, file_hash: str):
        for b in reversed(self.chain):
            if isinstance(b.data, dict) and b.data.get("file_hash") == file_hash:
                return b
        return None

    def find_by_encrypted_filename(self, name: str):
        for b in reversed(self.chain):
            if isinstance(b.data, dict) and b.data.get("encrypted_filename") == name:
                return b
        return None

    def to_json(self) -> str:
        return json.dumps([b.to_dict() for b in self.chain], ensure_ascii=False, indent=2)

    def save(self, path: str):
        with open(path, "w", encoding="utf-8") as f:
            f.write(self.to_json())

    @staticmethod
    def load(path: str) -> "Blockchain":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        bc = Blockchain.__new__(Blockchain)
        bc.chain = [Block.from_dict(d) for d in data]
        return bc


# ==================== Главное окно PyQt5 ====================

STORAGE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "blockchain.json")


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Лабораторная №8 — Блокчейн-шифрование файлов (Вариант 2)")
        self.setMinimumSize(1000, 750)

        # Загрузка/создание блокчейна
        if os.path.exists(STORAGE_FILE):
            try:
                self.blockchain = Blockchain.load(STORAGE_FILE)
            except Exception:
                self.blockchain = Blockchain()
        else:
            self.blockchain = Blockchain()

        # Текущий файл
        self.current_filepath = None
        self.current_file_data = None
        self.current_hash_full = None
        self.current_hash_compressed = None
        self.encrypted_data = None
        self.session_key = None
        self.encrypted_session_key = None

        self._build_ui()
        self._apply_dark_theme()
        self._refresh_chain_table()
        self._log("Система инициализирована. Блоков в цепочке: " + str(len(self.blockchain.chain)))

    # ---- UI ----
    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        root = QVBoxLayout(central)

        # Заголовок
        title = QLabel("Блокчейн-шифрование файлов")
        title.setFont(QFont("Segoe UI", 18, QFont.Bold))
        title.setAlignment(Qt.AlignCenter)
        subtitle = QLabel("Вариант 2 · AES-256 · SHA-256 + сжатие · PyQt5")
        subtitle.setAlignment(Qt.AlignCenter)
        subtitle.setStyleSheet("color: #8b8fa3;")
        root.addWidget(title)
        root.addWidget(subtitle)

        # Вкладки
        tabs = QTabWidget()
        root.addWidget(tabs, 1)

        # Вкладка 1: Работа с файлом
        tabs.addTab(self._build_file_tab(), "Файл")
        # Вкладка 2: Расшифровка
        tabs.addTab(self._build_decrypt_tab(), "Расшифровка")
        # Вкладка 3: Верификация
        tabs.addTab(self._build_verify_tab(), "Верификация")
        # Вкладка 4: Блокчейн
        tabs.addTab(self._build_chain_tab(), "Блокчейн")

        # Лог внизу
        log_group = QGroupBox("Лог операций")
        log_lay = QVBoxLayout(log_group)
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(150)
        self.log_text.setFont(QFont("Consolas", 9))
        log_lay.addWidget(self.log_text)
        root.addWidget(log_group)

    def _build_file_tab(self) -> QWidget:
        w = QWidget()
        lay = QVBoxLayout(w)

        # Создать текстовый файл
        g1 = QGroupBox("Создать текстовый файл")
        g1l = QVBoxLayout(g1)
        self.txt_content = QTextEdit()
        self.txt_content.setPlaceholderText("Введите произвольный текст...")
        self.txt_content.setMaximumHeight(100)
        g1l.addWidget(self.txt_content)
        row = QHBoxLayout()
        self.txt_filename = QLineEdit("test.txt")
        self.txt_filename.setPlaceholderText("Имя файла")
        row.addWidget(QLabel("Имя файла:"))
        row.addWidget(self.txt_filename)
        btn_create = QPushButton("Создать файл")
        btn_create.clicked.connect(self._on_create_file)
        row.addWidget(btn_create)
        g1l.addLayout(row)
        lay.addWidget(g1)

        # Или выбрать файл
        g2 = QGroupBox("Или выбрать существующий файл")
        g2l = QHBoxLayout(g2)
        btn_open = QPushButton("Открыть файл...")
        btn_open.clicked.connect(self._on_open_file)
        g2l.addWidget(btn_open)
        self.file_label = QLabel("Файл не выбран")
        self.file_label.setStyleSheet("color: #8b8fa3;")
        g2l.addWidget(self.file_label, 1)
        lay.addWidget(g2)

        # Информация о файле
        g3 = QGroupBox("Информация о файле")
        g3l = QVBoxLayout(g3)
        self.info_label = QLabel("—")
        self.info_label.setWordWrap(True)
        g3l.addWidget(self.info_label)
        self.preview_text = QTextEdit()
        self.preview_text.setReadOnly(True)
        self.preview_text.setMaximumHeight(80)
        self.preview_text.setFont(QFont("Consolas", 9))
        g3l.addWidget(self.preview_text)
        lay.addWidget(g3)

        # Мастер-ключ
        mk_row = QHBoxLayout()
        mk_row.addWidget(QLabel("Мастер-ключ:"))
        self.master_key_input = QLineEdit()
        self.master_key_input.setEchoMode(QLineEdit.Password)
        self.master_key_input.setPlaceholderText("Введите мастер-ключ...")
        mk_row.addWidget(self.master_key_input)
        lay.addLayout(mk_row)

        # Кнопки
        btn_row = QHBoxLayout()
        self.btn_hash = QPushButton("Вычислить хэш")
        self.btn_hash.clicked.connect(self._on_hash)
        self.btn_hash.setEnabled(False)
        btn_row.addWidget(self.btn_hash)

        self.btn_encrypt = QPushButton("Зашифровать (AES-256)")
        self.btn_encrypt.clicked.connect(self._on_encrypt)
        self.btn_encrypt.setEnabled(False)
        self.btn_encrypt.setStyleSheet("background-color: #6c63ff; color: white;")
        btn_row.addWidget(self.btn_encrypt)

        self.btn_add_block = QPushButton("Добавить в блокчейн")
        self.btn_add_block.clicked.connect(self._on_add_block)
        self.btn_add_block.setEnabled(False)
        self.btn_add_block.setStyleSheet("background-color: #38bdf8; color: #0f1117;")
        btn_row.addWidget(self.btn_add_block)
        lay.addLayout(btn_row)

        # Результат хэширования
        self.hash_label = QLabel("")
        self.hash_label.setWordWrap(True)
        self.hash_label.setFont(QFont("Consolas", 9))
        lay.addWidget(self.hash_label)

        # Результат шифрования
        self.encrypt_label = QLabel("")
        self.encrypt_label.setWordWrap(True)
        self.encrypt_label.setFont(QFont("Consolas", 9))
        lay.addWidget(self.encrypt_label)

        lay.addStretch()
        return w

    def _build_decrypt_tab(self) -> QWidget:
        w = QWidget()
        lay = QVBoxLayout(w)

        g = QGroupBox("Расшифровка файла")
        gl = QVBoxLayout(g)

        btn_open = QPushButton("Выбрать зашифрованный файл...")
        btn_open.clicked.connect(self._on_open_encrypted)
        gl.addWidget(btn_open)
        self.dec_file_label = QLabel("Файл не выбран")
        self.dec_file_label.setStyleSheet("color: #8b8fa3;")
        gl.addWidget(self.dec_file_label)

        row = QHBoxLayout()
        row.addWidget(QLabel("Мастер-ключ:"))
        self.dec_master_key = QLineEdit()
        self.dec_master_key.setEchoMode(QLineEdit.Password)
        self.dec_master_key.setPlaceholderText("Введите мастер-ключ...")
        row.addWidget(self.dec_master_key)
        gl.addLayout(row)

        self.btn_decrypt = QPushButton("Расшифровать")
        self.btn_decrypt.clicked.connect(self._on_decrypt)
        self.btn_decrypt.setEnabled(False)
        self.btn_decrypt.setStyleSheet("background-color: #6c63ff; color: white;")
        gl.addWidget(self.btn_decrypt)

        self.dec_result = QTextEdit()
        self.dec_result.setReadOnly(True)
        self.dec_result.setFont(QFont("Consolas", 9))
        gl.addWidget(self.dec_result)

        lay.addWidget(g)
        lay.addStretch()
        return w

    def _build_verify_tab(self) -> QWidget:
        w = QWidget()
        lay = QVBoxLayout(w)

        g = QGroupBox("Верификация файла")
        gl = QVBoxLayout(g)

        btn_open = QPushButton("Выбрать файл для проверки...")
        btn_open.clicked.connect(self._on_open_verify)
        gl.addWidget(btn_open)
        self.ver_file_label = QLabel("Файл не выбран")
        self.ver_file_label.setStyleSheet("color: #8b8fa3;")
        gl.addWidget(self.ver_file_label)

        self.btn_verify = QPushButton("Проверить целостность")
        self.btn_verify.clicked.connect(self._on_verify)
        self.btn_verify.setEnabled(False)
        self.btn_verify.setStyleSheet("background-color: #38bdf8; color: #0f1117;")
        gl.addWidget(self.btn_verify)

        self.ver_result = QTextEdit()
        self.ver_result.setReadOnly(True)
        self.ver_result.setFont(QFont("Consolas", 9))
        gl.addWidget(self.ver_result)

        lay.addWidget(g)
        lay.addStretch()
        return w

    def _build_chain_tab(self) -> QWidget:
        w = QWidget()
        lay = QVBoxLayout(w)

        btn_row = QHBoxLayout()
        btn_val = QPushButton("Проверить целостность цепочки")
        btn_val.clicked.connect(self._on_validate_chain)
        btn_row.addWidget(btn_val)

        btn_tamper = QPushButton("Изменить блок (тест)")
        btn_tamper.setStyleSheet("color: #ef4444;")
        btn_tamper.clicked.connect(self._on_tamper)
        btn_row.addWidget(btn_tamper)

        btn_export = QPushButton("Экспорт JSON")
        btn_export.clicked.connect(self._on_export)
        btn_row.addWidget(btn_export)

        btn_reset = QPushButton("Сбросить цепочку")
        btn_reset.setStyleSheet("color: #ef4444;")
        btn_reset.clicked.connect(self._on_reset)
        btn_row.addWidget(btn_reset)
        lay.addLayout(btn_row)

        self.chain_status_label = QLabel("")
        self.chain_status_label.setWordWrap(True)
        lay.addWidget(self.chain_status_label)

        # Таблица блоков
        self.chain_table = QTableWidget()
        self.chain_table.setColumnCount(5)
        self.chain_table.setHorizontalHeaderLabels(["#", "Время", "Данные", "Хэш", "Хэш пред."])
        self.chain_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Stretch)
        self.chain_table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeToContents)
        self.chain_table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeToContents)
        self.chain_table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.chain_table.setAlternatingRowColors(True)
        lay.addWidget(self.chain_table, 1)

        return w

    # ---- Тёмная тема ----
    def _apply_dark_theme(self):
        self.setStyleSheet("""
            QMainWindow, QWidget { background-color: #0f1117; color: #e4e6ef; }
            QGroupBox {
                border: 1px solid #2e3345; border-radius: 8px;
                margin-top: 8px; padding-top: 16px; font-weight: bold;
            }
            QGroupBox::title { subcontrol-origin: margin; left: 12px; padding: 0 4px; color: #38bdf8; }
            QLineEdit, QTextEdit {
                background-color: #1a1d27; border: 1px solid #2e3345;
                border-radius: 6px; padding: 6px; color: #e4e6ef;
            }
            QLineEdit:focus, QTextEdit:focus { border-color: #6c63ff; }
            QPushButton {
                background-color: #242834; border: 1px solid #2e3345;
                border-radius: 6px; padding: 8px 16px; color: #e4e6ef; font-weight: bold;
            }
            QPushButton:hover { background-color: #2e3345; }
            QPushButton:disabled { opacity: 0.4; color: #555; }
            QTabWidget::pane { border: 1px solid #2e3345; border-radius: 6px; }
            QTabBar::tab {
                background: #1a1d27; border: 1px solid #2e3345;
                padding: 8px 16px; margin-right: 2px; border-radius: 6px 6px 0 0; color: #8b8fa3;
            }
            QTabBar::tab:selected { background: #242834; color: #38bdf8; border-bottom-color: #242834; }
            QTableWidget {
                background-color: #1a1d27; border: 1px solid #2e3345;
                gridline-color: #2e3345; color: #e4e6ef;
            }
            QTableWidget::item:alternate { background-color: #181b24; }
            QHeaderView::section {
                background-color: #242834; color: #38bdf8;
                border: 1px solid #2e3345; padding: 4px;
            }
            QLabel { color: #e4e6ef; }
            QScrollBar:vertical {
                background: #1a1d27; width: 8px; border-radius: 4px;
            }
            QScrollBar::handle:vertical { background: #2e3345; border-radius: 4px; }
        """)

    # ---- Логика: создание файла ----
    def _on_create_file(self):
        text = self.txt_content.toPlainText().strip()
        name = self.txt_filename.text().strip() or "test.txt"
        if not text:
            QMessageBox.warning(self, "Ошибка", "Введите текст для создания файла.")
            return

        save_dir = os.path.dirname(os.path.abspath(__file__))
        filepath = os.path.join(save_dir, name)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(text)

        self._load_file(filepath)
        self._log(f"Файл создан: {filepath}")

    def _on_open_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Открыть файл")
        if path:
            self._load_file(path)

    def _load_file(self, filepath):
        self.current_filepath = filepath
        with open(filepath, "rb") as f:
            self.current_file_data = f.read()

        name = os.path.basename(filepath)
        size = len(self.current_file_data)
        self.file_label.setText(f"{name} ({filepath})")
        self.info_label.setText(f"Имя: {name}   |   Размер: {size} байт")

        # Предпросмотр текстовых файлов
        try:
            preview = self.current_file_data[:500].decode("utf-8")
            self.preview_text.setPlainText(preview)
        except UnicodeDecodeError:
            self.preview_text.setPlainText("[Бинарный файл — предпросмотр недоступен]")

        self.current_hash_full = None
        self.current_hash_compressed = None
        self.encrypted_data = None
        self.hash_label.setText("")
        self.encrypt_label.setText("")
        self.btn_hash.setEnabled(True)
        self.btn_encrypt.setEnabled(True)
        self.btn_add_block.setEnabled(False)
        self._log(f"Файл загружен: {name} ({size} байт)")

    # ---- Хэширование ----
    def _on_hash(self):
        if not self.current_file_data:
            return
        self.current_hash_full, self.current_hash_compressed = hash_file(self.current_filepath)
        self.hash_label.setText(
            f"SHA-256: {self.current_hash_full}\n"
            f"SHA-256 + сжатие: {self.current_hash_compressed}"
        )
        self.btn_add_block.setEnabled(True)
        self._log(f"Хэш вычислен: {self.current_hash_full[:32]}...")

    # ---- Шифрование ----
    def _on_encrypt(self):
        if not self.current_file_data:
            return
        master_key = self.master_key_input.text().strip()
        if not master_key:
            QMessageBox.warning(self, "Ошибка", "Введите мастер-ключ.")
            return

        if not self.current_hash_full:
            self._on_hash()

        self.session_key = FileEncryptor.generate_session_key()
        self.encrypted_data = FileEncryptor.encrypt_data(self.current_file_data, self.session_key)
        self.encrypted_session_key = FileEncryptor.encrypt_session_key(self.session_key, master_key)

        # Сохранить зашифрованный файл
        base = os.path.basename(self.current_filepath)
        name_part, ext = os.path.splitext(base)
        enc_name = name_part + "_encrypted" + ext
        enc_path = os.path.join(os.path.dirname(self.current_filepath), enc_name)
        with open(enc_path, "wb") as f:
            f.write(self.encrypted_data)

        self.encrypt_label.setText(
            f"Файл зашифрован AES-256.\n"
            f"Зашифрованный файл: {enc_path}\n"
            f"Ключ сессии (зашифрован мастер-ключом): {self.encrypted_session_key[:60]}..."
        )
        self.btn_add_block.setEnabled(True)
        self._log(f"Файл зашифрован: {enc_name}")

    # ---- Добавление в блокчейн ----
    def _on_add_block(self):
        if not self.current_filepath or not self.current_hash_full:
            return

        block_data = {
            "filename": os.path.basename(self.current_filepath),
            "file_hash": self.current_hash_full,
            "file_hash_compressed": self.current_hash_compressed,
            "file_size": len(self.current_file_data),
            "timestamp": datetime.utcnow().isoformat(),
        }

        if self.encrypted_data and self.encrypted_session_key:
            base = os.path.basename(self.current_filepath)
            name_part, ext = os.path.splitext(base)
            block_data["encryption_key"] = self.encrypted_session_key
            block_data["encrypted_filename"] = name_part + "_encrypted" + ext
            block_data["encryption_time"] = datetime.utcnow().isoformat()
            block_data["encryption_algorithm"] = "AES-256"

        new_block = self.blockchain.add_block(block_data)
        self._save_chain()
        self._refresh_chain_table()
        self._log(f"Блок #{new_block.index} добавлен: {block_data['filename']}")

        # Сброс
        self.current_filepath = None
        self.current_file_data = None
        self.current_hash_full = None
        self.current_hash_compressed = None
        self.encrypted_data = None
        self.session_key = None
        self.encrypted_session_key = None
        self.file_label.setText("Файл не выбран")
        self.info_label.setText("—")
        self.preview_text.clear()
        self.hash_label.setText("")
        self.encrypt_label.setText("")
        self.btn_hash.setEnabled(False)
        self.btn_encrypt.setEnabled(False)
        self.btn_add_block.setEnabled(False)

    # ---- Расшифровка ----
    def _on_open_encrypted(self):
        path, _ = QFileDialog.getOpenFileName(self, "Выбрать зашифрованный файл")
        if path:
            self.dec_filepath = path
            self.dec_file_label.setText(os.path.basename(path))
            self.btn_decrypt.setEnabled(True)
            self._log(f"Файл для расшифровки выбран: {os.path.basename(path)}")

    def _on_decrypt(self):
        if not hasattr(self, "dec_filepath") or not self.dec_filepath:
            return
        master_key = self.dec_master_key.text().strip()
        if not master_key:
            QMessageBox.warning(self, "Ошибка", "Введите мастер-ключ.")
            return

        enc_name = os.path.basename(self.dec_filepath)
        block = self.blockchain.find_by_encrypted_filename(enc_name)
        if not block:
            self.dec_result.setPlainText(
                f"Блок с информацией о шифровании не найден для: {enc_name}"
            )
            self._log("Расшифровка невозможна: блок не найден.", error=True)
            return

        try:
            session_key = FileEncryptor.decrypt_session_key(block.data["encryption_key"], master_key)
        except Exception:
            self.dec_result.setPlainText("Неверный мастер-ключ. Расшифровка не удалась.")
            self._log("Неверный мастер-ключ.", error=True)
            return

        with open(self.dec_filepath, "rb") as f:
            encrypted = f.read()

        try:
            decrypted = FileEncryptor.decrypt_data(encrypted, session_key)
        except Exception:
            self.dec_result.setPlainText("Ошибка расшифровки. Повреждён файл или неверный ключ.")
            self._log("Ошибка расшифровки.", error=True)
            return

        # Проверяем хэш
        dec_hash = sha256_hash(decrypted)
        match = dec_hash == block.data.get("file_hash", "")

        # Сохраняем расшифрованный файл
        name_part, ext = os.path.splitext(enc_name)
        dec_name = name_part.replace("_encrypted", "_decrypted") + ext
        dec_path = os.path.join(os.path.dirname(self.dec_filepath), dec_name)
        with open(dec_path, "wb") as f:
            f.write(decrypted)

        try:
            preview = decrypted[:1000].decode("utf-8")
        except UnicodeDecodeError:
            preview = "[Бинарный файл]"

        status = "Файл успешно расшифрован! Хэш совпадает." if match else \
                 "Файл расшифрован, но хэш НЕ совпадает с оригиналом!"
        self.dec_result.setPlainText(
            f"{status}\n\nСохранён: {dec_path}\n\nПредпросмотр:\n{preview}"
        )
        self._log(f"Расшифровка: {dec_name}. Хэш {'совпадает' if match else 'НЕ совпадает'}.")

    # ---- Верификация ----
    def _on_open_verify(self):
        path, _ = QFileDialog.getOpenFileName(self, "Выбрать файл для проверки")
        if path:
            self.ver_filepath = path
            self.ver_file_label.setText(os.path.basename(path))
            self.btn_verify.setEnabled(True)

    def _on_verify(self):
        if not hasattr(self, "ver_filepath"):
            return
        full_h, comp_h = hash_file(self.ver_filepath)
        block = self.blockchain.find_by_file_hash(full_h)

        if not block:
            self.ver_result.setPlainText(
                f"Файл НЕ зарегистрирован в блокчейне.\n"
                f"Текущий хэш: {full_h}\n"
                f"Файл не добавлялся или был изменён."
            )
            self._log("Верификация: файл не найден в блокчейне.", error=True)
            return

        errors = self.blockchain.validate()
        if not errors:
            self.ver_result.setPlainText(
                f"Файл подлинный! Целостность подтверждена.\n"
                f"Блок #{block.index}\n"
                f"Хэш: {full_h}\n"
                f"Цепочка блокчейна целостна."
            )
            self._log(f"Верификация: файл подлинный (блок #{block.index}).")
        else:
            msgs = "\n".join(f"  - {msg}" for _, msg in errors)
            self.ver_result.setPlainText(
                f"Файл найден в блоке #{block.index}, но цепочка нарушена!\n"
                f"Нельзя доверять результату.\n\nОшибки:\n{msgs}"
            )
            self._log("Верификация: цепочка нарушена!", error=True)

    # ---- Блокчейн ----
    def _on_validate_chain(self):
        errors = self.blockchain.validate()
        if not errors:
            self.chain_status_label.setText("Цепочка блокчейна целостна. Все блоки прошли проверку.")
            self.chain_status_label.setStyleSheet("color: #22c55e; font-weight: bold;")
            self._log("Проверка цепочки: целостность подтверждена.")
        else:
            msgs = "\n".join(f"  - {msg}" for _, msg in errors)
            self.chain_status_label.setText(f"Цепочка нарушена!\n{msgs}")
            self.chain_status_label.setStyleSheet("color: #ef4444; font-weight: bold;")
            self._log("Проверка цепочки: НАРУШЕНИЕ!", error=True)
        self._refresh_chain_table()

    def _on_tamper(self):
        if len(self.blockchain.chain) <= 1:
            QMessageBox.information(self, "Информация", "Нет блоков данных (только генезис-блок).")
            return

        idx = len(self.blockchain.chain) - 1
        block = self.blockchain.chain[idx]
        if isinstance(block.data, dict) and "filename" in block.data:
            original = block.data["filename"]
            chars = list(original)
            chars[-1] = chr(ord(chars[-1]) + 1)
            block.data["filename"] = "".join(chars)
            self._log(f"Блок #{idx}: filename изменён с '{original}' на '{block.data['filename']}'", error=True)
        elif isinstance(block.data, str):
            original = block.data
            chars = list(original)
            chars[-1] = chr(ord(chars[-1]) + 1)
            block.data = "".join(chars)
            self._log(f"Блок #{idx}: данные изменены на один символ.", error=True)

        self._save_chain()
        self._refresh_chain_table()
        self._log("Данные принудительно изменены! Проверьте целостность.", error=True)

    def _on_export(self):
        path, _ = QFileDialog.getSaveFileName(self, "Экспорт JSON", "blockchain_export.json", "JSON (*.json)")
        if path:
            self.blockchain.save(path)
            self._log(f"Блокчейн экспортирован: {path}")

    def _on_reset(self):
        reply = QMessageBox.question(self, "Подтверждение", "Удалить всю цепочку?",
                                     QMessageBox.Yes | QMessageBox.No)
        if reply == QMessageBox.Yes:
            self.blockchain = Blockchain()
            self._save_chain()
            self._refresh_chain_table()
            self.chain_status_label.setText("")
            self._log("Блокчейн сброшен. Создан новый генезис-блок.")

    def _refresh_chain_table(self):
        errors = self.blockchain.validate()
        invalid_set = set(idx for idx, _ in errors)
        chain = self.blockchain.chain
        self.chain_table.setRowCount(len(chain))
        for i, block in enumerate(chain):
            self.chain_table.setItem(i, 0, QTableWidgetItem(str(block.index)))
            self.chain_table.setItem(i, 1, QTableWidgetItem(block.timestamp))

            if isinstance(block.data, dict):
                data_str = block.data.get("filename", "") + " | " + block.data.get("file_hash", "")[:24] + "..."
            else:
                data_str = str(block.data)
            self.chain_table.setItem(i, 2, QTableWidgetItem(data_str))
            self.chain_table.setItem(i, 3, QTableWidgetItem(block.hash[:20] + "..."))
            self.chain_table.setItem(i, 4, QTableWidgetItem(block.previous_hash[:20] + "..."))

            if i in invalid_set:
                for col in range(5):
                    item = self.chain_table.item(i, col)
                    if item:
                        item.setBackground(QColor(60, 20, 20))
                        item.setForeground(QColor("#ef4444"))

    # ---- Утилиты ----
    def _save_chain(self):
        try:
            self.blockchain.save(STORAGE_FILE)
        except Exception as e:
            self._log(f"Ошибка сохранения: {e}", error=True)

    def _log(self, msg, error=False):
        ts = datetime.now().strftime("%H:%M:%S")
        color = "#ef4444" if error else "#38bdf8"
        self.log_text.append(f'<span style="color:#8b8fa3">[{ts}]</span> '
                             f'<span style="color:{color}">{msg}</span>')


# ==================== Точка входа ====================

def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
