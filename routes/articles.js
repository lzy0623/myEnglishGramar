import { dbConfig } from '../backend/config.js'

import express from 'express';
import mysql from 'mysql2/promise';


const router = express.Router();
const pool = mysql.createPool(dbConfig);


//3-1获取单篇短文详情（通过日期）
router.get('/get/:date/:level', async (req, res) => {
  const { date, level } = req.params;
  try {
    const [articles] = await pool.query('SELECT * FROM articles WHERE date = ? AND difficulty = ? LIMIT 1', [date, level]);
    if (articles.length === 0) {
      res.status(404).json({ error: `${level}难度短文不存在或未上传` });
    } else {
      const article = articles[0];
      if (typeof article.content === 'string') {
        article.content = JSON.parse(article.content);
      }
      //将 JavaScript 对象或数组转换为JSON格式的字符串,并设置响应头 Content-Type: application/json
      res.json(article);
    }
  } catch (err) {
    console.error('获取短文详情失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 3-1.1 上传每日短文
router.post('/upload', async (req, res) => {
  try {
    const { title, content, difficulty, date } = req.body;
    // 验证数据
    if (!title || !content || !difficulty || !date) {
      return res.status(400).json({ error: '请填写所有必填项' });
    }
    const [existingArticle] = await pool.query('SELECT * FROM articles WHERE date = ? AND difficulty = ? LIMIT 1', [date, difficulty]);
    if (existingArticle.length > 0) {
      return res.status(400).json({ error: `日期:${date}!难度:${difficulty}短文已存在` });
    }
    // 插入新记录
    const [result] = await pool.query(
      'INSERT INTO articles (title, content, difficulty, date) VALUES (?, ?, ?, ?)',
      [title, JSON.stringify(content), difficulty, date]
    );
    res.status(201).json({ message: '短文上传成功' });
  } catch (err) {
    res.status(500).json({
      error: err.message || '服务器错误',
      detail: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router;