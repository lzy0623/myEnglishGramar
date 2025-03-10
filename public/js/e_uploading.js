// 提交题目
async function submitDiscussionQuestion(event) {
  event.preventDefault(); // 阻止表单默认提交行为
  const type = document.getElementById('type').value.trim();
  const question = document.getElementById('question').value.trim();
  const optionA = document.getElementById('optionA').value.trim();
  const optionB = document.getElementById('optionB').value.trim();
  const optionC = document.getElementById('optionC').value.trim();
  const optionD = document.getElementById('optionD').value.trim();
  const analysis = document.getElementById('analysis').value.trim();

  // 获取正确答案
  const correctAnswer = document.querySelector('input[name="correctAnswer"]:checked')?.value;
  if (!correctAnswer) {
    alert('请在选项后勾选正确答案!');
    return;
  }

  // 构造选项数组
  const options = [optionA, optionB, optionC, optionD].filter(option => option !== '');

  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = currentUser.id;
    const response = await fetch('http://localhost:3000/api/discussion/upload/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, question, options, correctAnswer, analysis, type })
    });
    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      window.location.href = 'e_community.html'; // 上传成功后跳转到社区讨论页面
    } else {
      alert(result.error || '上传题目失败');
    }
  } catch (err) {
    alert('上传题目失败,可能网络未连接或未登录');
  }
}

// 取消上传
document.querySelector('.cancel-btn').addEventListener('click', () => {
  window.close();
});


// 动态启用/禁用单选按钮和输入框
function toggleRadioButtons() {
  const optionA = document.getElementById('optionA').value.trim();
  const optionB = document.getElementById('optionB').value.trim();
  const optionC = document.getElementById('optionC').value.trim();
  const optionD = document.getElementById('optionD').value.trim();

  document.getElementById('radioA').disabled = optionA === '';
  document.getElementById('radioB').disabled = optionB === '';
  document.getElementById('radioC').disabled = optionC === '';
  document.getElementById('radioD').disabled = optionD === '';

  document.getElementById('optionB').disabled = optionA === '';
  document.getElementById('optionC').disabled = optionB === '';
  document.getElementById('optionD').disabled = optionC === '';

}

// 监听选项输入框的变化
document.getElementById('optionA').addEventListener('input', toggleRadioButtons);
document.getElementById('optionB').addEventListener('input', toggleRadioButtons);
document.getElementById('optionC').addEventListener('input', toggleRadioButtons);
document.getElementById('optionD').addEventListener('input', toggleRadioButtons);

// 初始化时调用一次
toggleRadioButtons();