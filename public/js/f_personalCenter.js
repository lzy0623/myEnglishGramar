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

window.onload = function () {
  const currentUser = getCurrentUser()
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


function uploadManageCommunity(type) {
  window.open(`f_manageCommunity.html?type=${type}`, '_blank')
}
