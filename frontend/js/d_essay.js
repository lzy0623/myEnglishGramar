import { config } from '../../backend/config.js';
async function loadArticle(level) {
  if (!getCurrentUser().admin) {
    document.getElementById('upload-article-box').style.display = 'none';
  }
  try {
    const date = getDateRange(1);
    const container = document.getElementById('article-container');
    const response = await fetch(`${config.API_BASE_URL}/api/get/${date}/articles/${level}`)
    const article = await response.json();

    if (!response.ok) {
      container.innerHTML = `<p>加载短文失败错误!<br><br>原因: ${article.error}</p>`;
      return;
    }
    
    container.innerHTML = `
      <div class="article-header">
        <div class="time">
          <p>${new Date(article.date).toLocaleDateString('zh-CN').replace(/\//g, '-')}</p>
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
document.getElementById('toggleTranslate').addEventListener('click', () => {
  const translates = document.querySelectorAll('.translate')
  translates.forEach(translate => {
    translate.style.display = translate.style.display === 'none' ? 'block' : 'none';
  });
})

//根据难度加载短文
document.getElementById('level-select').addEventListener('change', (event) => {
  const level = event.target.value;
  loadArticle(level);
})

//跳转上传短文页面
document.getElementById('uploadArticle').addEventListener('click', () => {
  window.open('../tob/d_uploadessay.html', '_blank')
})


// 页面加载时调用
window.onload = loadArticle('初级');