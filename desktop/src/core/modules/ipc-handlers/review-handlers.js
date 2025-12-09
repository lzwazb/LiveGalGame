
import { ipcMain } from 'electron';

export function registerReviewHandlers({ reviewService }) {
    if (!reviewService) {
        console.error('[IPC] ReviewService is required for review handlers');
        return;
    }

    // 生成复盘
    ipcMain.handle('review:generate', async (event, payload) => {
        try {
            const { conversationId, force = false } =
                typeof payload === 'object' && payload !== null
                    ? payload
                    : { conversationId: payload, force: false };

            if (!conversationId) {
                throw new Error('conversationId is required');
            }

            console.log(`[IPC] Handling review:generate for conversation ${conversationId}, force=${force}`);
            const review = await reviewService.generateReview(conversationId, { force });
            return { success: true, data: review };
        } catch (error) {
            console.error(`[IPC] review:generate failed:`, error);
            return { success: false, error: error.message };
        }
    });

    // 获取复盘
    ipcMain.handle('review:get', async (event, conversationId) => {
        try {
            console.log(`[IPC] Handling review:get for conversation ${conversationId}`);
            const review = reviewService.getExistingReview(conversationId);
            return { success: true, data: review };
        } catch (error) {
            console.error(`[IPC] review:get failed:`, error);
            return { success: false, error: error.message };
        }
    });
}
