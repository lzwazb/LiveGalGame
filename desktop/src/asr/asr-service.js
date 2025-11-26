import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import * as logger from '../utils/logger.js';
import { app } from 'electron';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ASR 服务
 * 当前实现：基于 Faster-Whisper 的语音识别引擎
 * 使用持久化 Python 进程以提高性能
 */
class ASRService {
    constructor() {
        this.isInitialized = false;

        // 默认模型配置（Faster-Whisper）
        this.modelName = 'medium'; // 默认使用 medium 模型

        this.retainAudioFiles = false;
        this.audioStoragePath = null;
        this.pythonProcess = null;

        // 任务队列
        this.pendingRequests = [];
        this.isProcessing = false;

        // Python 可执行文件路径
        this.pythonPath = this.detectPythonPath();

        // 流式处理配置
        this.sampleRate = 16000;
        this.chunkStride = 9600; // 600ms 的采样点数

        // 音频缓冲（用于流式处理）
        this.audioBuffer = [];
        this.chunkCounter = 0; // 当前处理的chunk计数

        // 【VAD】静音检测配置
        this.silenceThreshold = 0.005; // 静音阈值（平均绝对值）

        // 【状态管理】当前句子的缓冲区
        this.sessionStates = new Map(); // sessionId -> { currentSentence, isSpeaking, lastActiveTime }

        // 【混合分句】事件回调
        this.onSentenceComplete = null; // (result) => void
        this.onPartialResult = null;    // (result) => void

        // 临时文件路径
        this.tempDir = path.join(app.getPath('temp'), 'asr');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }

