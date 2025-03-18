import { config } from '../../backend/config.js';

// 获取每日一句
async function loadDailySentence(selectDate) {
  if (!selectDate) {
    selectDate = new Date().toISOString().split('T')[0];
  }
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/sentence/get/${selectDate}`);
    const result = await response.json();
    if (response.ok) {
      // 更新日期
      const date = new Date(result.date);
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' });
      // 更新页面内容
      document.querySelector('.daily-sentence img').src = `${config.IMG_SENTENCE_PATH}${result.image_url}`
      document.querySelector('.english').textContent = result.sentence;
      document.querySelector('.translation').textContent = result.translation;
      document.querySelector('.dateday strong').textContent = day;
      document.querySelector('.datemoon strong').textContent = month;
    } else {
      document.querySelector('.english').textContent = result.error;
      document.querySelector('.translation').textContent = ''
    }
  } catch (err) {
    console.error('前端请求错误:', err);
  }
}

// 生成日期选项并添加到select中
function generateDateOptions() {
  const dateSelector = document.getElementById('selectDate');
  const dates = getDateRange(4, 'past');
  console.log(dates);
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date
    option.textContent = date.slice(5)
    dateSelector.appendChild(option);
  });
}

// 页面加载时调用
window.onload = function () {
  loadDailySentence();
  generateDateOptions();
};

// DOM加载完成后执行添加点击事件
document.addEventListener('DOMContentLoaded', function () {
  // 判断用户是否登录,显示登录模块
  if (!getCurrentUser()) {
    const loginCard = document.getElementById('login-card');
    loginCard.classList.remove('hidden')
    loginCard.innerHTML = `<a href="a_login.html"><img src="../icon/index_login.jpeg"></a>`;
  }

  //根据日期加载相应句子
  document.getElementById('selectDate').addEventListener('change', () => {
    const selectDate = document.getElementById('selectDate').value;
    loadDailySentence(selectDate)
  });

  // 显示或者隐藏翻译
  document.getElementById('translateToggle').addEventListener('click', function () {
    const translationContent = document.querySelector('.translation');
    const actionsBox = document.querySelector('.actions')
    translationContent.classList.toggle('hidden');
    translationContent.classList.toggle('show');
    actionsBox.style.marginTop = translationContent.classList.contains('show') ? '0px' : '20px';

    setTimeout(() => {

    }, 100);



  });

  // 判断用户是否为管理员,显示管理按钮
  if (getCurrentUser().admin) {
    document.getElementById('upload-information-box').innerHTML = `
      <div class="upload-information" id="uploadSentence">添加每日一句</div>`;
    document.getElementById('uploadSentence').addEventListener('click', () => {
      window.open('../tob/b_uploadsentence.html', '_blank');
    });
  }
});


