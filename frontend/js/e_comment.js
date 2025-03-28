import { config } from '../../backend/config.js';

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
const questionId = getQueryParam('questionId');//问题id
let isLiked = getQueryParam('isLiked') === 'true';//是否点赞
const likeCount = parseInt(getQueryParam('likeCount'), 10);//点赞数
const correctAnswer = getQueryParam('correctAnswer');//正确答案
const incorrectAnswer = getQueryParam('incorrectAnswer')//错误答案
//加载本题题目信息
async function loadThisQuestion() {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/discussion/get/${questionId}/question`);
    const question = await response.json();

    const discussionBox = document.getElementById('discussion-box')
    discussionBox.innerHTML = `
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
          <img id="like-icon-${question.id}" src="${isLiked ? '../icon/like_have.png' : '../icon/like_not.png'}">
          <span id="like-count-${question.id}"></span>
        </div>
        <div id="backCommunity">
          <img src="../icon/back.png">
          <span>返回</span>
        </div>
      </div>

      <div class="answer" id="answer-${question.id}" style="display: none;">
        <span>解析:</span> ${question.analysis}
      </div>
    </div>`
    getCommunityQuestionInfo();
    bindEventListeners();
    document.getElementById('backCommunity').addEventListener('click', backCommunity)
  } catch (err) {
    console.error('加载评论失败:', err);
  }
}
//得到传来的答题信息并且给到本页面
function getCommunityQuestionInfo() {
  document.getElementById(`like-count-${questionId}`).textContent = likeCount;
  const questionDiv = document.getElementById(questionId)
  const options = questionDiv.querySelectorAll('.option');
  options.forEach(option => {
    const dataOption = option.getAttribute('data-option');
    if (dataOption === correctAnswer) {
      option.classList.add('correct');
      option.querySelector('.optionHint').textContent = '✅答案正确!';
    }
    else if (dataOption === incorrectAnswer) {
      option.classList.add('incorrect');
      option.querySelector('.optionHint').textContent = '❌答案错误!';
    }
  });
}


document.getElementById('submitComment').addEventListener('click', submitComment)
// 提交评论
async function submitComment() {
  const content = document.getElementById('comment-content').value.trim();
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userId = currentUser.id;
  if (!content) {
    alert('评论内容不能为空');
    return;
  }
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/discussion/upload/${questionId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionId, content })
    });
    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      loadComments(); // 刷新评论列表
      document.getElementById('comment-content').value = ''; // 清空评论框
    } else {
      alert('评论失败');
    }
  } catch (err) {
    console.error('提交评论失败:', err);
  }
}
// 加载评论
async function loadComments() {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/discussion/get/${questionId}/comments`);
    const comments = await response.json();
    const commentBox = document.getElementById('comment-box');
    commentBox.innerHTML = comments.map(comment => `
      <div class="comment-card">
        <div class="comment-header">
          <img src="${config.IMG_AVATAR_PATH}${comment.avatar}">
        </div>
        <div class="comment-body">
          <span>${comment.author}</span>
          <div class="body-content">
            ${comment.content}
          </div>
          <div class="body-time">
            ${new Date(comment.created_at).toLocaleDateString().replace(/\//g, '-')}
          </div>
          <div class="body-line">
          </div>
        </div>
      </div>`).join('');
  } catch (err) {
    console.error('加载评论失败:', err);
  }
}

// 页面加载时调用
window.onload = () => {
  loadThisQuestion();//加载本题信息
  loadComments();///加载评论
  const user = JSON.parse(localStorage.getItem('currentUser'));
  document.querySelector('.userAvatarimg').src = `${config.IMG_AVATAR_PATH}${user.avatar}`
};

//返回上个页面
function backCommunity() {
  const correctOption = document.querySelector('.option.correct')
  const incorrectOption = document.querySelector('.option.incorrect')
  let correctAnswer = correctOption ? correctOption.getAttribute('data-option') : null;
  let incorrectAnswer = incorrectOption ? incorrectOption.getAttribute('data-option') : null;
  const likedImgSrc = document.getElementById(`like-icon-${questionId}`).src
  isLiked = likedImgSrc.includes('like_have.png') ? true : false

  if (window.opener && !window.opener.closed) {
    const questionInfo = {
      questionId: questionId,
      correctAnswer: correctAnswer,
      incorrectAnswer: incorrectAnswer,
      isLiked: isLiked
    };
    window.opener.receiveQuestionInfo(questionInfo);
  } else {
    console.error('无法调用父页面的 receiveQuestionInfo 函数');
  }
  window.close();
}