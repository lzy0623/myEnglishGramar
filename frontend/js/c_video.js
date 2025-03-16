import { config } from '../../backend/config.js';

document.addEventListener('DOMContentLoaded', () => {
  const courseTitle = document.querySelector('.course-title');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoSource = document.getElementById('videoSource');
  const submitCommentBtn = document.getElementById('submitComment');

  // 解析 URL 参数
  const courseDataString = new URLSearchParams(window.location.search).get('courseDAtaString');
  const courseData = JSON.parse(courseDataString);
  const user = JSON.parse(localStorage.getItem('currentUser'));

  courseTitle.innerHTML = `<P>课程:${courseData.courseTitle}</P>`
  videoSource.src = `${config.VIDEO_COURSE_PATH}${courseData.videoUrl}`
  videoPlayer.load();

  submitCommentBtn.addEventListener('click', submitComment);
  // 评论功能
  async function submitComment() {
    const commentContent = document.getElementById('comment-content').value.trim();
    if (!commentContent) {
      alert('评论内容不能为空');
      return;
    }
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/course/video/upload/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          courseId: courseData.courseId,
          content: commentContent
        })
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        loadComments();
      } else {
        alert(result.error || '评论失败');
      }
    } catch (err) {
      alert('评论请求失败');
    }
  }
  async function loadComments() {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/course/video/get/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: courseData.courseId })
      });
      const comments = await response.json();
      const commentBox = document.getElementById('comment-box');
      commentBox.innerHTML = comments.map(comment => `
        <div class="comment-card">
          <div class="comment-header">
            <img src="${config.IMG_AVATAR_PATH}${comment.avatar}">
          </div>
          <div class="comment-body">
            <span>${comment.author}</span>
            <div class="body-content">${comment.content}</div>
            <div class="body-time">${new Date(comment.created_at).toLocaleDateString().replace(/\//g, '-')}</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('加载评论失败:', err);
    }
  }
  loadComments();
});