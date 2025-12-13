
import { useState, useEffect, useCallback, useRef } from 'react';

export function useConversationReview(conversationId) {
    const [review, setReview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(null);
    const activeRequestIdRef = useRef(null);

    const fetchReview = useCallback(async () => {
        if (!conversationId) {
            setReview(null);
            return;
        }

        try {
            setIsLoading(true);
            const result = await window.electronAPI.getConversationReview(conversationId);
            if (result.success && result.data) {
                setReview(result.data.review_data);
            } else {
                // 当没有复盘时清空旧数据，避免显示上一个对话的内容
                setReview(null);
            }
        } catch (err) {
            console.error('Failed to fetch review:', err);
            setReview(null);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    const generate = useCallback(async () => {
        if (!conversationId) return;

        setIsLoading(true);
        setError(null);
        setProgress({ stage: 'start', percent: 0, message: '开始生成复盘...' });
        try {
            const requestId = `review-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            activeRequestIdRef.current = requestId;
            const result = await window.electronAPI.generateConversationReview(conversationId, {
                force: true,
                requestId
            });
            if (result.success) {
                setReview(result.data);
                setProgress({ stage: 'done', percent: 1, message: '复盘完成' });
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            // 不清空 progress，让 UI 可以展示“完成/失败”
        }
    }, [conversationId]);

    useEffect(() => {
        if (!window.electronAPI?.onReviewProgress) return undefined;
        const off = window.electronAPI.onReviewProgress((data) => {
            if (!data) return;
            const active = activeRequestIdRef.current;
            if (active && data.requestId && data.requestId !== active) return;
            setProgress({
                stage: data.stage,
                percent: data.percent,
                message: data.message,
                extra: data.extra
            });
        });
        return () => off && off();
    }, []);

    useEffect(() => {
        fetchReview();
    }, [fetchReview]);

    return { review, isLoading, error, progress, generate };
}
