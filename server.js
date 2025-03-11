const express = require('express');// 引入Express框架，用于创建web服务器
const cors = require('cors');// 引入CORS中间件，用于处理跨域请求
const mysql = require('mysql2/promise');// 引入MySQL2的Promise实现，用于数据库操作
const app = express();// 创建Express应用实例

// 数据库配置
const pool = mysql.createPool({
  host: 'localhost',//数据库地址
  user: 'root',//数据库用户名
  password: '123456', //数据库密码
  database: 'english_grammar_system',//数据库名
  waitForConnections: true,//是否等待连接
  connectionLimit: 10//最大连接数
});


// 中间件
app.use(express.json()); // 解析JSON请求体
app.use(cors()); // 允许跨域

//图片视频文件处理
const multer = require('multer'); //处理文件上传
const path = require('path');//处理文件路径
const fs = require('fs');
const { timeLog } = require('console');
const { type } = require('os');
const { title, resourceUsage } = require('process');




//0---------------------------------用户模块API-------------------------------------
// 0-1注册接口
app.post('/api/user/register', async (req, res) => {
  //async 是一个关键字，用于定义一个异步函数。req请求体，res响应体
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (!/^\d{11}$/.test(username)) {
    return res.status(400).json({ error: '用户名不符合11位数字格式' });
  }
  if (!/^[a-zA-Z0-9]{6,20}$/.test(password)) {
    return res.status(400).json({ error: '密码不符合6-20位字母数字组合' });
  }
  try {
    // 先检查用户名是否已存在
    const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: '该用户名已存在,可直接前往登录' });
    }
    const nickname = '用户' + username;//构造用户昵称
    // 插入新用户
    await pool.query('INSERT INTO users (username, password,nickname) VALUES (?, ?, ?)', [username, password, nickname]);
    res.status(201).json({ message: '注册成功可前往登录' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误!' });
  }
});

