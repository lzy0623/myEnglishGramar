function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
const questionId = getQueryParam('questionId');//问题id
let isLiked = getQueryParam('isLiked') === 'true';//是否点赞
const likeCount = parseInt(getQueryParam('likeCount'), 10);//点赞数
const correctAnswer = getQueryParam('correctAnswer');//正确答案
const incorrectAnswer = getQueryParam('incorrectAnswer')//错误答案
console.log(questionId, isLiked, likeCount, correctAnswer, incorrectAnswer)
//加载本题题目信息
async function loadThisQuestion() {
  try {
    const response = await fetch(`http://localhost:3000/api/discussion/get/${questionId}/question`);
    const question = await response.json();

    const discussionBox = document.getElementById('discussion-box')
    discussionBox.innerHTML = `
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
      <div class="discussion-options" id="this-${question.id}">
        ${question.options.map((option, optionIndex) =>
      `<div class="option" data-option="${String.fromCharCode(65 + optionIndex)}" onclick="selectOption('${question.correct_answer}', '${String.fromCharCode(65 + optionIndex)}','${question.id}',event)">
             <span>${String.fromCharCode(65 + optionIndex)}.</span>
             ${option}
             <span class="optionHint"></span>
           </div>`).join('')}
      </div>
      <div class="discussion-footer">
        <div onclick="toggleAnswer(${question.id})">
          <img src="images/icon/check_answer.png" class="checkimg"> <span>解析</span>
        </div>
        <div onclick="toggleLike(${question.id})">
          <img id="like-icon-${question.id}">
          <span id="like-count-${question.id}"></span>
        </div>
        <div onclick="backCommunity()">
          <img src="images/icon/back.png">
          <span>返回</span>
        </div>
      </div>
      <div class="answer" id="answer-${question.id}" style="display: none;">
        <span>解析:</span>${question.analysis}
      </div>
    </div>`
    getCommunityQuestionInfo();
  } catch {
    console.error('加载评论失败:', err);
  }
}
//得到传来的答题信息并且给到本页面
function getCommunityQuestionInfo() {
  document.getElementById(`like-icon-${questionId}`).src = isLiked ? 'images/icon/like_have.png' : 'images/icon/like_not.png';
  document.getElementById(`like-count-${questionId}`).textContent = likeCount;
  const questionDiv = document.getElementById(`this-${questionId}`)
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
// 加载评论
async function loadComments() {
  try {
    const response = await fetch(`http://localhost:3000/api/discussion/get/${questionId}/comments`);
    const comments = await response.json();
    const commentBox = document.getElementById('comment-box');
    commentBox.innerHTML = comments.map(comment => `
      <div class="comment-card">
        <div class="comment-header">
          <img src="images/imgavatars/${comment.avatar}">
        </div>
        <div class="comment-body">
          <span>${comment.author}</span>
          <div class="body-content">
            ${comment.content}
          </div>
          <div class="body-time">
            ${new Date(comment.created_at).toLocaleDateString()}
          </div>
          <div class="body-line">
          </div>
        </div>
      </div>`).join('');
  } catch (err) {
    console.error('加载评论失败:', err);
  }
}

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
    const response = await fetch(`http://localhost:3000/api/discussion/upload/${questionId}/comment`, {
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

// 页面加载时调用
window.onload = () => {
  loadThisQuestion();//加载本题信息
  loadComments();///加载评论
  const user = JSON.parse(localStorage.getItem('currentUser'));
  document.querySelector('.userAvatarimg').src = `images/imgavatars/${user.avatar}`
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