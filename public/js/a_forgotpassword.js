// 注册函数
async function forgotpassword(event) {
  event.preventDefault(); // 阻止表单默认提交行为
  const username = document.getElementById('username').value.trim();//获取用户名元素的值
  const password = document.getElementById('password').value.trim();//获取密码元素的值
  const confirmPassword = document.getElementById('confirm-password').value.trim();//获取确认密码元素的值

  if (!/^\d{11}$/.test(username)) {
    alert('用户名必须是11位数字且不包含其他字符');
    return;
  }
  if (!/^[a-zA-Z0-9]{6,20}$/.test(password)) {
    alert('密码至少6到20个字符,并且只能包含数字和字母');
    return;
  }
  // 检查两次密码是否一致
  if (password !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }
  try {
    const response = await fetch('http://localhost:3000/api/user/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();//将HTTP响应体解析为JSON格式，并将其赋值给变量 result
    if (response.ok) {
      //.ok属性表示响应成功，成功状态码200-299
      alert(result.message);
      window.location.href = 'a_login.html'; // 修改成功后跳转到登录页
    } else {
      alert(result.error);
    }
  } catch (err) {
    alert('修改失败,可能服务器未连接');
  }
}