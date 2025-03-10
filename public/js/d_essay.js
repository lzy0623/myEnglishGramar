async function loadArticle(level) {
  if (getCurrentUser().admin) {
    document.getElementById('upload-article-box').innerHTML = `<div class="upload-information" onclick="uploadEssay()">添加短文</div>`;
  }
  try {
    //获取今日日期
    const date = getDateRange(1);
    console.log(date);
    const container = document.getElementById('article-container');
    // 调用后端 API 获取短文详情
    const response = await fetch(`http://localhost:3000/api/get/${date}/articles/${level}`)
    const article = await response.json();
    if (!response.ok) {
      container.innerHTML = `<p>加载短文失败错误!<br><br>原因: ${article.error}</p>`;
      return;
    }
    if (!article.content) {
      //throw new Error 抛出的错误会在 catch 块中被捕获
      throw new Error('今日暂时没有短文');
    }
    // 渲染短文内容
    container.innerHTML = `
      <div class="article-header">
        <div class="time">
          <p>${new Date(article.date).toLocaleDateString('zh-CN')}</p>
        </div>
          <h1>${article.title}</h1>
      </div>
      <div class="article-content">
        ${article.content.map(paragraph => `
          <div class="english">
            <p>${paragraph.english}</p>
          </div>
          <div class="translate">
            <p>${paragraph.translate}</p>
          </div>`).join('')}
      </div>`;
  } catch (err) {
    const container = document.getElementById('article-container');
    container.innerHTML = `<p>加载短文失败错误原因: ${err.message}</p>`;
  }
}

//显示隐藏翻译
function toggleTranslate() {
  const translates = document.querySelectorAll('.translate')
  translates.forEach(translate => {
    translate.style.display = translate.style.display === 'none' ? 'block' : 'none';
  });
}
//根据水平难度选择短文
function selectLevel(level) {
  loadArticle(level);
}
//跳转上传短文页面
function uploadEssay() {
  window.open('tob/d_uploadessay.html', '_blank')
}

// 页面加载时调用
window.onload = loadArticle('初级');