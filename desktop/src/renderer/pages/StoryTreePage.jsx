
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversationReview } from '../hooks/useConversationReview.js';

export default function StoryTreePage() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { review, isLoading } = useConversationReview(conversationId);
    const [conversation, setConversation] = useState(null);

    useEffect(() => {
        // Fetch conversation details for the title
        // Assume window.electronAPI exists
        window.electronAPI?.getConversationById(conversationId).then(setConversation);
    }, [conversationId]);

    if (isLoading || !review) {
        return (
            <div className="flex bg-background-light dark:bg-background-dark h-screen items-center justify-center">
                <div className="text-text-muted-light dark:text-text-muted-dark flex flex-col items-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    Loading Story Tree...
                </div>
            </div>
        );
    }

    const { summary, nodes } = review;
    const characterName = conversation?.character_name || '...';

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-text-light dark:text-text-dark flex flex-col">
            {/* Header */}
            <header className="flex items-center gap-4 px-6 py-4 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-lg font-bold">剧情复盘 - 与 {characterName} 的对话</h1>
                </div>
            </header>

            {/* Summary Stats */}
            <div className="px-6 py-6 max-w-4xl mx-auto w-full">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <StatCard
                        label="总好感度变化"
                        value={summary.total_affinity_change > 0 ? `+${summary.total_affinity_change}` : summary.total_affinity_change}
                        highlight={summary.total_affinity_change > 0 ? 'text-green-500' : summary.total_affinity_change < 0 ? 'text-red-500' : ''}
                    />
                    <StatCard label="关键节点" value={summary.node_count} />
                    <StatCard label="命中建议" value={`${summary.matched_count}/${summary.node_count}`} />
                </div>

                {/* Timeline / Tree */}
                <div className="relative pl-8 border-l-2 border-border-light dark:border-border-dark space-y-12">
                    {nodes.map((node, index) => (
                        <StoryNodeItem key={node.node_id} node={node} isLast={index === nodes.length - 1} />
                    ))}
                </div>

                <div className="mt-12 text-center text-text-muted-light dark:text-text-muted-dark pb-12">
                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">flag</span>
                    <p>本次复盘结束</p>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, highlight }) {
    return (
        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark text-center">
            <div className={`text-2xl font-bold mb-1 ${highlight || ''}`}>{value}</div>
            <div className="text-xs text-text-muted-light dark:text-text-muted-dark">{label}</div>
        </div>
    )
}

function StoryNodeItem({ node }) {
    const isMatched = node.choice_type === 'matched';
    const dateStr = new Date(node.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="relative">
            {/* Dot */}
            <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-background-light dark:border-background-dark 
                ${isMatched ? 'bg-green-500' : 'bg-amber-400'}`}></div>

            <div className="mb-2 flex items-center gap-3">
                <span className="text-xs font-mono text-text-muted-light dark:text-text-muted-dark opacity-70 bg-surface-light dark:bg-surface-dark px-2 py-0.5 rounded">
                    {dateStr}
                </span>
                <h3 className="text-lg font-bold">{node.node_title || '关键节点'}</h3>
            </div>

            {/* Main Card */}
            <div className={`
                p-5 rounded-2xl border transition-all
                ${isMatched
                    ? 'bg-green-500/5 border-green-500/30'
                    : 'bg-amber-400/5 border-amber-400/30'}
                relative
            `}>
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mb-2
                            ${isMatched ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}
                        `}>
                            {isMatched ? '[已命中]' : '[自定义]'}
                            {isMatched && node.match_confidence && ` 置信度 ${(node.match_confidence * 100).toFixed(0)}%`}
                        </div>
                        <p className="text-base font-medium">
                            {isMatched
                                ? `你选择了: "${getSuggestionContent(node)}"`
                                : `你回复了: "${node.user_description}"`
                            }
                        </p>
                    </div>
                </div>

                <div className="mt-3 text-sm text-text-muted-light dark:text-text-muted-dark bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                    <span className="font-semibold block mb-1 opacity-80">分析:</span>
                    {node.reasoning}
                </div>

                {/* Ghost Options */}
                {node.ghost_options && node.ghost_options.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5">
                        <p className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark mb-3 uppercase tracking-wider">未选择的路径</p>
                        <div className="space-y-2">
                            {node.ghost_options.map(opt => (
                                <div key={opt.suggestion_id} className="flex items-start gap-2 opacity-60 hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-base mt-0.5">radio_button_unchecked</span>
                                    <span className="text-sm line-through text-text-muted-light dark:text-text-muted-dark">{opt.content}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function getSuggestionContent(node) {
    // If we have the matched suggestion content available (passed from backend possibly?)
    // currently node has matched_suggestion_id. Ideally backend enriches this for us or we search ghost options?
    // Wait, backend enrichment logic in review-service.js only enriches ghost_options.
    // Ideally we should have the content of the matched choice locally or in node.matched_content.
    // Checking review-service.js: it does not populate matched content directly in node root, only ID.
    // But it has `user_description` which for matched might be the summary?
    // Or... we should use user_description for now which describes what user did.
    return node.user_description;
}
