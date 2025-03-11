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
    const response = await fetch(`http://localhost:3000/api/userinfo/get/${userId}/${type}/discussion-data`);
    const discussionCount = await response.json();
    console.log(discussionCount)
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
  document.querySelector('.avatar').src = `images/imgavatars/${user.avatar}`
  //昵称
  document.querySelector('.user-details h2').textContent = user.nickname || '暂无昵称(点击设置)'
  //vip状态
  document.querySelector('.user-details .img-vip').src = user.vip ? 'images/icon/VIP_yes.png' : 'images/icon/VIP_no.png'
  //注册时间
  const userCreateDate = new Date(user.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  document.querySelector('.user-details .register-date').textContent = `${userCreateDate}注册`;
  document.getElementById('level').innerHTML = `<span>${userLevel[user.level]}</span>`
}

//退出登录
function logout() {
  const confirmed = confirm('确定要退出登录吗？')
  if (confirmed) {
    localStorage.removeItem('currentUser')
    window.location.href = 'a_login.html'
  }
}

//页面加载时更新用户信息
window.onload = function () {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))
  if (currentUser) {
    updateUserInfo(currentUser)
    document.querySelector('.user-info').insertAdjacentHTML('beforeend', `
      <div class="logout-btn" onclick="logout()">
        退出登录
      </div>
      `)
  }
  getUserDiscussionInfo(currentUser.id, 'discussionCount')
}

//跳转社区管理页面
function uploadManageCommunity(type) {
  window.open(`f_manageCommunity.html?type=${type}`, '_blank')
}


// 弹窗控制
function showInfoModal() {
  document.getElementById('infoModal').style.display = 'block';
  document.getElementById('previewAvatar').src = document.querySelector('.avatar').src;
  document.getElementById('nicknameInput').value = document.querySelector('.user-details h2').innerText;
}

//关闭弹窗
function closeModal() {
  document.getElementById('infoModal').style.display = 'none';
}

// 头像预览
document.getElementById('avatarInput').addEventListener('change', function (e) {
  const reader = new FileReader();
  reader.onload = function () {
    document.getElementById('previewAvatar').src = reader.result;
  }
  reader.readAsDataURL(e.target.files[0]);
});

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
    const response = await fetch('http://localhost:3000/api/userinfo/update-info', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      const responseUser = await fetch(`http://localhost:3000/api/user/${currentUser.id}/current-user`);
      const user = await responseUser.json();
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  } catch (error) {
    console.error('修改失败:', error);
  }
}
