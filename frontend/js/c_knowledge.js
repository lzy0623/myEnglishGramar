import { config } from '../../backend/config.js';
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
let knowledges = [];
// 获取知识点内容
async function loadKnowledgePoints(subCourseId) {
  try {
    // 调用后端 API 获取子课程的知识点
    const response = await fetch(`${config.API_BASE_URL}/api/courses/get/sub-courses/knowledge/${subCourseId}`);
    const knowledgePoints = await response.json();
    knowledges = knowledgePoints;
    const contentContainer = document.getElementById('knowledge-content');
    knowledgePoints.map(knowledgePoint => {
      if (typeof knowledgePoint.features.content === 'string') {
        knowledgePoint.features.content = JSON.parse(knowledgePoint.features.content);
      }
    });

    contentContainer.innerHTML = knowledgePoints.map(knowledgePoint => `
      <div class="grammar-section">
        <div class="admin-edit" data-subcourse-id="${subCourseId}" data-knowledge-id="${knowledgePoint.id}">编辑</div>
        <h2 class="section-title">
          <span class="section-marker"></span>
          ${knowledgePoint.title}
        </h2>
        <div class="section-content">
          ${knowledgePoint.example ? `<div class="section-examle"><p>例句: ${knowledgePoint.example}</p></div>` : ''}
          <p>详解:${knowledgePoint.content}</p>

          ${knowledgePoint.features.title ? `
            <p class="feature-title">${knowledgePoint.features.title}</p>` : ''}
          ${knowledgePoint.features.content ? `
            <ul class="feature-list">
              ${knowledgePoint.features.content.map((feature, i) => `<li>${feature}</li>`).join('')}
            </ul>` : ''}

          ${knowledgePoint.summary ? `<p class="summary">${knowledgePoint.summary}</p>` : ''}
        </div>
      </div>
      `).join('') + `<div id="upload-knowledge-box"></div>`;

    bindEventListeners(subCourseId);
  } catch (err) {
    console.error('加载知识点失败:', err);
  }
}

// 页面加载时调用
window.onload = () => {
  const subCourseId = new URLSearchParams(window.location.search).get('subCourseId');
  loadKnowledgePoints(subCourseId);
};

// 绑定事件监听器
function bindEventListeners(subCourseId) {
  if (currentUser.admin) {
    //管理员添加按钮
    const uploadKnowledgeBox = document.getElementById('upload-knowledge-box');
    uploadKnowledgeBox.innerHTML = `
      <div class="upload-information" data-subcourse-id="${subCourseId}">添加知识点</div>`;

    uploadKnowledgeBox.addEventListener('click', () => {
      window.open(`../tob/c_uploadknowledge.html?subCourseId=${subCourseId}`, '_blank');
    });

    //管理员编辑按钮
    const editBoxs = document.querySelectorAll('.admin-edit');
    editBoxs.forEach(editBox => {
      editBox.style.display = 'block';
      editBox.addEventListener('click', (e) => {
        e.preventDefault();
        const subCourseId = editBox.getAttribute('data-subcourse-id');
        const knowledgeId = editBox.getAttribute('data-knowledge-id');
        const knowledge = knowledges.find(knowledge => knowledge.id == knowledgeId);
        const knowledgeString = JSON.stringify(knowledge);
        window.open(`../tob/c_uploadknowledge.html?subCourseId=${subCourseId}&knowledgeId=${knowledgeId}&knowledgeString=${knowledgeString}`, '_blank');
      });
    });
  }
}
