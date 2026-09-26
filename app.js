// ==========================================
// HỆ THỐNG QUẢN LÝ ÔN THI VÀO 10 THPT TRẦN PHÚ
// ==========================================

const STORAGE_KEYS = {
  CHECKLIST: 'lop9_checklist_data',
  POMODORO: 'lop9_pomodoro_stats',
  MISTAKES: 'lop9_mistakes_data'
};

// Sound notification using Web Audio API (Zero external assets needed)
function playBeep(type = 'success') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.log("Audio not supported or permitted yet");
  }
}

// ------------------------------------------
// 1. POMODORO TIMER
// ------------------------------------------
let pomoDuration = 25 * 60; // 25 mins
let pomoRemaining = pomoDuration;
let pomoTimerId = null;
let isPomoRunning = false;
let isBreak = false;
let pomoCount = parseInt(localStorage.getItem(STORAGE_KEYS.POMODORO) || '0', 10);

function updatePomoDisplay() {
  const display = document.getElementById('pomoDisplay');
  const countEl = document.getElementById('pomoCount');
  const labelEl = document.getElementById('pomoLabel');
  if (!display) return;
  
  const m = Math.floor(pomoRemaining / 60);
  const s = pomoRemaining % 60;
  display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  
  if (countEl) countEl.textContent = pomoCount;
  if (labelEl) labelEl.textContent = isBreak ? '☕ NGHỈ GIẢI LAO' : '🎯 CA HỌC TẬP TRUNG';
}

function startPomodoro() {
  if (isPomoRunning) return;
  isPomoRunning = true;
  document.getElementById('btnStartPomo')?.setAttribute('disabled', 'true');
  document.getElementById('btnPausePomo')?.removeAttribute('disabled');
  
  pomoTimerId = setInterval(() => {
    if (pomoRemaining > 0) {
      pomoRemaining--;
      updatePomoDisplay();
    } else {
      clearInterval(pomoTimerId);
      isPomoRunning = false;
      playBeep('success');
      
      if (!isBreak) {
        pomoCount++;
        localStorage.setItem(STORAGE_KEYS.POMODORO, pomoCount);
        alert('🎉 Chúc mừng con đã hoàn thành xuất sắc 1 ca học tập trung! Hãy nghỉ giải lao 5 phút.');
        isBreak = true;
        pomoRemaining = 5 * 60;
      } else {
        alert('⏰ Hết giờ giải lao! Hãy sẵn sàng bước vào ca học tiếp theo nhé!');
        isBreak = false;
        pomoRemaining = pomoDuration;
      }
      document.getElementById('btnStartPomo')?.removeAttribute('disabled');
      document.getElementById('btnPausePomo')?.setAttribute('disabled', 'true');
      updatePomoDisplay();
    }
  }, 1000);
}

function pausePomodoro() {
  if (!isPomoRunning) return;
  clearInterval(pomoTimerId);
  isPomoRunning = false;
  document.getElementById('btnStartPomo')?.removeAttribute('disabled');
  document.getElementById('btnPausePomo')?.setAttribute('disabled', 'true');
}

function resetPomodoro(minutes = 25) {
  pausePomodoro();
  isBreak = false;
  pomoDuration = minutes * 60;
  pomoRemaining = pomoDuration;
  updatePomoDisplay();
}

// ------------------------------------------
// 2. CHECKLIST THEO DÕI TUẦN
// ------------------------------------------
function getChecklistState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKLIST) || '{}');
  } catch (e) {
    return {};
  }
}

function initChecklist() {
  const checkboxes = document.querySelectorAll('.checklist-box');
  if (!checkboxes.length) return;
  
  const savedState = getChecklistState();
  let completed = 0;
  
  checkboxes.forEach(cb => {
    const id = cb.dataset.id;
    if (savedState[id]) {
      cb.checked = true;
      completed++;
    }
    
    cb.addEventListener('change', () => {
      const state = getChecklistState();
      state[id] = cb.checked;
      localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(state));
      if (cb.checked) playBeep('success');
      updateProgress();
    });
  });
  
  updateProgress();
}

