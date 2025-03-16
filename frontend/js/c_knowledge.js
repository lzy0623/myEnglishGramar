import { config } from '../../backend/config.js';
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
// 获取知识点内容
async function loadKnowledgePoints(subCourseId) {
  try {
    // 调用后端 API 获取子课程的知识点
    const response = await fetch(`${config.API_BASE_URL}/api/get/sub-courses/${subCourseId}/knowledge`);
    const knowledgePoints = await response.json();
    const contentContainer = document.getElementById('knowledge-content');

    contentContainer.innerHTML = knowledgePoints.map(knowledgePoint => `
      <div class="grammar-section">
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
    const uploadKnowledgeBox = document.getElementById('upload-knowledge-box');
    uploadKnowledgeBox.innerHTML = `
      <div class="upload-information" data-subcourse-id="${subCourseId}">添加知识点</div>`;

    uploadKnowledgeBox.addEventListener('click', () => {
      window.open(`../tob/c_uploadknowledge.html?subCourseId=${subCourseId}`, '_blank');
    });
  }
}
