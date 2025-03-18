import { dbConfig, uploadResourcesConfig } from '../backend/config.js'

import express from 'express';
import mysql from 'mysql2/promise';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir= path.resolve(__dirname,'..');

const router = express.Router();
const pool = mysql.createPool(dbConfig);

// 图片存储配置
const imgstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 指定文件存储的目录，使用 path 模块拼接目录路径
    cb(null, path.join(rootDir, uploadResourcesConfig.IMG_SENTENCE_PATH));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);// 获取文件扩展名
    const destination = path.join(rootDir, uploadResourcesConfig.IMG_SENTENCE_PATH, file.originalname);
    console.log('拼接文件名', destination);
    // 检查文件是否存在
    fs.access(destination, fs.constants.F_OK, (err) => {
      if (err) {
        const newFileName = `${Date.now()}${ext}`;// 文件不存在，生成新的文件名
        req.newFileName = true;
        cb(null, newFileName);
      } else {
        req.newFileName = false;
        cb(null, file.originalname);// 文件存在，使用现有文件名
      }
    });
  }
});
// 配置Multer中间件，用于处理文件上传
const upload = multer({
  storage: imgstorage, // 指定文件存储配置，已在上面指明
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // 根据文件类型过滤，仅允许上传图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true); // 文件类型符合要求，调用回调函数继续上传流程
    } else {
      cb(new Error('仅允许上传图片文件'));// 文件类型不符合要求，调用回调函数返回错误
    }
  }
});

//1-1获取今天的每日一句
router.get('/get/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const [sentence] = await pool.query(
      'SELECT * FROM daily_sentences WHERE date = ? LIMIT 1', [date]
    );
    if (sentence.length > 0) {
      res.json(sentence[0]); // 返回今天的每日一句
    } else {
      res.status(404).json({ error: `${date}日暂时没有每日一句` });
    }
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

//1-2管理员上传每日一句
router.post('/upload', upload.single('image'), async (req, res) => {
  //single()表示处理单个文件上传的方法，
  //'image'对应前端表单中 <input type="file"> 的 name 属性：
  const { date, sentence, translation } = req.body;
  let imagePath = req.file ? `${req.file.filename}` : null;
  try {
    const [existing] = await pool.query(
      'SELECT * FROM daily_sentences WHERE date = ? LIMIT 1', [date]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: '该日期已存在每日一句' });
    }
    // 插入新记录
    await pool.query(
      'INSERT INTO daily_sentences (sentence, translation, image_url, date) VALUES (?, ?, ?, ?)',
      [sentence, translation, imagePath, date]
    );
    if (req.newFileName) {
      res.status(201).json({ message: '这是一个新文件,已存入文件夹,新文件名存入数据库' });
    }
    else {
      res.status(201).json({ message: '文件已存在,仅将文件名存入数据库' });
    }
  } catch (err) {
    res.status(500).json({ error: '服务器端错误' });
  }
});


export default router;