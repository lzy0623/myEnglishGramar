import { dbConfig } from '../backend/config.js'

import express from 'express';
import mysql from 'mysql2/promise';


const router = express.Router();
const pool = mysql.createPool(dbConfig);


//4-1.1用户获取讨论题目
router.get('/get/:type/questions', async (req, res) => {
  const { type } = req.params;
  try {
    if (!type || type === '全部题目') {
      const [questions] = await pool.query(`
        SELECT dq.*, u.nickname AS author, u.avatar AS avatar
        FROM discussion_questions dq
        JOIN users u ON dq.user_id = u.id
        ORDER BY dq.created_at DESC
    `);
      return res.json(questions);

    } else if (type) {
      const [questions] = await pool.query(`
        SELECT dq.*, u.nickname AS author, u.avatar AS avatar
        FROM discussion_questions dq
        JOIN users u ON dq.user_id = u.id
        WHERE dq.type = ?
        ORDER BY dq.created_at DESC
      `, [type]);
      return res.json(questions);
    }
    else {
      return res.status(400).json({ error: '无效的参数' });
    }
  } catch (err) {
    return res.status(500).json({ error: '服务器错误' });
  }
});

// 4-1.2上传用户的讨论题目到暂存表，等管理员审核
router.post('/upload/question', async (req, res) => {
  const { userId, question, options, correctAnswer, analysis, type } = req.body;
  try {
    // 插入题目到数据库
    await pool.query(
      'INSERT INTO discussion_questions_admin (user_id, question, options, correct_answer, analysis, type) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, question, JSON.stringify(options), correctAnswer, analysis, type]
    );
    res.status(201).json({ message: '题目上传成功' });
  } catch (err) {
    console.error('上传题目失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

//4-1.3获取暂存表的题目给管理员审核
router.get('/get/admin/:userId/questions', async (req, res) => {
  const { userId } = req.params;
  try {
    const [questions] = await pool.query(`
      SELECT dqa.*, u.nickname AS author, u.avatar AS avatar
      FROM discussion_questions_admin dqa
      JOIN users u ON dqa.user_id = u.id
      ORDER BY dqa.created_at DESC 
    `
    )
    return res.json(questions);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
})

//4-1.4管理员审核后上传至用户表
router.post('/pass/admin/questions', async (req, res) => {
  try {
    const { userId, questionId } = req.body;
    if (!userId && !questionId) {
      return res.status(400).json({ error: '缺少用户和问题参数' });
    }
    //将题目从暂存表移动到正式表
    await pool.query(`
      INSERT INTO discussion_questions (user_id, question, options, correct_answer, analysis, type) 
      SELECT user_id, question, options, correct_answer, analysis, type FROM discussion_questions_admin 
      WHERE id = ? AND user_id = ?`,
      [questionId, userId]
    );
    //删除暂存表中的记录
    await pool.query(
      'DELETE FROM discussion_questions_admin WHERE id = ? AND user_id = ?',
      [questionId, userId]
    );
    res.json({ message: '题目审核通过并已上传到用户表' });

  } catch (err) {
    console.error('审核题目失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
})

//4-1.5管理员审核不通过
router.post('/passno/admin/questions', async (req, res) => {
  try {
    const { userId, questionId } = req.body;
    if (!userId && !questionId) {
      return res.status(400).json({ error: '缺少用户和问题参数' });
    }

    //删除暂存表中的记录
    await pool.query(
      'DELETE FROM discussion_questions_admin WHERE id = ? AND user_id = ?',
      [questionId, userId]
    );
    res.json({ message: '题目审核未通过且已删除' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
})





// 4-2获取某个题目的点赞数
router.get('/get/:questionId/likes-count', async (req, res) => {
  const { questionId } = req.params;
  try {
    const [likes] = await pool.query(
      'SELECT COUNT(*) AS count FROM discussion_likes WHERE question_id = ?',
      [questionId]);
    res.json({ count: likes[0].count });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 4-3获取某个题目的评论数
router.get('/get/:questionId/comment-count', async (req, res) => {
  const { questionId } = req.params;
  try {
    const [comments] = await pool.query(
      'SELECT COUNT(*) AS count FROM discussion_comments WHERE question_id = ?',
      [questionId]
    );
    res.json({ count: comments[0].count });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

//4-4获取单个题目
router.get('/get/:questionId/question', async (req, res) => {
  const { questionId } = req.params;
  try {
    const [question] = await pool.query(`
      SELECT dq.*, u.nickname AS author, u.avatar AS avatar
      FROM discussion_questions dq
      JOIN users u ON dq.user_id = u.id
      WHERE dq.id = ? LIMIT 1`, [questionId]);
    if (question.length === 0) {
      return res.status(404).json({ error: '讨论题目不存在' });
    }
    res.json(question[0]);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
})

// 4-5.1获取某个题目的评论
router.get('/get/:questionId/comments', async (req, res) => {
  const { questionId } = req.params;
  try {
    const [comments] = await pool.query(`
          SELECT dc.*, u.nickname AS author,u.avatar AS avatar 
          FROM discussion_comments dc
          JOIN users u ON dc.user_id = u.id
          WHERE dc.question_id = ?
          ORDER BY dc.created_at DESC
      `, [questionId]);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 4-5.2提交某个题目的评论
router.post('/upload/:questionId/comment', async (req, res) => {
  const questionId = req.params.questionId;
  const { userId, content } = req.body;
  try {
    // 插入评论到数据库
    const [result] = await pool.query(
      'INSERT INTO discussion_comments (user_id, question_id, content) VALUES (?, ?, ?)',
      [userId, questionId, content]
    );
    // 返回成功信息
    res.status(201).json({ message: '评论成功' });
  } catch (err) {
    res.status(500).json({ error: err.message || '服务器错误' });
  }
});



//4-6 点赞或取消点赞
router.post('/liked', async (req, res) => {
  const { userId, questionId } = req.body;
  try {
    // 检查是否已点赞
    const [existing] = await pool.query(
      'SELECT * FROM discussion_likes WHERE user_id = ? AND question_id = ?',
      [userId, questionId]
    );

    if (existing.length > 0) {
      // 取消点赞
      await pool.query(
        'DELETE FROM discussion_likes WHERE user_id = ? AND question_id = ?',
        [userId, questionId]
      );
      res.json({ message: '取消点赞成功', isLiked: false });
    } else {
      // 新增点赞
      await pool.query(
        'INSERT INTO discussion_likes (user_id, question_id) VALUES (?, ?)',
        [userId, questionId]
      );
      res.json({ message: '点赞成功', isLiked: true });
    }
  } catch (err) {
    console.error('操作失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

//4-7获取某位用户的点赞状态
router.get('/get/:userId/user-likes', async (req, res) => {
  const { userId } = req.params;
  try {
    const [likes] = await pool.query(
      'SELECT question_id FROM discussion_likes WHERE user_id = ?',
      [userId]
    );
    const likedQuestionIds = likes.map(like => like.question_id);
    res.json({ likedQuestionIds });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});


export default router;