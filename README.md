# CleanLab - LLM Corpus Refinement System
# CleanLab - LLMコーパス精製システム

[English](#english) | [日本語](#japanese)

---

<a name="english"></a>
## 🇺🇸 English

### Introduction
**CleanLab** is a powerful web-based application designed to streamline the process of cleaning, rewriting, and refining text corpora for Large Language Model (LLM) training. It leverages advanced LLMs (like Google Gemini and local models via generic APIs) to process text data autonomously based on custom system prompts.

### Key Features
*   **LLM-Powered Rewriting**: Automatically rewrite, summarize, or format text files using state-of-the-art AI models.
*   **Robust Job Queue**: Efficiently manages massive datasets with a concurrent job processing system.
*   **Persistent Storage**: Uses IndexedDB to safely store progress and results locally. Even if the browser crashes, your data is safe.
*   **Live Monitoring**: Real-time status updates, processing speed estimation, and detailed logs.
*   **Flexible Inputs**: Supports single file and batch folder uploads.
*   **Downloadable Results**: Export processed data as a ZIP archive with a single click.
*   **Customizable Settings**: Configure API endpoints, models, system prompts, and concurrency levels.

### Getting Started

#### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn

#### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/nRyan7/CleanLab.git
    cd CleanLab
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

#### Configuration
You can configure the AI provider in the **Settings** menu within the app.
*   **Gemini API**: Requires a valid API Key.
*   **Local/Generic API**: Compatible with OpenAI-style endpoints (e.g., LM Studio, Ollama, vLLM).

#### Usage
1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to `http://localhost:5173`.
3.  **Configure**: Open "Settings" to set your API Key and System Prompt.
4.  **Upload**: Click "Upload Files" or "Upload Folder" to add your raw text data.
5.  **Process**: Click the "Run" button to start the queue.
6.  **Download**: Once finished, click the "Download" button to get your refined dataset.

---

<a name="japanese"></a>
## 🇯🇵 日本語

### はじめに
**CleanLab** は、大規模言語モデル（LLM）のトレーニング用に使用するテキストコーパスを効率的にクリーニング、書き換え、精製するために設計された強力なWebアプリケーションです。Google Gemini やローカルモデル（汎用API経由）などの高度なLLMを活用し、カスタムプロンプトに基づいてテキストデータを自律的に処理します。

### 主な機能
*   **LLMによる自動書き換え**: 最先端のAIモデルを使用して、テキストファイルを自動的に書き換え、要約、またはフォーマットします。
*   **堅牢なジョブキュー**: 並行処理システムにより、大量のデータセットを効率的に管理します。
*   **永続的ストレージ**: IndexedDBを使用して、進捗状況と結果をローカルに安全に保存します。ブラウザがクラッシュしても、データは安全です。
*   **ライブモニタリング**: リアルタイムのステータス更新、処理速度の推定、および詳細なログを提供します。
*   **柔軟な入力**: 単一ファイルおよびフォルダの一括アップロードをサポートします。
*   **結果のダウンロード**: 処理されたデータをワンクリックでZIPアーカイブとしてエクスポートできます。
*   **カスタマイズ可能な設定**: APIエンドポイント、モデル、システムプロンプト、同時実行数を自由に設定できます。

### 始め方

#### 必須条件
*   Node.js (v18 以上)
*   npm または yarn

#### インストール
1.  リポジトリをクローンします:
    ```bash
    git clone https://github.com/nRyan7/CleanLab.git
    cd CleanLab
    ```
2.  依存関係をインストールします:
    ```bash
    npm install
    ```

#### 設定
アプリ内の **Settings (設定)** メニューでAIプロバイダーを設定できます。
*   **Gemini API**: 有効なAPIキーが必要です。
*   **Local/Generic API**: OpenAI互換のエンドポイント（例：LM Studio, Ollama, vLLM）に対応しています。

#### 使い方
1.  開発サーバーを起動します:
    ```bash
    npm run dev
    ```
2.  ブラウザで `http://localhost:5173` を開きます。
3.  **設定**: "Settings" を開き、APIキーとシステムプロンプトを設定します。
4.  **アップロード**: "Upload Files" または "Upload Folder" をクリックして、生データを追加します。
5.  **実行**: "Run" ボタンをクリックして、処理キューを開始します。
6.  **ダウンロード**: 完了後、"Download" ボタンをクリックして、精製されたデータセットを取得します。
