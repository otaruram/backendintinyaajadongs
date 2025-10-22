"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const youtubeService_1 = require("../services/youtubeService");
const chatService_1 = require("../services/chatService");
const router = express_1.default.Router();
const youtubeService = new youtubeService_1.YouTubeService();
const chatService = new chatService_1.ChatService();
const sessions = new Map();
const upload = (0, multer_1.default)({
    dest: 'uploads/',
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/', 'video/', 'application/pdf', 'text/'];
        const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
        if (isAllowed) {
            cb(null, true);
        }
        else {
            cb(new Error('File type not supported'));
        }
    }
});
router.post('/analyze', async (req, res) => {
    try {
        const { url, sessionId } = req.body;
        if (!url || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: url, sessionId'
            });
        }
        console.log(`📺 Starting YouTube analysis: ${url}`);
        const analysis = await youtubeService.analyzeVideo(url);
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, { conversationHistory: [], analyses: [] });
        }
        const session = sessions.get(sessionId);
        session.analyses.push({
            id: `analysis_${Date.now()}`,
            ...analysis,
            analyzedAt: new Date().toISOString()
        });
        console.log(`✅ YouTube analysis completed for session: ${sessionId}`);
        console.log(`📊 Analysis result - Title: ${analysis.title}`);
        const responseData = {
            id: `analysis_${Date.now()}`,
            title: analysis.title,
            description: analysis.description,
            duration: analysis.duration,
            viewCount: analysis.viewCount,
            likeCount: analysis.likeCount,
            channelTitle: analysis.channelTitle,
            transcript: analysis.transcript,
            thumbnailUrl: analysis.thumbnailUrl,
            url: analysis.url,
            processedAt: new Date().toISOString()
        };
        console.log(`🚀 Sending response to frontend with title: ${responseData.title}`);
        res.json({
            success: true,
            data: responseData
        });
    }
    catch (error) {
        console.error('❌ YouTube analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during YouTube analysis',
            details: error.message
        });
    }
});
router.post('/chat', async (req, res) => {
    try {
        const { message, sessionId, analysisId } = req.body;
        if (!message || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: message, sessionId'
            });
        }
        console.log(`💬 Processing chat message for session: ${sessionId}`);
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, { conversationHistory: [], analyses: [] });
        }
        const session = sessions.get(sessionId);
        let conversationHistory = session.conversationHistory || [];
        if (analysisId) {
            console.log(`📄 Including analysis context: ${analysisId}`);
            const analysis = session.analyses.find((a) => a.id === analysisId);
            if (analysis) {
                const systemMessage = {
                    role: 'system',
                    content: `Kamu sedang membahas video YouTube berikut:
          
Judul: ${analysis.title}
Channel: ${analysis.channelTitle || 'Tidak diketahui'}
Durasi: ${analysis.duration}
Deskripsi: ${analysis.description}

${analysis.transcript ? `Transkrip lengkap video:
${analysis.transcript}` : 'Transkrip tidak tersedia.'}

Gunakan informasi ini untuk menjawab pertanyaan pengguna tentang video ini. Berikan jawaban yang informatif dan detail berdasarkan konten video.`
                };
                if (!conversationHistory.some((msg) => msg.role === 'system' && msg.content.includes(analysis.title))) {
                    conversationHistory.unshift(systemMessage);
                }
            }
        }
        const userMessage = { role: 'user', content: message };
        conversationHistory.push(userMessage);
        const aiResponse = await chatService.generateResponse(conversationHistory);
        const assistantMessage = { role: 'assistant', content: aiResponse };
        conversationHistory.push(assistantMessage);
        session.conversationHistory = conversationHistory;
        console.log(`✅ Chat response generated for session: ${sessionId}`);
        res.json({
            success: true,
            data: {
                response: aiResponse,
                conversationHistory: conversationHistory.filter((msg) => msg.role !== 'system')
            }
        });
    }
    catch (error) {
        console.error('❌ Chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during chat',
            details: error.message
        });
    }
});
router.get('/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = sessions.get(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        const conversationHistory = session.conversationHistory || [];
        res.json({
            success: true,
            data: {
                sessionId,
                conversationHistory: conversationHistory.filter((msg) => msg.role !== 'system')
            }
        });
    }
    catch (error) {
        console.error('❌ Session info error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/session', (req, res) => {
    try {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessions.set(sessionId, {
            conversationHistory: [],
            analyses: [],
            createdAt: new Date().toISOString()
        });
        res.json({
            success: true,
            data: {
                sessionId
            }
        });
    }
    catch (error) {
        console.error('❌ Error creating session:', error.message);
        res.status(500).json({
            success: false,
            error: 'Gagal membuat session',
            details: error.message
        });
    }
});
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'Intinya aja dongs Backend',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=vibelytube.js.map