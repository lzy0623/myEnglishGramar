let currentExerciseIndex = 0; // 当前练习题的索引
let exercises = []; // 存储所有练习题
let exercisesTitle = '';// 存储练习题的标题
let currentExerciseId = 0;// 存储当前练习题的 ID
let userAnswers = [];//存储用户答题的答案信息
const subCourseId = new URLSearchParams(window.location.search).get('subCourseId');// 解析获取子课程 ID
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// 获取练习题内容
async function loadExercises(subCourseId) {
  try {
    // 调用后端 API 获取练习题
    const response = await fetch(`http://localhost:3000/api/get/sub-courses/${subCourseId}/exercises`);
    const result = await response.json();
    exercises = result.exercises;
    exercisesTitle = result.title;
    // 获取用户答题记录
    const exercise = 'exercise'
    const responseUserAnswer = await fetch(`http://localhost:3000/api/user/get/${exercise}/${currentUser.id}/progress?subCourseId=${subCourseId}`,);
    const userAnswerData = await responseUserAnswer.json();
    userAnswers = userAnswerData.data
    // 显示第一道题
    showExercise(currentExerciseIndex);
  } catch (err) {
    console.error('加载练习题失败:', err);
  }
}
// 显示指定索引的练习题
function showExercise(index) {
  const exercise = exercises[index];
  currentExerciseId = exercise.id
  const contentContainer = document.getElementById('practice-content');
  contentContainer.innerHTML = exercises.length > 0 ? `
    <div class="box">
      <h2 class="title">${exercisesTitle}-练习题</h2>
      <div class="exercise-box">
        <p class="exercise-number">第 ${index + 1}/${exercises.length} 题</p>
        <p class="exercise-question">${exercise.question}</p>
        <form>
          ${exercise.options.map((option, i) => `
            <div class="option-group">
              <label onclick="selectOption('${exercise.correct_answer}','${exercise.id}',event)">
                <input type="radio" name="answer" value="${String.fromCharCode(65 + i)}">
                ${option}
                <span></span>
              </label>
            </div>`).join('')}
        </form>
        <div class="analysis"><p><span>解析:${exercise.analysis}</span></p></div>
        <div class="exercise-navigation">
          <button class="nav-btn" id="pre-btn" onclick="prevExercise()">上一个</button>
          <button class="nav-btn" id="next-btn" onclick="nextExercise()">下一个</button>
          <button class="nav-btn" id="save-btn" onclick="saveExercise()">保存记录</button>
        </div>
     </div>
   </div>
  <div id="upload-practice-box"></div>`: `<div id="upload-practice-box"></div>`;
  if (currentUser.admin) {
    document.getElementById('upload-practice-box').innerHTML = `<div class="upload-information" onclick="uploadSubCourseExcercise(${subCourseId})">添加练习题</div>`;

  }

  // 恢复用户答案
  const userAnswer = userAnswers.find(answer => answer.exerciseId === currentExerciseId.toString());
  if (userAnswer) {
    const selectedRadio = document.querySelector(`input[value="${userAnswer.answer}"]`);
    if (selectedRadio) {
      selectedRadio.checked = true;
      const parentLabel = selectedRadio.closest('.option-group');
      if (userAnswer.answer === exercise.correct_answer) {
        parentLabel.classList.add('green');
        parentLabel.querySelector('span').textContent = '✅ 正确！';
      } else {
        parentLabel.classList.add('red');
        parentLabel.querySelector('span').textContent = '❌ 错误！';
      }
    }
  }
  // 更新“下一个”按钮状态
  updateNextButtonState();
}

// 选择选项比对答案
function selectOption(correctAnswer, exerciseId, event) {
  event.stopPropagation(); // 阻止事件冒泡和捕获
  // 确保 event.target 是 label 元素
  let labelElement = event.target;
  if (labelElement.tagName.toLowerCase() !== 'label') {
    labelElement = labelElement.closest('label');
  }
  const selectedOption = labelElement.querySelector('input[type="radio"]');
  const selectedValue = selectedOption.value;
  const spanElement = labelElement.querySelector('span');

  // 清除所有选项的提示信息
  const allSpans = document.querySelectorAll('.option-group span');
  allSpans.forEach(span => {
    span.parentElement.classList.remove('green', 'red');
    span.textContent = '';
  });

  // 判断是否正确并显示提示信息
  if (selectedValue === correctAnswer) {
    spanElement.parentElement.classList.add('green');
    spanElement.textContent = '✅ 正确！';
  } else {
    spanElement.parentElement.classList.add('red');
    spanElement.textContent = '❌ 错误！';
  }
  // 保存用户答案
  const existingAnswer = userAnswers.find(answer => answer.exerciseId === exerciseId);
  if (existingAnswer) {
    existingAnswer.answer = selectedValue; // 更新已有答案
  } else {
    userAnswers.push({ exerciseId: exerciseId, answer: selectedValue }); // 新增答案
  }
  // 更新“下一个”按钮状态
  updateNextButtonState();
}
function updateNextButtonState() {
  const nextButton = document.getElementById('next-btn');
  const saveButton = document.getElementById('save-btn');
  const userAnswer = userAnswers.find(answer => answer.exerciseId === currentExerciseId.toString());
  if (userAnswer && userAnswer.answer === exercises[currentExerciseIndex].correct_answer) {
    nextButton.style.display = 'block';
    saveButton.style.display = 'block';
    document.querySelector('.analysis').style.display = 'block';
  } else {
    nextButton.style.display = 'none';
    saveButton.style.display = 'none';
    document.querySelector('.analysis').style.display = 'none';
  }
}

// 上一题
function prevExercise() {
  if (currentExerciseIndex > 0) {
    currentExerciseIndex--;
    showExercise(currentExerciseIndex);
  }
  else {
    alert('已经是第一题了')
  }
}
// 下一题
function nextExercise() {
  const userAnswer = userAnswers.find(answer => answer.exerciseId === currentExerciseId.toString());
  if (userAnswer && userAnswer.answer === exercises[currentExerciseIndex].correct_answer) {
    if (currentExerciseIndex < exercises.length - 1) {
      currentExerciseIndex++;
      showExercise(currentExerciseIndex);
    }
    else {
      alert('已经是最后一题了')
    }
  }
}
//保存做题记录
async function saveExercise() {
  if (userAnswers.length === 0) {
    alert('请先作答')
    return
  }
  const exercise = 'exercise'
  const response = await fetch(`http://localhost:3000/api/user/upload/${exercise}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.id,
      subCourseId: subCourseId,
      data: userAnswers
    })
  })
  const result = await response.json();
  if (response.ok) {
    alert('答题记录保存成功' + result.message)
  } else {
    alert('答题记录保存失败' + result.errorj)
  }
}


//----------管理员功能------------------
function uploadSubCourseExcercise(subCourseId) {
  window.location.href = `tob/c_uploadexercise.html?id=${subCourseId}`
}


// 页面加载时调用
window.onload = () => {
  loadExercises(subCourseId);//调用练习题函数
};