import { config } from '../../backend/config.js';
async function loadArticle(level) {
  isAdmin();
  try {
    const date = getDateRange(1);
    const container = document.getElementById('article-container');
    const response = await fetch(`${config.API_BASE_URL}/api/articles/get/${date}/${level}`)
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


function isAdmin() {
  const articleBox = document.getElementById('article-container');
  const uploadBox = document.getElementById('upload-article-box');
  //是管理员,上传短文
  if (getCurrentUser().admin) {
    uploadBox.innerHTML = '<div class="upload-information" id="uploadArticle">添加短文</div>';
    document.getElementById('uploadArticle').addEventListener('click', () => {
      window.open('../tob/d_uploadessay.html', '_blank')
    })
  }
  //不是管理员,显示字体信息
  else {
    uploadBox.innerHTML = `
      <div class="font">
        <select id="font">
          <option value="-apple-system, sans-serif">apple</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="Roboto, sans-serif">Roboto</option>
          <option value="Open Sans, sans-serif">Open Sans</option>
          <option value="Merriweather, serif">Merriweather</option>
        </select>
      </div>
      <div class="font-weight">
        <select id="font-weight">
          <option value="300">300</option>
          <option value="400">400</option>
          <option value="500">500</option>
        </select>
      </div>
      `
    // 字体选择
    const fontSelect = document.getElementById('font');
    fontSelect.addEventListener('change', () => {
      const font = fontSelect.value;
      console.log('字体', font);
      articleBox.style.fontFamily = `${font}`;
    });
    // 字体粗细选择
    const fontWeightSelect = document.getElementById('font-weight')
    fontWeightSelect.addEventListener('change', () => {
      const fontWeight = fontWeightSelect.value;
      console.log('字体粗细', fontWeight);
      articleBox.style.fontWeight = `${fontWeight}`;

    })
  }
}




// 页面加载时调用
window.onload = loadArticle('初级');