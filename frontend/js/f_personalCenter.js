import { config } from '../../backend/config.js';

//用户等级的枚举类型
const userLevel = {
  0: 'beginner',
  1: 'intermediate',
  2: 'advanced',
  3: 'expert'
}

//根据请求类型获取用户讨论信息
async function getUserDiscussionInfo(userId, type) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/userinfo/get/${userId}/${type}/discussion-data`);
    const discussionCount = await response.json();
    if (!response.ok) {
      alert(discussionCount.error)
    }
    document.getElementById('likedCount').innerHTML = `<span>${discussionCount.likedCount}</span>`
    document.getElementById('commentCount').innerHTML = `<span>${discussionCount.commentCount}</span>`
    document.getElementById('questionCount').innerHTML = `<span>${discussionCount.questionCount}</span>`
  } catch (err) { }
}

//更新用户基本信息
function updateUserInfo(user) {
  //头像
  document.querySelector('.avatar').src = `${config.IMG_AVATAR_PATH}${user.avatar}`
  //昵称
  document.querySelector('.user-details h2').textContent = user.nickname || '暂无昵称(点击设置)'
  //用户名
  document.querySelector('.user-details h4').textContent = `(${user.username})`||'null';
  //vip状态
  document.querySelector('.user-details .img-vip').src = user.vip ? '../icon/VIP_yes.png' : '../icon/VIP_no.png'
  //注册时间
  const userCreateDate = new Date(user.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  document.querySelector('.user-details .register-date').textContent = `${userCreateDate}注册`;

  // 判断是否为管理员,将水平这里显示未题目审核
  if (user.admin) {
    const levelEl = document.getElementById('level')
    levelEl.innerHTML = `<span>审核</span>`
    levelEl.addEventListener('click', (e) => {
      e.preventDefault()
      window.open(`f_adminDiscussion.html`, '_blank');
    })
  }
  else {
    document.getElementById('level').innerHTML = `<span>${userLevel[user.level]}</span>`
  }


}


//页面加载后绑定点击事件
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = getCurrentUser()
  if (currentUser) {
    updateUserInfo(currentUser)
    document.querySelector('.user-info').insertAdjacentHTML('beforeend', `
      <div class="logout-btn" id="logout">退出登录</div>`)
    getUserDiscussionInfo(currentUser.id, 'discussionCount')
  }

  //点击进入管理社区
  document.querySelector('.content-box.community').addEventListener('click', (event) => {
    const target = event.target
    console.log(target)
    if (target.closest('.itembox')) {
      window.open(`f_manageCommunity.html`, '_blank')
      event.stopPropagation()
    }
  })

  document.querySelector('.content-wrapper').addEventListener('click', (event) => {
    const target = event.target
    //点击展示修改个人信息弹窗
    if (target.id === 'showInfoModal') {
      document.getElementById('infoModal').style.display = 'block';
      document.getElementById('previewAvatar').src = document.querySelector('.avatar').src;
      document.getElementById('nicknameInput').value = document.querySelector('.user-details h2').innerText;
      event.stopPropagation();
    }

    //点击退出登录
    else if (target.id === 'logout') {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('currentUser')
        window.location.href = 'a_login.html'
        event.stopPropagation();
      }
    }

    //打开vip弹窗
    else if (target.id === 'openVipModal') {
      openVipModal()
    }
  })

  // 头像预览
  document.getElementById('avatarInput').addEventListener('change', function (e) {
    const reader = new FileReader();
    reader.onload = function () {
      document.getElementById('previewAvatar').src = reader.result;
    }
    reader.readAsDataURL(e.target.files[0]);
  });

  // 修改信息弹窗
  document.getElementById('infoModal').addEventListener('click', (event) => {
    const target = event.target;
    console.log(target);
    // 提交修改信息
    if (target.id === 'submitUserInfo') {
      submitUserInfo();
      updateUserInfo(currentUser)
      event.stopPropagation();
    }
    // 关闭修改信息弹窗
    else if (target.classList.contains('close')) {
      document.getElementById('infoModal').style.display = 'none';
      event.stopPropagation();
    }
  });

})

// 提交修改
async function submitUserInfo() {
  const formData = new FormData();
  const avatarFile = document.getElementById('avatarInput').files[0];
  const nickname = document.getElementById('nicknameInput').value;
  const currentUser = getCurrentUser();

  formData.append('userId', currentUser.id);
  formData.append('username', currentUser.username);
  formData.append('nickname', nickname);
  if (avatarFile) formData.append('avatar', avatarFile);

  console.log('表单数据', formData)
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/userinfo/update-info`, {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    if (response.ok) {
      // 更新当前用户信息
      updateCurrentUser();
      document.getElementById('infoModal').style.display = 'none';
      alert(`修改成功${result.message}`);
    }
  } catch (error) {
    console.error('修改失败:', error);
  }
}
