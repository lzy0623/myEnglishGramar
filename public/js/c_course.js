let subCourseTitle = '';


// 获取主课程内容
async function loadCourses() {
  try {
    const response = await fetch('http://localhost:3000/api/get/courses');
    const courses = await response.json();
    const contentContainer = document.getElementById('course-content');
    contentContainer.innerHTML = courses.map(course => `
      <div class="grammar-card">
        <div class="card-header" onclick="toggleSubCourses(${course.id})">
          <div class="icon-map">
            <img src="images/icon/course_cap.png">
          </div>
          <h2>${course.title}</h2>
          <button class="video-btn" onclick="playVideo('${course.video_url}','${course.id}','${course.title}');event.stopPropagation();">
            <img src="images/icon/play_video.png" class="play-icon">观看视频
          </button>
          <img src="images/icon/pull_down.png" alt="" class="pulldown"  id="pulldown-${course.id}">
        </div>
          <p>${course.description}</p>
        <div id="sub-courses-${course.id}" class='hidden subcoursebox'></div>
      </div>`).join('') + `<div id="upload-course-box"></div>`;

    if (getCurrentUser().admin) {
      document.getElementById('upload-course-box').innerHTML = `<div class="upload-information" onclick="uploadCouser()">添加主课程</div>`;
    }
  } catch (err) {
    console.error('加载主课程失败:', err);
  }
}

// 获取子课程
async function loadSubCourses(courseId) {
  try {
    // 调用后端 API 获取某个课程的子课程
    const response = await fetch(`http://localhost:3000/api/get/courses/${courseId}/sub-courses`);
    const subCourses = await response.json();
    const subCoursesContainer = document.getElementById(`sub-courses-${courseId}`);
    subCoursesContainer.innerHTML = subCourses.map(subCourse => `
      <div class="sub-cards">
        <div class="sub-card">
          <div class="icon-label">
            <img src="images/icon/course_label.png" />
          </div>
          <div class="sub-card-main">
            <h3>${subCourse.title}</h3>
            <p>${subCourse.description}</p>
          </div>
          <div class="sub-card-actions">
            <button class="detail-btn" onclick="loadKnowledgePoints(${subCourse.id})">知识点详解</button>
            <button class="practice-btn" onclick="loadExercises(${subCourse.id})">题目练习</button>
          </div>
        </div>
      </div>
      `).join('') + `<div id="upload-box-${courseId}"></div>`;
    if (getCurrentUser().admin) {
      document.getElementById(`upload-box-${courseId}`).innerHTML = `<div class="upload-information" onclick="uploadSubCourse(${courseId})">添加子课程</div>`;
    }
  } catch (err) {
    alert('加载子课程失败:', err);
  }
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

// 播放视频
function playVideo(videoUrl, courseId, courseTitle) {
  const courseDada = {
    videoUrl: videoUrl,
    courseId: courseId,
    courseTitle: courseTitle
  }
  const courseDAtaString = JSON.stringify(courseDada);
  window.open(`c_video.html?courseDAtaString=${courseDAtaString}`, '_blank');
}

// 跳转到知识点页面
function loadKnowledgePoints(subCourseId) {
  if (subCourseId === 1) {
    window.open(`c_knowledge.html?subCourseId=${subCourseId}`, '_blank')
  } else if (getCurrentUser().vip) {
    window.open(`c_knowledge.html?subCourseId=${subCourseId}`, '_blank')
  }
  else {
    openVipModal();
  }
}
// 跳转到练习题页面
function loadExercises(subCourseId) {
  if (subCourseId === 1) {
    window.open(`c_practice.html?subCourseId=${subCourseId}`, '_blank')
  } else if (getCurrentUser().vip) {
    window.open(`c_practice.html?subCourseId=${subCourseId}`, '_blank')
  }
  else {
    openVipModal();
  }
}

//----管理员功能----
function uploadCouser() {
  window.open('tob/c_uploadcourse.html', '_blank');
}
function uploadSubCourse(courseId) {
  window.open(`tob/c_uploadsubcourse.html?courseId=${courseId}`, '_blank');
}

// 页面加载时调用
window.onload = loadCourses();