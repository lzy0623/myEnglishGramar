// 获取知识点内容
async function loadKnowledgePoints(subCourseId) {
  try {
    // 调用后端 API 获取子课程的知识点
    const response = await fetch(`http://localhost:3000/api/get/sub-courses/${subCourseId}/knowledge`);
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
              ${knowledgePoint.features.content.map((feature, i) => `<li>(${i + 1})${feature}</li>`).join('')}
            </ul>` : ''}
          ${knowledgePoint.summary ? `<p class="summary">${knowledgePoint.summary}</p>` : ''}
        </div>
      </div>
      `).join('') + `<div id="upload-knowledge-box"></div>`;

    if (localStorage.getItem('currentUser')) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser.admin) {
        document.getElementById('upload-knowledge-box').innerHTML = `
        <div class="upload-information" onclick="uploadSubCourseKnowledge(${subCourseId})">添加知识点</div>`;
      }
    }
  } catch (err) {
    console.error('加载知识点失败:', err);
  }
}

// 页面加载时调用
window.onload = () => {
  const subCourseId = new URLSearchParams(window.location.search).get('subCourseId');
  loadKnowledgePoints(subCourseId);
};

function uploadSubCourseKnowledge(subCourseId) {
  window.open(`tob/c_uploadknowledge.html?subCourseId=${subCourseId}`, '_blank');
}