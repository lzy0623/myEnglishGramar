let likedIds = [];
let isType = false;//选择题目类型进行题目加载的标识符
// 加载全部讨论题目
async function loadDiscussionQuestions(questionType) {
  try {
    const contentContainer = document.getElementById('discussion-box');
    const userId = getCurrentUser('id');
    //获取所有题目信息
    const response = await fetch(`http://localhost:3000/api/discussion/get/${questionType}/questions`);
    const questions = await response.json();
    if (!response.ok) {
      contentContainer.innerHTML = `<p>后端响应失败:${questions.error}</p>`;
      contentContainer.style.color = 'red';
      return;
    }
    // 获取当前登录用户的点赞状态
    const likesResponse = await fetch(`http://localhost:3000/api/discussion/get/${userId}/user-likes`);
    const { likedQuestionIds } = await likesResponse.json();
    likedIds = likedQuestionIds;

    contentContainer.innerHTML = questions.map(question => `
      <div class="discussion-card">
        <div class="discussion-header">
          <div class="headphoto">
            <img src="images/imgavatars/${question.avatar}">
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
            <div class="option" data-option="${String.fromCharCode(65 + optionIndex)}" onclick="selectOption('${question.correct_answer}', '${String.fromCharCode(65 + optionIndex)}','${question.id}',event)">
            <span>${String.fromCharCode(65 + optionIndex)}.</span>
            ${option}<span class="optionHint"></span>
            </div>`).join('')}
        </div>

        <div class="discussion-footer">
          <div onclick="toggleAnswer(${question.id})">
            <img src="images/icon/check_answer.png" class="checkimg"> 
            <span>解析</span>
          </div>
          <div onclick="toggleLike(${question.id})">
            <img src="${likedQuestionIds.includes(question.id) ? 'images/icon/like_have.png' : 'images/icon/like_not.png'}" id="like-icon-${question.id}">
            <span id="like-count-${question.id}"></span>
          </div>
          <div onclick="toggleComments(${question.id})">
            <img src="images/icon/comment.png">
            <span id="comment-count-${question.id}"></span>
          </div>
        </div>

        <div class="answer" id="answer-${question.id}" style="display: none;">
          <span>解析:</span> ${question.analysis}
        </div>
      </div>`).join('');

    //初始化每个题目的互动数据
    questions.forEach(question => {
      loadLikes(question.id);
      loadCommentCount(question.id);
    });
  } catch (err) {
    document.getElementById('discussion-box').innerHTML = '<p>前端请求练习题失败</p>';
    document.getElementById('discussion-box').style.color = 'red';
  }
}

// 加载点赞数
async function loadLikes(questionId) {
  try {
    const response = await fetch(`http://localhost:3000/api/discussion/get/${questionId}/likes-count`);
    const { count } = await response.json();
    document.getElementById(`like-count-${questionId}`).textContent = count;
  } catch (err) {
    console.error('加载点赞数失败:', err);
  }
}
// 加载评论数
async function loadCommentCount(questionId) {
  try {
    const response = await fetch(`http://localhost:3000/api/discussion/get/${questionId}/comment-count`);
    const { count } = await response.json();
    document.getElementById(`comment-count-${questionId}`).textContent = count;
  } catch (err) {
    console.error('加载评论数失败:', err);
  }
}
// 显示/隐藏答案
function toggleAnswer(questionId) {
  const answerDiv = document.getElementById(`answer-${questionId}`);
  answerDiv.style.display = answerDiv.style.display === 'none' ? 'block' : 'none';
}
// 点赞/取消点赞
async function toggleLike(questionId) {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'))
    const userId = currentUser.id
    const response = await fetch('http://localhost:3000/api/discussion/liked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionId })
    });
    const result = await response.json();

    // 更新点赞图标和点赞数
    const likeIcon = document.getElementById(`like-icon-${questionId}`);
    likeIcon.src = result.isLiked ? 'images/icon/like_have.png' : 'images/icon/like_not.png';
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
  const likedImgSrc = document.getElementById(`like-icon-${questionId}`).src
  let isLiked = false
  let likeCount = 0
  if (likedImgSrc.includes('like_have.png')) {
    isLiked = true
  }
  likeCount = document.getElementById(`like-count-${questionId}`).textContent
  const url = `e_comment.html?questionId=${questionId}&isLiked=${isLiked}&likeCount=${likeCount}&correctAnswer=${correctAnswer}&incorrectAnswer=${incorrectAnswer}`;
  window.open(url, '_blank');
}

// 接收评论页面传递的信息
async function receiveQuestionInfo(questionInfo) {
  // 更新题目信息，例如用户的做题情况
  const questionId = questionInfo.questionId;
  const correctAnswer = questionInfo.correctAnswer;
  const incorrectAnswer = questionInfo.incorrectAnswer;
  console.log(questionInfo)
  document.getElementById(`like-icon-${questionId}`).src = questionInfo.isLiked ? 'images/icon/like_have.png' : 'images/icon/like_not.png';
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
  //获取原来已经显示正确答案或错误答案的信息将其消除
  const options = event.target.parentElement.querySelectorAll('.option');
  options.forEach(option => {
    option.classList.remove('correct', 'incorrect');
    option.querySelector('.optionHint').textContent = '';
  });

  if (selectedAnswer === correctAnswer) {
    event.target.classList.add('correct');
    event.target.querySelector('.optionHint').textContent = `✅答案正确!`;
  }
  else {
    event.target.classList.add('incorrect');
    event.target.querySelector('.optionHint').textContent = `❌答案错误!`;
  }
}


//用户自上传讨论题目处理函数
function uploadDiscussion() {
  window.open('e_uploading.html', '_blank');
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


// 页面加载时调用
window.onload = loadDiscussionQuestions('全部题目');