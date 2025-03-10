let currentExerciseIndex = 0; // 当前练习题的索引
let exercises = []; // 存储所有练习题
let exercisesTitle = '';
let userAnswers = [];//存储答案信息
const subCourseId = new URLSearchParams(window.location.search).get('subCourseId');// 解析获取子课程 ID

// 获取练习题内容
async function loadExercises(subCourseId) {
  try {
    // 调用后端 API 获取练习题
    const response = await fetch(`http://localhost:3000/api/get/sub-courses/${subCourseId}/exercises`);
    const result = await response.json();
    exercises = result.exercises;
    exercisesTitle = result.title;
    // 显示第一道题
    showExercise(currentExerciseIndex);
  } catch (err) {
    console.error('加载练习题失败:', err);
  }
}
// 显示指定索引的练习题
function showExercise(index) {
  const exercise = exercises[index];
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
              <label onclick="selectOption('${exercise.correct_answer}',event)">
                <input type="radio" name="answer" value="${String.fromCharCode(65 + i)}">
                ${option}
                <span></span>
              </label>
            </div>`).join('')}
        </form>
        <div class="analysis"><p><span>解析:</span>为什么</p></div>
        <div class="exercise-navigation">
          <button class="nav-btn" id="pre-btn" onclick="prevExercise()">上一个</button>
          <button class="nav-btn" id="next-btn" onclick="nextExercise()">下一个</button>
        </div>
     </div>
   </div>
  <div id="upload-practice-box"></div>`: `<div id="upload-practice-box"></div>`;

  if (localStorage.getItem('currentUser')) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser.admin) {
      document.getElementById('upload-practice-box').innerHTML = `<div class="upload-information" onclick="uploadSubCourseExcercise(${subCourseId})">添加练习题</div>`;
    }
  }

  // 恢复用户答案
  const userAnswer = userAnswers.find(answer => answer.index === index);
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
function selectOption(correctAnswer, event) {
  const selectedOption = event.target.querySelector('input[type="radio"]');
  const selectedValue = selectedOption.value;
  const spanElement = event.target.querySelector('span');

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
  const existingAnswer = userAnswers.find(answer => answer.index === currentExerciseIndex);
  if (existingAnswer) {
    existingAnswer.answer = selectedValue; // 更新已有答案
  } else {
    userAnswers.push({ index: currentExerciseIndex, answer: selectedValue }); // 新增答案
  }

  // 更新“下一个”按钮状态
  updateNextButtonState();
}
function updateNextButtonState() {
  const nextButton = document.getElementById('next-btn');
  const userAnswer = userAnswers.find(answer => answer.index === currentExerciseIndex);

  if (userAnswer && userAnswer.answer === exercises[currentExerciseIndex].correct_answer) {
    nextButton.style.display = 'block';
    document.querySelector('.analysis').style.display = 'block';
  } else {
    nextButton.style.display = 'none';
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
  const userAnswer = userAnswers.find(answer => answer.index === currentExerciseIndex);
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


//----------管理员功能------------------
function uploadSubCourseExcercise(subCourseId) {
  window.location.href = `tob/c_uploadexercise.html?id=${subCourseId}`
}


// 页面加载时调用
window.onload = () => {
  loadExercises(subCourseId);//调用练习题函数
};