export const config = {
  API_BASE_URL: 'http://localhost:3000',// 后端API的根URL
  IMG_AVATAR_PATH: '../../public/images/imgavatars/',//用户头像路劲
  IMG_SENTENCE_PATH: '../../public/images/imgsentences/',//每日一句图片路劲
  VIDEO_COURSE_PATH: '../../public/videos/'//课程视频路劲
};

export const dbConfig = {
  host: 'localhost', // 数据库主机地址
  user: 'root',      // 数据库用户名
  password: '123456',      // 数据库密码
  database: 'english_grammar_system', // 数据库名称
  waitForConnections: true,//是否等待连接，可不更改
  connectionLimit: 10//连接池最大连接数，可不更改
};

export const uploadResourcesConfig = {// 静态资源路径,图片视频等路径配置
  IMG_AVATAR_PATH: 'public/images/imgavatars',//用户头像路劲
  IMG_SENTENCE_PATH: 'public/images/imgsentences',//每日一句图片路劲
  VIDEO_COURSE_PATH: 'public/videos'//课程视频路劲
}

