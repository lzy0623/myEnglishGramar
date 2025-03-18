import { dbConfig } from '../backend/config.js'

import express from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();
const pool = mysql.createPool(dbConfig);



//6-1用户做题信息上传
router.post('/upload/:type', async (req, res) => {
  const { type } = req.params
  const { userId, data } = req.body
  if (!Array.isArray(data)) {
    data = [data]
  }
  try {
    switch (type) {
      case 'community':
        const [result] = await pool.query(`SELECT community_question FROM user_progress_community WHERE user_id = ? LIMIT 1`, [userId])
        if (result.length === 0) {
          const dataString = JSON.stringify(data)
          await pool.query(`INSERT INTO user_progress_community (user_id, community_question) VALUES (?, ?)`, [userId, dataString])
          return res.json({ message: '插入成功,首次保存' })
        } else {
          const resultData = result[0].community_question
          const newData = data.concat(resultData)
          const newDataString = JSON.stringify(newData)
          await pool.query(`UPDATE user_progress_community SET community_question = ? WHERE user_id = ?`, [newDataString, userId])
          return res.json({ message: '插入成功,非首次保存' })
        }
      case 'exercise':
        const { subCourseId } = req.body
        const [resultExercise] = await pool.query(`SELECT course_question FROM user_progress_exercise WHERE user_id = ? AND subcourse_id= ? LIMIT 1`, [userId, subCourseId])
        if (resultExercise.length === 0) {
          const dataString = JSON.stringify(data)
          await pool.query(`INSERT INTO user_progress_exercise (user_id, subcourse_id, course_question) VALUES (?, ?, ?)`, [userId, subCourseId, dataString])
          return res.json({ message: '插入成功,首次保存' })
        } else {
          const dataString = JSON.stringify(data)
          await pool.query(`UPDATE user_progress_exercise SET course_question = ? WHERE user_id = ? AND subcourse_id= ?`, [dataString, userId, subCourseId])
          return res.json({ message: '插入成功,非首次保存' })
        }
    }
  }
  catch (err) {
    console.error('6-1用户进度过程信息错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
}
)

//6-2用户做题信息获取
router.get('/get/:type/:userId', async (req, res) => {
  const { type, userId } = req.params
  try {
    switch (type) {
      case 'community':
        const [result] = await pool.query(`SELECT community_question FROM user_progress_community WHERE user_id = ? LIMIT 1`, [userId])
        if (result.length === 0) {
          return res.json({ data: [] });
        }
        const resultData = result[0].community_question
        return res.json({ data: resultData })

      case 'exercise':
        const { subCourseId } = req.query;
        const [resultExercise] = await pool.query(`SELECT course_question FROM user_progress_exercise WHERE user_id = ? AND subcourse_id= ? LIMIT 1`, [userId, subCourseId])
        if (resultExercise.length === 0) {
          return res.json({ data: [] })
        }
        const resultExerciseData = resultExercise[0].course_question
        return res.json({ data: resultExerciseData })

      case 'course':
        const [resultCourse] = await pool.query(`SELECT course FROM user_progress WHERE user_id = ? LIMIT 1`, [userId])
        if (resultCourse.length === 0) {
          return res.json({ data: [] })
        }
        const resultCourseData = resultCourse[0].course
        return res.json({ data: resultCourseData })
      default:
        return res.status(400).json({ error: '参数无效,请刷新重试' });
    }
  } catch (err) {
    console.error('获取错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
})






// 更新用户课程进度
router.post('/course/update', async (req, res) => {
  const { userId, courseId, subCourseId, completed } = req.body;
  try {
    const [existing]= await pool.query(
      'SELECT user_id FROM user_progress_course WHERE user_id = ? AND course_id = ? AND sub_course_id = ? LIMIT 1',
      [userId, courseId, subCourseId]
    );
    if (existing.length > 0) {
      return res.json({ message: '该记录已存在' });
    }

    const [result] = await pool.query(
      'INSERT INTO user_progress_course (user_id, course_id, sub_course_id, completed) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE completed = VALUES(completed)',
      [userId, courseId, subCourseId, completed]
    );
    res.status(200).json({ message: '进度更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message || '服务器错误' });
  }
});

// 查询用户进度
router.get('/course/get/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [progress] = await pool.query(
      'SELECT course_id, sub_course_id, completed FROM user_progress_course WHERE user_id = ?',
      [userId]
    );
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message || '服务器错误' });
  }
});

export default router;

