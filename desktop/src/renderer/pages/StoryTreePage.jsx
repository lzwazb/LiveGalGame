
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversationReview } from '../hooks/useConversationReview.js';

export default function StoryTreePage() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { review, isLoading } = useConversationReview(conversationId);
    const [conversation, setConversation] = useState(null);

    const [visibleIndex, setVisibleIndex] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioSource, setAudioSource] = useState(null);
    const audioRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Constants for tree layout
    const STEP_X = 180;
    const START_X = 120;
    const BASE_Y = 170;
    const OFFSET_Y = 80;

    useEffect(() => {
        window.electronAPI?.getConversationById(conversationId).then(setConversation);
    }, [conversationId]);

    // Calculate node positions based on choice_type
    const nodes = useMemo(() => {
        if (!review?.nodes) return [];

        const res = [];
        // Each review.node[i] is a decision made at Point i.
        // The segment from Point i to Point i+1 is the result of that decision.

        for (let i = 0; i <= review.nodes.length; i++) {
            let y = BASE_Y;
            if (i > 0) {
                // Point i's Y position is determined by the choice made at Point i-1
                const prevNode = review.nodes[i - 1];
                if (prevNode.choice_type === 'matched') y -= OFFSET_Y;
                if (prevNode.choice_type === 'custom') y += OFFSET_Y;
            }

            const decisionData = review.nodes[i];
            res.push({
                ...(decisionData || {}),
                node_id: decisionData?.node_id || `point_${i}`,
                x: START_X + i * STEP_X,
                y: y,
                is_terminal: i === review.nodes.length,
                has_decision: !!decisionData
            });
        }
        return res;
    }, [review?.nodes]);

    // Generate main path (Always full path for animation)
    const mainPathD = useMemo(() => {
        if (nodes.length === 0) return '';
        let d = `M ${nodes[0].x} ${nodes[0].y}`;
        for (let i = 1; i < nodes.length; i++) {
            const curr = nodes[i];
            const prev = nodes[i - 1];
            const cp1x = prev.x + (curr.x - prev.x) * 0.5;
            const cp2x = curr.x - (curr.x - prev.x) * 0.5;
            d += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
        }
        return d;
    }, [nodes]);

    // Measure path length for animation
    const pathRef = useRef(null);
    const [pathLength, setPathLength] = useState(0);

    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, [mainPathD]);

    // Auto-play effect
    useEffect(() => {
        let interval;
        if (isPlaying && nodes.length > 0) {
            interval = setInterval(() => {
                setVisibleIndex(prev => {
                    const next = prev + 1;
                    if (next >= nodes.length) {
                        setIsPlaying(false);
                        return nodes.length - 1;
                    }
                    if (scrollContainerRef.current) {
                        const container = scrollContainerRef.current;
                        const targetX = nodes[next].x - container.offsetWidth / 2 + STEP_X / 2;
                        container.scrollTo({ left: targetX, behavior: 'smooth' });
                    }
                    return next;
                });
            }, 1200);
        }
        return () => clearInterval(interval);
    }, [isPlaying, nodes]);

    // Start auto-play after mount
    useEffect(() => {
        if (nodes.length > 0) {
            const timer = setTimeout(() => setIsPlaying(true), 800);
            return () => clearTimeout(timer);
        }
    }, [nodes.length]);

    const handlePlayPause = () => {
        if (visibleIndex >= nodes.length - 1) {
            setVisibleIndex(0);
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            }
        }
        setIsPlaying(!isPlaying);
    };

    const handlePlayAudio = async (filePath) => {
        if (!filePath) return;

        try {
            // If clicking the same audio that's already playing, toggle it
            if (audioSource && isAudioPlaying) {
                audioRef.current.pause();
                setIsAudioPlaying(false);
                return;
            }

            const dataUrl = await window.electronAPI.asrGetAudioDataUrl(filePath);
            if (dataUrl) {
                setAudioSource(dataUrl);
                setIsAudioPlaying(true);
                // The actual play will be triggered by useEffect on audioSource change
            }
        } catch (error) {
            console.error('Failed to play audio:', error);
        }
    };

    useEffect(() => {
        if (audioSource && audioRef.current) {
            audioRef.current.play().catch(err => {
                console.error('Audio play error:', err);
                setIsAudioPlaying(false);
            });
        }
    }, [audioSource]);

    const handleDeleteAudio = async (node) => {
        if (!node.audio_file_path || !node.audio_record_id) return;

        const confirmed = window.confirm('确定要删除这段录音吗？物理文件将被移除且无法恢复。');
        if (!confirmed) return;

        try {
            const result = await window.electronAPI.asrDeleteAudioFile({
                recordId: node.audio_record_id,
                filePath: node.audio_file_path
            });

            if (result.success) {
                // Update local state to hide the button
                // We need to find the node in the review.nodes array and update it
                // Since review is from a hook, we might not be able to update it directly easily
                // But StoryTreePage will re-render if we can trigger a refresh or local state update
                // For now, let's just update the local nodes useMemo dependency if possible or use a local override state

                // Simple approach: show a toast and disable the button locally for this session
                node.audio_file_path = null;
                if (audioSource) {
                    audioRef.current.pause();
                    setIsAudioPlaying(false);
                }
                alert('录音已删除');
            } else {
                alert('删除失败: ' + result.error);
            }
        } catch (error) {
            console.error('Failed to delete audio:', error);
            alert('删除过程中发生错误');
        }
    };

    if (isLoading || !review) {
        return (
            <div className="flex bg-background-light dark:bg-background-dark h-screen items-center justify-center">
                <div className="text-text-muted-light dark:text-text-muted-dark flex flex-col items-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    加载剧情树中...
                </div>
            </div>
        );
    }

    const { summary } = review;
    const characterName = conversation?.character_name || '...';
    const activeNode = hoveredIndex !== null ? nodes[hoveredIndex] : nodes[visibleIndex];

    const firstTimestamp = nodes[0]?.timestamp || 0;

    // Format timestamp to relative e.g. T+15s
    // Format timestamp to proper HH:mm:ss
    const formatTime = (ts) => {
        if (!ts) return '';
        try {
            return new Date(ts).toLocaleTimeString('zh-CN', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-6 md:p-12 flex flex-col items-center font-display">
            <div className="w-full max-w-6xl space-y-6">

                {/* Header */}
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 tracking-tighter">
                            深度对话复盘
                        </h1>
                        <p className="text-text-muted-light dark:text-text-muted-dark mt-2 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            共计 <span className="font-bold text-primary">{summary.decision_count || 0}</span> 次关键决策（命中 <span className="text-success font-bold">{summary.matched_count || 0}</span> 次），
                            识别 <span className="font-bold text-secondary">{summary.insight_count || 0}</span> 个话题转折点
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 dark:bg-white/10 border border-white/20 dark:border-white/10 text-sm font-medium hover:bg-white/80 dark:hover:bg-white/20 transition-all shadow-sm backdrop-blur-sm"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        返回对话
                    </button>
                </header>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Stats Card */}
                    <div className="col-span-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6">
                        <div className="text-text-muted-light dark:text-text-muted-dark text-xs font-medium uppercase tracking-wider mb-4">
                            复盘统计
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-text-muted-light dark:text-text-muted-dark">好感变化</span>
                                <span className={`text-2xl font-bold ${summary.total_affinity_change > 0 ? 'text-success' : summary.total_affinity_change < 0 ? 'text-error' : 'text-text-light dark:text-text-dark'}`}>
                                    {summary.total_affinity_change > 0 ? '+' : ''}{summary.total_affinity_change || 0}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-primary/5 rounded-xl">
                                    <div className="text-2xl font-bold text-primary">{summary.matched_count || 0}</div>
                                    <div className="text-[10px] text-text-muted-light dark:text-text-muted-dark uppercase">命中建议</div>
                                </div>
                                <div className="text-center p-3 bg-warning/10 rounded-xl">
                                    <div className="text-2xl font-bold text-warning">{summary.custom_count || 0}</div>
                                    <div className="text-[10px] text-text-muted-light dark:text-text-muted-dark uppercase">自定义</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Insight Panel */}
                    <div className="col-span-1 md:col-span-2 bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-center min-h-[180px] shadow-xl">
                        {activeNode ? (
                            <div className="animate-fade-in flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-primary font-mono text-sm">{formatTime(activeNode.timestamp)}</span>
                                            <span className="text-text-light dark:text-text-dark font-semibold">
                                                {activeNode.has_source ? (activeNode.node_title || '关键决策') : (activeNode.node_title || '转折点分析')}
                                            </span>
                                            {/* Source Badge */}
                                            {activeNode.has_source ? (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-primary/30 text-primary/80 bg-primary/5" title="该节点基于系统建议生成">
                                                    Suggestion
                                                </span>
                                            ) : (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-secondary/30 text-secondary/80 bg-secondary/5" title="该节点由AI复盘分析识别">
                                                    Insight
                                                </span>
                                            )}
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold ${activeNode.choice_type === 'matched' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                            {activeNode.choice_type === 'matched' ? '命中建议' : '自定义回复'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-[10px] text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">用户行为</div>
                                                {activeNode.audio_file_path && (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handlePlayAudio(activeNode.audio_file_path)}
                                                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${isAudioPlaying ? 'bg-primary text-white scale-105 shadow-md shadow-primary/20' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                                        >
                                                            <span className="material-symbols-outlined text-sm">
                                                                {isAudioPlaying ? 'pause' : 'play_circle'}
                                                            </span>
                                                            {isAudioPlaying ? '播放中' : '播放录音'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAudio(activeNode)}
                                                            className="flex items-center justify-center w-6 h-6 rounded-full bg-error/10 text-error hover:bg-error/20 transition-all"
                                                            title="删除录音文件"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-text-light dark:text-text-dark leading-relaxed">{activeNode.user_description}</p>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider mb-1">决策点评</div>
                                            <p className="text-sm text-text-light dark:text-text-dark leading-relaxed">{activeNode.reasoning}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Show Alternative/Ghost Options */}
                                {/* Show Alternative/Ghost Options */}
                                {activeNode.has_source && (
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <div className="text-[10px] text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider mb-2">
                                            {activeNode.ghost_options?.length > 0 ? "其他可能性 / 建议选项" : "当时仅有一条建议"}
                                        </div>
                                        {activeNode.ghost_options?.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {activeNode.ghost_options.map((opt, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 text-xs text-text-muted-light dark:text-text-muted-dark bg-white/20 dark:bg-black/10 px-3 py-1.5 rounded-lg border border-white/5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-text-muted-light/40 dark:bg-text-muted-dark/40 shrink-0 mt-1.5"></span>
                                                        <span className="leading-relaxed">{opt.content}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-text-muted-light dark:text-text-muted-dark italic opacity-60">
                                                无其他候选建议
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-text-muted-light dark:text-text-muted-dark text-sm flex items-center justify-center h-full">
                                点击或悬停节点查看详细分析
                            </div>
                        )}
                    </div>

                    {/* Plot Tree */}
                    <div className="col-span-1 md:col-span-3 bg-white/40 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-3xl p-0 overflow-hidden flex flex-col h-[520px] relative shadow-2xl">

                        {/* Tree Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/10 dark:bg-black/10 z-20 relative backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="text-text-muted-light dark:text-text-muted-dark text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                                    互动剧情树 · {characterName}
                                </div>
                                <button
                                    onClick={handlePlayPause}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {isPlaying ? 'pause' : (visibleIndex >= nodes.length - 1 ? 'replay' : 'play_arrow')}
                                    </span>
                                    {isPlaying ? '暂停' : (visibleIndex >= nodes.length - 1 ? '回放' : '演示')}
                                </button>
                            </div>
                            <div className="flex gap-6 text-[10px] text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div> 你的选择
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-success rounded-full"></div> 命中建议
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-warning rounded-full"></div> 自定义
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 border border-dashed border-text-muted-light dark:border-text-muted-dark rounded-full"></div> 错失机会
                                </span>
                            </div>
                        </div>

                        {/* Background Labels */}
                        <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col justify-between h-[230px] pointer-events-none z-10 opacity-40">
                            <span className="text-sm font-black text-primary uppercase tracking-[0.2em] [writing-mode:vertical-rl]">
                                情感 / 共鸣
                            </span>
                            <span className="text-sm font-black text-warning uppercase tracking-[0.2em] [writing-mode:vertical-rl]">
                                理性 / 逻辑
                            </span>
                        </div>

                        {/* Scrollable SVG Container */}
                        <div
                            ref={scrollContainerRef}
                            className="flex-1 overflow-x-auto overflow-y-hidden relative scroll-smooth cursor-grab active:cursor-grabbing z-0"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            <div className="min-w-max h-full p-8 relative">
                                <svg
                                    height="380"
                                    width={START_X + nodes.length * STEP_X + 100}
                                    className="overflow-visible"
                                >
                                    <defs>
                                        <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" style={{ stopColor: '#c51662', stopOpacity: 0.4 }} />
                                            <stop offset="50%" style={{ stopColor: '#e91e8c', stopOpacity: 0.9 }} />
                                            <stop offset="100%" style={{ stopColor: '#ff85c0', stopOpacity: 1 }} />
                                        </linearGradient>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                        <filter id="nodeGlow">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>

                                    {/* Base Axis */}
                                    <line
                                        x1={START_X}
                                        y1={BASE_Y}
                                        x2={START_X + (nodes.length - 1) * STEP_X}
                                        y2={BASE_Y}
                                        stroke="currentColor"
                                        className="text-border-light dark:text-border-dark"
                                        strokeWidth="1"
                                        strokeDasharray="4,4"
                                    />

                                    {/* Ghost Branches (unchosen options originating FROM decision nodes) */}
                                    {nodes.map((node, i) => {
                                        if (node.is_terminal || !node.ghost_options?.length) return null;

                                        return node.ghost_options.map((opt, optIdx) => {
                                            // Ghost position: Stack them vertically to avoid overlap
                                            // Matched -> Ghost is Down (+Y). Custom -> Ghost is Up (-Y).
                                            const isMainMatched = node.choice_type === 'matched';
                                            const baseOffset = isMainMatched ? OFFSET_Y : -OFFSET_Y;

                                            // Spread multiple options
                                            const spacing = 30;
                                            const totalSpread = (node.ghost_options.length - 1) * spacing;
                                            const yOffset = (optIdx * spacing) - (totalSpread / 2);

                                            const ghostY = BASE_Y + baseOffset + yOffset;

                                            const prevX = node.x;
                                            const prevY = node.y;
                                            const currX = nodes[i + 1].x;

                                            const cp1x = prevX + (currX - prevX) * 0.5;
                                            const cp2x = currX - (currX - prevX) * 0.5;
                                            const opacity = i < visibleIndex ? 0.6 : 0;

                                            return (
                                                <g key={`${node.node_id}-ghost-${optIdx}`} style={{ opacity, transition: 'opacity 1s' }}>
                                                    <path
                                                        d={`M ${prevX} ${prevY} C ${cp1x} ${prevY}, ${cp2x} ${ghostY}, ${currX} ${ghostY}`}
                                                        stroke="currentColor"
                                                        className="text-text-muted-light/60 dark:text-text-muted-dark/60"
                                                        strokeWidth="1.5"
                                                        fill="none"
                                                        strokeDasharray="4,4"
                                                    />
                                                    <circle cx={currX} cy={ghostY} r="3" fill="currentColor" className="text-background-light dark:text-background-dark" stroke="currentColor" strokeWidth="1" />

                                                    {/* Ghost Option Label - Staggered Y */}
                                                    <text
                                                        x={currX}
                                                        y={ghostY + (isMainMatched ? 20 : -12)}
                                                        textAnchor="middle"
                                                        className="fill-text-muted-light/80 dark:fill-text-muted-dark/80 text-[9px] font-medium"
                                                        style={{ pointerEvents: 'none' }}
                                                    >
                                                        {opt.content?.slice(0, 12)}...
                                                    </text>

                                                    <title>{opt.content}</title>
                                                </g>
                                            );
                                        });
                                    })}

                                    {/* Main Path - Animated using dashoffset */}
                                    <path
                                        ref={pathRef}
                                        d={mainPathD}
                                        stroke="url(#mainGradient)"
                                        strokeWidth="4"
                                        fill="none"
                                        filter="url(#glow)"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeDasharray={pathLength}
                                        strokeDashoffset={pathLength - (Math.min(visibleIndex, nodes.length - 1) / (nodes.length - 1 || 1)) * pathLength}
                                        className="opacity-90"
                                        style={{ transition: 'stroke-dashoffset 1.2s linear' }}
                                    />

                                    {/* Nodes */}
                                    {nodes.map((node, i) => {
                                        const isVisible = i <= visibleIndex;
                                        const isCurrent = i === visibleIndex;
                                        const isHovered = i === hoveredIndex;
                                        const isMatched = node.choice_type === 'matched';

                                        return (
                                            <g
                                                key={node.node_id}
                                                transform={`translate(${node.x}, ${node.y})`}
                                                style={{
                                                    opacity: isVisible ? 1 : 0,
                                                    transform: `translate(${node.x}px, ${node.y}px) scale(${isVisible ? 1 : 0.8})`,
                                                    transition: 'opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                                }}
                                                onMouseEnter={() => {
                                                    setHoveredIndex(i);
                                                }}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                                className="cursor-pointer"
                                            >
                                                {/* Popover for active/hovered node */}
                                                {(isCurrent || isHovered) && node.has_decision && (
                                                    <foreignObject
                                                        x="-100"
                                                        y={node.choice_type === 'matched' ? -130 : 50}
                                                        width="200"
                                                        height="100"
                                                        className="overflow-visible pointer-events-none"
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 shadow-2xl backdrop-blur-xl w-max max-w-[220px]">
                                                                <div className="flex items-center gap-2 mb-1.5 border-b border-border-light dark:border-border-dark pb-1.5">
                                                                    <span className="material-symbols-outlined text-primary text-xs">info</span>
                                                                    <span className="text-[10px] font-bold text-text-light dark:text-text-dark uppercase">用户行为</span>
                                                                </div>
                                                                <p className="text-[10px] text-text-light dark:text-text-dark leading-snug">
                                                                    {node.user_description}
                                                                </p>
                                                            </div>
                                                            {/* Triangle arrow */}
                                                            {node.choice_type === 'matched' && (
                                                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-surface-light dark:border-t-surface-dark mt-[-1px]"></div>
                                                            )}
                                                            {node.choice_type !== 'matched' && (
                                                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-surface-light dark:border-b-surface-dark mb-[-1px] order-first"></div>
                                                            )}
                                                        </div>
                                                    </foreignObject>
                                                )}

                                                {/* Halo effect for current node */}
                                                {isCurrent && (
                                                    <circle r="20" fill="url(#mainGradient)" opacity="0.15" className="animate-pulse" />
                                                )}

                                                {/* Node body - Shape Distinction */}
                                                {/* If has_source (Suggestion based), use Circle. If Insight (AI generated), use Diamond */}
                                                {node.has_source ? (
                                                    <circle
                                                        r="8"
                                                        fill={isHovered ? '#fff' : (isMatched ? '#22c55e' : '#f59e0b')}
                                                        stroke={isMatched ? '#22c55e' : '#f59e0b'}
                                                        strokeWidth={2}
                                                        filter={isCurrent ? "url(#nodeGlow)" : ""}
                                                        style={{ transition: 'fill 0.3s, stroke 0.3s' }}
                                                    />
                                                ) : (
                                                    // Diamond Shape for Insight Nodes
                                                    <rect
                                                        x="-6" y="-6" width="12" height="12"
                                                        transform="rotate(45)"
                                                        fill={isHovered ? '#fff' : '#f59e0b'}
                                                        stroke="#f59e0b"
                                                        strokeWidth={2}
                                                        filter={isCurrent ? "url(#nodeGlow)" : ""}
                                                        style={{ transition: 'fill 0.3s, stroke 0.3s' }}
                                                    />
                                                )}

                                                {/* Inner dot (Only for Circle/Suggestion nodes) */}
                                                {node.has_source && !isHovered && <circle
                                                    r="3"
                                                    fill={isMatched ? '#ffffff' : '#ffffff'}
                                                    opacity="0.8"
                                                />}

                                                {/* Timestamp */}
                                                <text
                                                    y={node.choice_type === 'matched' ? -35 : 45}
                                                    textAnchor="middle"
                                                    className="fill-text-muted-light dark:fill-text-muted-dark text-[10px] font-mono font-bold tracking-wider"
                                                >
                                                    {formatTime(node.timestamp)}
                                                </text>

                                                {/* User action description or Matched Content */}
                                                <text
                                                    y={node.choice_type === 'matched' ? -18 : 28}
                                                    textAnchor="middle"
                                                    className={`text-[12px] font-bold ${isMatched ? 'fill-success' : 'fill-warning'}`}
                                                >
                                                    {isMatched && node.matched_content
                                                        ? (node.matched_content.length > 8 ? `${node.matched_content.slice(0, 8)}...` : node.matched_content)
                                                        : (node.user_description?.length > 8 ? `${node.user_description.slice(0, 8)}...` : node.user_description)
                                                    }
                                                </text>

                                                {/* Node title (Contextual) */}
                                                <text
                                                    y={node.choice_type === 'matched' ? 28 : -18}
                                                    textAnchor="middle"
                                                    className="fill-text-muted-light dark:fill-text-muted-dark text-[10px] font-medium opacity-80"
                                                >
                                                    {node.node_title}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>

                                {/* Removed Bottom Text Labels for Ghost Options as they are now inline */}

                                {/* Bottom Label Removed */}

                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    {summary.conversation_summary && (
                        <div className="col-span-1 md:col-span-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6">
                            <div className="text-text-muted-light dark:text-text-muted-dark text-xs font-medium uppercase tracking-wider mb-3">
                                对话总结
                            </div>
                            <p className="text-text-light dark:text-text-dark leading-relaxed">
                                {summary.conversation_summary || summary.chat_overview}
                            </p>
                        </div>
                    )}

                </div>
            </div>

            {/* Custom CSS for animations */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                /* Hide scrollbar but keep functionality */
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
