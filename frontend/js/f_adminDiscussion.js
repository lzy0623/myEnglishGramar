import { config } from '../../backend/config.js';
async function loadDiscussionAdmin() {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'))
    const contentContainer = document.getElementById('discussion-box');
    const response = await fetch(`${config.API_BASE_URL}/api/discussion/get/admin/${currentUser.id}/questions`);
    const questions = await response.json();

    if (!response.ok) {
      contentContainer.innerHTML = `<p>后端响应失败:${questions.error}</p>`;
      contentContainer.style.color = 'red';
      return;
    }

    contentContainer.innerHTML = questions.map(question => `
      <div class="discussion-card" data-question-id="${question.id}">
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
          ${question.options.map((option, index) => `
            <div class="option" data-option="${String.fromCharCode(65 + index)}" data-correct-answer="${question.correct_answer}">
            ${option}
            <span class="optionHint"></span>
            </div>`).join('')}
        </div>

        <div class="answer" id="answer-${question.id}">
          <span>解析:</span> ${question.analysis}
        </div>

        <div class="discussion-footer">
          <div class="passBtn" data-question-id="${question.id}">
            <img src="../icon/pass.png" class="checkimg"> 
            <span>通过</span>
          </div>
          <div class="passNoBtn" data-question-id="${question.id}">
            <img src="../icon/pass_no.png">
            <span>驳回</span>
          </div>
        </div>
       
      </div>`).join('');

    questions.map(question => {
      const discussionEl = document.querySelector(`.discussion-options[id="${question.id}"]`)
      const correctDiv = discussionEl.querySelector(`.option[data-option="${question.correct_answer}"]`)
      correctDiv.classList.add('correct');
      correctDiv.querySelector('.optionHint').textContent = '✅ 正确！';
    });

    const contentContainers = document.getElementById('discussion-box');
    contentContainers.addEventListener('click', (event) => {
      const target = event.target;
      if (target.closest('.passBtn')) {
        const questionId = target.closest('.passBtn').getAttribute('data-question-id');
        const question = questions.find(q => q.id == questionId);
        passQuestion(question)
        event.stopPropagation();
      }
      if (target.closest('.passNoBtn')) {
        const questionId = target.closest('.passNoBtn').getAttribute('data-question-id');
        const question = questions.find(q => q.id == questionId);
        passNoQuestion(question)
        event.stopPropagation();
      }
    });


  } catch (err) {
    document.getElementById('discussion-box').innerHTML = '<p>前端请求练习题失败</p>';
    document.getElementById('discussion-box').style.color = 'red';
  }
}
//通过审核题目
async function passQuestion(question) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/discussion/pass/admin/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionId: question.id,
        userId: question.user_id
      })
    })
    const result = await response.json()
    if (response.ok) {
      alert(`问题审核通过${result.message}`)
    } else {
      alert(`问题审核失败${result.error}`)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

//不通过审核题目
async function passNoQuestion(question) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/discussion/passno/admin/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionId: question.id,
        userId: question.user_id
      })
    })
    const result = await response.json()
    if (response.ok) {
      alert(`问题不通过${result.message}`)
    } else {
      alert(`${result.error}`)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}





window.onload = loadDiscussionAdmin