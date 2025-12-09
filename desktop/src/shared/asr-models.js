export const ASR_MODEL_PRESETS = [
  // FunASR ONNX 模型（默认）- 使用 funasr_onnx 库
  // 2-Pass 架构: VAD + 流式ASR + 离线ASR + 标点
  {
    id: 'funasr-paraformer',
    label: 'FunASR ParaFormer',
    description: 'FunASR 流式识别，INT8 量化版，体积更小、速度更快，精度略低',
    engine: 'funasr',
    // ONNX 模型配置 (用于 2-Pass 架构)
    onnxModels: {
      vad: 'damo/speech_fsmn_vad_zh-cn-16k-common-onnx',
      online: 'damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online-onnx',
      offline: 'damo/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-onnx',
      punc: 'damo/punc_ct-transformer_zh-cn-common-vocab272727-onnx',
    },
    // 用于缓存路径检测 (兼容 model-manager.js)
    repoId: 'damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online-onnx',
    modelScopeRepoId: 'iic/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online',
    // 本地统计（ModelScope 缓存）: online quant ~240MB + offline quant ~247MB + punc ~274MB + VAD ~1MB ≈ 760MB
    sizeBytes: 760 * 1024 * 1024, // 约 0.76GB（INT8 量化包体，含 VAD/流式/离线/标点）
    recommendedSpec: '≥4 核 CPU / ≥4GB 内存',
    speedHint: '实时 2x-3x',
    language: 'zh',
    isDefault: true,
  },
  {
    id: 'funasr-paraformer-large',
    label: 'FunASR ParaFormer Large',
    description: 'FunASR 非量化 FP32 版，精度最高但体积更大、占用更高',
    engine: 'funasr',
    // ONNX 模型配置 - 使用更大的离线模型
    onnxModels: {
      vad: 'damo/speech_fsmn_vad_zh-cn-16k-common-onnx',
      online: 'damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online-onnx',
      // Large 版本使用非量化模型，精度更高
      offline: 'damo/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-onnx',
      punc: 'damo/punc_ct-transformer_zh-cn-common-vocab272727-onnx',
    },
    quantize: false, // Large 版本不使用量化，精度更高
    // 用于缓存路径检测 (兼容 model-manager.js)
    repoId: 'damo/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-onnx',
    modelScopeRepoId: 'iic/speech_seaco_paraformer_large_asr_nat-zh-cn-16k-common-vocab8404-pytorch',
    // 估算：INT8 → FP32 约 4x 体积，结合 punc/VAD 实测，整包约 2.1GB
    sizeBytes: 2100 * 1024 * 1024, // 约 2.1GB（FP32 未量化）
    recommendedSpec: '≥8 核 CPU / ≥8GB 内存（建议 12GB+ 更流畅）',
    speedHint: '接近实时 / 精度更高',
    language: 'zh',
  },


  // Faster-Whisper 模型
  {
    id: 'tiny',
    label: 'Whisper Tiny',
    description: '最快速，约 75MB，适合体验或低端设备，准确率较低',
    engine: 'faster-whisper', // 指定使用 Faster-Whisper 引擎
    repoId: 'Systran/faster-whisper-tiny',
    modelScopeRepoId: 'gpustack/faster-whisper-tiny',
    sizeBytes: 76 * 1024 * 1024,
    recommendedSpec: '≥2 核 CPU / ≥2GB 内存',
    speedHint: '实时 4x+',
    language: 'multilingual',
  },
  {
    id: 'base',
    label: 'Whisper Base',
    description: '速度与准确率均衡，约 150MB，适合多语言场景',
    engine: 'faster-whisper',
    repoId: 'Systran/faster-whisper-base',
    modelScopeRepoId: 'gpustack/faster-whisper-base',
    sizeBytes: 152 * 1024 * 1024,
    recommendedSpec: '≥4 核 CPU / ≥4GB 内存',
    speedHint: '实时 2x-3x',
    language: 'multilingual',
  },
  {
    id: 'small',
    label: 'Whisper Small',
    description: '准确率更高，约 466MB，需要更高算力',
    engine: 'faster-whisper',
    repoId: 'Systran/faster-whisper-small',
    modelScopeRepoId: 'gpustack/faster-whisper-small',
    sizeBytes: 466 * 1024 * 1024,
    recommendedSpec: '≥6 核 CPU / ≥6GB 内存',
    speedHint: '实时 1x-2x',
    language: 'multilingual',
  },
  {
    id: 'medium',
    label: 'Whisper Medium',
    description: '旗舰模型，约 1.4GB，中文表现较好但资源占用大',
    engine: 'faster-whisper',
    repoId: 'Systran/faster-whisper-medium',
    modelScopeRepoId: 'gpustack/faster-whisper-medium',
    sizeBytes: 1500 * 1024 * 1024,
    recommendedSpec: '≥8 核 CPU / ≥8GB 内存',
    speedHint: '接近实时',
    language: 'multilingual',
  },
  {
    id: 'large-v2',
    label: 'Whisper Large v2',
    description: '多语言最高精度，约 2.9GB，运行成本高',
    engine: 'faster-whisper',
    repoId: 'Systran/faster-whisper-large-v2',
    modelScopeRepoId: 'gpustack/faster-whisper-large-v2',
    sizeBytes: 2950 * 1024 * 1024,
    recommendedSpec: '≥12 核 CPU / ≥12GB 内存',
    speedHint: '离线或高端主机',
    language: 'multilingual',
  },
  {
    id: 'large-v3',
    label: 'Whisper Large v3',
    description: '最新大模型，约 3.1GB，更好上下文理解',
    engine: 'faster-whisper',
    repoId: 'Systran/faster-whisper-large-v3',
    modelScopeRepoId: 'gpustack/faster-whisper-large-v3',
    sizeBytes: 3100 * 1024 * 1024,
    recommendedSpec: '≥16 核 CPU / ≥16GB 内存',
    speedHint: '离线或服务器',
    language: 'multilingual',
  },
];

export function getAsrModelPreset(modelId) {
  return ASR_MODEL_PRESETS.find((preset) => preset.id === modelId);
}


