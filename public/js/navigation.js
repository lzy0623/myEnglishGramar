document.addEventListener('DOMContentLoaded', () => {
  try {
    const header = document.querySelector('header');
    header.innerHTML = `
    <nav class="main-nav">
      <div class="nav-content">
        <div class="logo"><img src="images/icon/logo.png"></div>
        <ul class="nav-links">
          <li><a href="b_dailySentence.html">每日一句</a></li>
          <li><a href="c_course.html">语法大纲</a></li>
          <li><a href="d_essay.html">短文阅读</a></li>
          <li><a href="e_community.html">社区讨论</a></li>
          <li class="right"><a href="a_login.html">登录|注册</a></li>
        </ul>
        <div class="underline"></div>
      </div>
    </nav>`

    //调用getCurrentUser()函数判断有没有登录
    if (getCurrentUser()) {
      document.querySelector('.nav-links .right').innerHTML = `
       <a href="f_personalCenter.html">个人中心</a>`
    }

    //获取所有的导航链接
    const navLinks = document.querySelectorAll('.nav-links a');
    // 设置当前页面的 active 类
    setActiveClassBasedOnURL();
    function setActiveClassBasedOnURL() {
      const currentPath = window.location.pathname;
      navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (currentPath.endsWith(linkHref)) {
          link.classList.add('active');
        }
      });
    }

    // ---------------------------下划线滑动---------------------------
    // 获取下划线和导航链接
    const underline = document.querySelector('.underline');
    let activeLink = document.querySelector('.nav-links a.active'); // 当前激活的导航项
    // 动态设置下划线位置和宽度
    function setUnderlinePosition(link) {
      const linkRect = link.getBoundingClientRect();
      const contentRect = document.querySelector('.nav-content').getBoundingClientRect();
      underline.style.left = `${linkRect.left - contentRect.left + window.scrollX}px`;
      underline.style.width = `${linkRect.width}px`; // 同步导航项宽度
    }
    // 鼠标移入导航项时移动下划线
    navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        setUnderlinePosition(link);
      });
      link.addEventListener('mouseleave', () => {
        if (activeLink) setUnderlinePosition(activeLink);
      });
    });
    // 初始化下划线位置（首次加载时）
    if (activeLink) setUnderlinePosition(activeLink);
  } catch (error) {
  }
})


// 获取当前用户信息
function getCurrentUser() {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user ? user : null;
  } catch (error) {
    return null;
  }
}
// 获取日期范围
function getDateRange(daysCount, offsetDirection) {
  if (!daysCount) {
    daysCount = 5
  }
  if (!offsetDirection) {
    offsetDirection = 'future'
  }
  const dates = [];
  const today = new Date();
  for (let i = 0; i < daysCount; i++) {
    const date = new Date(today);
    if (offsetDirection === 'past') {
      date.setDate(today.getDate() - i);
    } else if (offsetDirection === 'future') {
      date.setDate(today.getDate() + i);
    } else {
      return '请指明时间past:过去 future:未来';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  if (daysCount == 1) {
    return dates[0];
  }
  return dates;
}

