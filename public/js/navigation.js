document.addEventListener('DOMContentLoaded', () => {
  displayOpenVipModal()
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
// 更新当前用户信息后重新获取当前用户信息
async function updateCurrentUser() {
  const userId = getCurrentUser().id
  const response = await fetch(`http://localhost:3000/api/user/${userId}/current-user`);
  const { user } = await response.json();
  localStorage.setItem('currentUser', JSON.stringify(user));
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



//画出vip弹框
function displayOpenVipModal() {
  const mainContainer = document.querySelector('.main-container')
  mainContainer.insertAdjacentHTML('beforeend', `
    <!-- 会员开通弹窗 -->
    <div class="vipModal" id="vipModal">
      <div class="vipModal-content">
        <div><span class="closeVipModal" onclick="closeVipModal()">&times;</span></div>
        <h3>开通会员</h3>
        <div class="vip-packages">
          <div class="package" onclick="selectPackage('monthly',event)" id="vip1">
            <h4>月度会员</h4>
            <p>￥20/月</p>
            <p>享受一个月的高级功能</p>
          </div>
          <div class="package" onclick="selectPackage('yearly',event)" id="vip2">
            <h4>年度会员</h4>
            <p>￥200/年</p>
            <p>享受一年的高级功能</p>
          </div>
          <div class="package" onclick="selectPackage('permanent',event)" id="vip3">
            <h4>永久会员</h4>
            <p>￥500/永久</p>
            <p>享受永久的高级功能</p>
          </div>
        </div>
        <button class="confirm-btnvip" onclick="confirmVip()">确认开通</button>
      </div>
    </div>`
  )
}
// 显示会员弹窗
function openVipModal() {
  if (!getCurrentUser().vip) {
    document.getElementById('vipModal').style.display = 'block';
  }
}
// 关闭会员弹窗
function closeVipModal() {
  document.getElementById('vipModal').style.display = 'none';
}
//选择会员套餐
let selectedPackage = null;
function selectPackage(packageType, event) {
  event.stopPropagation();
  event.preventDefault();
  const packageElement = event.target.closest('.package');
  document.querySelectorAll('.vipModal .package').forEach(packageEl => {
    packageEl.style.border = '';
  })
  packageElement.style.border = '2px solid rgba(121, 72, 234, 1)';
  selectedPackage = packageElement.querySelector('h4').textContent.trim();
}
// 确认开通会员
async function confirmVip() {
  if (selectedPackage) {
    const vipType = 1;
    const response = await fetch('http://localhost:3000/api/userinfo/update-vip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vipType: vipType,
        userId: getCurrentUser().id
      })
    });
    const result = await response.json();
    if (response.ok) {
      alert(`${selectedPackage}开通成功${result.message}`);
      updateCurrentUser();
    } else {
      alert(`会员开通失败${result.error}`);
    }
    // 这里可以添加开通会员的逻辑
    closeVipModal();
  } else {
    alert('请选择一个会员套餐');
  }
}

