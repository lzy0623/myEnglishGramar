import { config } from '../../backend/config.js';

// 获取主课程
async function loadCourses() {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/get/courses`);
    const courses = await response.json();
    const contentContainer = document.getElementById('content-wrapper');

    contentContainer.innerHTML = courses.map(course => `
      <div class="grammar-card">
        <div class="card-header" data-course-id="${course.id}">
          <div class="icon-map">
            <img src="../icon/course_cap.png">
          </div>
          <h2>${course.title}</h2>
          <button class="video-btn" data-video-url="${course.video_url}" data-course-id="${course.id}" data-course-title="${course.title}">
            <img src="../icon/play_video.png" class="play-icon">观看视频
          </button>
          <img src="../icon/pull_down.png" alt="" class="pulldown"  id="pulldown-${course.id}">
        </div>
          <p>${course.description}</p>
        <div id="sub-courses-${course.id}" class='hidden subcoursebox'></div>
      </div>`).join('') + `<div id="upload-course-box"></div>`;

    if (getCurrentUser().admin) {
      document.getElementById('upload-course-box').innerHTML = `
      <div class="upload-information" data-action="uploadCourse">添加主课程</div>`;
    }

    // 绑定事件监听器
    bindEventListeners();
  } catch (err) {
    console.error('加载主课程失败:', err);
  }
}

// 获取子课程
async function loadSubCourses(courseId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/get/courses/${courseId}/sub-courses`);
    const subCourses = await response.json();
    const subCoursesContainer = document.getElementById(`sub-courses-${courseId}`);

    subCoursesContainer.innerHTML = subCourses.map(subCourse => `
      <div class="sub-cards">
        <div class="sub-card">
          <div class="icon-label">
            <img src="../icon/course_label.png" />
          </div>
          <div class="sub-card-main">
            <h3>${subCourse.title}</h3>
            <p>${subCourse.description}</p>
          </div>
          <div class="sub-card-actions">
            <button class="detail-btn" data-action="loadKnowledgePoints" data-sub-course-id="${subCourse.id}">知识点详解</button>
            <button class="practice-btn" data-action="loadExercises" data-sub-course-id="${subCourse.id}">题目练习</button>
          </div>
        </div>
      </div>`).join('') + `<div id="upload-box-${courseId}"></div>`;

    if (getCurrentUser().admin) {
      document.getElementById(`upload-box-${courseId}`).innerHTML = `
      <div class="upload-information" data-action="uploadSubCourse" data-course-id="${courseId}">添加子课程</div>`;
    }
  } catch (err) {
    alert('加载子课程失败:', err);
  }
}


// 绑定事件监听器
function bindEventListeners() {
  const contentContainer = document.getElementById('content-wrapper');

  contentContainer.addEventListener('click', (event) => {
    const target = event.target;

    //播放视频
    if (target.closest('.video-btn')) {
      const videoUrl = target.closest('.video-btn').getAttribute('data-video-url');
      const courseId = target.closest('.video-btn').getAttribute('data-course-id');
      const courseTitle = target.closest('.video-btn').getAttribute('data-course-title');
      const courseDada = {
        videoUrl: videoUrl,
        courseId: courseId,
        courseTitle: courseTitle
      }
      const courseDAtaString = JSON.stringify(courseDada);
      window.open(`c_video.html?courseDAtaString=${courseDAtaString}`, '_blank');
      event.stopPropagation();
      return; 
    }
    //切换显示子课程
    if (target.closest('.card-header')) {
      const courseId = target.closest('.card-header').getAttribute('data-course-id');
      toggleSubCourses(courseId);
      event.stopPropagation();
    }

    // 跳转到知识点页面
    if (target.closest('.detail-btn')) {
      const subCourseId = target.closest('.detail-btn').getAttribute('data-sub-course-id');
      console.log('subCourseId:', subCourseId, typeof subCourseId)
      if (subCourseId == 1||getCurrentUser().vip) {
        window.open(`c_knowledge.html?subCourseId=${subCourseId}`, '_blank')
      } 
      else {
        openVipModal();
      }
      event.stopPropagation();
    }

    // 跳转到练习题页面
    if (target.closest('.practice-btn')) {
      const subCourseId = target.closest('.practice-btn').getAttribute('data-sub-course-id');
      if (subCourseId == 1||getCurrentUser().vip) {
        window.open(`c_practice.html?subCourseId=${subCourseId}`, '_blank')
      } 
      else {
        openVipModal();
      }
      event.stopPropagation();
    }

    // 上传主课程
    if (target.closest('.upload-information[data-action="uploadCourse"]')) {
      window.open('../tob/c_uploadcourse.html', '_blank');
      event.stopPropagation();
    }

    // 上传子课程
    if (target.closest('.upload-information[data-action="uploadSubCourse"]')) {
      const courseId = target.closest('.upload-information').getAttribute('data-course-id');
      window.open(`../tob/c_uploadsubcourse.html?courseId=${courseId}`, '_blank');
      event.stopPropagation();
    }

  });
}

// 切换子课程的显示状态
function toggleSubCourses(courseId) {
  const container = document.getElementById(`sub-courses-${courseId}`);
  const pulldownIcon = document.getElementById(`pulldown-${courseId}`);
  pulldownIcon.classList.toggle('rotated');  // 切换箭头图标旋转状态
  if (container.classList.contains('hidden')) {
    // 展开逻辑
    container.classList.remove('hidden');
    setTimeout(() => {
      container.classList.add('boxshow');
      if (container.innerHTML.trim() === '') {
        loadSubCourses(courseId);
      } else {
        // 为每个子课程设置动画延迟
        const subCards = container.querySelectorAll('.sub-card');
        subCards.forEach((subCard, index) => {
          subCard.style.animationDelay = `${index * 0.1}s`; // 每个子课程延迟0.1秒
        });
      }
    }, 20); // 确保CSS重绘
  } else {
    // 收起逻辑
    container.classList.remove('boxshow');
    const subCards = container.querySelectorAll('.sub-card');
    const maxHideNum = 5;
    if (subCards.length > maxHideNum) {
      for (let i = maxHideNum - 1; i >= 0; i--) {
        subCards[i].style.animationDelay = `${(maxHideNum - 1 - i) * 0.1}s`;
        subCards[i].classList.add('hide');
        subCards[i].classList.add('sub-show')
      }
    } else {
      subCards.forEach((subCard, index) => {
        subCard.style.animationDelay = `${(subCards.length - 1 - index) * 0.1}s`; // 反向延迟
        subCard.classList.add('hide'); // 添加 hide 类
        subCard.classList.add('sub-show');
      });
    }

    container.addEventListener('transitionend', () => {
      // 移除子课程的动画延迟
      subCards.forEach(subCard => {
        subCard.style.animationDelay = '0s';
        subCard.classList.remove('hide');
        subCard.classList.remove('sub-show');
      });
      container.classList.add('hidden');
    }, { once: true });
  }
}


// 页面加载时调用
window.onload = loadCourses();