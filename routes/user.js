import { dbConfig } from '../backend/config.js';//引入数据库配置文件

import express from 'express';//引入express
import mysql from 'mysql2/promise';//引入mysql2/promise


const router = express.Router();//引入express路由
const pool = mysql.createPool(dbConfig);//创建一个数据库连接池


// 0-1注册接口
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
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
router.post('/forgot-password', async (req, res) => {
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
router.get('/:userId/current-user', async (req, res) => {
  const { userId } = req.params
  if (!userId) {
    return res.status(400).json({ error: '用户不存在,请先登录' });
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


export default router;
