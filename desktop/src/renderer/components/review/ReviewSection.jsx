
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversationReview } from '../../hooks/useConversationReview.js';

export default function ReviewSection({ conversationId }) {
    const { review, isLoading, generate } = useConversationReview(conversationId);
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-border-light bg-surface-light p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark flex items-center justify-center py-8">
                <div className="flex flex-col items-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">正在生成复盘分析...</p>
                </div>
            </div>
        );
    }

    if (!review) {
        return (
            <div className="rounded-2xl border border-border-light bg-surface-light p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-light dark:text-text-dark mb-3">
                    <span className="material-symbols-outlined text-primary">history_edu</span>
                    剧情复盘
                </div>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-4">
                    点击生成复盘，回顾关键决策点，探索"如果当时..."的可能性。
                </p>
                <button
                    onClick={generate}
                    className="w-full py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                    生成复盘
                </button>
            </div>
        );
    }

    const { summary, has_nodes } = review;
    const hasNodes = !!has_nodes;

    return (
        <div className="rounded-2xl border border-border-light bg-surface-light p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-light dark:text-text-dark">
                    <span className="material-symbols-outlined text-primary">history_edu</span>
                    剧情复盘
                </div>

                {hasNodes ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={generate}
                            className="p-1 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors rounded hover:bg-surface-light dark:hover:bg-surface-dark/50"
                            title="重新生成复盘"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                        </button>
                        {has_nodes && (
                            <button
                                onClick={() => navigate(`/review/${conversationId}`)}
                                className="text-xs text-primary hover:underline flex items-center"
                            >
                                查看剧情树 <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={generate}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">auto_awesome</span>
                        生成剧情复盘
                    </button>
                )}
            </div>

            <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs text-text-muted-light dark:text-text-muted-dark">
                    <span>关键节点: {summary.node_count || 0}</span>
                    <span>命中建议: {summary.matched_count || 0}</span>
                </div>
                {summary.total_affinity_change !== undefined && (
                    <div className="flex items-center justify-between text-xs text-text-muted-light dark:text-text-muted-dark">
                        <span>好感变化:</span>
                        <span className={summary.total_affinity_change > 0 ? 'text-green-500' : summary.total_affinity_change < 0 ? 'text-red-500' : ''}>
                            {summary.total_affinity_change > 0 ? '+' : ''}{summary.total_affinity_change}
                        </span>
                    </div>
                )}
            </div>

            <p className="text-sm text-text-light dark:text-text-dark line-clamp-3">
                {summary.conversation_summary}
            </p>

        </div>
    );
}