function updateProgress() {
  const checkboxes = document.querySelectorAll('.checklist-box');
  const progressText = document.getElementById('progressText');
  const progressBar = document.getElementById('progressBar');
  if (!checkboxes.length) return;
  
  let done = 0;
  checkboxes.forEach(cb => { if (cb.checked) done++; });
  const total = checkboxes.length;
  const pct = Math.round((done / total) * 100);
  
  if (progressText) progressText.textContent = `${done}/${total} ca (${pct}%)`;
  if (progressBar) progressBar.style.width = `${pct}%`;
}

// ------------------------------------------
// 3. SỔ TAY LỖI SAI (MISTAKE LOG)
// ------------------------------------------
function getMistakes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MISTAKES) || '[]');
  } catch (e) {
    return [];
  }
}

function saveMistakes(list) {
  localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(list));
  renderMistakes();
}

function renderMistakes() {
  const container = document.getElementById('mistakesList');
  if (!container) return;
  
  const list = getMistakes();
  if (list.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 1.5rem;">Chưa có lỗi sai nào được ghi chép. Hãy ghi lại khi làm đề để không bị mất điểm oan!</div>';
    return;
  }
  
  container.innerHTML = list.map((item, idx) => `
    <div class="log-item ${item.subject.toLowerCase()}">
      <div class="log-meta">
        <span><strong>[${item.subject}]</strong> ${item.date}</span>
        <button class="btn btn-outline" style="padding: 2px 6px; font-size: 0.75rem;" onclick="deleteMistake(${idx})">Xóa</button>
      </div>
      <div class="log-detail"><strong>Dạng bài:</strong> ${escapeHtml(item.topic)}</div>
      <div class="log-reason">⚠️ <strong>Lỗi sai:</strong> ${escapeHtml(item.mistake)} (Lý do: ${escapeHtml(item.reason)})</div>
      <div class="log-fix">💡 <strong>Khắc phục:</strong> ${escapeHtml(item.fix)}</div>
    </div>
  `).join('');
}

function addMistake(e) {
  e.preventDefault();
  const subject = document.getElementById('logSubject').value;
  const topic = document.getElementById('logTopic').value.trim();
  const mistake = document.getElementById('logMistake').value.trim();
  const reason = document.getElementById('logReason').value.trim();
  const fix = document.getElementById('logFix').value.trim();
  
  if (!topic || !mistake || !fix) {
    alert('Vui lòng điền đầy đủ các thông tin!');
    return;
  }
  
  const list = getMistakes();
  list.unshift({
    subject,
    topic,
    mistake,
    reason,
    fix,
    date: new Date().toLocaleDateString('vi-VN')
  });
  
  saveMistakes(list);
  playBeep('success');
  document.getElementById('mistakeForm').reset();
  alert('Đã lưu lỗi sai vào sổ tay thành công!');
}

function deleteMistake(index) {
  if (confirm('Con có chắc chắn muốn xóa mục này khỏi sổ tay?')) {
    const list = getMistakes();
    list.splice(index, 1);
    saveMistakes(list);
  }
}

// ------------------------------------------
// 4. SAO LƯU & ĐỒNG BỘ (100% MIỄN PHÍ)
// ------------------------------------------
function exportBackup() {
  const data = {
    checklist: getChecklistState(),
    pomodoro: localStorage.getItem(STORAGE_KEYS.POMODORO) || '0',
    mistakes: getMistakes(),
    exportDate: new Date().toISOString()
  };
  
  const jsonStr = JSON.stringify(data, null, 2);
  const codeBox = document.getElementById('syncCodeBox');
  if (codeBox) {
    codeBox.value = jsonStr;
    codeBox.select();
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert('Đã sao chép mã sao lưu vào bộ nhớ tạm! Bạn có thể dán mã này sang máy khác hoặc gửi qua Zalo.');
    }).catch(() => {
      alert('Vui lòng chọn và sao chép đoạn mã trong ô văn bản.');
    });
  }
}

