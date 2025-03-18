import { config } from '../../backend/config.js';

let likedIds = [];//记录点赞的题目id用来加载
let isType = false;//选择题目类型进行题目加载的标识符
let correctQeuestionIds = [];//记录已经做题并且正确的题目id下次就不在加载
// 加载讨论题目
async function loadDiscussionQuestions(questionType) {
  try {
    const contentContainer = document.getElementById('discussion-box');
    const userId = getCurrentUser().id;
    //获取讨论题目 
    const response = await fetch(`${config.API_BASE_URL}/api/discussion/get/${questionType}/questions`);
    const questions = await response.json();
    if (!response.ok) {
      contentContainer.innerHTML = `<p>后端响应失败:${questions.error}</p>`;
      contentContainer.style.color = 'red';
      return;
    }
    // 获取当前登录用户的点赞状态
    const likesResponse = await fetch(`${config.API_BASE_URL}/api/discussion/get/${userId}/user-likes`);
    const { likedQuestionIds } = await likesResponse.json();
    likedIds = likedQuestionIds;

    //获取用户的做题记录
    const type = 'community'
    const correctResponse = await fetch(`${config.API_BASE_URL}/api/user-progress/get/${type}/${userId}`);
    const correctQuestionIds = await correctResponse.json();
    const correctQuestionIdsArray = correctQuestionIds.data.map(id => parseInt(id, 10));
    const filteredQuestions = questions.filter(question => !correctQuestionIdsArray.includes(question.id))

    contentContainer.innerHTML = filteredQuestions.map(question => `
      <div class="discussion-card">
        <div class="discussion-header">
          <div class="headphoto">
            <img src="${config.IMG_AVATAR_PATH}${question.avatar}">
          </div>
          <div class="author">${question.author}<br>
            <span>${new Date(question.created_at).toLocaleDateString().replace(/\//g, '-')}</span>
          </div>
        </div>
        <div class="discussion-content">
          ${question.question}
        </div>

        <div class="discussion-options" id="${question.id}">
          ${question.options.map((option, optionIndex) => `
            <div class="option" data-option="${String.fromCharCode(65 + optionIndex)}" data-correct-answer="${question.correct_answer}">
            ${option}
            <span class="optionHint"></span>
            </div>`).join('')}
        </div>

        <div class="discussion-footer" data-question-id="${question.id}">
          <div class="analysisBtn">
            <img src="../icon/check_answer.png" class="checkimg"> 
            <span>解析</span>
          </div>
          <div class="likeBtn">
            <img id="like-icon-${question.id}" src="${likedQuestionIds.includes(question.id) ? '../icon/like_have.png' : '../icon/like_not.png'}">
            <span id="like-count-${question.id}"></span>
          </div>
          <div class="commentBtn">
            <img src="../icon/comment.png">
            <span id="comment-count-${question.id}"></span>
          </div>
        </div>

        <div class="answer" id="answer-${question.id}" style="display: none;">
          <span>解析:</span> ${question.analysis}
        </div>
      </div>`).join('');

    //初始化每个题目的互动数据
    filteredQuestions.forEach(question => {
      loadLikes(question.id);
      loadCommentCount(question.id);
    });

    bindEventListeners();
  } catch (err) {
    document.getElementById('discussion-box').innerHTML = '<p>前端请求练习题失败</p>';
    document.getElementById('discussion-box').style.color = 'red';
  }
}

// 加载点赞数
async function loadLikes(questionId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/discussion/get/${questionId}/likes-count`);
    const { count } = await response.json();
    document.getElementById(`like-count-${questionId}`).textContent = count;
  } catch (err) {
    console.error('加载点赞数失败:', err);
  }
}
// 加载评论数
async function loadCommentCount(questionId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/discussion/get/${questionId}/comment-count`);
    const { count } = await response.json();
    document.getElementById(`comment-count-${questionId}`).textContent = count;
  } catch (err) {
    console.error('加载评论数失败:', err);
  }
}
// 点赞/取消点赞
async function toggleLike(questionId) {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'))
    const userId = currentUser.id
    const response = await fetch(`${config.API_BASE_URL}/api/discussion/liked`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionId })
    });
    const result = await response.json();

    // 更新点赞图标和点赞数
    const likeIcon = document.getElementById(`like-icon-${questionId}`);
    likeIcon.src = result.isLiked ? '../icon/like_have.png' : '../icon/like_not.png';
    loadLikes(questionId); // 刷新点赞数
  } catch (err) {
    console.error('操作失败:', err);
  }
}
//进入评论区
function toggleComments(questionId) {
  const questionDiv = document.getElementById(questionId)
  let correctOption = questionDiv.querySelector('.option.correct')
  let incorrectOption = questionDiv.querySelector('.option.incorrect')
  let correctAnswer = correctOption ? correctOption.getAttribute('data-option') : null;
  let incorrectAnswer = incorrectOption ? incorrectOption.getAttribute('data-option') : null;
  let isLiked = document.getElementById(`like-icon-${questionId}`).src.includes('like_have.png')
  let likeCount = document.getElementById(`like-count-${questionId}`).textContent
  const url = `e_comment.html?questionId=${questionId}&isLiked=${isLiked}&likeCount=${likeCount}&correctAnswer=${correctAnswer}&incorrectAnswer=${incorrectAnswer}`;
  window.open(url, '_blank');
}

