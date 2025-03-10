// 获取每日一句
async function loadDailySentence(selectDate) {
  if (!selectDate) {
    selectDate = new Date().toISOString().split('T')[0];
  }
  try {
    const response = await fetch(`http://localhost:3000/api/get/${selectDate}/sentence`);
    const result = await response.json();
    if (response.ok) {
      // 更新日期
      const date = new Date(result.date);
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' });
      // 更新页面内容
      document.querySelector('.daily-sentence img').src = `images/imgsentences/${result.image_url}`
      document.querySelector('.english').textContent = result.sentence;
      document.querySelector('.translation').textContent = result.translation;
      document.querySelector('.dateday strong').textContent = day;
      document.querySelector('.datemoon strong').textContent = month;
    } else {
      document.querySelector('.english').textContent = result.error;
    }
  } catch (err) {
    console.error('前端请求错误:', err);
  }
}

//根据日期加载相应句子
function getSentenceByDate() {
  const selectDate = document.getElementById('selectDate').value;
  loadDailySentence(selectDate)
}

// 显示或者隐藏翻译
document.getElementById('translateToggle').addEventListener('click', function () {
  const translationContent = document.querySelector('.translation');
  translationContent.classList.toggle('hidden');
  translationContent.classList.toggle('show');
});
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
//控制动态变化
const sentenceBox = document.querySelector('.daily-sentence')
const imgBox = document.querySelector('.daily-sentence>img');
const englishBox = document.querySelector('.english');
const translationBox = document.querySelector('.translation');
const actionsBox = document.querySelector('.actions')
sentenceBox.addEventListener('mouseenter', function () {
  imgBox.style.width = '500px'
  imgBox.style.height = '200px'
  englishBox.style.width = '500px'
  translationBox.style.width = '500px'
  actionsBox.style.width = '500px'
})
sentenceBox.addEventListener('mouseleave', function () {
  imgBox.style.width = '460px'
  imgBox.style.height = '180px'
  englishBox.style.width = '460px'
  translationBox.style.width = '460px'
  actionsBox.style.width = '460px'
})


// 页面加载时调用
window.onload = function () {
  loadDailySentence();
  generateDateOptions(); // 生成日期选项
};


//-----------------------------管理员功能-------------------------------
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
  const loginCard = document.getElementById('login-card');
  loginCard.classList.remove('hidden')
  loginCard.innerHTML = `<a href="a_login.html"><img src="images/index_login.jpeg"></a>`;
}
if (currentUser.admin) {
  document.getElementById('upload-information-box').innerHTML = `
  <div class="upload-information" onclick="uploadSentence()">添加每日一句</div>`;
}
// 管理员功能点击上传按钮跳转到上传每日一句界面
function uploadSentence() {
  window.open('tob/b_uploadsentence.html', '_blank');
}