function importBackup() {
  const codeBox = document.getElementById('syncCodeBox');
  if (!codeBox || !codeBox.value.trim()) {
    alert('Vui lòng dán mã sao lưu vào ô văn bản trước!');
    return;
  }
  
  try {
    const data = JSON.parse(codeBox.value.trim());
    if (data.checklist) localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(data.checklist));
    if (data.pomodoro) localStorage.setItem(STORAGE_KEYS.POMODORO, data.pomodoro);
    if (data.mistakes) localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(data.mistakes));
    
    alert('Đồng bộ dữ liệu thành công!');
    location.reload();
  } catch (err) {
    alert('Mã sao lưu không hợp lệ. Vui lòng kiểm tra lại!');
  }
}

// ------------------------------------------
// 5. TRẮC NGHIỆM TƯƠNG TÁC
// ------------------------------------------
function handleQuizClick(btn, isCorrect, expId) {
  const parent = btn.closest('.quiz-options');
  const allBtns = parent.querySelectorAll('.quiz-option-btn');
  allBtns.forEach(b => b.setAttribute('disabled', 'true'));
  
  if (isCorrect) {
    btn.classList.add('correct');
    playBeep('success');
  } else {
    btn.classList.add('wrong');
    allBtns.forEach(b => {
      if (b.dataset.correct === "true") b.classList.add('correct');
    });
    playBeep('error');
  }
  
  const expEl = document.getElementById(expId);
  if (expEl) expEl.style.display = 'block';
}

// ------------------------------------------
// 6. CÔNG CỤ TẠO ĐOẠN VĂN NLXH 5 BƯỚC (VĂN.HTML)
// ------------------------------------------
function generateNLXH() {
  const topic = document.getElementById('nlxhTopic')?.value.trim();
  const example = document.getElementById('nlxhExample')?.value.trim();
  const resultBox = document.getElementById('nlxhResult');
  if (!topic || !resultBox) return;
  
  const charPerson = example || 'Thầy giáo Nguyễn Ngọc Ký';
  
  const text = `Trong hành trình hoàn thiện nhân cách để vươn tới thành công, ${topic} chính là một trong những phẩm chất quan trọng và quý giá nhất của mỗi con người. ${topic} có thể hiểu là lối sống, thái độ tích cực biết nỗ lực hành động đúng đắn mà không ngại ngần thử thách. Thật vậy, người sở hữu ${topic} sẽ luôn tìm thấy sức mạnh nội tại để vượt qua những khó khăn, tạo dựng được uy tín vững chắc và nhận được sự tôn trọng, tin yêu từ mọi người xung quanh. Minh chứng tiêu biểu là tấm gương ${charPerson} - người đã không ngừng nỗ lực vượt lên nghịch cảnh để đạt được thành tựu xuất sắc và truyền cảm hứng mạnh mẽ cho cộng đồng. Trái lại, trong cuộc sống vẫn còn những kẻ sống ỷ lại, thiếu ${topic}, đó là thái độ sống đáng bị lên án. Là một học sinh lớp 9 đang đứng trước kỳ thi chuyển cấp quan trọng, em luôn tự nhắc nhở bản thân phải rèn luyện ${topic} ngay từ những việc nhỏ mỗi ngày để vững bước tương lai.`;
  
  resultBox.value = text;
  alert('Đã lắp ghép thành công đoạn văn NLXH chuẩn 200 chữ theo công thức 5 bước!');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updatePomoDisplay();
  initChecklist();
  renderMistakes();
  
  const form = document.getElementById('mistakeForm');
  if (form) form.addEventListener('submit', addMistake);
});