// 接收评论页面传递的信息
async function receiveQuestionInfo(questionInfo) {
  const questionId = questionInfo.questionId;
  const correctAnswer = questionInfo.correctAnswer;
  const incorrectAnswer = questionInfo.incorrectAnswer;
  console.log(questionInfo)
  document.getElementById(`like-icon-${questionId}`).src = questionInfo.isLiked ? '../icon/like_have.png' : '../icon/like_not.png';
  const questionDiv = document.getElementById(questionId)
  const options = questionDiv.querySelectorAll('.option');
  options.forEach(option => {
    option.classList.remove('correct', 'incorrect');
    option.querySelector('.optionHint').textContent = '';
  });
  options.forEach(option => {
    const dataOption = option.getAttribute('data-option')
    if (dataOption === correctAnswer) {
      option.classList.add('correct');
      option.querySelector('.optionHint').textContent = '✅答案正确!';
    }
    else if (dataOption === incorrectAnswer) {
      option.classList.add('incorrect');
      option.querySelector('.optionHint').textContent = '❌答案错误!';
    }
  });
  loadLikes(questionId);
  loadCommentCount(questionId);
}

//提交答案并且比对
function selectOption(correctAnswer, selectedAnswer, questionId, event) {
  const options = event.target.parentElement.querySelectorAll('.option');
  options.forEach(option => {
    option.classList.remove('correct', 'incorrect');
    option.querySelector('.optionHint').textContent = '';
  });

  if (selectedAnswer === correctAnswer) {
    event.target.classList.add('correct');
    event.target.querySelector('.optionHint').textContent = `✅答案正确!`;
    if (!correctQeuestionIds.includes(questionId)) {
      correctQeuestionIds.push(questionId)
    }
  }
  else {
    event.target.classList.add('incorrect');
    event.target.querySelector('.optionHint').textContent = `❌答案错误!`;
    if (correctQeuestionIds.includes(questionId)) {
      correctQeuestionIds.splice(correctQeuestionIds.indexOf(questionId), 1)
    }
  }
}

// 选择题目类型进行题目加载
function selectQuestionType(questionType) {
  isType = true
  const selectElement = document.getElementById('selectQuestionType')
  const tipsElement = document.getElementById('isTips');
  selectElement.disabled = true;
  let countdown = 5;
  tipsElement.textContent = `${countdown} 秒后可再次选择`;
  tipsElement.style.display = 'block';

  const intervalId = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(intervalId);
      tipsElement.style.display = 'none';
      selectElement.disabled = false;
      isType = false;
    } else {
      tipsElement.textContent = `${countdown} 秒后可再次选择`;
    }
  }, 1000);
  loadDiscussionQuestions(questionType);
}

//保存用户答题记录
async function saveQuestionRecords() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))
  if (correctQeuestionIds.length === 0) {
    alert('请先答题')
    return
  }
  const userId = currentUser.id
  const type = 'community'
  const response = await fetch(`${config.API_BASE_URL}/api/user-progress/upload/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      data: correctQeuestionIds
    })
  })
  const result = await response.json();
  if (response.ok) {
    alert('答题记录保存成功' + result.message)
  } else {
    alert('答题记录保存失败' + result.errorj)
  }
}

//绑定事件监听器
function bindEventListeners() {
  const contentContainer = document.getElementById('discussion-box');

  contentContainer.addEventListener('click', (event) => {
    const target = event.target;

    //点击答案选项事件
    if (target.classList.contains('option')) {
      console.log('评论页面')
      const optionsBox = target.closest('.discussion-options');
      const questionId = optionsBox.id
      const correctAnswer = target.getAttribute('data-correct-answer');
      const selectedAnswer = target.getAttribute('data-option');
      selectOption(correctAnswer, selectedAnswer, questionId, event);
      event.stopPropagation();
    }

    //显示隐藏答案
    if (target.closest('.analysisBtn')) {
      const btnBox = target.closest('.discussion-footer')
      const questionId = btnBox.getAttribute('data-question-id');
      const answerDiv = document.getElementById(`answer-${questionId}`);
      answerDiv.style.display = answerDiv.style.display === 'none' ? 'block' : 'none';
      event.stopPropagation();
    }

    //点赞取消点赞
    if (target.closest('.likeBtn')) {
      const btnBox = target.closest('.discussion-footer')
      const questionId = btnBox.getAttribute('data-question-id');
      toggleLike(questionId)
      event.stopPropagation();
    }

    //进入评论
    if (target.closest('.commentBtn')) {
      const btnBox = target.closest('.discussion-footer')
      const questionId = btnBox.getAttribute('data-question-id');
      toggleComments(questionId)
      event.stopPropagation();
    }
  });
  try {
    //选择题目类型进行加载
    document.getElementById('selectQuestionType').addEventListener('change', (event) => {
      event.preventDefault();
      const type = event.target.value
      selectQuestionType(type)
      event.stopPropagation();
    });

    //上传讨论题目
    document.getElementById('upload-question-btn').addEventListener('click', (event) => {
      event.preventDefault();
      window.open('e_uploading.html', '_blank');
    });

    //保存答题记录
    document.getElementById('save-questions-btn').addEventListener('click', (event) => {
      event.preventDefault();
      saveQuestionRecords()
    });
  } catch (error) {
  }
}


// 页面加载时调用
window.onload = loadDiscussionQuestions('全部题目');
window.receiveQuestionInfo = receiveQuestionInfo;
window.bindEventListeners = bindEventListeners;