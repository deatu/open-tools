(() => {
  var __defProp = Object.defineProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // src/core/debug.js
  var Debug = {
    _enabled: false,
    _refreshUI: null,
    /* UI更新用コールバック（app初期化後に設定） */
    /* デバッグモードが有効かどうか */
    get enabled() {
      return this._enabled;
    },
    /* デバッグモードの設定 */
    setEnabled(value) {
      this._enabled = value;
      console.log(`[ZA] Debug mode: >> ${value ? "ON" : "OFF"}`);
      if (this._refreshUI) {
        this._refreshUI();
      }
    },
    /* カテゴリが有効かどうか */
    isEnabled(category) {
      if (!this.enabled) return false;
      const categories = window.ZA_DEBUG_CATEGORIES || {};
      return categories[category] !== false;
    },
    /* ログ出力 */
    log(category, ...args) {
      if (this.isEnabled(category)) {
        console.log(`[ZA:${category}]`, ...args);
      }
    },
    /* 警告出力 */
    warn(category, ...args) {
      if (this.isEnabled(category)) {
        console.warn(`[ZA:${category}]`, ...args);
      }
    },
    /* エラー出力（常に出力） */
    error(category, ...args) {
      console.error(`[ZA:${category}]`, ...args);
    }
  };
  function registerDebugMode() {
    window.zaDebugMode = (enable = null) => {
      const newState = enable === null ? !Debug.enabled : Boolean(enable);
      Debug.setEnabled(newState);
      return newState;
    };
  }
  function initDebugMode(debugMode) {
    if (debugMode) {
      Debug.setEnabled(true);
    }
  }

  // src/core/utils.js
  var isMobile = {
    size: window.innerWidth <= 768,
    agent: /iPhone|iPad|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  };
  var barStyle = {
    height: "80px",
    width: "700px",
    margin: "20px"
  };
  var flexAlign = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
  var groupWrapperClass = "groupContainer";
  var chkCls = "cellCheckbox";
  function genSquareStyle(len) {
    return {
      height: `${len}px`,
      width: `${len}px`
    };
  }
  function generateJpTimestamp() {
    return new Date(Date.now() + 9 * 60 * 60 * 1e3).toISOString().replace(/[:\-]|(\.\d{3})|[Z]/g, "").replace(/T/g, "_");
  }
  function formatFileSize(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (1024 <= size && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
  function sanitizeFileName(filename, maxLength = 200) {
    return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").substring(0, maxLength);
  }
  function sanitizePageName(title = document.title, maxLength = 100) {
    return title.replace(/[ <>:"\/\\|?*\x00-\x1F]/g, "_").replace(/^\. +/, "").replace(/^-/, "").replace(/[/\0]/, "").replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i, "_$1").substring(0, maxLength);
  }
  function getFileType(filename, mimeType = null) {
    if (mimeType?.startsWith("video/") || /\.(mp4)$/i.test(filename)) {
      return "video";
    }
    if (mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
      return "image";
    }
    return "other";
  }
  function extractLinksFromMemo(memo) {
    return [
      ...memo.flatMap((m) => m.img),
      ...memo.flatMap((m) => m.vids)
    ];
  }
  function generateSummaryText(options) {
    const {
      timestamp,
      files = [],
      failedDownloads = [],
      memo = null,
      viaExtension = false,
      downloadPart = null,
      totalParts = null,
      formatFileSize: formatFn = (bytes) => `${bytes} bytes`
    } = options;
    const SEPARATOR = `-`.repeat(50);
    const hasSize = files.some((f) => f?.size != null);
    const totalSize = hasSize ? files.reduce((acc, f) => acc + (f?.size || 0), 0) : null;
    const SUCCESSES = hasSize ? [
      `Successfully Downloaded Files (${files.length}, 合計: ${formatFn(totalSize)}):`,
      ...files.map((f) => f ? `- ${f.filename || f.path} (${formatFn(f.size)})` : "").filter(Boolean)
    ] : [
      `Download Target Files (${files.length}):`,
      ...files.map((f) => `- ${f.path || f.filename || f.url}`).filter(Boolean)
    ];
    const FAILS = failedDownloads.length ? [
      `Failed Downloads (${failedDownloads.length}):`,
      ...failedDownloads.map((f) => `- ${f.link || f.url || f.path}: ${f.error}`),
      ``
    ] : [];
    const partInfo = downloadPart ? `
ダウンロードパート: ${downloadPart}/${totalParts || "?"}` : "";
    const memoArray = Array.isArray(memo) ? memo : [];
    const TEXTS = memoArray.length > 0 ? [
      `Text Contents (${memoArray.filter((m) => m?.text).length}/${memoArray.length} items):`,
      ...memoArray.map((m, idx) => {
        if (!m?.text) return `[${idx}] < baseTextIsEmpty >`;
        const preview = m.text.length > 200 ? m.text.substring(0, 200) + "..." : m.text;
        return `[${idx}] ${preview.replace(/\n/g, " ")}`;
      })
    ] : [];
    const metadata = [
      `Download Summary${viaExtension ? " (via ZA Extension)" : ""}`,
      SEPARATOR,
      ``,
      `Current Page URL: ${window.location.href}`,
      `Download Date: ${timestamp}`,
      ...totalSize != null ? [`Total Size: ${formatFn(totalSize)}${partInfo}`] : [],
      ``,
      ...SUCCESSES,
      ``,
      ...FAILS,
      SEPARATOR,
      ``,
      ...TEXTS.length > 0 ? [...TEXTS, ``, SEPARATOR, ``] : [],
      `Original memo:`,
      JSON.stringify(memoArray.map((m) => {
        const copy = { ...m };
        delete copy.textVisible;
        return copy;
      }), null, 2)
    ].join("\n");
    return metadata;
  }

  // src/core/extractionConfig.js
  var ExtractionConfig = {
    /* 動画リンク */
    vids: {
      selector: 'a[href*=".mp4"]',
      method: "links",
      /* URL変換関数 - .mp4以降のクエリパラメータ等を除去 */
      transform: (value) => value?.replace(/^(.+\.mp4).*$/i, "$1") ?? null
    },
    /* テキスト本文 */
    text: {
      selector: 'font[size="5"] b',
      method: "text"
    },
    /* オリジナルリンクテキスト */
    orig: {
      selector: ".fs span",
      method: "text"
    },
    /* 参照リンク */
    refs: {
      selector: ".fs a",
      method: "attr",
      attr: "href",
      /* URL変換関数 */
      transform: (value, url) => value?.replace(/.*r3\.php/, new URL(url).origin + "/r3.php") ?? null
    }
  };

  // src/services/extension.js
  var extensionAvailable = null;
  function postMessageAndWait(message, responseType, timeoutMs = 200) {
    return new Promise((resolve) => {
      Debug.log("extension", `Sending ${message.type}, waiting for ${responseType}...`);
      const timeout = setTimeout(() => {
        Debug.log("extension", `Timeout waiting for ${responseType}`);
        window.removeEventListener("message", handler);
        resolve(null);
      }, timeoutMs);
      const handler = (e) => {
        Debug.log("extension", "Received message:", e.data?.type);
        if (e.data?.type === responseType) {
          Debug.log("extension", `Got ${responseType}!`, e.data);
          clearTimeout(timeout);
          window.removeEventListener("message", handler);
          resolve(e.data);
        }
      };
      window.addEventListener("message", handler);
      window.postMessage(message, "*");
    });
  }
  async function checkExtensionAvailable(appSettings) {
    console.log(appSettings);
    if (!appSettings.useExtension) {
      Debug.log("extension", "Extension disabled by settings");
      return false;
    }
    if (extensionAvailable !== null) {
      Debug.log("extension", "Extension check (cached):", extensionAvailable);
      return extensionAvailable;
    }
    const response = await postMessageAndWait({ type: "ZA_PING" }, "ZA_PONG", 300);
    extensionAvailable = response !== null;
    Debug.log("extension", "Extension check:", extensionAvailable, response);
    return extensionAvailable;
  }
  async function checkUrlsViaExtension(urls) {
    const response = await postMessageAndWait(
      { type: "ZA_CHECK_REQUEST", urls },
      "ZA_CHECK_RESPONSE",
      3e4
      /* 30秒タイムアウト */
    );
    if (response?.success) {
      return response.results;
    }
    Debug.error("check", "Check URLs failed:", response?.error);
    return null;
  }
  function dispatchToExtension(payload, timestamp) {
    const eventData = { ...payload, timestamp };
    window.dispatchEvent(new CustomEvent("ZA_DOWNLOAD_REQUEST", {
      detail: eventData
    }));
    window.postMessage({
      type: "ZA_DOWNLOAD_REQUEST",
      ...eventData
    }, "*");
  }
  function createAppSettings() {
    return {
      sizeThreshold: 1024 * 1024 * 1024,
      setSizeThreshold: function(sizeInMB) {
        this.sizeThreshold = sizeInMB * 1024 * 1024;
      },
      getSizeThreshold: function() {
        return this.sizeThreshold / (1024 * 1024);
      },
      /* 拡張機能使用設定 */
      useExtension: true,
      extensionInstalled: null,
      async initExtensionStatus() {
        const response = await postMessageAndWait({ type: "ZA_PING" }, "ZA_PONG", 300);
        this.extensionInstalled = response !== null;
        this.useExtension = this.extensionInstalled;
        Debug.log("extension", "Extension installed:", this.extensionInstalled);
        return this.extensionInstalled;
      },
      setUseExtension: function(value) {
        if (value && !this.extensionInstalled) {
          Debug.log("extension", "Cannot enable extension: not installed");
          return false;
        }
        this.useExtension = value;
        Debug.log("extension", "Extension usage set to:", value);
        return true;
      },
      toggleExtension: function() {
        if (!this.useExtension && !this.extensionInstalled) {
          Debug.log("extension", "Cannot enable extension: not installed");
          return this.useExtension;
        }
        this.useExtension = !this.useExtension;
        Debug.log("extension", "Extension usage toggled to:", this.useExtension);
        return this.useExtension;
      },
      getExtensionLabel: function() {
        if (!this.extensionInstalled) {
          return "ext: N/A";
        }
        return `ext: ${this.useExtension ? "ON" : "OFF"}`;
      },
      getExtensionStyle: function() {
        if (!this.extensionInstalled) {
          return { backgroundColor: "#888", cursor: "not-allowed" };
        }
        return { backgroundColor: this.useExtension ? "#4CAF50" : "#f44336" };
      }
    };
  }

  // src/services/fetcher.js
  var FetchStatus = Object.freeze({
    PENDING: "pending",
    SUCCESS: "success",
    FAILED: "failed"
  });
  function createHtmlFetcher($) {
    return {
      /**
       * URLからHTMLを取得してjQueryオブジェクトとしてパース
       * @param {string} url - 取得するURL
       * @returns {Promise<{$doc: jQuery, html: string}>} パース済みjQueryオブジェクトと生HTML
       */
      async fetchAndParse(url) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        return { $doc: $(doc), html };
      },
      /**
       * jQueryオブジェクトからリンクを抽出（重複排除）
       * @param {jQuery} $doc - パース済みjQueryオブジェクト
       * @param {string} selector - CSSセレクタ
       * @returns {string[]} リンクURL配列
       */
      extractLinks($doc, selector) {
        return [...new Set($doc.find(selector).map((_, el) => el.href).get())];
      },
      /**
       * jQueryオブジェクトからテキストを抽出
       * @param {jQuery} $doc - パース済みjQueryオブジェクト
       * @param {string} selector - CSSセレクタ
       * @returns {string} 抽出したテキスト
       */
      extractText($doc, selector) {
        return $doc.find(selector).first().text()?.trim() || "";
      },
      /**
       * jQueryオブジェクトから属性値を抽出
       * @param {jQuery} $doc - パース済みjQueryオブジェクト
       * @param {string} selector - CSSセレクタ
       * @param {string} attr - 属性名
       * @returns {string|null} 属性値
       */
      extractAttr($doc, selector, attr) {
        return $doc.find(selector).first().attr(attr) ?? null;
      }
    };
  }

  // src/services/chunkManager.js
  var ChunkManager = class {
    constructor(config = {}) {
      this.config = {
        chunkSize: config.chunkSize || 3,
        maxRetries: config.maxRetries || 3,
        retryDelay: config.retryDelay || 6e3,
        timeout: config.timeout || 6e4,
        sizeThreshold: config.sizeThreshold || 750 * 1024 * 1024
      };
      this.downloadedSize = 0;
      this.totalEstimatedSize = 0;
      this.averageFileSize = 0;
      this.thresholdReached = false;
    }
    async processChunks(links, onProgress, startIndex = 0) {
      const downloaded = [];
      const failed = [];
      const retryQueue = [];
      this.remainingLinks = [];
      const remainingLinks = links.length - startIndex;
      this.totalEstimatedSize = remainingLinks * 5 * 1024 * 1024;
      this.downloadedSize = 0;
      this.thresholdReached = false;
      for (let i = startIndex; i < links.length; i += this.config.chunkSize) {
        if (this.config.sizeThreshold < this.downloadedSize && 0 < downloaded.length) {
          console.log(`Size threshold reached: ${formatFileSize(this.downloadedSize)} > ${formatFileSize(this.config.sizeThreshold)}`);
          this.remainingLinks = links.slice(i);
          this.thresholdReached = true;
          onProgress(downloaded.length, downloaded.length, this.downloadedSize, this.downloadedSize, "容量閾値に達しました。ZIPファイルを作成します。");
          break;
        }
        const chunk = links.slice(i, Math.min(i + this.config.chunkSize, links.length));
        const results = await Promise.all(chunk.map((link) => this._processChunkItem(link)));
        results.forEach((result, index) => {
          if (result.success) {
            downloaded.push(result.data);
            this.downloadedSize += result.data.size;
            if (0 < downloaded.length) {
              this.averageFileSize = this.downloadedSize / downloaded.length;
              this.totalEstimatedSize = this.downloadedSize + (links.length - i - index - 1) * this.averageFileSize;
            }
          } else {
            failed.push({
              link: chunk[index],
              error: result.error,
              status: result.status,
              isHttpError: result.isHttpError,
              isCorsError: result.isCorsError
            });
            retryQueue.push(chunk[index]);
          }
          onProgress(downloaded.length, links.length - startIndex, this.downloadedSize, this.totalEstimatedSize);
        });
      }
      if (0 < retryQueue.length && !this.thresholdReached) {
        onProgress(downloaded.length, links.length - startIndex, this.downloadedSize, this.totalEstimatedSize, "失敗したファイルをリトライ中...");
        for (let retry = 0; retry < this.config.maxRetries; retry++) {
          if (retryQueue.length === 0) break;
          if (0 < retry) {
            const delay = this.config.retryDelay * Math.pow(2, retry - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
          const currentRetryBatch = [...retryQueue];
          retryQueue.length = 0;
          for (let i = 0; i < currentRetryBatch.length; i += this.config.chunkSize) {
            if (this.config.sizeThreshold < this.downloadedSize && 0 < downloaded.length) {
              this.remainingLinks = [...currentRetryBatch.slice(i), ...this.remainingLinks];
              this.thresholdReached = true;
              break;
            }
            const chunk = currentRetryBatch.slice(i, Math.min(i + this.config.chunkSize, currentRetryBatch.length));
            const results = await Promise.all(chunk.map((link) => this._processChunkItem(link)));
            results.forEach((result, index) => {
              if (result.success) {
                downloaded.push(result.data);
                this.downloadedSize += result.data.size;
                this.averageFileSize = this.downloadedSize / downloaded.length;
                this.totalEstimatedSize = this.downloadedSize + (currentRetryBatch.length - i - index - 1 + this.remainingLinks.length) * this.averageFileSize;
                const failedIndex = failed.findIndex((f) => f.link === chunk[index]);
                if (failedIndex !== -1) {
                  failed.splice(failedIndex, 1);
                }
              } else {
                retryQueue.push(chunk[index]);
              }
              onProgress(downloaded.length, links.length - startIndex, this.downloadedSize, this.totalEstimatedSize);
            });
            if (this.thresholdReached) break;
          }
          if (this.thresholdReached) break;
        }
      }
      return {
        downloaded,
        failed,
        remainingLinks: this.remainingLinks,
        thresholdReached: this.thresholdReached
      };
    }
    async _processChunkItem(link) {
      try {
        const result = await this._fetchWithTimeout(link);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error(`Error downloading ${link}:`, error);
        return {
          success: false,
          error: error.message,
          status: error.status || null,
          isHttpError: error.isHttpError || false,
          isCorsError: error.name === "TypeError" && error.message.includes("Failed to fetch")
        };
      }
    }
    async _fetchWithTimeout(link) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeout);
      try {
        const response = await fetch(link, {
          signal: controller.signal,
          mode: "cors",
          credentials: "same-origin",
          referrerPolicy: "no-referrer"
        });
        if (!response.ok) {
          const error = new Error(`HTTP error! status: ${response.status}`);
          error.status = response.status;
          error.isHttpError = true;
          throw error;
        }
        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error("Downloaded file is empty");
        }
        return {
          blob,
          filename: sanitizeFileName(link.split("/").pop()),
          size: blob.size,
          type: blob.type,
          url: link
        };
      } finally {
        clearTimeout(timeout);
      }
    }
  };

  // src/services/downloadManager.js
  function createDownloadManagerClass(DownloadUIClass) {
    return class DownloadManager {
      constructor(config = {}) {
        this.config = {
          maxTotalSize: config.maxTotalSize || 27e8,
          maxFilesPerArchive: config.maxFilesPerArchive || 500,
          maxRetries: config.maxRetries || 3,
          sizeThreshold: config.sizeThreshold || 750 * 1024 * 1024,
          ...config
        };
        this.downloadUi = new DownloadUIClass();
        this.chunkManager = new ChunkManager(config);
        this.retryQueue = [];
        this.erroredFiles = [];
        this.currentDownloadPart = 1;
        this.totalDownloadParts = 1;
        this.originalMemo = null;
      }
      async downloadSelected(memo, startIndex = 0, isResume = false) {
        this.timestamp = generateJpTimestamp();
        this.folderName = this._generateFolderName();
        try {
          if (!isResume) {
            this.originalMemo = memo;
            this.currentDownloadPart = 1;
          }
          const links = extractLinksFromMemo(memo);
          if (links.length === 0) {
            throw new Error("No files selected for download");
          }
          const remainingLinks = links.length - startIndex;
          const averageFileSize = this.chunkManager.averageFileSize || 5 * 1024 * 1024;
          const estimatedRemainingSize = remainingLinks * averageFileSize;
          const estimatedRemainingParts = Math.ceil(estimatedRemainingSize / this.config.sizeThreshold);
          this.totalDownloadParts = this.currentDownloadPart + estimatedRemainingParts - 1;
          this.downloadUi.initialize();
          this.downloadUi.updateStatus(`パート${this.currentDownloadPart}/${this.totalDownloadParts}をダウンロード中...`);
          const {
            downloaded,
            failed,
            remainingLinks: remaining,
            thresholdReached
          } = await this.chunkManager.processChunks(links, (current, total, downloadedSize, totalEstimatedSize, status) => this.downloadUi.updateProgress(current, total, downloadedSize, totalEstimatedSize, status, this.currentDownloadPart, this.totalDownloadParts), startIndex);
          this.retryQueue = failed;
          this.erroredFiles = [];
          if (downloaded.length === 0) {
            throw new Error("No files were downloaded successfully");
          }
          if (thresholdReached) {
            this.downloadUi.updateStatus(`パート${this.currentDownloadPart}/${this.totalDownloadParts}: 容量閾値(${formatFileSize(this.config.sizeThreshold)})に到達しました`);
          }
          const fileChunks = this._splitFilesIntoChunks(downloaded);
          this.downloadUi.updateStatus(`パート${this.currentDownloadPart}: ${fileChunks.length}個のアーカイブを作成中...`);
          for (let i = 0; i < fileChunks.length; i++) {
            const chunk = fileChunks[i];
            this.downloadUi.updateProgress(i + 1, fileChunks.length, 0, 0, "", this.currentDownloadPart, this.totalDownloadParts);
            try {
              const zipBlob = await this._createZipArchive(chunk, i === fileChunks.length - 1 ? [...failed, ...this.erroredFiles] : [], {
                ...memo,
                partIndex: i + 1,
                totalParts: fileChunks.length,
                downloadPart: this.currentDownloadPart,
                estimatedTotalParts: this.totalDownloadParts
              });
              await this._triggerDownload(zipBlob, i + 1, fileChunks.length);
            } catch (error) {
              console.error(`アーカイブ ${i + 1} の作成に失敗:`, error);
              continue;
            }
          }
          const totalErrored = this.erroredFiles.length;
          const manualDownloadLinks = failed.filter(
            (f) => f.status === 403 || f.status === 401 || f.isCorsError
          );
          const retryableErrors = failed.filter(
            (f) => !(f.status === 403 || f.status === 401 || f.isCorsError)
          );
          this.retryQueue = retryableErrors;
          if (0 < remaining.length && thresholdReached) {
            this.currentDownloadPart++;
            this.downloadUi.showContinueOption(remaining.length, this.currentDownloadPart, this.totalDownloadParts, () => {
              this.downloadSelected(this.originalMemo, links.length - remaining.length, true);
            });
          } else {
            this.downloadUi.showComplete(downloaded.length - totalErrored, failed.length + totalErrored, this.currentDownloadPart, this.totalDownloadParts);
          }
          if (0 < manualDownloadLinks.length) {
            this.downloadUi.showManualDownloadLinks(manualDownloadLinks);
          }
          if (0 < retryableErrors.length || 0 < totalErrored) {
            this.downloadUi.showRetryOption(retryableErrors.length + totalErrored);
          }
        } catch (error) {
          console.error("ダウンロード失敗:", error);
          this.downloadUi.showError(error.message);
        }
      }
      async retryFailedDownloads() {
        if (this.retryQueue.length === 0) {
          return;
        }
        try {
          this.downloadUi.initialize();
          this.downloadUi.updateStatus("失敗したファイルを再ダウンロード中...");
          const retryLinks = this.retryQueue.map((f) => f.link);
          const {
            downloaded,
            failed
          } = await this.chunkManager.processChunks(retryLinks, (current, total, downloadedSize, totalEstimatedSize, status) => this.downloadUi.updateProgress(current, total, downloadedSize, totalEstimatedSize, status));
          if (0 < downloaded.length) {
            const zipBlob = await this._createZipArchive(downloaded, failed, {
              type: "retry",
              originalFiles: this.retryQueue
            });
            await this._triggerDownload(zipBlob);
            this.downloadUi.showComplete(downloaded.length, failed.length);
          }
          this.retryQueue = failed;
          if (0 < failed.length) {
            this.downloadUi.showRetryOption(failed.length);
          }
        } catch (error) {
          console.error("再ダウンロード失敗:", error);
          this.downloadUi.showError(error.message);
        }
      }
      _splitFilesIntoChunks(files) {
        const chunks = [];
        let currentChunk = [];
        let currentSize = 0;
        for (const file of files) {
          if (!file?.blob) continue;
          if (this.config.maxTotalSize < currentSize + file.blob.size || currentChunk.length >= this.config.maxFilesPerArchive) {
            if (0 < currentChunk.length) {
              chunks.push(currentChunk);
            }
            currentChunk = [];
            currentSize = 0;
          }
          if (this.config.maxTotalSize < file.blob.size) {
            console.warn(`File ${file.filename} exceeds size limit and will be skipped`);
            continue;
          }
          currentChunk.push(file);
          currentSize += file.blob.size;
        }
        if (0 < currentChunk.length) {
          chunks.push(currentChunk);
        }
        return chunks;
      }
      async _createZipArchive(files, failedDownloads, memo) {
        let zip = null;
        let successfullyAddedFiles = [];
        let erroredFiles = [];
        let totalSize = 0;
        let currentSize = 0;
        for (const file of files) {
          if (file?.blob) {
            totalSize += file.blob.size;
          }
        }
        try {
          zip = new JSZip();
          const pageName = sanitizePageName();
          const rootFolder = zip.folder(pageName);
          const subFolder = rootFolder.folder(this.folderName);
          const folders = {
            video: subFolder.folder("vids"),
            image: subFolder.folder("imgs"),
            other: subFolder
          };
          for (const file of files) {
            if (file?.blob) {
              try {
                const fileType = getFileType(file.filename, file.type);
                const targetFolder = folders[fileType];
                await this._addFileToZip(targetFolder, file);
                successfullyAddedFiles.push(file);
                currentSize += file.blob.size;
                this.downloadUi.updateZipProgress(
                  currentSize,
                  totalSize,
                  successfullyAddedFiles.length,
                  files.length
                );
              } catch (error) {
                console.error(`ファイル ${file.filename} の追加に失敗:`, error);
                erroredFiles.push({
                  ...file,
                  error: `ZIP追加エラー: ${error.message || "不明なエラー"}`
                });
                continue;
              }
            }
          }
          this.erroredFiles.push(...erroredFiles);
          if (successfullyAddedFiles.length === 0) {
            throw new Error("No files were successfully added to the archive");
          }
          this.downloadUi.updateStatus("メタデータを追加中...");
          await this._addMetadata(subFolder, successfullyAddedFiles, [...failedDownloads, ...erroredFiles], memo);
          this.downloadUi.updateStatus("ZIPを完成中...");
          return await zip.generateAsync(
            {
              type: "blob",
              compression: "DEFLATE",
              compressionOptions: {
                level: 6
              }
            },
            (metadata) => {
              const percent = metadata.percent.toFixed(2);
              this.downloadUi.updateStatus(`ZIP圧縮中: ${percent}%`);
            }
          );
        } catch (error) {
          throw error;
        }
      }
      async _addFileToZip(zipFolder, file, retryCount = 0) {
        try {
          zipFolder.file(file.filename, file.blob, {
            binary: true,
            compression: "DEFLATE"
          });
        } catch (error) {
          if (retryCount < this.config.maxRetries) {
            console.warn(
              `ファイル ${file.filename} の追加を再試行中... (${retryCount + 1}/${this.config.maxRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, 1e3 * (retryCount + 1)));
            return this._addFileToZip(zipFolder, file, retryCount + 1);
          }
          throw error;
        }
      }
      async _addMetadata(zipFolder, files, failedDownloads, memo) {
        const metadata = generateSummaryText({
          timestamp: this.timestamp,
          files,
          failedDownloads,
          memo,
          viaExtension: false,
          downloadPart: memo.downloadPart,
          totalParts: memo.estimatedTotalParts,
          formatFileSize
        });
        zipFolder.file(`__download_info_${this.timestamp}_part${memo.downloadPart || ""}.txt`, metadata);
      }
      _generateFolderName() {
        const pageName = sanitizePageName(document.title, 230);
        const partSuffix = 1 < this.currentDownloadPart ? `_part${this.currentDownloadPart}` : "";
        const result = `${pageName.slice(0, 230 - this.timestamp.length)}${partSuffix}_${this.timestamp}`;
        console.log(result);
        return result;
      }
      async _triggerDownload(blob, partIndex = 1, totalParts = 1) {
        if (!blob || blob.size === 0) {
          throw new Error("ダウンロードするファイルが空です");
        }
        const url = URL.createObjectURL(blob);
        const filename = totalParts > 1 ? `${this.folderName}_${partIndex}.zip` : `${this.folderName}.zip`;
        this.downloadUi.updateStatus(`ダウンロード準備完了: ${formatFileSize(blob.size)}`);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(url);
        }, 3e3);
      }
    };
  }

  // src/ui/domBuilder.js
  function createItemDOMBuilder($) {
    const baseLinkCss = {
      ...flexAlign,
      height: "40px",
      width: "500px",
      border: "solid 1px black",
      borderRadius: "10px"
    };
    return {
      baseLinkCss,
      /**
       * リンク要素を生成
       * @param {string} href - リンクURL
       * @param {string} text - 表示テキスト
       * @returns {jQuery} リンク要素
       */
      createLink(href, text) {
        return $("<a>").attr({
          href,
          referrerpolicy: "no-referrer",
          target: "_blank"
        }).text(text);
      },
      /**
       * スタイル付きリンク要素を生成
       * @param {string} lnk - リンクURL
       * @returns {jQuery} スタイル付きリンク要素
       */
      createStyledLink(lnk) {
        return this.createLink(lnk, lnk).css(baseLinkCss);
      },
      /**
       * 動画リンクコンテナを生成
       * @param {string[]} vids - 動画URL配列
       * @param {function} onDelete - 削除時コールバック (vid, index) => void
       * @returns {jQuery} 動画リンクコンテナ
       */
      createVideoLinksContainer(vids, onDelete) {
        const $container = $("<div>").css({
          ...flexAlign,
          flexDirection: "column",
          justifyContent: "space-around",
          height: "250px",
          marginLeft: "20px"
        });
        vids.forEach((vid, idx) => {
          const vidName = vid.split("/").pop().split(".")[0];
          const $vidLink = this.createLink(vid, vidName).css({
            ...baseLinkCss,
            width: "125px",
            fontSize: "10%"
          });
          const $deleteBtn = $("<button>").text("×").css({
            marginLeft: "2px",
            padding: "0 4px",
            fontSize: "10px",
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: "3px",
            backgroundColor: "#fff"
          }).on("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            $(e.target).parent().remove();
            if (onDelete) onDelete(vid, idx);
          });
          const $vidContainer = $("<span>").css({ display: "inline-flex", alignItems: "center" }).append($vidLink).append($deleteBtn);
          $container.append($vidContainer);
        });
        return $container;
      },
      /**
       * テキストをリンク化
       * @param {string} text - 元テキスト
       * @returns {string} リンク化されたHTML
       */
      linkifyText(text) {
        if (!text) return "< baseTextIsEmpty >";
        const escaped = $("<div>").text(text).html();
        const urlPattern = /(https?:\/\/[^\s<]+)/g;
        return escaped.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
      },
      /**
       * テキストコンテナを生成
       * @param {string} id - 要素ID
       * @param {string} text - テキスト内容
       * @returns {jQuery} テキストコンテナ
       */
      createTextContainer(id, text) {
        return $("<div>").attr("id", id).css({
          display: "none",
          width: "100%",
          padding: "10px",
          marginTop: "5px",
          backgroundColor: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: "5px",
          fontSize: "12px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }).html(this.linkifyText(text));
      }
    };
  }

  // src/ui/downloadUi.js
  function createDownloadUIClass($) {
    return class DownloadUI {
      constructor() {
        this.getMemoCallback = null;
      }
      /**
       * memoを取得するコールバックを設定
       * @param {Function} callback - () => memoObjectsArray
       */
      setMemoCallback(callback) {
        this.getMemoCallback = callback;
      }
      initialize() {
        $("#download-progress").remove();
        this.progressDiv = this._createProgressDiv();
        this.progressBar = this._createProgressBar();
        this.progressBarInner = this._createProgressBarInner();
        this.statusText = this._createStatusText();
        this.detailText = this._createDetailText();
        this.sizeText = this._createSizeText();
        this.partInfoText = this._createPartInfoText();
        this.actionButtons = this._createActionButtonsContainer();
        this.retryButton = this._createActionButton("再試行", "retry");
        this.continueButton = this._createActionButton("続きをダウンロード", "continue");
      }
      _createProgressDiv() {
        return $("<div>").attr("id", "download-progress").css({
          position: "fixed",
          top: "10px",
          right: "10px",
          padding: "15px",
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          color: "white",
          borderRadius: "8px",
          zIndex: 1e4,
          width: "300px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
        }).appendTo("body");
      }
      _createProgressBar() {
        return $("<div>").css({
          height: "10px",
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: "10px",
          marginTop: "10px",
          overflow: "hidden"
        }).appendTo(this.progressDiv);
      }
      _createProgressBarInner() {
        return $("<div>").css({
          height: "100%",
          width: "0%",
          backgroundColor: "#4CAF50",
          borderRadius: "10px",
          transition: "width 0.3s ease-in-out"
        }).appendTo(this.progressBar);
      }
      _createStatusText() {
        return $("<div>").css({
          marginBottom: "5px"
        }).appendTo(this.progressDiv);
      }
      _createDetailText() {
        return $("<div>").css({
          fontSize: "0.9em",
          opacity: "0.8"
        }).appendTo(this.progressDiv);
      }
      _createSizeText() {
        return $("<div>").css({
          fontSize: "0.9em",
          opacity: "0.8",
          marginTop: "5px"
        }).appendTo(this.progressDiv);
      }
      _createPartInfoText() {
        return $("<div>").css({
          fontSize: "0.9em",
          fontWeight: "bold",
          marginTop: "5px",
          borderTop: "1px solid rgba(255,255,255,0.2)",
          paddingTop: "5px"
        }).appendTo(this.progressDiv);
      }
      _createActionButtonsContainer() {
        return $("<div>").css({
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          marginTop: "10px"
        }).appendTo(this.progressDiv);
      }
      _createActionButton(text, cls) {
        return $("<button>").text(text).attr("class", cls + "-button").css({
          display: "none",
          padding: "8px",
          backgroundColor: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          width: "100%"
        }).hover(function() {
          $(this).css("backgroundColor", "#1976D2");
        }, function() {
          $(this).css("backgroundColor", "#2196F3");
        }).appendTo(this.actionButtons);
      }
      updateProgress(current, total, downloadedSize = 0, totalEstimatedSize = 0, status = "", currentPart = 1, totalParts = 1) {
        const percentage = Math.round(current / total * 100);
        this.statusText.text(`Downloading: ${percentage}%`);
        if (0 < downloadedSize) {
          const formattedDownloadedSize = formatFileSize(downloadedSize);
          const formattedTotalSize = formatFileSize(totalEstimatedSize);
          this.detailText.text(`${current}/${total} files ${status}`);
          this.sizeText.text(`${formattedDownloadedSize} / ${formattedTotalSize}${totalEstimatedSize !== downloadedSize ? " (推定)" : ""}`);
        } else {
          this.detailText.text(`${current}/${total} files ${status}`);
          this.sizeText.text("");
        }
        if (1 < totalParts) {
          this.partInfoText.text(`パート ${currentPart}/${totalParts}`);
        } else {
          this.partInfoText.text("");
        }
        this.progressBarInner.css("width", `${percentage}%`);
        this.progressBarInner.css({
          backgroundColor: percentage < 30 ? "#FFA726" : percentage < 70 ? "#42A5F5" : "#4CAF50"
        });
      }
      updateZipProgress(currentSize, totalSize, currentFiles, totalFiles) {
        const percentage = Math.round(currentSize / totalSize * 100);
        const formattedCurrentSize = formatFileSize(currentSize);
        const formattedTotalSize = formatFileSize(totalSize);
        this.statusText.text(`ZIP作成中: ${percentage}%`);
        this.detailText.text(`${currentFiles}/${totalFiles} ファイル`);
        this.sizeText.text(`${formattedCurrentSize} / ${formattedTotalSize}`);
        this.progressBarInner.css("width", `${percentage}%`);
        this.progressBarInner.css({
          backgroundColor: percentage < 30 ? "#FFA726" : percentage < 70 ? "#42A5F5" : "#4CAF50"
        });
      }
      updateStatus(message) {
        this.statusText.text(message);
      }
      showRetryOption(failedCount) {
        $(".retry-button").text(`失敗したファイルを再ダウンロード (${failedCount}件)`).off("click").on("click", () => {
          if (typeof this.onRetryClick === "function") {
            this.onRetryClick();
          }
        }).css({
          display: "block"
        });
      }
      showContinueOption(remainingCount, currentPart, totalParts, onContinueClick) {
        this.onContinueClick = onContinueClick;
        $(".continue-button").text(`続きをダウンロード (残り${remainingCount}ファイル, パート${currentPart}/${totalParts})`).off("click").on("click", () => {
          if (typeof this.onContinueClick === "function") {
            this.onContinueClick();
          }
        }).css({
          display: "block"
        });
        this.statusText.text("一部ダウンロード完了");
        this.detailText.text(`容量閾値に達したため一時停止中`);
      }
      showComplete(downloadedCount, failedCount, currentPart = 1, totalParts = 1) {
        const partInfo = 1 < totalParts ? ` (パート${currentPart}/${totalParts})` : "";
        this.statusText.text(`Download Complete!${partInfo}`);
        this.detailText.html([`Successfully downloaded: ${downloadedCount} files`, 0 < failedCount ? `<br>Failed: ${failedCount} files` : ""].join(""));
        this.progressBarInner.css({
          backgroundColor: 0 < failedCount ? "#FF5722" : "#4CAF50",
          width: "100%"
        });
        if (failedCount === 0 && currentPart >= totalParts) {
          this._fadeOutAfterDelay(1e4);
        }
      }
      showError(message) {
        this.statusText.text("Download Failed!");
        this.detailText.text(message);
        this.progressBarInner.css({
          backgroundColor: "#f44336",
          width: "100%"
        });
        this._fadeOutAfterDelay(3e4);
      }
      /**
       * 403エラー等で自動ダウンロードできなかったファイルのリンクを表示
       * @param {Array<{link: string, error: string}>} failedLinks - 失敗したリンクの配列
       */
      showManualDownloadLinks(failedLinks) {
        if (!failedLinks || failedLinks.length === 0) {
          return;
        }
        $("#manual-download-links").remove();
        const $container = $("<div>").attr("id", "manual-download-links").css({
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          padding: "20px",
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          color: "white",
          borderRadius: "10px",
          zIndex: 10001,
          maxWidth: "80vw",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
        });
        const $header = $("<div>").css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
          borderBottom: "1px solid rgba(255,255,255,0.2)",
          paddingBottom: "10px"
        });
        $header.append(
          $("<span>").text(`手動ダウンロード (${failedLinks.length}件)`).css({
            fontSize: "16px",
            fontWeight: "bold"
          })
        );
        const $closeBtn = $("<button>").text("×").css({
          backgroundColor: "transparent",
          color: "white",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          padding: "0 5px"
        }).on("click", () => $container.remove());
        $header.append($closeBtn);
        $container.append($header);
        const $desc = $("<p>").text("以下のファイルは自動ダウンロードできませんでした。右クリック→「名前を付けてリンク先を保存」で手動ダウンロードしてください。").css({
          fontSize: "12px",
          opacity: "0.8",
          marginBottom: "15px"
        });
        $container.append($desc);
        const $linkList = $("<div>").css({
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        });
        failedLinks.forEach((item, index) => {
          const filename = item.link.split("/").pop().split("?")[0];
          const $linkItem = $("<div>").css({
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "5px"
          });
          $linkItem.append(
            $("<span>").text(`${index + 1}.`).css({ opacity: "0.6", minWidth: "25px" })
          );
          const $link = $("<a>").attr({
            href: item.link,
            target: "_blank",
            rel: "noreferrer",
            download: filename
          }).text(filename).css({
            color: "#64B5F6",
            textDecoration: "none",
            wordBreak: "break-all",
            flex: "1"
          }).hover(
            function() {
              $(this).css("textDecoration", "underline");
            },
            function() {
              $(this).css("textDecoration", "none");
            }
          );
          $linkItem.append($link);
          const $errorInfo = $("<span>").text(item.error || "403").css({
            fontSize: "11px",
            color: "#ff8a80",
            opacity: "0.8"
          });
          $linkItem.append($errorInfo);
          $linkList.append($linkItem);
        });
        $container.append($linkList);
        const $buttonContainer = $("<div>").css({
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginTop: "15px"
        });
        const buttonStyle = {
          padding: "10px",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          width: "100%",
          fontSize: "14px"
        };
        const $copyBtn = $("<button>").text("全URLをコピー").css({
          ...buttonStyle,
          backgroundColor: "#4CAF50"
        }).on("click", () => {
          const urls = failedLinks.map((item) => item.link).join("\n");
          navigator.clipboard.writeText(urls).then(() => {
            $copyBtn.text("コピーしました！");
            setTimeout(() => $copyBtn.text("全URLをコピー"), 2e3);
          });
        });
        $buttonContainer.append($copyBtn);
        const $openTabsBtn = $("<button>").text("全て新規タブで開く").css({
          ...buttonStyle,
          backgroundColor: "#2196F3"
        }).on("click", () => {
          this.openAllInTabs(failedLinks);
        });
        $buttonContainer.append($openTabsBtn);
        const $extIndividualBtn = $("<button>").text("拡張機能で個別DL").css({
          ...buttonStyle,
          backgroundColor: "#9C27B0"
        }).on("click", () => {
          this.downloadViaExtension({ links: failedLinks, mode: "individual" });
        });
        $buttonContainer.append($extIndividualBtn);
        const $extZipBtn = $("<button>").text("拡張機能でZIP DL").css({
          ...buttonStyle,
          backgroundColor: "#673AB7"
        }).on("click", () => {
          this.downloadViaExtension({ links: failedLinks, mode: "zip" });
        });
        $buttonContainer.append($extZipBtn);
        $container.append($buttonContainer);
        $("body").append($container);
      }
      /**
       * 失敗したリンクを連続で新規タブで開く（noreferrer方式）
       * @param {Array<{link: string}>} failedLinks - 失敗したリンクの配列
       * @param {number} interval - タブを開く間隔（ミリ秒）
       */
      openAllInTabs(failedLinks, interval = 100) {
        if (!failedLinks || failedLinks.length === 0) {
          return;
        }
        const confirmed = confirm(
          `${failedLinks.length}件のリンクを新規タブで開きます。
ポップアップブロッカーを無効にしてください。

続行しますか？`
        );
        if (!confirmed) {
          return;
        }
        let opened = 0;
        failedLinks.forEach((item, i) => {
          setTimeout(() => {
            const a = document.createElement("a");
            a.href = item.link;
            a.target = "_blank";
            a.rel = "noreferrer";
            a.click();
            opened++;
            this.statusText?.text(`タブを開いています: ${opened}/${failedLinks.length}`);
          }, i * interval);
        });
      }
      /**
       * 拡張機能経由でダウンロード
       * @param {Object} options - オプション
       * @param {Array<{link: string}>} options.links - ダウンロードリンク配列（memoが無い場合に使用）
       * @param {'individual'|'zip'} options.mode - ダウンロードモード
       */
      downloadViaExtension({ links = null, mode = "individual" } = {}) {
        const memo = this.getMemoCallback ? this.getMemoCallback() : [];
        const downloadLinks = links ? links : extractLinksFromMemo(memo).map((url) => ({ link: url }));
        if (!downloadLinks || downloadLinks.length === 0) {
          return;
        }
        const timestamp = generateJpTimestamp();
        const requestTimestamp = Date.now();
        const pageName = sanitizePageName();
        if (mode === "zip") {
          const folderMap = { video: "vids", image: "imgs", other: "" };
          const files = downloadLinks.map((item) => {
            const url = item.link;
            const filename = url.split("/").pop().split("?")[0];
            const folder = folderMap[getFileType(filename)];
            return {
              url,
              path: folder ? `${folder}/${filename}` : filename
            };
          });
          const summaryContent = generateSummaryText({
            timestamp,
            files,
            failedDownloads: [],
            memo,
            viaExtension: true
          });
          files.push({
            content: summaryContent,
            path: `__download_info_${timestamp}.txt`
          });
          const structure = {
            rootFolder: pageName,
            subFolder: `${pageName}_${timestamp}`,
            files,
            metadata: {
              pageUrl: window.location.href,
              pageTitle: document.title,
              timestamp
            }
          };
          const zipFilename = `${pageName}_${timestamp}.zip`;
          dispatchToExtension({
            action: "downloadAsZip",
            zipFilename,
            structure
          }, requestTimestamp);
          this.statusText?.text(`拡張機能にZIPダウンロードリクエストを送信しました (${structure.files.length}件)`);
        } else {
          const extLinks = downloadLinks.map((item) => ({
            url: item.link,
            filename: item.link.split("/").pop().split("?")[0]
          }));
          dispatchToExtension({
            action: "downloadAll",
            links: extLinks
          }, requestTimestamp);
          this.statusText?.text(`拡張機能にダウンロードリクエストを送信しました (${extLinks.length}件)`);
        }
        this.initialize();
        this.updateStatus("拡張機能に送信中...");
        const messageHandler = (e) => {
          if (e.data?.type === "ZA_DOWNLOAD_RESPONSE") {
            if (e.data.success) {
              this.updateStatus("拡張機能がダウンロードを開始しました");
            } else {
              this.showError(`拡張機能エラー: ${e.data.error || "不明"}`);
              window.removeEventListener("message", messageHandler);
            }
          } else if (e.data?.type === "ZA_PROGRESS") {
            const { status, progress } = e.data;
            const { completed, failed, total, percent, filename, currentFile } = progress || {};
            if (status === "完了") {
              this.showComplete(completed, failed);
              window.removeEventListener("message", messageHandler);
            } else {
              let statusText = status;
              if (percent !== void 0) {
                statusText += ` ${percent}%`;
              }
              if (currentFile) {
                statusText += ` - ${currentFile}`;
              }
              if (filename) {
                statusText += ` - ${filename}`;
              }
              this.updateStatus(statusText);
              if (total > 0) {
                this.updateProgress(completed || 0, total, 0, 0, `失敗: ${failed || 0}`);
              }
            }
          }
        };
        window.addEventListener("message", messageHandler);
        setTimeout(() => {
          window.removeEventListener("message", messageHandler);
        }, 3e5);
      }
      _fadeOutAfterDelay(delay) {
        setTimeout(() => {
          this.progressDiv.fadeOut(500, function() {
            $(this).remove();
          });
        }, delay);
      }
    };
  }

  // src/app.js
  async function createApp($, d, pageRange, options = {}) {
    var _showDispToggleButton, _showGroupToggleButton, _getStartPageNumber, _UIManager_instances, getUncheckedItems_fn, collectVideoUrls_fn, checkUrls_fn, checkUrlsDirect_fn, applyCheckResults_fn, _teleLinks, _validateFetchResult;
    const { debugMode = false } = options;
    registerDebugMode();
    initDebugMode(debugMode);
    const HtmlFetcher = createHtmlFetcher($);
    const ItemDOMBuilder = createItemDOMBuilder($);
    const appSettings = createAppSettings();
    const DownloadUIClass = createDownloadUIClass($);
    const DownloadManagerClass = createDownloadManagerClass(DownloadUIClass);
    class AppState {
      constructor() {
        this.dataObj = {};
        this.prevState = null;
        this.initialState = null;
        this.fetched = {};
        this.fetchStatus = {};
        this.fetchErrors = {};
        this.checkboxes = {};
        this.remainingLinks = [];
        this.currentDownloadPart = 1;
        const maxDataLengthSelections = [$("h3").first().text()?.split("本")[0], $("p").first().text()];
        const dataRange = (maxDataLengthSelections[0] ? $("p").first() : $("p").eq(1)).text().split("～").map((e) => Number(e));
        const maxDataLength = Number(maxDataLengthSelections[0] || maxDataLengthSelections[1]);
        const perPageLength = maxDataLength == dataRange[1] ? 30 : dataRange[1] - dataRange[0];
        const maxPage = Math.ceil(maxDataLength / perPageLength);
        const pageRange2 = Math.floor(maxPage / 2);
        const range = pageRange2 < 3 ? pageRange2 : Math.min(pageRange2, Number(prompt("range ?", isMobile.size ? 1 : 5)));
        this.pageConfig = {
          min: 1,
          max: maxPage,
          range
        };
        console.log(this.pageConfig);
      }
      static getInstance() {
        if (!this._instance) {
          this._instance = new AppState();
        }
        return this._instance;
      }
    }
    class App {
      constructor() {
        this.state = AppState.getInstance();
        this.config = new Config(this);
        this.domManager = new DOMManager(this);
        this.uiManager = new UIManager(this);
        this.linkManager = new LinkManager(this);
        this.downloadManager = new DownloadManagerClass({
          chunkSize: 3,
          maxRetries: 3,
          retryDelay: 6e3,
          timeout: 6e4,
          maxTotalSize: 27e8,
          sizeThreshold: appSettings.sizeThreshold
        });
        this.downloadManager.downloadUi.setMemoCallback(() => this.config.genMemoObjectsArray());
      }
      init() {
        this.config.init();
      }
    }
    class Config {
      constructor(app2) {
        /**
         * buttonName - function - downKey
         */
        __publicField(this, "btns", {
          "all": {
            "fn": function(app2) {
              app2.uiManager.allToggle();
            },
            "key": "a"
          },
          "copy": {
            "fn": function(app2) {
              app2.uiManager.copySelected();
            },
            "key": "c"
          },
          "download": {
            "fn": async function(app2) {
              Debug.log("download", "download button clicked, isMobile:", isMobile);
              const isPC = !isMobile.size && !isMobile.agent;
              Debug.log("download", "isPC:", isPC);
              const extAvailable = isPC ? await checkExtensionAvailable(appSettings) : false;
              const useExtension = isPC && extAvailable;
              Debug.log("download", "useExtension:", useExtension);
              if (useExtension) {
                app2.config.btns["ext-zip"].fn(app2);
              } else {
                app2.downloadManager.downloadSelected(app2.config.genMemoObjectsArray());
              }
            },
            "key": "d"
          },
          "ext-dl": {
            "fn": function(app2) {
              app2.downloadManager.downloadUi.downloadViaExtension({ mode: "individual" });
            },
            "key": "e",
            "debugOnly": true
          },
          "ext-zip": {
            "fn": function(app2) {
              app2.downloadManager.downloadUi.downloadViaExtension({ mode: "zip" });
            },
            "key": "z",
            "debugOnly": true
          },
          "open-tabs-vid": {
            "fn": function(app2) {
              app2.uiManager.openSelectedInTabs("vids");
            },
            "key": "v"
          },
          "open-tabs-page": {
            "fn": function(app2) {
              app2.uiManager.openSelectedInTabs("href");
            },
            "key": "p"
          },
          "sort-by-group": {
            "fn": function(app2) {
              app2.domManager.sort("refs");
            },
            "key": "s"
          },
          "sort-by-index": {
            "fn": function(app2) {
              app2.domManager.sort("index");
            },
            "key": "i"
          },
          "remove": {
            "fn": function(app2) {
              app2.domManager.remove("selected");
            },
            "key": "r"
          },
          "remove-groups": {
            "fn": function(app2) {
              app2.domManager.remove("groups");
            },
            "key": "g"
          },
          "range-toggle": {
            "fn": function(app2) {
              const start = parseInt(prompt("開始インデックス?", 0));
              const end = parseInt(prompt("終了インデックス?", 29));
              if (!isNaN(start) && !isNaN(end)) {
                app2.uiManager.rangeToggle(start, end);
              }
            },
            "key": null
          },
          "undo": {
            "fn": function(app2) {
              app2.uiManager.undo();
            },
            "key": null
          },
          "reset": {
            "fn": function(app2) {
              app2.uiManager.reset();
            },
            "key": null
          },
          "check": {
            "fn": async function(app2) {
              const useExtension = await checkExtensionAvailable(appSettings);
              app2.uiManager.checkSelectedLinks(useExtension);
            },
            "key": "k"
          },
          "set-threshold": {
            "fn": function(app2) {
              const newThreshold = parseInt(prompt("ダウンロード分割サイズ (MB)", appSettings.getSizeThreshold()));
              if (!isNaN(newThreshold) && 0 < newThreshold) {
                appSettings.setSizeThreshold(newThreshold);
                alert(`ダウンロード分割サイズを ${newThreshold}MB に設定しました`);
              }
            },
            /* 'key': 't', */
            "key": null
          },
          "toggle-text": {
            "fn": function(app2) {
              Object.keys(app2.state.dataObj).forEach((index) => {
                if (app2.state.dataObj[index]) {
                  app2.state.dataObj[index].textVisible = !app2.state.dataObj[index].textVisible;
                  $(`#text_${index}`).toggle(app2.state.dataObj[index].textVisible);
                }
              });
            },
            "key": "t"
          },
          "fetch-url": {
            "fn": async function(app2) {
              const url = prompt("取得するURLを入力してください（一覧ページ形式）:");
              if (!url) return;
              try {
                const count = await app2.domManager.fetchFromExternalUrl(url);
                alert(`${count}件のアイテムを追加しました`);
              } catch (e) {
                Debug.error("general", "fetchFromExternalUrl error:", e);
                alert("取得に失敗しました: " + e.message);
              }
            },
            "key": "f"
          },
          "toggle-debug-mode": {
            "fn": function(app2) {
              window.zaDebugMode();
            },
            "key": "b",
            "debugOnly": true
          },
          "toggle-ext": {
            "fn": function(app2) {
              if (!appSettings.extensionInstalled) {
                alert("拡張機能がインストールされていません");
                return;
              }
              appSettings.toggleExtension();
              $("button.toggle-ext-button").each(function() {
                $(this).text(appSettings.getExtensionLabel());
                $(this).css(appSettings.getExtensionStyle());
              });
            },
            "key": "x",
            "label": () => appSettings.getExtensionLabel(),
            "style": () => appSettings.getExtensionStyle(),
            "debugOnly": true
          }
        });
        /**
         * getCheckedCheckboxNumbers
         */
        __publicField(this, "getCheckedNumbers", () => {
          const items = this.filterValidCheckboxItems();
          return Object.keys(items).filter((i) => items[i]["checked"]);
        });
        /**
         * getCheckedGroupNumbers
         */
        __publicField(this, "getSameGroupNumbers", (type, number = null) => {
          function getGroupName(group) {
            return group.split("=")[1];
          }
          ;
          function getElementsInGroup(group) {
            return app.uiManager.getGroupElements(getGroupName(group));
          }
          const numbers = type === "checked" ? this.getCheckedNumbers() : [number];
          return [...new Set(numbers.map((i) => app.state.dataObj[i].refs).flatMap((group) => Object.values(getElementsInGroup(group))))].map((elm) => $(elm).attr("id").split("_")[1]);
        });
        /**
         * toggleCheckbox
         * @param el string elementName
         */
        __publicField(this, "toggleCheckbox", (el) => {
          $(el).children().first().prop("checked", (_i, c) => !c);
        });
        /**
         * hideByNumber
         * @param index string|number intIndex
         */
        __publicField(this, "hideElement", (index) => {
          $(`#wrapped_${index}`).parent().hide();
          __privateGet(this, _showDispToggleButton).call(this, index);
        });
        /**
         * hideByGroupName
         * @param group string groupName
         */
        __publicField(this, "hideGroupElements", (group) => {
          $(`#${group}`).children().not(":first").hide();
          __privateGet(this, _showGroupToggleButton).call(this, group);
        });
        /**
         * buttonToShow
         * @param index string|number intIndex
         */
        __privateAdd(this, _showDispToggleButton, (index) => {
          const showButton = $(`<button>`).text(`表示:${index}`).css({
            ...genSquareStyle(125),
            margin: "40px"
          }).click(() => {
            const $elm = $(`#wrapped_${index}`).parent();
            $elm.show();
            $(["html", "body"].join(", ")).animate({
              scrollTop: $elm.offset().top - 50
            }, 0);
            showButton.remove();
          });
          $("center").append(showButton);
        });
        /**
         * buttonToShow
         * @param group string groupName
         */
        __privateAdd(this, _showGroupToggleButton, (group) => {
          const $elm = $(`#${group}`);
          const showButton = $(`<button>`).text(`表示:${group}`).css(barStyle).click(() => {
            $elm.children().show();
            showButton.remove();
          });
          $elm.append(showButton);
        });
        /**
         * saveCurrentDOMState
         */
        __publicField(this, "saveState", () => {
          this.app.state.prevState = $("center").clone(true, true);
        });
        /**
         * generateMemoObjects
         * @returns array memoObjectsArray
         */
        __publicField(this, "genMemoObjectsArray", () => {
          return this.getCheckedNumbers().map((i) => this.app.state.dataObj[i]);
        });
        /**
         * getPageParam
         * @returns number int
         */
        __publicField(this, "getCurrentPageNumber", () => {
          const params = new URLSearchParams(window.location.search);
          return parseInt(params.get("p")) || 1;
        });
        /**
         * generatePageNumbers
         * @param currentPage number pageParam
         * @returns array pagesArray
         */
        __publicField(this, "generatePageSequence", (currentPage) => {
          const {
            min,
            max,
            range
          } = this.app.state.pageConfig;
          currentPage = [currentPage < min, max < currentPage].includes(true) ? 1 : currentPage;
          const startOffset = __privateGet(this, _getStartPageNumber).call(this, currentPage, range, min, max);
          return Array.from({
            length: 2 * range + 1
          }, (_, i) => i + startOffset).map((page) => ({
            page,
            toAdd: currentPage < page ? "after" : "before"
          })).filter(({
            page
          }) => min <= page && page <= max);
        });
        /**
         * getStartPageByCurrentPage
         * @param base string|number middlePageNumber
         * @param range string|number pagesRange
         * @param min string|number definedMinPage
         * @param max string|number definedMaxPage
         * @returns number startPage
         */
        __privateAdd(this, _getStartPageNumber, (base, range, min, max) => {
          const over = max < base + range ? base + range - max : 0;
          const under = base - range < min ? base - range - min : 0;
          return base - (range + (over || under));
        });
        this.app = app2;
      }
      /**
       * generateUrlByAObject
       * @param a object
       * @returns string
       */
      genUrl(a) {
        return "https://" + window.location.host + a.attr("href").slice(1);
      }
      /**
       * createButtonDOMString
       * @param cls string className
       * @param txt string displayText
       * @param btnConfig object ボタン設定（label, style, debugOnlyを含む場合がある）
       * @returns string DOMString
       */
      createButton(cls, txt, btnConfig = null) {
        const label = btnConfig?.label ? btnConfig.label() : txt;
        const customStyle = btnConfig?.style ? btnConfig.style() : {};
        const isDebugOnly = btnConfig?.debugOnly === true;
        const $btn = $("<button>").attr("class", cls).css({
          ...genSquareStyle(250),
          margin: "40px",
          ...customStyle
        }).text(label);
        if (isDebugOnly) {
          $btn.addClass("debug-only-btn");
          if (!Debug.enabled) {
            $btn.hide();
          }
        }
        return $btn;
      }
      /**
       * HTML要素が表示可能で有効な状態かを検証する
       * @param {HTMLElement} element - 検証対象の要素
       * @returns {boolean} - 要素とその親要素が有効で表示可能な場合true、それ以外はfalse
       */
      isAvailableItem(element) {
        if (!element) {
          return false;
        }
        ;
        if (!["input", "div"].includes(element.tagName.toLowerCase())) {
          return true;
        }
        const style = window.getComputedStyle(element);
        const isHidden = [style.display === "none", style.visibility === "hidden"].some(Boolean);
        if (isHidden) {
          return false;
        }
        return this.isAvailableItem(element.parentElement);
      }
      /**
       * チェックボックスの有効なアイテムをフィルタリングする
       * @param {Object} data - フィルタリング対象のデータ
       * @returns {Object} - 有効なアイテムのオブジェクト
       */
      filterValidCheckboxItems() {
        const data = app.state.checkboxes;
        return Object.entries(data).reduce((acc, [key, item]) => {
          if (this.isAvailableItem(item)) {
            acc[key] = item;
          }
          return acc;
        }, {});
      }
      /**
       * initializeApp
       */
      init() {
        $("#DLsite_blog_parts_000").css("width", "750px");
        this.app.domManager.fetchAndAddContents().then(() => {
          this.app.state.initialState = $("center").clone(true, true);
          this.app.domManager.wrapLinks();
          $(".originOuter").wrapAll($("<div>").attr("id", "outerContainer").css({
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap"
          }));
          this.app.domManager.appendButtons();
          this.setupEventListeners();
          $(".pc, .sp").remove();
          this.app.uiManager.allToggle();
          const app2 = this.app;
          Debug._refreshUI = () => {
            if (Debug.enabled) {
              $.each(app2.config.btns, (btn, opt) => {
                if (opt.debugOnly) {
                  $(`.${btn}-button`).show().on("click", () => opt.fn(app2));
                }
              });
            } else {
              $(".debug-only-btn").off("click").hide();
            }
          };
        });
      }
      setupEventListeners() {
        const app2 = this.app;
        const keyMap = {};
        $.each(app2.config.btns, (btn, opt) => {
          $(`.${btn}-button`).on("click", () => opt.fn(app2));
          if (opt.key) {
            if (!keyMap[opt.key]) {
              keyMap[opt.key] = [];
            }
            keyMap[opt.key].push(`.${btn}-button`);
          }
        });
        $(document).on("keydown", (e) => {
          if (keyMap[e.key]) {
            keyMap[e.key].forEach((selector) => {
              const $btn = $(selector).first();
              if ($btn.is(":visible")) {
                $btn.trigger("click");
              }
            });
          }
        });
        $("center").on("DOMNodeRemoved", () => this.app.state.prevState = $("center").clone(true, true));
      }
    }
    _showDispToggleButton = new WeakMap();
    _showGroupToggleButton = new WeakMap();
    _getStartPageNumber = new WeakMap();
    ;
    class DOMManager {
      constructor(app2) {
        /**
         * wrapDOMByDiv
         */
        __publicField(this, "wrapLinks", () => {
          const pl = new Set(
            $('[id^="outer_"] > a, [id^="wrapped_"] > a').map((_, a) => $(a).attr("href")).get()
          );
          const genWrapper = (id, cls) => {
            return $("<div>").attr({
              id,
              class: cls
            }).css(flexAlign);
          };
          const existingIndices = $('[id^="outer_"]').map((_, el) => {
            const match = $(el).attr("id").match(/outer_(\d+)/);
            return match ? parseInt(match[1]) : -1;
          }).get().filter((n) => n >= 0);
          let i = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 0;
          $("center").children("a").each((_, a) => {
            const href = $(a).attr("href");
            if (pl.has(href)) {
              $(a).remove();
              return true;
            }
            pl.add(href);
            const cc = `${chkCls}_${i}`;
            const $chkBox = $("<input>").attr({
              id: cc,
              type: "checkbox",
              class: chkCls
            }).css({
              ...genSquareStyle(200),
              marginRight: "5px"
            }).on("click", (e) => e.stopPropagation).on("change", (e) => {
              app.uiManager.updateGroupCheckbox($(e.target).closest(`.${groupWrapperClass}`).attr("id"));
              if (e.target.checked) {
                app.linkManager.getSelectedLinks();
              }
            });
            const baseCss = {
              ...flexAlign,
              marginRight: "5px",
              width: "100%",
              height: "50%"
            };
            const $btnBase = $("<button>").text(i).css(baseCss);
            const $btnDiv = $("<div>").css({
              ...baseCss,
              ...genSquareStyle(125),
              flexDirection: "column"
            });
            const $hideButton = $btnBase.clone().on("click", (e) => {
              e.stopPropagation();
              app.config.hideElement($(e.target).text());
            });
            const $textToggleButton = $btnBase.clone().text("T").on("click", (e) => {
              e.stopPropagation();
              const index = $(e.target).closest('[id^="outer_"]').attr("id")?.replace("outer_", "");
              if (app.state.dataObj[index]) {
                app.state.dataObj[index].textVisible = !app.state.dataObj[index].textVisible;
                $(`#text_${index}`).toggle(app.state.dataObj[index].textVisible);
              }
            });
            const $removeGroupButton = $btnBase.clone().on("click", (e) => {
              e.stopPropagation();
              app.domManager.remove("thisGroup", $(e.target).text());
            });
            $btnDiv.append($hideButton).append($textToggleButton).append($removeGroupButton);
            $(a).children().first().css(genSquareStyle(200));
            $(a).wrap(genWrapper(`outer_${i}`, "originOuter").css({
              flexDirection: "column",
              width: "700px",
              margin: "20px 0"
            })).wrap(genWrapper(`wrapped_${i}`, "wrappedCell").css({
              justifyContent: "space-around"
            })).on("click", () => app.config.toggleCheckbox).parent().prepend($chkBox).append($btnDiv);
            app.state.checkboxes[i] = $(`#${cc}`).get()[0];
            i++;
          });
        });
        /**
         * appendButtonsTopAndBottom
         */
        __publicField(this, "appendButtons", () => {
          $("center").wrap($("<div>").addClass("wrapped").css({
            ...flexAlign,
            width: isMobile.size ? "700px" : ""
          }));
          const btnNames = Object.keys(this.app.config.btns);
          const btnKeys = btnNames.map((k) => k + "-button");
          $(btnKeys.join(", ")).remove();
          const $d = $("<div>");
          btnNames.forEach((btnName) => {
            const btnConfig = this.app.config.btns[btnName];
            const btnClass = btnName + "-button";
            $d.append(this.app.config.createButton(btnClass, btnName, btnConfig));
          });
          $("center").prepend($d.clone());
          $("center").append($d.clone());
        });
        /**
         * removeLazyloadAttrs
         * @param $target object linkedTargetObject
         * @returns object removedLazyloadAttrs
         */
        __publicField(this, "processImages", ($target) => {
          $target.find("img").each(function() {
            const $img = $(this);
            const src = $img.attr("data-src");
            if (src) {
              $img.attr("src", src).removeAttr("data-src");
            }
            $img.removeAttr("loading");
          });
          return $target;
        });
        /**
         * fetchThenAddContents
         */
        __publicField(this, "fetchAndAddContents", async () => {
          const currentPage = this.app.config.getCurrentPageNumber();
          const pageSequence = this.app.config.generatePageSequence(currentPage);
          const fetchPromises = pageSequence.map(async ({
            page,
            toAdd
          }) => {
            const url = new URL(window.location.href);
            url.searchParams.set("p", page);
            try {
              const { $doc } = await HtmlFetcher.fetchAndParse(url.toString());
              const $directLinks = this.processImages($doc.find("center").children("a").clone());
              const basePosition = {
                before: "first",
                after: "last"
              }[toAdd] ?? "last";
              $("center").children("a")[basePosition]()[toAdd]($directLinks);
            } catch (error) {
              console.error(`Error fetching page ${page}:`, error);
            }
          });
          await Promise.all(fetchPromises);
        });
        /**
         * 外部URLから一覧ページを取得しDOMに追加
         * @param {string} externalUrl - 取得するURL（一覧ページ形式）
         * @returns {Promise<number>} 追加したアイテム数
         */
        __publicField(this, "fetchFromExternalUrl", async (externalUrl) => {
          console.log(`[ZA] fetchFromExternalUrl: ${externalUrl}`);
          try {
            const { $doc } = await HtmlFetcher.fetchAndParse(externalUrl);
            const $directLinks = this.processImages($doc.find("center").children("a").clone());
            if ($directLinks.length === 0) {
              throw new Error("アイテムが見つかりませんでした");
            }
            $("center").append($directLinks);
            this.wrapLinks();
            $("center > .originOuter").appendTo("#outerContainer");
            console.log(`[ZA] fetchFromExternalUrl: ${$directLinks.length}件追加`);
            return $directLinks.length;
          } catch (error) {
            console.error(`[ZA] fetchFromExternalUrl error:`, error);
            throw error;
          }
        });
        __publicField(this, "remove", (type, number = null) => {
          ({
            selected: app.config.getCheckedNumbers(),
            groups: app.config.getSameGroupNumbers("checked"),
            thisGroup: app.config.getSameGroupNumbers("this", number)
          }[type] ?? []).forEach((target) => {
            console.log(type, target);
            $(`#outer_${target}`).remove();
          });
        });
        this.app = app2;
      }
      sort(sortKey) {
        const app2 = this.app;
        function mergeSort(arr, sortKey2) {
          const sortKeyType = typeof arr[0][sortKey2];
          const compare = (a, b) => {
            const comparisonStrategies = {
              string: () => a[sortKey2].localeCompare(b[sortKey2]),
              number: () => a[sortKey2] - b[sortKey2]
            };
            if (!Object.keys(comparisonStrategies).includes(sortKeyType)) {
              throw new Error("Unsupported key type: " + sortKeyType);
            }
            return comparisonStrategies[sortKeyType](a, b);
          };
          function merge(left, right) {
            const result = [];
            while (left.length && right.length) {
              result.push((compare(left[0], right[0]) <= 0 ? left : right).shift());
            }
            return result.concat(left, right);
          }
          function divide(arr2) {
            if (arr2.length <= 1) return arr2;
            const mid = Math.floor(arr2.length / 2);
            const left = divide(arr2.slice(0, mid));
            const right = divide(arr2.slice(mid));
            return merge(left, right);
          }
          return divide(arr);
        }
        const items = [];
        $(".originOuter").detach().each(function() {
          const index = Number($(this).attr("id").split("_")[1]);
          const refs = app2.state.dataObj[index].refs?.split("=")[1] ?? "__null";
          $(this).addClass(refs);
          items.push({
            index,
            $elm: $(this),
            refs
          });
        });
        const expectedKeys = Object.keys(items[0]);
        if (!expectedKeys.includes(sortKey)) {
          throw new Error(`UnexpectedSortKey: > ${sortKey} <, expected in ${expectedKeys}`);
        }
        const sorted = mergeSort(items, sortKey);
        $("#outerContainer").append(sorted.map((item) => item.$elm));
        const sortKeyAdditionalFunction = {
          index: () => {
            if ($(`.${groupWrapperClass}`).length) {
              $(".group-hide-button").remove();
              $(".group-checkbox").remove();
              $(`.${groupWrapperClass}`).contents().unwrap();
              $(`.${groupWrapperClass}`).remove();
            }
          },
          refs: () => {
            if (!$(`.${groupWrapperClass}`).length) {
              let processed = [];
              sorted.forEach((obj) => {
                const idName = obj.refs;
                if (!processed.includes(idName)) {
                  const $target = $(obj.$elm.attr("class").split(" ").map((c) => "." + c)[1]);
                  console.log($target);
                  if (1 < $(`.${idName}`).length) {
                    $target.wrapAll($("<div>").attr({
                      id: idName,
                      class: groupWrapperClass
                    }).css({
                      margin: "40px 0",
                      position: "relative",
                      overflow: "visible"
                    }));
                  }
                  processed.push(idName);
                  const groupHideButton = (position) => {
                    return $("<button>").addClass("group-hide-button").text(idName).css({
                      ...flexAlign,
                      ...barStyle,
                      fontWeight: "bold",
                      position: "sticky",
                      [position]: 0,
                      zIndex: 10
                    }).on("click", (e) => {
                      e.stopPropagation();
                      app2.config.hideGroupElements($(e.target).text());
                    });
                  };
                  const gc = `groupCheckbox_${idName}`;
                  $(`#${idName}`).prepend($("<input>").attr({
                    id: gc,
                    class: "group-checkbox",
                    type: "checkbox"
                  }).css(genSquareStyle(125)).on("click", (e) => {
                    e.stopPropagation();
                    app2.uiManager.groupToggle(idName);
                  })).prepend(groupHideButton("top")).append(groupHideButton("bottom"));
                }
              });
            }
          }
        }[sortKey];
        sortKeyAdditionalFunction();
        console.log(items.length, sorted.length);
      }
    }
    ;
    class UIManager {
      constructor(app2) {
        __privateAdd(this, _UIManager_instances);
        /**
         * toggleAllCheckBox
         */
        __publicField(this, "allToggle", () => {
          const cv = Object.values(app.config.filterValidCheckboxItems());
          const acd = cv.length === cv.filter((c) => c["checked"]).length;
          for (let key in app.state.checkboxes) {
            app.state.checkboxes[key]["checked"] = !acd;
          }
          app.linkManager.getSelectedLinks();
        });
        /**
         * 仮想シフトボタンのセットアップ
         */
        __publicField(this, "setupVirtualShiftButton", () => {
          const toggleStyle = {
            [true]: {
              backgroundColor: "#0056b3"
            },
            [false]: {
              backgroundColor: "#007bff"
            }
          };
          const initStyle = {
            ...genSquareStyle(60),
            ...toggleStyle[false],
            position: "fixed",
            bottom: "20px",
            right: "20px",
            borderRadius: "30px",
            color: "white",
            border: "none",
            fontSize: "16px",
            boxShadow: "0 2px 5px rgba(2, 2, 2, 0.2)",
            zIndex: 1e4,
            opacity: "0.8",
            transition: "all 0.3s ease"
          };
          const $shiftButton = $("<button>").text("Shift").css(initStyle).on("click", (e) => {
            e.preventDefault();
            this.virtualShiftActive = !this.virtualShiftActive;
            $shiftButton.css(toggleStyle[this.virtualShiftActive]);
          });
          $("body").append($shiftButton);
        });
        /**
         * シフトクリックイベントハンドラの設定
         */
        __publicField(this, "setupShiftClickHandler", () => {
          $(document).on("click", `.${chkCls}`, (e) => {
            if (!(e.shiftKey || this.virtualShiftActive)) return;
            const $clicked = $(e.currentTarget).parent();
            if (!this.selectionStart) {
              this.selectionStart = $clicked;
              this.highlightElement($clicked);
              return;
            }
            const startPos = this.selectionStart.offset().top;
            const endPos = $clicked.offset().top;
            const [topPos, bottomPos] = startPos < endPos ? [startPos, endPos] : [endPos, startPos];
            const elementsInRange = $(".wrappedCell").filter(function() {
              const pos = $(this).offset().top;
              return topPos < pos && pos < bottomPos;
            });
            elementsInRange.each((_, el) => {
              const checkbox = $(el).find('input[type="checkbox"]');
              checkbox.prop("checked", !checkbox.prop("checked"));
            });
            const affectedGroups = /* @__PURE__ */ new Set();
            elementsInRange.each((_, el) => {
              const checkbox = $(el).find('input[type="checkbox"]');
              const group = checkbox.data("group");
              if (group) {
                affectedGroups.add(group.split("=")[1]);
              }
            });
            affectedGroups.forEach((group) => {
              this.updateGroupCheckbox(group);
            });
            this.removeHighlight();
            this.selectionStart = null;
            this.app.linkManager.getSelectedLinks();
          });
        });
        /**
         * 要素をハイライト表示
         * @param {jQuery} $element - ハイライトする要素
         */
        __publicField(this, "highlightElement", ($element) => {
          this.removeHighlight();
          $element.css({
            "border": "2px solid #007bff"
          });
        });
        /**
         * ハイライトを解除
         */
        __publicField(this, "removeHighlight", () => {
          $(".wrappedCell").css({
            "border": ""
          });
        });
        /**
         * toggleRangeCheckboxes
         * @param {number} start - 開始インデックス
         * @param {number} end - 終了インデックス
         */
        __publicField(this, "rangeToggle", (start, end) => {
          const checkboxCount = Object.keys(this.app.state.checkboxes).length;
          start = Math.max(0, Math.min(start, checkboxCount - 1));
          end = Math.max(0, Math.min(end, checkboxCount - 1));
          if (end < start) {
            [start, end] = [end, start];
          }
          for (let i = start; i <= end; i++) {
            if (this.app.state.checkboxes[i]) {
              this.app.state.checkboxes[i].checked = !this.app.state.checkboxes[i].checked;
            }
          }
          const affectedGroups = /* @__PURE__ */ new Set();
          for (let i = start; i <= end; i++) {
            const checkbox = this.app.state.checkboxes[i];
            if (checkbox) {
              const group = $(checkbox).data("group");
              if (group) {
                affectedGroups.add(group.split("=")[1]);
              }
            }
          }
          affectedGroups.forEach((group) => {
            this.updateGroupCheckbox(group);
          });
          this.app.linkManager.getSelectedLinks();
        });
        /**
         * toggleAllCheckBox
         */
        __publicField(this, "groupToggle", (group) => {
          const groupElms = this.getGroupElements(group);
          const allChecked = this._getGroupStatus(groupElms);
          for (let key in groupElms) {
            groupElms[key]["checked"] = !allChecked;
          }
          this.updateGroupCheckbox(group);
        });
        __publicField(this, "updateGroupCheckbox", (group) => {
          const groupElms = this.getGroupElements(group);
          const chkStatus = this._getGroupStatus(groupElms);
          $(`#groupCheckbox_${group}`).prop("checked", chkStatus);
        });
        __publicField(this, "getGroupElements", (group) => {
          const groupElements = Object.fromEntries(Object.entries(app.config.filterValidCheckboxItems()).filter(([_, c]) => {
            const groupData = $(c).data("group");
            return groupData && groupData.endsWith(`=${group}`);
          }));
          return groupElements;
        });
        __publicField(this, "_getGroupStatus", (groupElms) => Object.values(groupElms).every((c) => c.checked));
        /**
         * undoDOM
         */
        __publicField(this, "undo", () => {
          if (this.app.state.prevState) {
            $("center").replaceWith(this.app.state.prevState);
            this.app.state.prevState = null;
            this.app.linkManager.getSelectedLinks();
          }
        });
        /**
         * resetDOM
         */
        __publicField(this, "reset", () => {
          if (this.app.initialState) {
            $("center").replaceWith(this.app.initialState);
            this.app.state.prevState = null;
            this.app.linkManager.getSelectedLinks();
          }
        });
        /**
         * copySelectedLinks
         */
        __publicField(this, "copySelected", () => {
          const TA = document.createElement("textarea");
          TA.value = JSON.stringify(this.app.config.genMemoObjectsArray(), null, 2);
          document.body.appendChild(TA);
          TA.select();
          document.execCommand("copy");
          document.body.removeChild(TA);
        });
        /**
         * openLinks
         * @param type string openLinkType
         */
        __publicField(this, "openSelectedInTabs", (type) => {
          const links = Object.keys(app.config.filterValidCheckboxItems()).filter((i) => this.app.state.checkboxes[i]["checked"]).map((i) => this.app.state.dataObj[i][type]);
          links.flat().forEach((link) => {
            const a = document.createElement("a");
            a.href = link;
            a.target = "_blank";
            a.rel = "noreferrer";
            a.click();
          });
        });
        this.app = app2;
        this.selectionStart = null;
        this.virtualShiftActive = false;
        this.setupShiftClickHandler();
        if (isMobile.size || isMobile.agent) {
          this.setupVirtualShiftButton();
        }
        this.errorTriangleStyle = {
          ...genSquareStyle(0),
          position: "absolute",
          borderRight: "60px solid transparent",
          borderTop: "60px solid #ff0000",
          pointerEvents: "none",
          top: "0px",
          left: "0px",
          zIndex: 1e3
        };
      }
      /**
       * 選択されたリンクのステータスを確認
       * @param {boolean} useExtension - 拡張機能経由でチェックするか
       */
      async checkSelectedLinks(useExtension = false) {
        const removedCount = this.removeMarkedInvalidItems();
        if (removedCount > 0) {
          console.log(`[ZA] Removed ${removedCount} invalid items`);
        }
        const selectedItems = __privateMethod(this, _UIManager_instances, getUncheckedItems_fn).call(this);
        if (selectedItems.length === 0) return;
        const allVids = __privateMethod(this, _UIManager_instances, collectVideoUrls_fn).call(this, selectedItems);
        if (allVids.length === 0) return;
        const results = await __privateMethod(this, _UIManager_instances, checkUrls_fn).call(this, allVids, useExtension);
        __privateMethod(this, _UIManager_instances, applyCheckResults_fn).call(this, selectedItems, results);
      }
      /**
       * 三角マークを表示
       * @param {jQuery} $element - マークする要素
       * @param {'error'|'warning'} type - マークの種類
       */
      markWithTriangle($element, type = "error") {
        const colors = {
          error: "red",
          warning: "orange"
        };
        const className = `${type}-triangle`;
        $element.find(`.${className}`).remove();
        if ($element.css("position") !== "relative") {
          $element.css("position", "relative");
        }
        const $triangle = $("<div>").addClass(className).css({
          ...this.errorTriangleStyle,
          borderTopColor: colors[type]
        });
        $element.append($triangle);
      }
      /* 後方互換性のためのエイリアス */
      markAsErrored($element) {
        this.markWithTriangle($element, "error");
      }
      markAsWarning($element) {
        this.markWithTriangle($element, "warning");
      }
      /**
       * チェックマークをクリア
       * @param {jQuery} $element - クリアする要素
       */
      clearCheckMarks($element) {
        $element.find(".error-triangle, .warning-triangle, .invalid-link-mark").remove();
        $element.find("a").css("color", "");
      }
      /**
       * 赤エラー + 404画像の要素を削除
       * @returns {number} 削除した要素数
       */
      removeMarkedInvalidItems() {
        let removedCount = 0;
        $(".error-triangle").each((_, triangle) => {
          const $outer = $(triangle).closest('[id^="outer_"]');
          if ($outer.length === 0) return;
          const has404Image = $outer.find("img").toArray().some((img) => {
            const $img = $(img);
            const src = $img.attr("src") ?? null;
            const onerror = $img.attr("onerror")?.split("'")?.[1] ?? null;
            return src?.includes("404.png") || onerror === src;
          });
          if (has404Image) {
            const index = $outer.attr("id")?.replace("outer_", "");
            if (index && this.app.state.checkboxes[index]) {
              this.app.state.checkboxes[index].checked = false;
            }
            $outer.remove();
            removedCount++;
          }
        });
        return removedCount;
      }
      /**
       * 無効なリンクを赤くマーク
       * @param {jQuery} $element - 対象要素
       * @param {Array<string>} invalidUrls - 無効なURLの配列
       */
      markInvalidLinks($element, invalidUrls) {
        const invalidSet = new Set(invalidUrls);
        $element.find("a").each(function() {
          const href = $(this).attr("href");
          if (href && invalidSet.has(href)) {
            $(this).css({
              color: "#ff4444",
              textDecoration: "line-through"
            });
          }
        });
      }
      /**
       * fetch失敗時のエラーマークを表示
       * @param {jQuery} $element - マークする要素
       * @param {string[]} errors - エラーメッセージの配列
       */
      markAsFetchError($element, errors) {
        $element.find(".fetch-error-mark").remove();
        if ($element.css("position") !== "relative") {
          $element.css("position", "relative");
        }
        const $errorMark = $("<div>").addClass("fetch-error-mark").css({
          position: "absolute",
          top: "0px",
          right: "0px",
          backgroundColor: "rgba(255, 165, 0, 0.9)",
          color: "white",
          padding: "5px 10px",
          borderRadius: "0 0 0 8px",
          fontSize: "12px",
          fontWeight: "bold",
          zIndex: 1e3,
          maxWidth: "200px",
          cursor: "pointer"
        }).text("⚠ Fetch失敗").attr("title", errors.join("\n"));
        $errorMark.on("click", (e) => {
          e.stopPropagation();
          alert("Fetch エラー:\n" + errors.join("\n"));
        });
        $element.append($errorMark);
        $element.css("border", "2px solid orange");
      }
      /**
       * エラーマークをクリア（再試行時）
       * @param {string|number} index - アイテムのインデックス
       */
      clearErrorMark(index) {
        const $element = $(`#outer_${index}`);
        $element.find(".fetch-error-mark").remove();
        $element.css("border", "");
      }
      moveToBottom($element) {
        const $container = $("#outerContainer");
        $element.appendTo($container);
      }
    }
    _UIManager_instances = new WeakSet();
    /**
     * 未チェックの選択要素を取得
     * @returns {Array<string>} 要素のindex配列
     */
    getUncheckedItems_fn = function() {
      const allSelectedItems = Object.keys(app.config.filterValidCheckboxItems()).filter((i) => this.app.state.checkboxes[i]["checked"]);
      const uncheckedItems = allSelectedItems.filter((i) => {
        const $element = $(`#outer_${i}`);
        return !$element.hasClass("check-completed");
      });
      const skippedCount = allSelectedItems.length - uncheckedItems.length;
      if (skippedCount > 0) {
        console.log(`[ZA] Skipped ${skippedCount} already-checked items`);
      }
      return uncheckedItems;
    };
    /**
     * 選択要素から動画URLを収集
     * @param {Array<string>} items - 要素のindex配列
     * @returns {Array<string>} 動画URL配列
     */
    collectVideoUrls_fn = function(items) {
      const allVids = [];
      for (const index of items) {
        const item = this.app.state.dataObj[index];
        if (!item || !item.vids) continue;
        for (const vid of item.vids) {
          allVids.push(vid);
        }
      }
      return allVids;
    };
    checkUrls_fn = async function(urls, useExtension) {
      if (useExtension) {
        Debug.log("check", "Checking URLs via extension:", urls.length);
        const results = await checkUrlsViaExtension(urls);
        if (results) return results;
        Debug.error("check", "Extension check failed, falling back to direct check");
      }
      return __privateMethod(this, _UIManager_instances, checkUrlsDirect_fn).call(this, urls);
    };
    checkUrlsDirect_fn = async function(urls) {
      const results = {};
      for (const url of urls) {
        results[url] = await this.app.linkManager.isVidOk(url);
      }
      return results;
    };
    /**
     * チェック結果を要素に適用
     * @param {Array<string>} items - 要素のindex配列
     * @param {Object} results - { url: boolean }
     */
    applyCheckResults_fn = function(items, results) {
      let allInvalidCount = 0;
      let partialInvalidCount = 0;
      let checkedCount = 0;
      for (const index of items) {
        const item = this.app.state.dataObj[index];
        if (!item || !item.vids) continue;
        const allVidsChecked = item.vids.every((vid) => results[vid] !== void 0);
        if (!allVidsChecked) {
          console.log(`[ZA] Item ${index} has unchecked vids, skipping mark`);
          continue;
        }
        const $element = $(`#outer_${index}`);
        const invalidVids = item.vids.filter((vid) => results[vid] === false);
        if (invalidVids.length === item.vids.length) {
          this.markAsErrored($element);
          this.moveToBottom($element);
          allInvalidCount++;
        } else if (invalidVids.length > 0) {
          this.markAsWarning($element);
          this.moveToBottom($element);
          partialInvalidCount++;
        }
        if (invalidVids.length > 0) {
          this.markInvalidLinks($element, invalidVids);
        }
        $element.addClass("check-completed");
        checkedCount++;
      }
      Debug.log("check", "Check complete:", {
        total: items.length,
        checked: checkedCount,
        allInvalid: allInvalidCount,
        partialInvalid: partialInvalidCount
      });
    };
    ;
    class LinkManager {
      constructor(app2) {
        /**
         * getLinksObject
         * @param url string targetUrl
         * @returns object multipleLinksObject
         */
        __privateAdd(this, _teleLinks, async (url) => {
          const { $doc, html } = await HtmlFetcher.fetchAndParse(url);
          const extractors = {
            links: (config) => {
              const links = HtmlFetcher.extractLinks($doc, config.selector);
              return config.transform ? links.map((link) => config.transform(link, url)) : links;
            },
            text: (config) => HtmlFetcher.extractText($doc, config.selector),
            attr: (config) => {
              const raw = HtmlFetcher.extractAttr($doc, config.selector, config.attr);
              return config.transform ? config.transform(raw, url) : raw;
            }
          };
          const extractValue = (config) => extractors[config.method]?.(config) ?? null;
          const result = {
            vids: extractValue(ExtractionConfig.vids),
            text: extractValue(ExtractionConfig.text),
            orig: extractValue(ExtractionConfig.orig),
            refs: extractValue(ExtractionConfig.refs)
          };
          if (result.vids.length === 0 || !result.refs) {
            console.group(`[DEBUG] teleLinks failed for: ${url}`);
            console.log("vids count:", result.vids.length);
            console.log("refs:", result.refs);
            console.log("All links:", HtmlFetcher.extractLinks($doc, "a"));
            console.log(".fs element:", $doc.find(".fs").length ? $doc.find(".fs").html() : "(not found)");
            console.log("HTML length:", html.length);
            console.log("HTML preview:", html.substring(0, 500));
            console.groupEnd();
          }
          return result;
        });
        /**
         * fetch結果を検証する
         * @param {Object} result - teleLinksの結果
         * @returns {{isValid: boolean, errors: string[]}} 検証結果とエラー理由
         */
        __privateAdd(this, _validateFetchResult, (result) => {
          const errors = [];
          if (!result) {
            errors.push("結果が空です");
            return { isValid: false, errors };
          }
          if (!result.vids || !Array.isArray(result.vids) || result.vids.length === 0) {
            errors.push("動画リンクが取得できませんでした");
          }
          if (!result.refs) {
            errors.push("参照リンクが取得できませんでした");
          }
          return {
            isValid: errors.length === 0,
            errors
          };
        });
        /**
         * getAndSetLinksFirstSelectTime
         * @returns promiseObject
         */
        __publicField(this, "getSelectedLinks", () => {
          return Promise.all(Object.values(app.config.filterValidCheckboxItems()).map((c) => {
            const $p = $(c).parent();
            const i = $p.attr("id").split("_")[1];
            if (this.app.state.fetchStatus[i] === FetchStatus.SUCCESS) {
              return Promise.resolve();
            }
            if (!$(c).is(`:checked`)) {
              return Promise.resolve();
            }
            const $a = $p.find("a");
            const url = this.app.config.genUrl($a);
            this.app.uiManager.clearErrorMark(i);
            return __privateGet(this, _teleLinks).call(this, url).then((lks) => {
              const validation = __privateGet(this, _validateFetchResult).call(this, lks);
              if (!validation.isValid) {
                this.app.state.fetchStatus[i] = FetchStatus.FAILED;
                this.app.state.fetchErrors[i] = validation.errors;
                this.app.uiManager.markAsFetchError($(`#outer_${i}`), validation.errors);
                console.warn(`Fetch validation failed for index ${i}:`, validation.errors);
                return;
              }
              $(`#${chkCls}_${i}`).data("group", lks.refs);
              app.state.dataObj[i] = {
                img: $a.children().first().attr("src"),
                href: url,
                ...lks,
                textVisible: false
                /* テキスト表示状態 */
              };
              this.app.state.fetchStatus[i] = FetchStatus.SUCCESS;
              this.app.state.fetched[i] = true;
              const vidDiv = ItemDOMBuilder.createVideoLinksContainer(
                this.app.state.dataObj[i].vids,
                (vid) => {
                  const idx = this.app.state.dataObj[i].vids.indexOf(vid);
                  if (idx > -1) {
                    this.app.state.dataObj[i].vids.splice(idx, 1);
                  }
                }
              );
              const $textContainer = ItemDOMBuilder.createTextContainer(`text_${i}`, lks.text);
              $(`#wrapped_${i}`).append(vidDiv).before(ItemDOMBuilder.createStyledLink(lks.orig)).after(ItemDOMBuilder.createStyledLink(lks.refs));
              $(`#outer_${i}`).append($textContainer);
            }).catch((error) => {
              const errorMsg = error?.message || error || "不明なエラー";
              this.app.state.fetchStatus[i] = FetchStatus.FAILED;
              this.app.state.fetchErrors[i] = [`通信エラー: ${errorMsg}`];
              this.app.uiManager.markAsFetchError($(`#outer_${i}`), [`通信エラー: ${errorMsg}`]);
              console.error(`Fetch error for index ${i}:`, errorMsg);
            });
          }));
        });
        this.app = app2;
        this.notFoundRefs = [];
      }
      /**
       * 動画リンクの有効性を確認
       * @param {string} url - チェックするURL
       * @returns {Promise<boolean>} リンクの有効性
       */
      async isVidOk(url) {
        try {
          const response = await fetch(url, {
            method: "HEAD",
            mode: "cors",
            credentials: "same-origin",
            referrerPolicy: "no-referrer"
          });
          return response.ok;
        } catch (error) {
          console.error(`Error checking video link: ${url}`, error);
          return false;
        }
      }
    }
    _teleLinks = new WeakMap();
    _validateFetchResult = new WeakMap();
    ;
    await appSettings.initExtensionStatus();
    const app = new App();
    app.init();
    $("iframe").remove();
    return app;
  }

  // src/index.js
  var DEBUG_MODE = true ? false : false;
  (async function main(d, pageRange) {
    async function loadScript(url) {
      const script = d.createElement("script");
      script.src = url;
      return new Promise((resolve) => {
        script.onload = () => resolve(script);
        d.body.appendChild(script);
      });
    }
    const $ = typeof jQuery === "undefined" ? (await loadScript("https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"), jQuery.noConflict(true)) : jQuery.noConflict(true);
    await loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js");
    await createApp($, d, pageRange, { debugMode: DEBUG_MODE });
  })(document, null);
})();