        logger.log('ASRService created (Streaming Mode)');
        logger.log(`Python path: ${this.pythonPath}`);
        logger.log(`Sample rate: ${this.sampleRate}Hz, chunk stride: ${this.chunkStride} samples (${this.chunkStride / this.sampleRate * 1000}ms)`);
    }

    /**
     * 检测Python路径（优先使用虚拟环境）
     */
    detectPythonPath() {
        const envPython = process.env.ASR_PYTHON_PATH;
        if (envPython && fs.existsSync(envPython)) {
            logger.log('使用环境变量指定的Python路径');
            return envPython;
        }

        // 获取项目根目录
        const projectRoot = path.resolve(app.getAppPath(), app.isPackaged ? '../..' : '.');
        const venvPython = path.join(projectRoot, '.venv', 'bin', 'python');

        // 检查虚拟环境中的Python
        if (fs.existsSync(venvPython)) {
            logger.log('使用虚拟环境中的Python');
            return venvPython;
        }

        // 回退到系统Python
        logger.log('虚拟环境未找到，使用系统Python');
        return 'python3';
    }

    /**
     * 初始化 ASR 服务
     * @param {string} modelName - 模型名称
     * @param {Object} options - 配置选项
     */
    async initialize(modelName = 'medium', options = {}) {
        try {
            logger.log(`Initializing ASR service with model: ${modelName}`);

            this.modelName = modelName || this.modelName;
            this.retainAudioFiles = options.retainAudioFiles || false;
            this.audioStoragePath = options.audioStoragePath || this.tempDir;

            // 启动 Python Worker
            await this.startWorker();

            this.isInitialized = true;
            logger.log('ASR service initialized successfully');

            return true;
        } catch (error) {
            logger.error('Error initializing ASR service:', error);
            throw error;
        }
    }

    /**
     * 启动 Python Worker 进程
     */
    async startWorker() {
        return new Promise((resolve, reject) => {
            const workerScript = path.join(__dirname, 'asr_worker.py');

            logger.log(`Starting ASR worker: ${workerScript}`);
            logger.log(`Model: ${this.modelName}`);
            logger.log(`Models will be cached in: ~/.cache/faster-whisper/`);

            // 设置环境变量传递模型名称
            // 【统一配置】使用 ASR_* 环境变量（与具体实现解耦）
            const env = {
                ...process.env,
                ASR_MODEL: this.modelName,
                ASR_SAMPLE_RATE: String(this.sampleRate),
                ASR_LANGUAGE: 'zh',  // 默认中文
                // 核心修复：禁止 OpenMP/MKL 多线程，解决 macOS 死锁
                'OMP_NUM_THREADS': '1',
                'MKL_NUM_THREADS': '1',
                'OPENBLAS_NUM_THREADS': '1',
                // 其他优化环境变量
                'TQDM_DISABLE': '1',
                'TF_CPP_MIN_LOG_LEVEL': '3',
                'PYTHONUNBUFFERED': '1'
            };

            this.pythonProcess = spawn(this.pythonPath, [workerScript], { env });

            let initialized = false;
            let buffer = '';

            this.pythonProcess.stdout.on('data', (data) => {
                const chunk = data.toString();
                buffer += chunk;

                const lines = buffer.split('\n');
                // 如果最后一行不为空，说明是不完整的行，保留到下一次
                // 如果最后一行是空字符串，说明buffer以换行符结尾，lines最后一个元素是空字符串
                if (buffer.endsWith('\n')) {
                    buffer = '';
                } else {
                    buffer = lines.pop();
                }

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const message = JSON.parse(line);

                        if (!initialized) {
                            if (message.status === 'ready') {
                                initialized = true;
                                logger.log('ASR worker is ready');
                                resolve();
                            } else if (message.error) {
                                reject(new Error(`Worker initialization failed: ${message.error}`));
                            }
                        } else {
                            this.handleWorkerMessage(message);
                        }
                    } catch (e) {
                        logger.warn(`Failed to parse worker output: ${line}`);
                    }
                }
            });

            this.pythonProcess.stderr.on('data', (data) => {
                logger.log(`[ASR Worker] ${data.toString().trim()}`);
            });

            this.pythonProcess.on('close', (code) => {
                logger.warn(`ASR worker exited with code ${code}`);
                this.isInitialized = false;
                if (!initialized) {
                    reject(new Error(`Worker exited prematurely with code ${code}`));
                }
            });

            this.pythonProcess.on('error', (err) => {
                logger.error('Failed to spawn ASR worker:', err);
                reject(err);
            });
        });
    }

    /**
     * 处理 Worker 消息
     */
    getSessionState(sessionId) {
        if (!this.sessionStates.has(sessionId)) {
            this.sessionStates.set(sessionId, {
                currentSentence: "",
                isSpeaking: false,
                lastActiveTime: Date.now()
            });
        }
        return this.sessionStates.get(sessionId);
    }

    resetSessionState(sessionId) {
        if (this.sessionStates.has(sessionId)) {
            this.sessionStates.set(sessionId, {
                currentSentence: "",
                isSpeaking: false,
                lastActiveTime: Date.now()
            });
        }
    }

    handleWorkerMessage(message) {
        // 根据request_id匹配请求
        const requestId = message.request_id;
        const sessionId = message.session_id || requestId;
        const messageType = message.type || 'unknown';

        // 调试日志：打印收到的消息
        if (messageType !== 'unknown') {
            logger.log(`[ASR Worker] Received message: type=${messageType}, session=${sessionId}, text="${(message.text || '').substring(0, 30)}..."`);
        }

        // ==============================================================================
        // 新增：处理 sentence_complete 事件（混合分句策略的核心）
        // ==============================================================================
        if (messageType === 'sentence_complete') {
            const text = message.text || '';
            if (text && text.trim().length > 0) {
                logger.log(`[Sentence Complete] "${text.substring(0, 50)}..." (session: ${sessionId}, trigger: ${message.trigger || 'punctuation'})`);

                // 更新 session 状态
                const sessionState = this.getSessionState(sessionId);
                sessionState.currentSentence = '';  // 清空当前句子
                sessionState.isSpeaking = false;

                // 触发句子完成回调（如果已注册）
                if (this.onSentenceComplete) {
                    logger.log(`[Sentence Complete] Calling onSentenceComplete callback...`);
                    this.onSentenceComplete({
                        sessionId,
                        text: text.trim(),
                        timestamp: message.timestamp || Date.now(),
                        isFinal: message.is_final || false,
                        trigger: message.trigger || 'punctuation',
                        audioDuration: message.audio_duration || 0,
                        language: message.language || null,
                    });
                } else {
                    logger.warn(`[Sentence Complete] No onSentenceComplete callback registered!`);
                }
            }
            return;
        }

        // ==============================================================================
        // 新增：处理 partial 事件（实时字幕）
        // ==============================================================================
        if (messageType === 'partial') {
            const text = message.text || '';
            const fullText = message.full_text || text;

            if (text) {
                // 更新 session 状态
                const sessionState = this.getSessionState(sessionId);
                sessionState.currentSentence = fullText;
                sessionState.isSpeaking = true;
                sessionState.lastActiveTime = Date.now();

                // 触发实时字幕回调（如果已注册）
                if (this.onPartialResult) {
                    this.onPartialResult({
                        sessionId,
                        partialText: text.trim(),
                        fullText: fullText.trim(),
                        timestamp: message.timestamp || Date.now(),
                        language: message.language || null,
                    });
                }
            }
            return;
        }

        // ==============================================================================
        // 原有逻辑：处理请求-响应模式的消息
        // ==============================================================================
        const requestIndex = this.pendingRequests.findIndex(req => req.requestId === requestId);

        if (requestIndex >= 0) {
            const { resolve, reject } = this.pendingRequests.splice(requestIndex, 1)[0];

            if (message.error) {
                logger.error(`FunASR worker error [${requestId}]: ${message.error}`);
                if (message.traceback) {
                    logger.error(message.traceback);
                }
                reject(new Error(message.error));
            } else {
                // 流式识别返回结果
                const text = message.text || '';

                // 【2-Pass】高精度识别结果，直接返回文本
                if (requestId && requestId.startsWith('2pass_')) {
                    resolve(text);
                    this.isProcessing = false;
                    this.processNextRequest();
                    return;
                }

                // 直接返回标点结果
                if (requestId && requestId.startsWith('punc_')) {
                    resolve(text);
                    this.isProcessing = false;
                    this.processNextRequest();
                    return;
                }

                // 【关键逻辑】流式结果累加（兼容旧逻辑）
                if (text && text.trim().length > 0) {
                    const sessionState = this.getSessionState(sessionId);
                    sessionState.currentSentence += text;
                    sessionState.isSpeaking = true;
                    sessionState.lastActiveTime = Date.now();
                }

                // 如果是批量文件模式，直接返回文本字符串
                if (requestId && requestId.startsWith('batch_')) {
                    resolve(text);
                } else {
                    // 流式模式返回对象，格式与ASRManager期望的一致
                    if (text && text.trim()) {
                        const timestamp = message.timestamp || Date.now();
                        const chunkDuration = this.chunkStride / this.sampleRate; // chunk时长（秒）

                        const sessionState = this.getSessionState(sessionId);
                        resolve({
                            partialText: text.trim(),              // 当前这一小块的识别结果
                            fullSentence: sessionState.currentSentence,    // 当前整句话
                            confidence: 0.95,
                            startTime: timestamp - (chunkDuration * 1000),
                            endTime: timestamp,
                            audioDuration: chunkDuration,
                            isSpeaking: sessionState.isSpeaking,           // 用户是否正在说话
                            isPartial: !message.is_final, // 是否为部分结果
                            audioData: null // 流式处理不保留音频数据
                        });
                    } else {
                        resolve(null);
                    }
                }
            }

            this.isProcessing = false;
            this.processNextRequest();
        } else if (messageType !== 'sentence_complete' && messageType !== 'partial') {
            // 只对非事件类型的消息打印警告
            logger.warn(`No matching request found for request_id: ${requestId}`);
        }
    }

    /**
     * 处理下一个请求
     */
    processNextRequest() {
        if (this.isProcessing || this.pendingRequests.length === 0) {
            return;
        }

        // 这里的逻辑有点问题，因为 request 是在 recognizeAudioFile 中直接发送的
        // 但是我们希望串行发送
        // 实际上，我们应该把 request data 放入 pendingRequests，然后在 processNextRequest 中发送
        // 让我修正 recognizeAudioFile 和 processNextRequest
    }

    /**
     * 添加音频块（流式实时识别）
     * @param {Float32Array} audioData - 音频数据（PCM float32 格式）
     * @param {number} timestamp - 时间戳
     * @returns {Promise<Object|null>} 识别结果
     */
    async addAudioChunk(audioData, timestamp, sourceId = 'default') {
        try {
            if (!this.isInitialized) {
                throw new Error('FunASR service not initialized');
            }

            // 【VAD】静音检测 - 二次验证，防止静音数据进入 ASR 模型
            if (this.detectSilence(audioData)) {
                // 静音时不处理，直接返回
                return null;
            }

            // 添加到缓冲区
            this.audioBuffer.push(...audioData);

            // 【优化】当缓冲区达到chunk大小或更大时，进行流式识别
            // 如果累积的音频块略大于chunkStride，会处理多个chunk，确保及时处理
            let result = null;
            while (this.audioBuffer.length >= this.chunkStride) {
                // 提取一个chunk进行处理
                const chunk = this.audioBuffer.splice(0, this.chunkStride);
                const isFinal = false; // 实时流式处理，通常不是最终块

                // 调用流式识别（只返回最后一个结果，避免重复处理）
                const chunkResult = await this.recognizeStreamingChunk(chunk, isFinal, timestamp, sourceId);
                if (chunkResult) {
                    result = chunkResult; // 保留最新的识别结果
                }
            }

            return result;
        } catch (error) {
            logger.error('Error adding audio chunk:', error);
            throw error;
        }
    }

    /**
     * 处理流式音频块
     * @param {Array<number>} audioChunk - 音频块数据
     * @param {boolean} isFinal - 是否为最后一个块
     * @param {number} timestamp - 时间戳
     * @returns {Promise<Object|null>} 识别结果
     */
    async recognizeStreamingChunk(audioChunk, isFinal, timestamp, sourceId = 'default') {
        try {
            if (!this.isInitialized || !this.pythonProcess) {
                throw new Error('FunASR service not initialized');
            }

            return new Promise((resolve, reject) => {
                // 将音频数据转换为Int16，然后编码为base64
                const int16Array = new Int16Array(audioChunk.length);
                for (let i = 0; i < audioChunk.length; i++) {
                    const sample = Math.max(-1, Math.min(1, audioChunk[i]));
                    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                }

                const audioDataBase64 = Buffer.from(int16Array.buffer).toString('base64');

                const requestId = `chunk_${sourceId}_${this.chunkCounter++}_${Date.now()}`;
                this.pendingRequests.push({ resolve, reject, requestId });

                // 每 10 次打印一次日志
                if (this.chunkCounter % 10 === 0) {
                    logger.log(`[ASR] Sending chunk #${this.chunkCounter} to Python worker, sourceId=${sourceId}, samples=${audioChunk.length}, base64_len=${audioDataBase64.length}`);
                }

                const payload = JSON.stringify({
                    type: 'streaming_chunk',
                    request_id: requestId,
                    audio_data: audioDataBase64,
                    is_final: isFinal,
                    timestamp: timestamp,
                    session_id: sourceId
                }) + '\n';

                this.pythonProcess.stdin.write(payload);
            });
        } catch (error) {
            logger.error('Error recognizing streaming chunk:', error);
            throw error;
        }
    }

    /**
     * 检测静音
     * @param {Float32Array} audioData - 音频数据
     * @returns {boolean} 是否为静音
     */
    detectSilence(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += Math.abs(audioData[i]);
        }
        const average = sum / audioData.length;
        return average < this.silenceThreshold;
    }

    /**
     * 完成流式识别（处理剩余的缓冲区数据）
     * @param {number} endTimestamp - 结束时间戳
     * @returns {Promise<Object>} 识别结果
     */
    async finalizeStreaming(endTimestamp) {
        try {
            if (this.audioBuffer.length === 0) {
                return null;
            }

            // 处理剩余的音频数据
            const result = await this.recognizeStreamingChunk(this.audioBuffer, true, endTimestamp);

            // 清空缓冲区
            this.audioBuffer = [];

            return result;
        } catch (error) {
            logger.error('Error finalizing streaming:', error);
            return null;
        }
    }

    async sendResetCommand(requestId) {
        if (!this.pythonProcess) return;
        this.resetSessionState(requestId);
        const payload = JSON.stringify({
            type: 'reset_session',
            request_id: requestId,
            session_id: requestId
        }) + '\n';
        this.pythonProcess.stdin.write(payload);
    }

    /**
     * 【混合分句】强制提交当前句子（由外部静音检测触发）
     * @param {string} sourceId - 音频源ID
     */
    async forceCommitSentence(sourceId) {
        if (!this.pythonProcess) return;

        const requestId = `force_${sourceId}_${Date.now()}`;
        const payload = JSON.stringify({
            type: 'force_commit',
            request_id: requestId,
            session_id: sourceId
        }) + '\n';

        this.pythonProcess.stdin.write(payload);
        logger.log(`[Force Commit] Sent force_commit for session: ${sourceId}`);
    }

    /**
     * 【混合分句】注册句子完成回调
     * @param {Function} callback - (result) => void
     */
    setSentenceCompleteCallback(callback) {
        this.onSentenceComplete = callback;
    }

    /**
     * 【混合分句】注册实时字幕回调
     * @param {Function} callback - (result) => void
     */
    setPartialResultCallback(callback) {
        this.onPartialResult = callback;
    }

    /**
     * 保存音频数据到临时文件
     * @param {Array<number>} audioData - 音频数据
     * @returns {Promise<string>} 文件路径
     */
    async saveAudioToTemp(audioData) {
        const filename = `temp_${Date.now()}.wav`;
        const filepath = path.join(this.tempDir, filename);

        // 创建WAV文件
        const wavBuffer = this.createWavBuffer(new Float32Array(audioData));
        fs.writeFileSync(filepath, wavBuffer);

        return filepath;
    }

    /**
     * 创建WAV文件缓冲区
     * @param {Float32Array} audioData - 音频数据
     * @returns {Buffer} WAV文件缓冲区
     */
    createWavBuffer(audioData) {
        const numChannels = 1;
        const bitsPerSample = 16;
        const bytesPerSample = bitsPerSample / 8;
        const blockAlign = numChannels * bytesPerSample;

        const dataLength = audioData.length * bytesPerSample;
        const buffer = Buffer.alloc(44 + dataLength);

        // WAV文件头
        buffer.write('RIFF', 0);
        buffer.writeUInt32LE(36 + dataLength, 4);
        buffer.write('WAVE', 8);
        buffer.write('fmt ', 12);
        buffer.writeUInt32LE(16, 16); // fmt chunk size
        buffer.writeUInt16LE(1, 20); // audio format (PCM)
        buffer.writeUInt16LE(numChannels, 22);
        buffer.writeUInt32LE(this.sampleRate, 24);
        buffer.writeUInt32LE(this.sampleRate * blockAlign, 28); // byte rate
        buffer.writeUInt16LE(blockAlign, 32);
        buffer.writeUInt16LE(bitsPerSample, 34);
        buffer.write('data', 36);
        buffer.writeUInt32LE(dataLength, 40);

        // 转换Float32到Int16
        for (let i = 0; i < audioData.length; i++) {
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            buffer.writeInt16LE(int16, 44 + i * 2);
        }

        return buffer;
    }

    /**
     * 使用ASR识别音频文件（批量模式，用于兼容性）
     * @param {string} audioFilePath - 音频文件路径
     * @returns {Promise<string>} 识别文本
     */
    async recognizeAudioFile(audioFilePath) {
        if (!this.isInitialized || !this.pythonProcess) {
            throw new Error('FunASR service not initialized');
        }

        return new Promise((resolve, reject) => {
            const requestId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 将请求加入队列
            this.pendingRequests.push({ resolve, reject, requestId });

            // 发送请求
            const payload = JSON.stringify({
                type: 'batch_file',
                request_id: requestId,
                audio_path: audioFilePath
            }) + '\n';

            this.pythonProcess.stdin.write(payload);
        });
    }

    /**
     * 处理下一个请求（已废弃，现在直接发送）
     */
    processNextRequest() {
        // 这个方法现在主要用于兼容性，实际请求已经在各个方法中直接发送
        // 保留此方法以避免破坏现有代码结构
    }

    /**
     * 保存音频文件
     * @param {Array<number>|Float32Array} audioData - 音频数据
     * @param {string} recordId - 记录ID
     * @param {string} conversationId - 对话ID
     * @param {string} sourceId - 音频源ID
     * @returns {Promise<string>} 文件路径
     */
    async saveAudioFile(audioData, recordId, conversationId, sourceId) {
        try {
            const filename = `${recordId}_${sourceId}.wav`;
            const conversationDir = path.join(this.audioStoragePath, conversationId);

            if (!fs.existsSync(conversationDir)) {
                fs.mkdirSync(conversationDir, { recursive: true });
            }

            const filepath = path.join(conversationDir, filename);

            // 创建WAV文件
            const float32Array = audioData instanceof Float32Array ? audioData : new Float32Array(audioData);
            const wavBuffer = this.createWavBuffer(float32Array);
            fs.writeFileSync(filepath, wavBuffer);

            logger.log(`Audio file saved: ${filepath}`);
            return filepath;
        } catch (error) {
            logger.error('Error saving audio file:', error);
            throw error;
        }
    }

    /**
     * 销毁服务
     */
    destroy() {
        if (this.pythonProcess) {
            this.pythonProcess.kill();
            this.pythonProcess = null;
        }

        // 清理临时文件
        if (fs.existsSync(this.tempDir)) {
            const files = fs.readdirSync(this.tempDir);
            for (const file of files) {
                if (file.startsWith('temp_')) {
                    try {
                        fs.unlinkSync(path.join(this.tempDir, file));
                    } catch (e) {
                        logger.warn(`Failed to delete temp file: ${file}`);
                    }
                }
            }
        }

        this.audioBuffer = [];
        this.sessionStates.clear();
        this.isInitialized = false;

        logger.log('ASRService destroyed');
    }
}

export default ASRService;
