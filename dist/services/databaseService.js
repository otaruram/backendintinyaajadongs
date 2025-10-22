"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = exports.DatabaseService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class DatabaseService {
    async createUser(data) {
        try {
            const user = await prisma_1.default.user.create({
                data
            });
            console.log(`👤 User created: ${user.email}`);
            return user;
        }
        catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
    async getUserByEmail(email) {
        try {
            return await prisma_1.default.user.findUnique({
                where: { email },
                include: {
                    sessions: true,
                    videos: true,
                    chats: true
                }
            });
        }
        catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }
    async getUserById(id) {
        try {
            return await prisma_1.default.user.findUnique({
                where: { id },
                include: {
                    sessions: true,
                    videos: true,
                    chats: true
                }
            });
        }
        catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }
    async createSession(userId, token, expiresAt) {
        try {
            const session = await prisma_1.default.session.create({
                data: {
                    userId,
                    token,
                    expiresAt
                },
                include: {
                    user: true
                }
            });
            console.log(`🔐 Session created for user: ${userId}`);
            return session;
        }
        catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }
    async getSessionByToken(token) {
        try {
            return await prisma_1.default.session.findUnique({
                where: { token },
                include: {
                    user: true
                }
            });
        }
        catch (error) {
            console.error('Error finding session by token:', error);
            throw error;
        }
    }
    async deleteSession(token) {
        try {
            await prisma_1.default.session.delete({
                where: { token }
            });
            console.log(`🗑️ Session deleted: ${token}`);
        }
        catch (error) {
            console.error('Error deleting session:', error);
            throw error;
        }
    }
    async createOrUpdateVideo(data) {
        try {
            const video = await prisma_1.default.video.upsert({
                where: { youtubeId: data.youtubeId },
                update: {
                    title: data.title,
                    description: data.description,
                    thumbnail: data.thumbnail,
                    duration: data.duration,
                    url: data.url,
                    userId: data.userId
                },
                create: data,
                include: {
                    user: true,
                    chats: true
                }
            });
            console.log(`🎥 Video created/updated: ${video.title}`);
            return video;
        }
        catch (error) {
            console.error('Error creating/updating video:', error);
            throw error;
        }
    }
    async getVideoByYouTubeId(youtubeId) {
        try {
            return await prisma_1.default.video.findUnique({
                where: { youtubeId },
                include: {
                    user: true,
                    chats: {
                        include: {
                            user: true
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error finding video by YouTube ID:', error);
            throw error;
        }
    }
    async getVideoById(id) {
        try {
            return await prisma_1.default.video.findUnique({
                where: { id },
                include: {
                    user: true,
                    chats: {
                        include: {
                            user: true
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error finding video by id:', error);
            throw error;
        }
    }
    async getUserVideos(userId) {
        try {
            return await prisma_1.default.video.findMany({
                where: { userId },
                include: {
                    chats: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }
        catch (error) {
            console.error('Error finding user videos:', error);
            throw error;
        }
    }
    async createChat(data) {
        try {
            const chat = await prisma_1.default.chat.create({
                data,
                include: {
                    video: true,
                    user: true
                }
            });
            console.log(`💬 Chat created for video: ${chat.videoId}`);
            return chat;
        }
        catch (error) {
            console.error('Error creating chat:', error);
            throw error;
        }
    }
    async getVideoChats(videoId, limit = 20) {
        try {
            return await prisma_1.default.chat.findMany({
                where: { videoId },
                include: {
                    user: true,
                    video: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit
            });
        }
        catch (error) {
            console.error('Error finding video chats:', error);
            throw error;
        }
    }
    async getUserChats(userId, limit = 50) {
        try {
            return await prisma_1.default.chat.findMany({
                where: { userId },
                include: {
                    video: true,
                    user: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit
            });
        }
        catch (error) {
            console.error('Error finding user chats:', error);
            throw error;
        }
    }
    async cleanupExpiredSessions() {
        try {
            const result = await prisma_1.default.session.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                }
            });
            console.log(`🧹 Cleaned up ${result.count} expired sessions`);
            return result.count;
        }
        catch (error) {
            console.error('Error cleaning up expired sessions:', error);
            throw error;
        }
    }
    async getStats() {
        try {
            const [userCount, videoCount, chatCount, sessionCount] = await Promise.all([
                prisma_1.default.user.count(),
                prisma_1.default.video.count(),
                prisma_1.default.chat.count(),
                prisma_1.default.session.count()
            ]);
            return {
                users: userCount,
                videos: videoCount,
                chats: chatCount,
                sessions: sessionCount
            };
        }
        catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }
}
exports.DatabaseService = DatabaseService;
exports.databaseService = new DatabaseService();
setInterval(() => {
    exports.databaseService.cleanupExpiredSessions();
}, 60 * 60 * 1000);
//# sourceMappingURL=databaseService.js.map