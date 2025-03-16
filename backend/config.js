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
  port: 3306,        // 数据库端口，默认是 3306
};

export const uploadResourcesConfig = {// 静态资源路径,图片视频等路径配置
  IMG_AVATAR_PATH: 'public/images/imgavatars',//用户头像路劲
  IMG_SENTENCE_PATH: 'public/images/imgsentences',//每日一句图片路劲
  VIDEO_COURSE_PATH: 'public/videos'//课程视频路劲
}

