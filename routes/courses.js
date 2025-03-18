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


//视频上传配置 
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(rootDir, uploadResourcesConfig.VIDEO_COURSE_PATH)); // 视频存储目录
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`); // 生成唯一文件名
  }
});
const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB限制
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('仅允许上传视频文件(mp4/mov/avi等格式)'));
    }
  }
});



//2-1.1获取所有主课程
router.get('/get', async (req, res) => {
  try {
    const [courses] = await pool.query('SELECT * FROM courses');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});
// 2-1.2上传添加主课程
router.post('/upload', videoUpload.single('video'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const videoPath = req.file ? `${req.file.filename}` : null;
    // 检查主课程是否存在
    const [existingTitle] = await pool.query('SELECT title FROM courses WHERE title = ? LIMIT 1', [title]);
    if (existingTitle.length > 0) {
      return res.status(400).json({ error: '该主课程已存在' });
    }

    const [result] = await pool.query(
      'INSERT INTO courses (title, description, video_url) VALUES (?, ?, ?)',
      [title, description, videoPath]
    );
    res.status(201).json({
      id: result.insertId,
      message: '主课程上传成功',
    });

  } catch (err) {
    res.status(500).json({
      error: err.message || '服务器错误',
      detail: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

//2-2.3更新某个主课程信息
router.post('/update/:courseId', videoUpload.single('video'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;
    const videoPath = req.file ? `${req.file.filename}` : null;
    // 检查主课程是否存在
    const [existingCourse] = await pool.query('SELECT * FROM courses WHERE id = ? LIMIT 1', [courseId]);
    if (existingCourse.length === 0) {
      return res.status(400).json({ error: '没有课程信息' });
    }

    // 如果有新的视频上传并且课程已经有视频，删除旧的视频文件
    if (videoPath && existingCourse[0].video_url) {
      const oldVideoPath = path.join(rootDir, uploadResourcesConfig.VIDEO_COURSE_PATH, existingCourse[0].video_url);
      try {
        fs.unlinkSync(oldVideoPath); // 删除旧的视频文件
      } catch (err) {
        console.error('删除旧视频文件失败:', err);
        return res.status(500).json({ error: '删除旧视频文件失败' });
      }
    }

    // 更新课程信息
    const updateQuery = videoPath
      ? 'UPDATE courses SET title = ?, description = ?, video_url = ? WHERE id = ?'
      : 'UPDATE courses SET title = ?, description = ? WHERE id = ?';
    const updateParams = videoPath
      ? [title, description, videoPath, courseId]
      : [title, description, courseId];

    const [result] = await pool.query(updateQuery, updateParams);

    res.status(201).json({ message: '主课程更新成功' });


  } catch (err) {
    res.status(500).json({
      error: err.message || '服务器错误',
      detail: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});





//2-2.1获取某个主课程的子课程
router.get('/get/sub-courses/:courseId', async (req, res) => {
  const { courseId } = req.params;
  if (!courseId) {
    res.status(400).json({ error: '缺少主课程ID' });
  }
  try {
    const [subCourses] = await pool.query('SELECT * FROM sub_courses WHERE course_id = ?', [courseId]);
    res.json(subCourses);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

//2-2.2上传某个主课程的子课程
router.post('/upload/sub-courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;
    // 检查子课程是否存在
    const [existingTitle] = await pool.query('SELECT title FROM sub_courses WHERE title = ? LIMIT 1', [title]);
    if (existingTitle.length > 0) {
      return res.status(400).json({ error: '该子课程已存在' });
    }
    // 验证主课程是否存在
    const [course] = await pool.query('SELECT id FROM courses WHERE id = ? LIMIT 1', [courseId]);
    if (course.length === 0) {
      return res.status(400).json({ error: '主课程不存在' });
    }
    const [result] = await pool.query(
      'INSERT INTO sub_courses (course_id, title, description) VALUES (?, ?, ?)',
      [courseId, title, description]
    );
    res.status(201).json({
      id: result.insertId,
      message: '子课程上传成功'
    });

  } catch (err) {
    res.status(500).json({
      error: err.message || '服务器错误',
      detail: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

//2-2.3更新某个子课程信息
router.post('/update/sub-courses/:courseId/:subCourseId', async (req, res) => {
  try {
    const { courseId, subCourseId } = req.params;
    const { title, description } = req.body;

    // 验证主课程是否存在
    const [course] = await pool.query('SELECT id FROM courses WHERE id = ? LIMIT 1', [courseId]);
    if (course.length === 0) {
      return res.status(400).json({ error: '主课程不存在' });
    }

    // 检查子课程是否存在
    const [existingSubCourseId] = await pool.query('SELECT id FROM sub_courses WHERE id = ? LIMIT 1', [subCourseId]);
    if (existingSubCourseId.length === 0) {
      return res.status(400).json({ error: '子课程不存在' });
    }

    const [result] = await pool.query(
      'UPDATE sub_courses SET title = ?, description = ? WHERE id = ?',
      [title, description, subCourseId]
    );
    res.status(201).json({ message: '子课程更新成功' });

  } catch (err) {
    res.status(500).json({
      error: err.message || '服务器错误',
      detail: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});





//2-3.1获取某个子课程的知识点
router.get('/get/sub-courses/knowledge/:subCourseId', async (req, res) => {
  const { subCourseId } = req.params;
  try {
    const [knowledgePoints] = await pool.query('SELECT * FROM subcourse_knowledge WHERE sub_course_id = ?', [subCourseId]);
    res.json(knowledgePoints);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 2-3.2 添加上传某个子课程的知识点
router.post('/upload/sub-courses/knowledge/:subCourseId', async (req, res) => {
  const { subCourseId } = req.params;
  try {
    const { title, example, content, features, summary } = req.body;
    const featuresString = JSON.stringify(features);
    //验证子课程是否存在
    const [subCourse] = await pool.query('SELECT id FROM sub_courses WHERE id = ? LIMIT 1', [subCourseId]);
    if (subCourse.length === 0) {
      return res.status(400).json({ error: '子课程不存在' });
    }
    //插入数据
    const [result] = await pool.query(
      'INSERT INTO subcourse_knowledge (sub_course_id, title, example, content, features, summary) VALUES (?, ?, ?, ?, ?, ?)',
      [subCourseId, title, example, content, featuresString, summary]
    );
    res.status(201).json({
      id: result.insertId,
      message: '知识点上传成功'
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || '服务器错误',
      detail: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

//2-3.3 更新某个子课程的知识点
router.put('/update/sub-courses/knowledge/:subCourseId', async (req, res) => {
  const { subCourseId } = req.params;
  try {
    const { knowledgeId, title, example, content, features, summary } = req.body;
    const featuresString = JSON.stringify(features);
    //验证子课程是否存在
    const [subCourse] = await pool.query('SELECT id FROM sub_courses WHERE id = ? LIMIT 1', [subCourseId]);
    if (subCourse.length === 0) {
      return res.status(400).json({ error: '子课程不存在' });
    }

    // 更新数据
    const [result] = await pool.query(
      'UPDATE subcourse_knowledge SET title = ?, example = ?, content = ?, features = ?, summary = ? WHERE id = ? AND sub_course_id = ?',
      [title, example, content, featuresString, summary, knowledgeId, subCourseId]
    );
    res.status(201).json({ message: '知识点更新成功' });

  } catch (err) {
    res.status(500).json({
      error: err.message || '服务器错误',
      detail: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});




//2-4.1 获取某个子课程的练习题
router.get('/get/sub-courses/exercises/:subCourseId', async (req, res) => {
  const { subCourseId } = req.params;
  try {
    const [subCourseTitle] = await pool.query('SELECT title FROM sub_courses WHERE id = ? LIMIT 1', [subCourseId]);
    const [exercises] = await pool.query('SELECT * FROM subcourse_exercises WHERE sub_course_id = ?', [subCourseId]);
    if (exercises.length === 0) {
      return res.json({
        title: subCourseTitle[0].title,
        exercises: []
      });
    }
    res.json({
      title: subCourseTitle[0].title,
      exercises: exercises
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

//2-4.2 添加上传某个子课程的练习题
router.post('/upload/sub-courses/exercises/:subCourseId', async (req, res) => {
  const { subCourseId } = req.params;
  const { question, options, correctAnswer, analysis } = req.body;
  //验证子课程是否存在
  const [subCourse] = await pool.query('SELECT id FROM sub_courses WHERE id = ? LIMIT 1', [subCourseId]);
  if (subCourse.length === 0) {
    return res.status(400).json({ error: '子课程不存在' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO subcourse_exercises (sub_course_id, question, options, correct_answer, analysis) VALUES (?, ?, ?, ?, ?)',
      [subCourseId, question, JSON.stringify(options), correctAnswer, analysis]
    );
    res.status(201).json({
      id: result.insertId,
      message: '练习题上传成功'
    });
  } catch (err) {
    res.status(500).json({ error: err.message || '服务器错误' });
  }
});

//2-4.3 更新某个子课程的练习题
router.put('/update/sub-courses/:subCourseId/exercises', async (req, res) => {
  const { subCourseId } = req.params;
  try {
    const { exercisesId, question, options, correctAnswer, analysis } = req.body;
    console.log('更新练习题', exercisesId, question, options, correctAnswer, analysis);
    //验证子课程是否存在
    const [subCourse] = await pool.query('SELECT id FROM sub_courses WHERE id = ? LIMIT 1', [subCourseId]);
    if (subCourse.length === 0) {
      return res.status(400).json({ error: '子课程不存在' });
    }

    const [result] = await pool.query(
      'UPDATE subcourse_exercises SET question = ?, options = ?, correct_answer = ?, analysis = ? WHERE id = ? AND sub_course_id = ?',
      [question, JSON.stringify(options), correctAnswer, analysis, exercisesId, subCourseId]
    );
    res.status(201).json({ message: '练习题更新成功' });

  } catch (err) {
    res.status(500).json({ error: err.message || '服务器错误' });
  }
});






// 2-5课程视频评论处理
router.post('/video/:type/comment', async (req, res) => {
  const { type } = req.params;
  try {
    if (type == 'upload') {
      const { userId, courseId, content } = req.body;
      await pool.query(
        'INSERT INTO c_videocomments (user_id, course_id, content) VALUES (?, ?, ?)',
        [userId, courseId, content]
      );
      res.status(201).json({ message: '评论成功' });
    }

    else if (type == 'get') {
      const { courseId } = req.body;
      const [comments] = await pool.query(
        `SELECT c.id, c.user_id, c.content, c.created_at, 
        u.avatar, u.nickname AS author 
        FROM c_videocomments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.course_id = ?`, [courseId]
      );
      res.json(comments);
    }
    else {
      return res.status(400).json({ error: `请明确请求类型参数type:${type}` });
    }
  } catch (err) {
    console.error('评论失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
