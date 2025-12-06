# ⚡️ CleanLab - Corpus Refinery

**CleanLab** is a specialized, local-first web application designed for refining, cleaning, and rewriting large text corpora for LLM training. Built with modern web technologies, it ensures privacy, speed, and reliability.

[English](#english) | [日本語](#japanese)

---

<a name="english"></a>
## 🇺🇸 English

### 🌟 Introduction
Preparing high-quality training data is the most critical step in building great LLMs. **CleanLab** automates this process by orchestrating AI models (Google Gemini or Local LLMs) to rewrite, format, and enhance your raw text data.

### ✨ Key Features
*   **🤖 AI-Powered Refinement**: Automatically rewrite messy text into high-quality, structured content using custom system prompts.
*   **🧹 Dataset Cleaner**: Built-in tool to strip "weird" symbols (control chars, zero-width spaces) and remove Markdown artifacts (`**`, `##`) from your data.
*   **✂️ Corpus Splitter**: Utility to split massive text files into manageable chunks for processing.
*   **🚀 Robust Queue System**: Multi-threaded job queue capable of handling thousands of files without browser lag.
*   **💾 Auto-Save & Resume**: All progress is saved to IndexedDB. Browser crashed? No problem. Resume exactly where you left off.
*   **📥 JSONL Export**: Downloads results in standard `.jsonl` format (`{"text": "..."}`), ready for immediate fine-tuning.
*   **🔌 Flexible Backend**:
    *   **Google Gemini**: fast and high-quality cloud processing.
    *   **Local LLMs**: Support for Ollama, LM Studio, and vLLM (OpenAI-compatible).

### 🚀 Getting Started

#### Prerequisites
*   Node.js (v18+)
*   npm or yarn

#### Installation
1.  **Clone the repository**
    ```bash
    git clone https://github.com/nRyan7/CleanLab.git
    cd CleanLab
    ```
2.  **Install dependencies**
    ```bash
    npm install
    ```

#### Usage
1.  **Start the app**
    ```bash
    npm run dev
    ```
2.  **Open in browser**: Go to `http://localhost:5173`
3.  **Configure**:
    *   Click the **Settings** icon.
    *   Choose **Gemini** (provide API Key) or **Local** (provide base URL).
4.  **Load Data**: Drop files or folders into the UI.
5.  **Run**: Click **Start Processing**.
6.  **Export**: Click **Download** to get your clean `.jsonl` dataset.

### ⚠️ License & Commercial Use
This project is strictly for **learning and research purposes only**.
If you wish to use it for **commercial purposes**, you must contact the author for authorization: **ranrinhk@gmail.com**

---

<a name="japanese"></a>
## 🇯🇵 日本語

### 🌟 はじめに
**CleanLab** は、LLMトレーニング用のテキストコーパスを洗練・整形・クリーニングするために設計された、ローカルファーストのWebアプリケーションです。プライバシーと効率を重視し、大量のデータをブラウザ上で快適に処理します。

### ✨ 主な機能
*   **🤖 AIによる自動精製**: カスタムプロンプトを使用し、乱雑なテキストを高品質な学習用データに書き換えます。
*   **🧹 データセットクリーナー**: 制御文字やゼロ幅スペースなどの「謎の記号」、Markdown記法（`**`, `##`）を自動除去するツールを搭載。
*   **✂️ コーパス分割ツール**: 巨大なテキストファイルを処理しやすいサイズに分割するユーティリティ。
*   **🚀 堅牢なジョブキュー**: 数千ファイルの処理もブラウザを重くすることなく、並列で効率的に実行します。
*   **💾 自動保存と再開**: 進捗はすべてIndexedDBに保存されます。ブラウザがクラッシュしても、途中から再開可能です。
*   **📥 JSONLエクスポート**: ファインチューニングにそのまま使える `.jsonl` 形式（`{"text": "..."}`）で結果を出力。
*   **🔌 柔軟なバックエンド**:
    *   **Google Gemini**: 高速かつ高品質なクラウド処理。
    *   **ローカル LLM**: Ollama, LM Studio, vLLM などのOpenAI互換APIをサポート。

### 🚀 始め方

#### 必須環境
*   Node.js (v18以上)
*   npm または yarn

#### インストール方法
1.  **リポジトリのクローン**
    ```bash
    git clone https://github.com/nRyan7/CleanLab.git
    cd CleanLab
    ```
2.  **依存関係のインストール**
    ```bash
    npm install
    ```

#### 使い方
1.  **アプリの起動**
    ```bash
    npm run dev
    ```
2.  **ブラウザで開く**: `http://localhost:5173` にアクセス。
3.  **設定 (Settings)**:
    *   **Gemini**: APIキーを入力。
    *   **Local**: ローカルサーバーのURLを設定 (例: `http://localhost:11434/v1`)。
4.  **データの読み込み**: ファイルまたはフォルダをドラッグ＆ドロップ。
5.  **実行**: **Start Processing** をクリック。
6.  **保存**: 完了後、**Download** をクリックして `.jsonl` を取得。

### ⚠️ ライセンスと商用利用について
本プロジェクトは**学習および研究目的**でのみ使用できます。
**商用利用**をご希望の場合は、必ず作者まで連絡し許諾を得てください: **ranrinhk@gmail.com**

---
&copy; 2025 CleanLab Project. Built for the Open Source AI Community.