// 0-2登录接口
app.post('/api/user/login', async (req, res) => {
  const { username, password } = req.body;
  // 检查用户名和密码是否为空
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  try {
    // 查询用户
    const [users] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    if (users.length === 0) {
      return res.status(400).json({ error: '用户不存在,请前往注册' });
    }
    const user = users[0];
    if (password === user.password) {
      res.json({
        message: '登录成功',
        user: {
          id: user.id,//用户id
          username: user.username,//用户名
          nickname: user.nickname, //昵称
          avatar: user.avatar, //头像
          vip: user.vip,//是否VIP
          level: user.level,//等级
          admin: user.admin,//是否管理员
          created_at: user.created_at//注册时间
        }
      });
    } else {
      res.status(400).json({ error: '密码错误' });
    }
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 0-3忘记密码接口
app.post('/api/user/forgot-password', async (req, res) => {
  const { username, password } = req.body;
  // 检查用户名和密码是否为空
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (!/^[a-zA-Z0-9]{6,20}$/.test(password)) {
    return res.status(400).json({ error: '密码不符合6-20位字母数字组合' });
  }
  try {
    // 检查是否存在这个用户名
    const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    if (existingUser.length === 0) {
      return res.status(400).json({ error: '该用户不存在，请仔细检查用户名或前往注册' });
    }
    // 修改该用户密码（明文密码）
    await pool.query('UPDATE users SET password = ? WHERE username = ?', [password, username]);
    res.status(201).json({ message: '修改密码成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 0-4新增获取当前用户信息接口
app.get('/api/user/:userId/current-user', async (req, res) => {
  const { userId } = req.params
  if (!userId) {
    return res.status(400).json({ error: '用户名为空,请先登录' });
  }
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
    if (users.length > 0) {
      const user = users[0];
      res.json({
        message: '获取成功',
        user: {
          id: user.id,//用户id
          username: user.username,//用户名
          nickname: user.nickname, //昵称
          avatar: user.avatar, //头像
          vip: user.vip,//是否VIP
          level: user.level,//等级
          admin: user.admin,//是否管理员
          created_at: user.created_at//注册时间
        }
      });
    } else {
      res.status(400).json({ error: '用户不存在' });
    }
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});



//1--------------------- 每日一句接口管理-------------------------
//配置multer图片存储
const imgstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 指定文件存储的目录，使用 path 模块拼接目录路径
    cb(null, path.join(__dirname, 'public/images/imgsentences'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);// 获取文件扩展名
    const destination = path.join(__dirname, 'public/images/imgsentences', file.originalname);
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
app.get('/api/get/:date/sentence', async (req, res) => {
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
app.post('/api/upload/sentence', upload.single('image'), async (req, res) => {
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




//2----------------------------------语法课程接口----------------------------------------------------
//视频上传配置 
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/videos')); // 视频存储目录
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

//2-1获取所有主课程
app.get('/api/get/courses', async (req, res) => {
  try {
    const [courses] = await pool.query('SELECT * FROM courses');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 2-1.1上传添加主课程
app.post('/api/upload/course', videoUpload.single('video'), async (req, res) => {
  try {
    const { title, description, userId, userName } = req.body;
    const videoPath = req.file ? `${req.file.filename}` : null;
    // 检查用户是否为管理员
    const [user] = await pool.query('SELECT admin FROM users WHERE id = ? AND username = ? LIMIT 1', [userId, userName])
    if (!user[0].admin) {
      return res.status(403).json({ error: '你不是管理员,权限不足' });
    }
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


//2-2获取某个主课程的子课程
app.get('/api/get/courses/:courseId/sub-courses', async (req, res) => {
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

//2-2.1添加上传某个主课程的子课程
app.post('/api/upload/courses/:courseId/sub-course', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, userId, userName } = req.body;

    // 验证用户是否为管理员
    const [user] = await pool.query('SELECT admin FROM users WHERE id = ? AND username = ? LIMIT 1', [userId, userName])
    if (!user[0].admin) {
      return res.status(403).json({ error: '你不是管理员,权限不足' });
    }
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


//2-3获取某个子课程的知识点
app.get('/api/get/sub-courses/:subCourseId/knowledge', async (req, res) => {
  const { subCourseId } = req.params;
  try {
    const [knowledgePoints] = await pool.query('SELECT * FROM subcourse_knowledge WHERE sub_course_id = ?', [subCourseId]);
    res.json(knowledgePoints);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 2-3-1 添加上传某个子课程的知识点
app.post('/api/upload/sub-courses/:subCourseId/knowledge', async (req, res) => {
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


//2-4 获取某个子课程的练习题
app.get('/api/get/sub-courses/:subCourseId/exercises', async (req, res) => {
  const { subCourseId } = req.params;
  try {
    const [subCourseTitle] = await pool.query('SELECT title FROM sub_courses WHERE id = ? LIMIT 1', [subCourseId]);
    const [exercises] = await pool.query('SELECT * FROM subcourse_exercises WHERE sub_course_id = ?', [subCourseId]);
    res.json({
      title: subCourseTitle[0].title,
      exercises: exercises
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

//2-4.1 添加上传某个子课程的练习题
app.post('/api/upload/sub-course/:subCourseId/exercise', async (req, res) => {
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
    res.status(500).json({
      error: err.message || '服务器错误',
    });
  }
});

// 2-5课程视频评论处理
app.post('/api/course/video/:type/comment', async (req, res) => {
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





// ----------------------------------3每日短文模块接口管理------------------------------------------------------------
//3-1获取单篇短文详情（通过日期）
app.get('/api/get/:date/articles/:level', async (req, res) => {
  const { date, level } = req.params;
  try {
    //数组解构赋值：articles 实际上是查询结果中的 rows 部分，即符合查询条件的所有文章记录。
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
app.post('/api/upload/article', async (req, res) => {
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




// ----------------------------------4社区讨论------------------------------------------------------------
//4-1获取讨论题目
app.get('/api/discussion/get/:type/questions', async (req, res) => {
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
// 4-2获取某个题目的点赞数
app.get('/api/discussion/get/:questionId/likes-count', async (req, res) => {
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
app.get('/api/discussion/get/:questionId/comment-count', async (req, res) => {
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
app.get('/api/discussion/get/:questionId/question', async (req, res) => {
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

// 4-5获取某个题目的评论
app.get('/api/discussion/get/:questionId/comments', async (req, res) => {
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

// 4-5.1提交某个题目的评论
app.post('/api/discussion/upload/:questionId/comment', async (req, res) => {
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


// 4-1.1上传用户的讨论题目
app.post('/api/discussion/upload/question', async (req, res) => {
  const { userId, question, options, correctAnswer, analysis, type } = req.body;
  try {
    // 插入题目到数据库
    await pool.query(
      'INSERT INTO discussion_questions (user_id, question, options, correct_answer, analysis, type) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, question, JSON.stringify(options), correctAnswer, analysis, type]
    );
    res.status(201).json({ message: '题目上传成功' });
  } catch (err) {
    console.error('上传题目失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 点赞或取消点赞
app.post('/api/discussion/liked', async (req, res) => {
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

// 获取某位用户的点赞状态
app.get('/api/discussion/get/:userId/user-likes', async (req, res) => {
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



//5-1用户中心获取用户的社区讨论信息
app.get('/api/userinfo/get/:userId/:type/discussion-data', async (req, res) => {
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


// 配置multer图片存储
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/images/imgavatars'));
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
//5-2更新用户信息
app.post('/api/userinfo/update-info', avatarUpload.single('avatar'), async (req, res) => {
  const { userId, username, nickname } = req.body;
  let imagePath = req.file ? `${req.file.filename}` : null;
  try {
    // 验证用户存在
    const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!user.length) return res.status(404).json({ error: '用户不存在或者未登录' });
    // 更新头像逻辑
    if (!imagePath) {
      imagePath = user[0].avatar;
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
app.post('/api/userinfo/update-vip', async (req, res) => {
  const { userId, vipType } = req.body;
  if (!userId || !vipType) {
    return res.status(400).json({ error: '参数为空,请重试' });
  }
  try {
    const [result] = await pool.query(`SELECT vip FROM users WHERE id = ? AND vip = ? LIMIT 1`, [userId, vipType])
    if (result.length > 0) {
      return res.status(400).json({ error: '你已经开通过会员了' });
    }
    await pool.query('UPDATE users SET vip = ? WHERE id = ?', [vipType, userId]
    );
    res.json({ message: '你已经成功订购会员' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误', details: err.message });
  }
});




//6-1用户进度过程信息上传
app.post('/api/user/upload/:type/progress', async (req, res) => {
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
        console.log('6-1subCourseId:', subCourseId)
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

//6-2用户进度过程信息获取
app.get('/api/user/get/:type/:userId/progress', async (req, res) => {
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



// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器已启动:http://localhost:${PORT}`);
});