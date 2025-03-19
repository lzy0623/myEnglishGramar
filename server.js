import userRoutes from './routes/user.js';
import dailySentenceRoutes from './routes/dailySentence.js';
import coursesRoutes from './routes/courses.js';
import articlesRoutes from './routes/articles.js';
import discussionRoutes from './routes/discussion.js';
import userInfoRoutes from './routes/userInfo.js';
import userProgressRoutes from './routes/userProgress.js';

import express from 'express'// 引入Express框架，用于创建web服务器
import cors from 'cors';// 引入CORS中间件，用于处理跨域请求
const app = express();// 创建Express应用实例
app.use(express.json()); // 解析JSON请求体
app.use(cors()); // 允许跨域

app.use('/api/user', userRoutes);
app.use('/api/sentence', dailySentenceRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/discussion', discussionRoutes);
app.use('/api/userInfo', userInfoRoutes);
app.use('/api/user-progress', userProgressRoutes);

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器已启动:http://localhost:${PORT}`);
});
   