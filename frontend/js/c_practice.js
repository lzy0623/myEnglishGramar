import { config } from '../../backend/config.js';

let currentExerciseIndex = 0; // 当前练习题的索引
let exercises = []; // 存储所有练习题
let exercisesTitle = '';// 存储练习题的标题
let currentExerciseId = 0;// 存储当前练习题的 ID
let userAnswers = [];//存储用户答题的答案信息
const subCourseId = new URLSearchParams(window.location.search).get('subCourseId');
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// 获取练习题内容
async function loadExercises(subCourseId) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/get/sub-courses/${subCourseId}/exercises`);
    const result = await response.json();
    exercisesTitle = result.title;
    exercises = result.exercises;

    if (exercises.length === 0 && currentUser.admin) {
      showUploadBtn()
      return;
    }
    // 获取用户答题记录
    const type = 'exercise'
    const responseUserAnswer = await fetch(`${config.API_BASE_URL}/api/user/get/${type}/${currentUser.id}/progress?subCourseId=${subCourseId}`,);
    const userAnswerData = await responseUserAnswer.json();
    userAnswers = userAnswerData.data

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
            <div class="option-group" data-correct-answer="${exercise.correct_answer}" data-exercise-id="${exercise.id}">
              <label>
                <input type="radio" name="answer" value="${String.fromCharCode(65 + i)}">
                ${option}
                <span></span>
              </label>
            </div>`).join('')}
        </form>
        <div class="analysis"><p><span>解析:${exercise.analysis}</span></p></div>
        <div class="exercise-navigation">
          <button class="nav-btn" id="prev-btn">上一个</button>
          <button class="nav-btn" id="next-btn">下一个</button>
          <button class="nav-btn" id="save-btn">保存记录</button>
        </div>
     </div>
   </div>
  <div id="upload-practice-box"></div>`: `<div id="upload-practice-box"></div>`;
  // 绑定事件监听器
  bindEventListeners();
  // 恢复用户答案记录
  restoreUserAnswers(exercise.correct_answer);
  // 更新“下一个”按钮状态
  updateNextButtonState();
}

// 选择选项比对答案
function selectOption(correctAnswer, exerciseId, labelElement) {
  console.log('选择选项比对答案', labelElement);
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

// 更新“下一个”按钮状态
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

//保存做题记录
async function saveExercise() {
  if (userAnswers.length === 0) {
    alert('请先作答')
    return
  }
  const exercise = 'exercise'
  const response = await fetch(`${config.API_BASE_URL}/api/user/upload/${exercise}/progress`, {
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

//恢复用户做题记录
function restoreUserAnswers(correct_answer) {
  const userAnswer = userAnswers.find(answer => answer.exerciseId === currentExerciseId.toString());
  if (userAnswer) {
    const selectedRadio = document.querySelector(`input[value="${userAnswer.answer}"]`);
    if (selectedRadio) {
      selectedRadio.checked = true;
      const optionDiv = selectedRadio.closest('.option-group');
      if (userAnswer.answer === correct_answer) {
        optionDiv.classList.add('green');
        optionDiv.querySelector('span').textContent = '✅ 正确！';
      } else {
        optionDiv.classList.add('red');
        optionDiv.querySelector('span').textContent = '❌ 错误！';
      }
    }
  }
}

function showUploadBtn() {
  const practiceContent = document.getElementById('practice-content')
  practiceContent.insertAdjacentHTML('beforeend', `
    <div class="upload-information" data-subcourse-id="${subCourseId}">添加练习题</div>
    `)
  practiceContent.addEventListener('click', (event) => {
    window.open(`../tob/c_uploadexercise.html?id=${subCourseId}`, '_blank');
  })
}


function bindEventListeners() {
  //管理员按钮功能
  const uploadBox = document.getElementById('upload-practice-box')
  if (currentUser.admin) {
    uploadBox.innerHTML = `
  < div class= "upload-information" data - subcourse - id="${subCourseId}" > 添加练习题</div > `
    uploadBox.addEventListener('click', (event) => {
      window.open(`../ tob / c_uploadexercise.html ? id = ${subCourseId}`, '_blank');
    });
  }

  //选项点击事件
  const practiceBox = document.getElementById('practice-content');
  practiceBox.addEventListener('click', (event) => {
    const target = event.target;
    if (target.tagName.toLowerCase() === 'label') {
      const optionGroup = target.closest('.option-group');
      const correctAnswer = optionGroup.getAttribute('data-correct-answer');
      const exerciseId = optionGroup.getAttribute('data-exercise-id');
      selectOption(correctAnswer, exerciseId, target);
      event.stopPropagation();
    }
  });
  //上一题按钮
  document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentExerciseIndex > 0) {
      currentExerciseIndex--;
      showExercise(currentExerciseIndex);
    }
    else {
      alert('已经是第一题了')
    }
  });
  //下一题按钮
  document.getElementById('next-btn').addEventListener('click', () => {
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
  });

  // 保存用户记录按钮
  document.getElementById('save-btn').addEventListener('click', () => {
    saveExercise();
  });

}


// 页面加载时调用
window.onload = () => {
  loadExercises(subCourseId);//调用练习题函数
};