// 注册函数
async function register(event) {
  event.preventDefault(); // 阻止表单默认提交行为
  const username = document.getElementById('username').value.trim();//获取用户名元素的值
  const password = document.getElementById('password').value.trim();//获取密码元素的值
  const confirmPassword = document.getElementById('confirm-password').value.trim();//获取确认密码元素的值
  const termsCheckbox = document.getElementById('terms');//获取协议框元素

  // 验证用户名是否为11位数字
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
  // 是否勾选协议
  if (!termsCheckbox.checked) {
    event.preventDefault(); // 阻止表单提交
    alert('请先阅读并同意服务条款和隐私政策');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },//设置了请求头中的 Content-Type(媒体类型) 为 application/json(表示请求体中的数据格式是JSON。)。
      body: JSON.stringify({ username, password })//JSON.stringify() 方法将一个 JavaScript 对象或数组转换为 JSON 字符串。
    });
    const result = await response.json();//将HTTP响应体解析为JSON格式，并将其赋值给变量 result
    if (response.ok) {
      alert(result.message);
      window.location.href = 'a_login.html'; // 注册成功后跳转到登录页
    } else {
      alert(result.error);
    }
  } catch (err) {
    alert('注册失败,catch错误可能服务器未连接');
  }
}