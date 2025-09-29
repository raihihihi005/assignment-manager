document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("taskForm");
  const taskList = document.getElementById("taskList");
  const firebaseConfig = {
  // あなたのFirebaseプロジェクトの設定情報
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  firebase.auth().signInAnonymously()
  .then(() => {
    const uid = firebase.auth().currentUser.uid;
    console.log("Anonymous UID:", uid);
    loadTasks(); // ← ここで初回表示
  });

  function saveTask(task) {
  const uid = firebase.auth().currentUser.uid;
  db.collection("users").doc(uid).collection("tasks").add(task)
    .then((docRef) => {
      console.log("Task saved with ID:", docRef.id);
    });
  } 

  function loadTasks() {
  const uid = firebase.auth().currentUser.uid;
  db.collection("users").doc(uid).collection("tasks").get()
    .then((querySnapshot) => {
      const tasks = [];
      querySnapshot.forEach((doc) => {
        tasks.push(doc.data());
      });
      renderTasks(tasks);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const deadline = document.getElementById("deadline").value;
    const subject = document.getElementById("subject").value;
    addSubjectOption(subject); // ← ここで候補に追加
    const task = { title, deadline, subject };
    saveTask(task);
    form.reset();
    renderTasks();
  });

  function addSubjectOption(subject) {
  const subjectList = document.getElementById("subjectList");
  const options = Array.from(subjectList.options).map(opt => opt.value.toLowerCase());
  if (!options.includes(subject.toLowerCase())) {
    const newOption = document.createElement("option");
    newOption.value = subject;
    subjectList.appendChild(newOption);
  }
}

  function deleteTask(taskToDelete) {
  
  const updatedTasks = tasks.filter(task =>
    !(task.title === taskToDelete.title &&
      task.deadline === taskToDelete.deadline &&
      task.subject === taskToDelete.subject)
  );
  
  renderTasks();
}
document.getElementById("filterButton").addEventListener("click", renderTasks);



  function renderTasks(tasks) {
  

  const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
  const showExpiredOnly = document.getElementById("filterExpired").checked;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // 日付だけで比較

  // フィルター処理
  let filteredTasks = tasks.filter(task => {
    const deadlineDate = new Date(task.deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const isExpired = deadlineDate < today;
    const matchesKeyword =
      keyword === "" ||
      task.title.toLowerCase().includes(keyword) ||
      task.subject.toLowerCase().includes(keyword);

    if (showExpiredOnly) {
      return isExpired && matchesKeyword;
    } else {
      return matchesKeyword;
    }
  });

  // 並び替え：期限あり → 期限切れ
  const activeTasks = filteredTasks.filter(task => {
    const deadlineDate = new Date(task.deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate >= today;
  });

  const expiredTasks = filteredTasks.filter(task => {
    const deadlineDate = new Date(task.deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  });

  activeTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  expiredTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  taskList.innerHTML = "";

  [...activeTasks, ...expiredTasks].forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item";

    const deadlineDate = new Date(task.deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
  li.classList.add("expired");
} else if (diffDays <= 1) {
  li.classList.add("urgent"); // 今日と明日が赤色
} else if (diffDays <= 3) {
  li.classList.add("warning"); // 2〜3日後が黄色
} 

    const info = document.createElement("div");
    info.className = "task-info";
    info.innerHTML = `
      <span><strong>${task.title}</strong></span>
      <span>教科: ${task.subject}</span>
      <span>期限: ${task.deadline}</span>
    `;

    const delBtn = document.createElement("button");
    delBtn.className = "delete";
    delBtn.textContent = "達成";
    delBtn.onclick = () => deleteTask(task);

    li.appendChild(info);
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}
  renderTasks();
});