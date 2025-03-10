
// 登录函数
async function login(event) {
  event.preventDefault(); // 阻止表单默认提交行为
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) {
    alert('用户名和密码不能为空');
    return;
  }
  // if (!/^\d{11}$/.test(username)) {
  //   alert('用户名必须是11位数字且不包含其他字符');
  //   return;
  // }
  // if (!/^[a-zA-Z0-9]{6,20}$/.test(password)) {
  //   alert('密码至少6到20个字符,并且只能包含数字和字母');
  //   return;
  // }
  try {
    const response = await fetch('http://localhost:3000/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (response.ok) {
      localStorage.setItem('currentUser', JSON.stringify(result.user));// 登录成功后存储用户信息到 localStorage
      window.location.href = 'b_dailySentence.html';
    } else {
      alert(result.error);
    }
  } catch (err) {
    alert('登录失败,catch错误可能是服务器错误');
  }
}