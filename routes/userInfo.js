import { dbConfig, uploadResourcesConfig } from '../backend/config.js'

import express from 'express';
import mysql from 'mysql2/promise';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const router = express.Router();
const pool = mysql.createPool(dbConfig);

// 配置multer图片存储
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(rootDir, uploadResourcesConfig.IMG_AVATAR_PATH));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// 配置Multer中间件，用于处理文件上传
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制文件大小为5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true); // 文件类型符合要求
    } else {
      cb(new Error('仅允许上传图片文件')); // 文件类型不符合要求
    }
  }
});

//5-1用户中心获取用户的社区讨论信息
router.get('/get/:userId/:type/discussion-data', async (req, res) => {
  const { userId, type } = req.params;
  if (!userId || !type) {
    return res.status(400).json({ error: '参数无效,请刷新重试' });
  }
  try {
    switch (type) {
      // 获取用户讨论的点赞数、评论数和上传数
      case 'discussionCount':
        const [likedCount] = await pool.query(
          'SELECT COUNT(*) AS count FROM discussion_likes WHERE user_id = ?', [userId]
        );
        const [commentCount] = await pool.query(
          'SELECT COUNT(*) AS count FROM discussion_comments WHERE user_id = ?', [userId]
        );
        const [questionCount] = await pool.query(
          'SELECT COUNT(*) AS count FROM discussion_questions WHERE user_id = ?', [userId]
        );
        return res.json({
          likedCount: likedCount[0].count,
          commentCount: commentCount[0].count,
          questionCount: questionCount[0].count,
        });

      // 获取用户点赞的题目
      case 'likedQuestions':
        const [likedQuestions] = await pool.query(`
          SELECT dq.*, u.nickname AS author, u.avatar AS avatar 
          FROM discussion_likes dl 
          JOIN discussion_questions dq ON dl.question_id = dq.id 
          JOIN users u ON dq.user_id = u.id WHERE dl.user_id = ?`,
          [userId]
        );
        return res.json(likedQuestions);
        
      // 获取用户评论的题目
      case 'commentedQuestions':
        const [commentedQuestions] = await pool.query(`
             SELECT 
               dq.*, 
               u.nickname AS author, 
               u.avatar AS avatar,
               dc.content AS comment_content,
               dc.created_at AS comment_created_at
             FROM 
               discussion_comments dc 
             JOIN 
               discussion_questions dq ON dc.question_id = dq.id 
             JOIN 
               users u ON dq.user_id = u.id 
              WHERE 
             dc.user_id = ?`, [userId]);
        // 将查询结果转换为更易读的格式
        const formattedQuestions = commentedQuestions.reduce((acc, row) => {
          const questionId = row.id;
          const existingQuestion = acc.find(q => q.id === questionId);
          if (existingQuestion) {
            existingQuestion.comments.push({
              content: row.comment_content,
              created_at: row.comment_created_at
            });
          } else {
            acc.push({
              ...row,
              comments: [{
                content: row.comment_content,
                created_at: row.comment_created_at
              }]
            });
          }
          return acc;
        }, []);
        return res.json(formattedQuestions);
      // 获取用户上传的题目
      case 'userQuestions':
        const [userQuestions] = await pool.query(`SELECT * FROM discussion_questions WHERE user_id = ?`, [userId])
        return res.json(userQuestions);
      default:
        return res.status(400).json({ error: '参数无效,请刷新重试' });
    }
  } catch (err) {
  }
});



//5-2更新用户信息
router.post('/update-info', avatarUpload.single('avatar'), async (req, res) => {
  const { userId, username, nickname } = req.body;
  let imagePath = req.file ? `${req.file.filename}` : null;
  try {
    // 验证用户存在
    const [user] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    if (!user.length) return res.status(404).json({ error: '用户不存在或者未登录' });

    // 获取旧的头像路径
    const oldImagePath = user[0].avatar;

    // 更新头像逻辑
    if (imagePath) {
      // 如果上传了新的头像，删除旧的头像文件
      const oldImagePathFull = path.join(rootDir, uploadResourcesConfig.IMG_AVATAR_PATH, oldImagePath);
      if (fs.existsSync(oldImagePathFull)) {
        fs.unlinkSync(oldImagePathFull);
      }
    } else {
      imagePath = oldImagePath;
    }

    // 更新数据库
    await pool.query(
      'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
      [nickname, imagePath, userId]
    );
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误', details: err.message });
  }
});


//5-3开通会员
router.post('/update-vip', async (req, res) => {
  const { userId, isVip } = req.body;
  if (!userId || !isVip) {
    return res.status(400).json({ error: '参数为空,请重试' });
  }
  try {
    const [result] = await pool.query(`SELECT vip FROM users WHERE id = ? AND vip = ? LIMIT 1`, [userId, isVip])
    if (result.length > 0) {
      return res.status(400).json({ error: '你已经开通过会员了' });
    }

    await pool.query('UPDATE users SET vip = ? WHERE id = ?', [isVip, userId]
    );
    res.json({ message: '你已经成功订购会员' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误', details: err.message });
  }
});
export default router;
