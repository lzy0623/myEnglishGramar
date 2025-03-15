import { config } from '../../config.js';

const user = JSON.parse(localStorage.getItem('currentUser'))
let likedQuestionsId = []
//根据请求类型获取用户讨论信息
async function getUserDiscussionInfo(userId, type) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/userinfo/get/${userId}/${type}/discussion-data`);
    const result = await response.json();
    console.log(result, typeof result)
    if (!response.ok) {
      alert(result.error)
    }
    return result;
  } catch (err) { }
}

//获取用户点赞信息
async function getLikedQuestions(button, userId, type) {
  document.querySelectorAll('.clicked').forEach(button => button.classList.remove('clicked'));
  button.classList.add('clicked');
  userId = user.id;
  type = 'likedQuestions'
  const likedQuestions = await getUserDiscussionInfo(userId, type)
  likedQuestionsId = likedQuestions.map(question => question.id)
  const contentContainer = document.getElementById('discussion-box');
  contentContainer.innerHTML = likedQuestions.map(question => `
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
            <div class="option" data-option="${String.fromCharCode(65 + optionIndex)}">
            <span>${String.fromCharCode(65 + optionIndex)}.</span>
            ${option}
            </div>`).join('')}
        </div>

        <div class="discussion-footer">
          <div class="likeBtn" data-question-id="${question.id}">
            <img src="images/icon/like_have.png" id="like-icon-${question.id}">
            <span id="like-count-${question.id}"></span>
          </div>
          <div>
            <img src="images/icon/comment.png">
            <span id="comment-count-${question.id}"></span>
          </div>
        </div>
      </div>`).join('');

  bindEventListeners()
  likedQuestions.forEach(question => {
    loadLikes(question.id);
    loadCommentCount(question.id);
  }
  )
}
//获取用户评论信息
async function getcommentedQuestions(button, userId, type) {
  document.querySelectorAll('.clicked').forEach(button => button.classList.remove('clicked'));
  button.classList.add('clicked');
  userId = user.id;
  type = 'commentedQuestions'
  const commentedQuestions = await getUserDiscussionInfo(userId, type)
  const contentContainer = document.getElementById('discussion-box');
  contentContainer.innerHTML = commentedQuestions.map(question => `
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
            <div class="option" data-option="${String.fromCharCode(65 + optionIndex)}">
            <span>${String.fromCharCode(65 + optionIndex)}.</span>
            ${option}
            </div>`).join('')}
        </div>

        <div class="discussion-footer">
          <div class="likeBtn" data-question-id="${question.id}">
            <img src="${likedQuestionsId.includes(question.id) ? 'images/icon/like_have.png' : 'images/icon/like_not.png'}" id="like-icon-${question.id}">
            <span id="like-count-${question.id}"></span>
          </div>
          <div>
            <img src="images/icon/comment.png">
            <span id="comment-count-${question.id}"></span>
          </div>
        </div>
        <div class="commentBox">
        ${question.comments.map(comment => `
          <p>${comment.content}<br><span>${new Date(comment.created_at).toLocaleDateString().replace(/\//g, '-')}</span></p>
          `).join('')}
        </div>
      </div>`).join('');

  bindEventListeners()
  commentedQuestions.forEach(question => {
    loadLikes(question.id);
    loadCommentCount(question.id);
  })
}
//获取用户发布的信息
async function getuserQuestions(button, userId, type) {
  document.querySelectorAll('.clicked').forEach(button => button.classList.remove('clicked'));
  button.classList.add('clicked');
  userId = user.id;
  type = 'userQuestions'
  const userQuestions = await getUserDiscussionInfo(userId, type)
  console.log(userQuestions)
  const contentContainer = document.getElementById('discussion-box');
  contentContainer.innerHTML = userQuestions.map(question => `
     <div class="discussion-card">
        <div class="discussion-header">
          <div class="headphoto">
            <img src="images/imgavatars/${user.avatar}">
          </div>
          <div class="author">${user.nickname}<br>
            <span>${new Date(question.created_at).toLocaleDateString().replace(/\//g, '-')}</span>
          </div>
        </div>
        <div class="discussion-content">
          ${question.question}
        </div>
        <div class="discussion-options" id="${question.id}">
          ${question.options.map((option, optionIndex) => `
            <div class="option" data-option="${String.fromCharCode(65 + optionIndex)}">
            <span>${String.fromCharCode(65 + optionIndex)}.</span>
            ${option}
            </div>`).join('')}
        </div>

        <div class="discussion-footer">
          <div class="likeBtn" data-question-id="${question.id}">
            <img src="${likedQuestionsId.includes(question.id) ? 'images/icon/like_have.png' : 'images/icon/like_not.png'}" id="like-icon-${question.id}">
            <span id="like-count-${question.id}"></span>
          </div>
          <div>
            <img src="images/icon/comment.png">
            <span id="comment-count-${question.id}"></span>
          </div>
        </div>
      </div>`).join('');

  bindEventListeners()
  userQuestions.forEach(question => {
    loadLikes(question.id);
    loadCommentCount(question.id);
  })

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

// 按钮切换不同目录点击事件
document.addEventListener('DOMContentLoaded', () => {
  // 点击按钮切换
  document.querySelector('.filter-bar').addEventListener('click', (event) => {
    const target = event.target.closest('.action-btn')
    console.log('点击对象', target)
    if (target && target.id === 'likedQuestions') {
      getLikedQuestions(target, user.id, 'likedQuestions')
      event.stopPropagation()
      return
    }
    if (target && target.id === 'commentedQuestions') {
      getcommentedQuestions(target, user.id, 'commentedQuestions')
      event.stopPropagation()
      return
    }
    if (target && target.id === 'userQuestions') {
      getuserQuestions(target, user.id, 'userQuestions')
      event.stopPropagation()
      return
    }
  });
});

//动态点赞事件
function bindEventListeners() {
  document.querySelector('.discussion-footer').addEventListener('click', (event) => {
    const target = event.target
    if (target.closest('.likeBtn')) {
      const questionId = target.closest('.likeBtn').getAttribute('data-question-id');
      toggleLike(questionId)
      event.stopPropagation()
      return
    }
  });
}

// 点赞/取消点赞
async function toggleLike(questionId) {
  try {
    const userId = user.id
    const response = await fetch(`${config.API_BASE_URL}/api/discussion/liked`, {
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

window.onload = function () {
  const button = document.getElementById('likedQuestions')
  getLikedQuestions(button);
}

