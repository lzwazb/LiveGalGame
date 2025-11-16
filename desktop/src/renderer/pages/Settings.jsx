import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Settings() {
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [defaultConfig, setDefaultConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      if (window.electronAPI?.getAllLLMConfigs) {
        const configs = await window.electronAPI.getAllLLMConfigs();
        setLlmConfigs(configs);
      }
      if (window.electronAPI?.getDefaultLLMConfig) {
        const defaultCfg = await window.electronAPI.getDefaultLLMConfig();
        setDefaultConfig(defaultCfg);
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>返回</span>
          </Link>
          <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">设置</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark mt-2">
            管理应用设置和LLM配置
          </p>
        </div>

        {/* LLM配置部分 */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark mb-6">
          <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">settings</span>
            LLM配置
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-text-muted-light dark:text-text-muted-dark">加载中...</p>
            </div>
          ) : llmConfigs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted-light dark:text-text-muted-dark mb-4">暂无LLM配置</p>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                添加配置
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {llmConfigs.map((config) => (
                <div
                  key={config.id}
                  className={`p-4 rounded-lg border ${
                    defaultConfig?.id === config.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border-light dark:border-border-dark'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-light dark:text-text-dark">
                        {config.name || '未命名配置'}
                        {defaultConfig?.id === config.id && (
                          <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">
                            默认
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
                        {config.provider || '未知提供商'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {defaultConfig?.id !== config.id && (
                        <button
                          onClick={async () => {
                            if (window.electronAPI?.setDefaultLLMConfig) {
                              await window.electronAPI.setDefaultLLMConfig(config.id);
                              loadConfigs();
                            }
                          }}
                          className="px-3 py-1 text-sm border border-border-light dark:border-border-dark rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                        >
                          设为默认
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (window.electronAPI?.deleteLLMConfig) {
                            if (confirm('确定要删除这个配置吗？')) {
                              await window.electronAPI.deleteLLMConfig(config.id);
                              loadConfigs();
                            }
                          }
                        }}
                        className="px-3 py-1 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 其他设置 */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark">
          <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tune</span>
            其他设置
          </h2>
          <p className="text-text-muted-light dark:text-text-muted-dark">
            更多设置选项即将推出
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;

