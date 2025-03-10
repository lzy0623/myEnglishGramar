//从本地存储中获取当前用户的信息
const currentUser = JSON.parse(localStorage.getItem('currentUser'))

if (currentUser) {
  updateUserInfo(currentUser)
  document.querySelector('.user-info').insertAdjacentHTML('beforeend', `
    <div class="logout-btn" onclick="logout()">
      退出登录
    </div>
  `)
}

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
  document.querySelector('.user-details .register-date').textContent = `${userCreateDate}注册`
}

function logout() {
  const confirmed = confirm('确定要退出登录吗？')
  if (confirmed) {
    localStorage.removeItem('currentUser')
    window.location.href = 'a_login.html'
  }
}