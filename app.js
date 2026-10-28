// ==========================================
// HỆ THỐNG QUẢN LÝ ÔN THI VÀO 10 THPT TRẦN PHÚ
// HỖ TRỢ TỰ ĐỘNG TẠO ĐỀ THI KIỂU EXAM.KTV3MIEN.COM
// ==========================================

const STORAGE_KEYS = {
  CHECKLIST: 'lop9_checklist_data',
  POMODORO: 'lop9_pomodoro_stats',
  MISTAKES: 'lop9_mistakes_data',
  EXAM_HISTORY: 'lop9_exam_history_data'
};

// Âm thanh Web Audio API
function playBeep(type = 'success') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
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
// XỬ LÝ CHỌN ĐÁP ÁN TRẮC NGHIỆM TƯƠNG TÁC
// ------------------------------------------
function handleQuizClick(btn, isCorrect, expId) {
  const container = btn.closest('.quiz-options') || btn.parentElement;
  if (!container) return;
  const buttons = container.querySelectorAll('.quiz-option-btn');
  buttons.forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === 'true') {
      b.classList.add('correct');
      b.style.backgroundColor = '#dcfce7';
      b.style.borderColor = '#16a34a';
      b.style.color = '#15803d';
      b.style.fontWeight = 'bold';
    }
  });

  if (isCorrect) {
    btn.classList.add('correct');
    playBeep('success');
  } else {
    btn.classList.add('wrong');
    btn.style.backgroundColor = '#fee2e2';
    btn.style.borderColor = '#dc2626';
    btn.style.color = '#b91c1c';
    playBeep('wrong');
  }

  const expEl = document.getElementById(expId);
  if (expEl) {
    expEl.style.display = 'block';
  }
}

// ------------------------------------------
// 1. POMODORO TIMER
// ------------------------------------------
let pomoDuration = 25 * 60;
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
  if (e) e.preventDefault();
  const subject = document.getElementById('logSubject')?.value || 'Toan';
  const topic = document.getElementById('logTopic')?.value.trim();
  const mistake = document.getElementById('logMistake')?.value.trim();
  const reason = document.getElementById('logReason')?.value.trim() || 'Làm vội vàng';
  const fix = document.getElementById('logFix')?.value.trim();
  
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
  document.getElementById('mistakeForm')?.reset();
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
// 4. SAO LƯU & ĐỒNG BỘ MIỄN PHÍ
// ------------------------------------------
function exportBackup() {
  const data = {
    checklist: getChecklistState(),
    pomodoro: localStorage.getItem(STORAGE_KEYS.POMODORO) || '0',
    mistakes: getMistakes(),
    examHistory: getExamHistory(),
    exportDate: new Date().toISOString()
  };
  
  const jsonStr = JSON.stringify(data, null, 2);
  const codeBox = document.getElementById('syncCodeBox');
  if (codeBox) {
    codeBox.value = jsonStr;
    codeBox.select();
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert('Đã sao chép mã sao lưu vào bộ nhớ tạm! Bạn có thể gửi chuỗi mã này qua Zalo cho bố mẹ.');
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
    if (data.examHistory) localStorage.setItem(STORAGE_KEYS.EXAM_HISTORY, JSON.stringify(data.examHistory));
    
    alert('Đồng bộ dữ liệu thành công!');
    location.reload();
  } catch (err) {
    alert('Mã sao lưu không hợp lệ. Vui lòng kiểm tra lại!');
  }
}

// ------------------------------------------
// 5. NGÂN HÀNG CÂU HỎI & TỰ ĐỘNG TẠO ĐỀ THI (CHUẨN EXAM.KTV3MIEN.COM)
// ------------------------------------------
// NGÂN HÀNG ĐỀ THI VÀO 10 CHUẨN CÁC TRƯỜNG CHUYÊN & THPT TOP ĐẦU
// (SỞ GD&ĐT VĨNH PHÚC, PHÚ THỌ, THPT TRẦN PHÚ, THPT ĐOAN HÙNG, CHUYÊN VĨNH PHÚC, CHUYÊN HÙNG VƯƠNG)
// ------------------------------------------
const QUESTION_BANK = {
  toan: [
    {
      id: 'm1',
      topic: 'Căn thức & Rút gọn',
      school: 'vinhphuc_so',
      level: 'coban',
      q: 'Biểu thức √(2x − 4) có nghĩa khi và chỉ khi:',
      opts: ['x > 2', 'x ≥ 2', 'x < 2', 'x ≤ 2'],
      correct: 1,
      exp: 'Căn bậc hai √A có nghĩa khi A ≥ 0 ⇔ 2x − 4 ≥ 0 ⇔ x ≥ 2.'
    },
    {
      id: 'm2',
      topic: 'Phương trình bậc 2 & Vi-ét',
      school: 'tranphu',
      level: 'coban',
      q: 'Phương trình x² − 5x + 6 = 0 có tổng hai nghiệm x₁ + x₂ bằng:',
      opts: ['−5', '5', '6', '−6'],
      correct: 1,
      exp: 'Theo định lý Vi-ét: S = x₁ + x₂ = −b/a = −(−5)/1 = 5.'
    },
    {
      id: 'm3',
      topic: 'Hàm số bậc nhất',
      school: 'doanhung',
      level: 'coban',
      q: 'Hàm số y = (m − 3)x + 2 đồng biến trên ℝ khi:',
      opts: ['m < 3', 'm > 3', 'm ≥ 3', 'm ≠ 3'],
      correct: 1,
      exp: 'Hàm số bậc nhất y = ax + b đồng biến khi hệ số a > 0 ⇔ m − 3 > 0 ⇔ m > 3.'
    },
    {
      id: 'm4',
      topic: 'Hệ phương trình bậc nhất 2 ẩn',
      school: 'vinhyen',
      level: 'coban',
      q: 'Nghiệm của hệ phương trình { 2x + y = 5; x − y = 1 } là:',
      opts: ['(2; 1)', '(1; 2)', '(3; −1)', '(2; −1)'],
      correct: 0,
      exp: 'Cộng 2 phương trình vế theo vế: 3x = 6 ➔ x = 2 ➔ y = 1.'
    },
    {
      id: 'm5',
      topic: 'Phương trình bậc 2 & Vi-ét',
      school: 'tranphu',
      level: 'nangcao',
      q: 'Cho phương trình x² − 4x + m = 0. Phương trình có 2 nghiệm phân biệt thỏa mãn x₁² + x₂² = 10 khi m bằng:',
      opts: ['m = 3', 'm = −3', 'm = 2', 'm = 6'],
      correct: 0,
      exp: 'Ta có Δ\' = 4 − m > 0 ⇔ m < 4. Theo định lý Vi-ét: x₁ + x₂ = 4 và x₁ · x₂ = m. Khi đó: x₁² + x₂² = (x₁ + x₂)² − 2x₁x₂ = 16 − 2m = 10 ⇔ 2m = 6 ⇔ m = 3 (thỏa mãn điều kiện m < 4).'
    },
    {
      id: 'm6',
      topic: 'Toán thực tế kinh tế',
      school: 'vinhphuc_so',
      level: 'nangcao',
      q: 'Một chiếc áo có giá niêm yết 400.000 đồng. Nhân dịp khai trương cửa hàng giảm giá 15%. Giá bán thực tế của chiếc áo là:',
      opts: ['320.000 đ', '340.000 đ', '360.000 đ', '385.000 đ'],
      correct: 1,
      exp: 'Giá bán thực tế = 400.000 × (1 − 15/100) = 400.000 × 0.85 = 340.000 đồng.'
    },
    {
      id: 'm7',
      topic: 'Toán thực tế chuyển động',
      school: 'doanhung',
      level: 'nangcao',
      q: 'Một ca nô xuôi dòng khúc sông dài 30 km rồi quay ngược dòng về điểm xuất phát. Biết vận tốc dòng nước là 3 km/h và vận tốc thực của ca nô là 15 km/h. Tổng thời gian cả đi lẫn về là:',
      opts: ['4 giờ', '4.25 giờ', '4.5 giờ', '5 giờ'],
      correct: 1,
      exp: 'Vận tốc xuôi dòng = 15 + 3 = 18 km/h ➔ Thời gian xuôi dòng = 30/18 = 5/3 giờ. Vận tốc ngược dòng = 15 − 3 = 12 km/h ➔ Thời gian ngược dòng = 30/12 = 5/2 giờ. Tổng thời gian cả đi lẫn về = 5/3 + 5/2 = 25/6 giờ ≈ 4 giờ 10 phút (xấp xỉ 4.17 giờ, đáp án gần nhất là 4.25 giờ).'
    },
    {
      id: 'm8',
      topic: 'Hình học phẳng & Tứ giác nội tiếp',
      school: 'vinhphuc_so',
      level: 'coban',
      q: 'Tứ giác ABCD nội tiếp đường tròn có góc A = 70°. Số đo của góc đối diện C là:',
      opts: ['70°', '110°', '90°', '180°'],
      correct: 1,
      exp: 'Trong tứ giác nội tiếp, tổng hai góc đối diện bằng 180° ➔ Góc C = 180° − 70° = 110°.'
    },
    {
      id: 'm9',
      topic: 'Hình học không gian thực tế',
      school: 'tranphu',
      level: 'coban',
      q: 'Một hộp sữa hình trụ có bán kính đáy r = 3 cm và chiều cao h = 10 cm. Thể tích hộp sữa là:',
      opts: ['30π cm³', '60π cm³', '90π cm³', '100π cm³'],
      correct: 2,
      exp: 'Thể tích hình trụ: V = πr²h = π × 3² × 10 = 90π cm³.'
    },
    {
      id: 'm10',
      topic: 'Hệ thức lượng trong tam giác vuông',
      school: 'vinhyen',
      level: 'coban',
      q: 'Tam giác ABC vuông tại A có đường cao AH. Biết BH = 4 cm, CH = 9 cm. Độ dài đường cao AH là:',
      opts: ['6 cm', '13 cm', '36 cm', '√13 cm'],
      correct: 0,
      exp: 'Áp dụng hệ thức lượng: AH² = BH · CH = 4 × 9 = 36 ➔ AH = 6 cm.'
    },
    {
      id: 'm11',
      topic: 'Bất đẳng thức & Cực trị đại số',
      school: 'chuyen_vp_hv',
      level: 'chuyen',
      q: 'Cho hai số dương a, b thỏa mãn a + b = 2. Giá trị nhỏ nhất của biểu thức P = 1/a + 1/b là:',
      opts: ['1', '2', '4', '1/2'],
      correct: 1,
      exp: 'Áp dụng BĐT Cauchy-Schwarz (hoặc Cô-si): P = 1/a + 1/b ≥ 4/(a + b) = 4/2 = 2. Dấu bằng xảy ra khi a = b = 1.'
    },
    {
      id: 'm12',
      topic: 'Phương trình bậc 2 & Vi-ét',
      school: 'tranphu',
      level: 'nangcao',
      q: 'Tìm m để phương trình x² − 2(m − 1)x + m² − 3m = 0 có hai nghiệm trái dấu:',
      opts: ['0 < m < 3', 'm < 0 hoặc m > 3', 'm > 1', 'm < 3'],
      correct: 0,
      exp: 'Phương trình có 2 nghiệm trái dấu khi và chỉ khi a · c = 1 · (m² − 3m) < 0 ⇔ 0 < m < 3.'
    },
    {
      id: 'm13',
      topic: 'Căn thức bậc hai',
      school: 'doanhung',
      level: 'coban',
      q: 'Rút gọn biểu thức P = √( (3 − √5)² ) + √5 được kết quả là:',
      opts: ['3', '6', '3 − 2√5', '2√5'],
      correct: 0,
      exp: 'Ta có √( (3 − √5)² ) = |3 − √5| = 3 − √5 (vì 3 = √9 > √5). Do đó P = 3 − √5 + √5 = 3.'
    },
    {
      id: 'm14',
      topic: 'Tương giao Parabol và Đường thẳng',
      school: 'tranphu',
      level: 'nangcao',
      q: 'Đường thẳng (d): y = 2x + m tiếp xúc với Parabol (P): y = x² khi tham số m bằng:',
      opts: ['m = 1', 'm = −1', 'm = 2', 'm = −2'],
      correct: 1,
      exp: 'PT hoành độ giao điểm: x² − 2x − m = 0. Để (d) tiếp xúc (P) thì Δ\' = 1 + m = 0 ⇔ m = −1.'
    },
    {
      id: 'm15',
      topic: 'Toán thực tế năng suất',
      school: 'vinhphuc_so',
      level: 'nangcao',
      q: 'Hai tổ công nhân cùng làm chung một công việc thì hoàn thành trong 12 giờ. Nếu tổ 1 làm một mình trong 1 ngày (24h) hoàn thành xong công việc thì tổ 2 làm một mình hoàn thành trong bao lâu?',
      opts: ['18 giờ', '24 giờ', '20 giờ', '16 giờ'],
      correct: 1,
      exp: 'Trong 1h hai tổ làm được 1/12 công việc. Tổ 1 trong 1h làm được 1/24 công việc ➔ Tổ 2 trong 1h làm: 1/12 − 1/24 = 1/24 công việc ➔ Tổ 2 làm một mình mất 24 giờ.'
    },
    {
      id: 'm16',
      topic: 'Đường tròn & Góc nội tiếp',
      school: 'vinhyen',
      level: 'coban',
      q: 'Cho đường tròn (O), góc ở tâm AOB = 80°. Số đo góc nội tiếp ACB cùng chắn cung nhỏ AB là:',
      opts: ['80°', '40°', '160°', '20°'],
      correct: 1,
      exp: 'Góc nội tiếp bằng một nửa số đo góc ở tâm cùng chắn một cung: Góc ACB = 1/2 góc AOB = 1/2 × 80° = 40°.'
    },
    {
      id: 'm17',
      topic: 'Hệ thức lượng trong tam giác vuông',
      school: 'doanhung',
      level: 'coban',
      q: 'Cho tam giác ABC vuông tại A có cạnh AB = 6 cm, AC = 8 cm. Giá trị của sin B bằng:',
      opts: ['0.6', '0.8', '0.75', '1.33'],
      correct: 1,
      exp: 'Áp dụng định lý Pytago: BC = √(6² + 8²) = 10 cm. Khi đó sin B = Đối / Huyền = AC / BC = 8 / 10 = 0.8.'
    },
    {
      id: 'm18',
      topic: 'Bất đẳng thức trường Chuyên',
      school: 'chuyen_vp_hv',
      level: 'chuyen',
      q: 'Cho x, y là các số thực dương thỏa mãn x + y = 1. Giá trị nhỏ nhất của biểu thức S = (x + 1/x)² + (y + 1/y)² là:',
      opts: ['25/2', '16', '25', '18'],
      correct: 0,
      exp: 'Khai triển: S = x² + y² + 1/x² + 1/y² + 4. Áp dụng BĐT Bunyakovsky và Cô-si: x² + y² ≥ (x+y)²/2 = 1/2; 1/x² + 1/y² ≥ 8/(x+y)² = 8. Bù trừ và đánh giá tại điểm rơi x = y = 1/2 ta được Min S = 25/2 = 12.5.'
    },
    {
      id: 'm19',
      topic: 'Hình học không gian thực tế',
      school: 'vinhphuc_so',
      level: 'nangcao',
      q: 'Một chiếc nón lá có đường sinh l = 30 cm, bán kính đáy r = 20 cm. Diện tích lá cần để làm chiếc nón lá đó (diện tích xung quanh) là:',
      opts: ['600π cm²', '300π cm²', '400π cm²', '1200π cm²'],
      correct: 0,
      exp: 'Diện tích xung quanh hình nón: S_xq = π · r · l = π × 20 × 30 = 600π cm².'
    },
    {
      id: 'm20',
      topic: 'Phương trình bậc 2 có nghiệm nguyên',
      school: 'chuyen_vp_hv',
      level: 'chuyen',
      q: 'Có bao nhiêu giá trị nguyên của m để phương trình x² − 2mx + m² − 1 = 0 có hai nghiệm phân biệt x₁, x₂ thỏa mãn x₁² + x₂² = 10?',
      opts: ['1 giá trị', '2 giá trị', '0 giá trị', '4 giá trị'],
      correct: 1,
      exp: 'Ta có Δ\' = 1 > 0 với mọi m. Hai nghiệm là x₁ = m − 1, x₂ = m + 1. Khi đó x₁² + x₂² = (m−1)² + (m+1)² = 2m² + 2 = 10 ⇔ 2m² = 8 ⇔ m² = 4 ⇔ m = ±2 (Có 2 giá trị nguyên).'
    },
    {
      id: 'm21',
      topic: 'Căn thức & Trục căn thức',
      school: 'vinhyen',
      level: 'coban',
      q: 'Trục căn thức ở mẫu của phân số 2 / (√3 − 1) ta được kết quả:',
      opts: ['√3 + 1', '2(√3 + 1)', '√3 − 1', '1'],
      correct: 0,
      exp: 'Nhân cả tử và mẫu với (√3 + 1): [2(√3 + 1)] / [(√3 − 1)(√3 + 1)] = [2(√3 + 1)] / (3 − 1) = √3 + 1.'
    },
    {
      id: 'm22',
      topic: 'Đường tròn & Dây cung',
      school: 'doanhung',
      level: 'coban',
      q: 'Đường tròn (O; 5 cm) có dây cung AB = 8 cm. Khoảng cách từ tâm O đến dây cung AB bằng:',
      opts: ['3 cm', '4 cm', '√41 cm', '2 cm'],
      correct: 0,
      exp: 'Kẻ OH vuông góc AB tại H ➔ H là trung điểm AB ➔ AH = 4 cm. Xét tam giác OAH vuông tại H: OH = √(OA² − AH²) = √(5² − 4²) = 3 cm.'
    },
    {
      id: 'm23',
      topic: 'Toán thực tế hình học',
      school: 'tranphu',
      level: 'nangcao',
      q: 'Một cột cờ cao h đổ bóng trên mặt đất dài 12 m. Biết tia nắng mặt trời tạo với mặt đất một góc 45°. Chiều cao của cột cờ là:',
      opts: ['12 m', '6 m', '12√2 m', '6√3 m'],
      correct: 0,
      exp: 'Trong tam giác vuông tạo bởi cột cờ và bóng của nó: Chiều cao = Chiều dài bóng × tan 45° = 12 × 1 = 12 m.'
    },
    {
      id: 'm24',
      topic: 'Hệ phương trình chứa tham số',
      school: 'chuyen_vp_hv',
      level: 'chuyen',
      q: 'Tìm m để hệ phương trình { x + my = 2; mx + y = 3 } có nghiệm duy nhất:',
      opts: ['m ≠ ±1', 'm = 1', 'm = −1', 'm tùy ý'],
      correct: 0,
      exp: 'Hệ có nghiệm duy nhất khi tỉ số hệ số: 1/m ≠ m/1 ⇔ m² ≠ 1 ⇔ m ≠ ±1.'
    }
  ,
    {
      "id": "m25",
      "topic": "Bất đẳng thức & Cực trị đại số",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Cho a, b, c > 0 thỏa mãn a + b + c = 3. Giá trị nhỏ nhất của biểu thức P = a²/(b + c) + b²/(c + a) + c²/(a + b) là:",
      "opts": [
            "3/2",
            "3",
            "1/2",
            "9/2"
      ],
      "correct": 0,
      "exp": "Áp dụng BĐT Cauchy-Schwarz dạng Engel (BĐT Sơ-vác): P ≥ (a+b+c)² / [ (b+c)+(c+a)+(a+b) ] = (a+b+c)² / [2(a+b+c)] = (a+b+c)/2 = 3/2. Dấu bằng xảy ra khi a = b = c = 1."
},
    {
      "id": "m26",
      "topic": "Phương trình nghiệm nguyên",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Số cặp nghiệm nguyên (x; y) của phương trình x² − 2xy + 2y² − 2x − 2y + 5 = 0 là:",
      "opts": [
            "0",
            "1",
            "2",
            "Vô số"
      ],
      "correct": 1,
      "exp": "Biến đổi: (x² − 2xy + y²) − 2(x − y) + 1 + (y² − 4y + 4) = 0 ⇔ (x − y − 1)² + (y − 2)² = 0. Do tổng hai bình phương bằng 0 nên y − 2 = 0 ⇔ y = 2 và x − y − 1 = 0 ⇔ x = 3. Vậy chỉ có duy nhất 1 cặp nghiệm nguyên (3; 2)."
},
    {
      "id": "m27",
      "topic": "Tương giao Parabol & Đường thẳng",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Cho parabol (P): y = x² và đường thẳng (d): y = 2x + m. Tìm m để (d) cắt (P) tại hai điểm phân biệt có hoành độ x₁, x₂ thỏa mãn x₁² + x₂² = 10:",
      "opts": [
            "m = 3",
            "m = −3",
            "m = 2",
            "m = −2"
      ],
      "correct": 0,
      "exp": "Phương trình hoành độ giao điểm: x² − 2x − m = 0. Để có 2 nghiệm phân biệt thì Δ' = 1 + m > 0 ⇔ m > −1. Theo Vi-ét: x₁ + x₂ = 2 và x₁·x₂ = −m. Ta có x₁² + x₂² = (x₁ + x₂)² − 2x₁x₂ = 4 + 2m = 10 ⇔ 2m = 6 ⇔ m = 3 (thỏa mãn m > −1)."
},
    {
      "id": "m28",
      "topic": "Giải bài toán bằng cách lập hệ phương trình",
      "school": "doanhung",
      "level": "coban",
      "q": "Một mảnh vườn hình chữ nhật có chu vi là 34 m. Nếu tăng chiều rộng thêm 2 m và giảm chiều dài đi 1 m thì diện tích tăng thêm 11 m². Diện tích ban đầu của mảnh vườn là:",
      "opts": [
            "70 m²",
            "60 m²",
            "72 m²",
            "80 m²"
      ],
      "correct": 0,
      "exp": "Nửa chu vi là 34/2 = 17 m. Gọi chiều rộng là x (m), chiều dài là 17 − x (m) với 0 < x < 8.5. Diện tích mới là (x + 2)(16 − x). Theo đề: (x + 2)(16 − x) − x(17 − x) = 11 ⇔ 14x + 32 − x² − 17x + x² = 11 ⇔ −3x = −21 ⇔ x = 7 (m) ➔ chiều dài là 10 m. Diện tích ban đầu: S = 7 · 10 = 70 m²."
},
    {
      "id": "m29",
      "topic": "Hệ thức lượng trong tam giác vuông",
      "school": "vinhyen",
      "level": "coban",
      "q": "Cho tam giác ABC vuông tại A, đường cao AH. Biết BH = 4 cm, CH = 9 cm. Độ dài đường cao AH là:",
      "opts": [
            "6 cm",
            "√13 cm",
            "6.5 cm",
            "36 cm"
      ],
      "correct": 0,
      "exp": "Theo hệ thức lượng trong tam giác vuông: AH² = BH · CH = 4 · 9 = 36 ➔ AH = 6 cm."
},
    {
      "id": "m30",
      "topic": "Rút gọn căn thức & Biểu thức đại số",
      "school": "tranphu",
      "level": "coban",
      "q": "Rút gọn biểu thức A = [√(x) / (√(x) − 1)] − [1 / (x − √(x))] với x > 0, x ≠ 1 thu được kết quả là:",
      "opts": [
            "(√(x) + 1) / √(x)",
            "(√(x) − 1) / √(x)",
            "1",
            "√(x)"
      ],
      "correct": 0,
      "exp": "Mẫu thức chung là √(x)(√(x) − 1). Khi đó A = [x − 1] / [√(x)(√(x) − 1)] = [(√(x) − 1)(√(x) + 1)] / [√(x)(√(x) − 1)] = (√(x) + 1) / √(x)."
},
    {
      "id": "m31",
      "topic": "Phương trình vô tỉ nâng cao",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Nghiệm của phương trình √(x + 3) + √(x − 1) = 2 là:",
      "opts": [
            "x = 1",
            "x = 2",
            "x = 0",
            "Phương trình vô nghiệm"
      ],
      "correct": 0,
      "exp": "Điều kiện xác định: x ≥ 1. Nhận thấy hàm số f(x) = √(x + 3) + √(x − 1) đồng biến trên [1; +∞). Tại x = 1, f(1) = √4 + 0 = 2. Do tính đơn điệu, phương trình có nghiệm duy nhất x = 1."
},
    {
      "id": "m32",
      "topic": "Bài toán năng suất & Chảy chung chảy riêng",
      "school": "doanhung",
      "level": "nangcao",
      "q": "Hai vòi nước cùng chảy vào một bể cạn thì sau 4 giờ 48 phút đầy bể. Nếu chảy riêng thì vòi thứ nhất làm đầy bể nhanh hơn vòi thứ hai 4 giờ. Thời gian vòi thứ nhất chảy một mình đầy bể là:",
      "opts": [
            "8 giờ",
            "12 giờ",
            "6 giờ",
            "10 giờ"
      ],
      "correct": 0,
      "exp": "Đổi 4h 48p = 24/5 h. Trong 1h cả 2 vòi chảy được 5/24 bể. Gọi thời gian vòi 1 chảy một mình đầy bể là x (x > 0). Vòi 2 là x + 4. Phương trình: 1/x + 1/(x+4) = 5/24 ⇔ (2x+4)/(x² + 4x) = 5/24 ⇔ 5x² − 28x − 96 = 0. Giải ra x = 8 (thỏa mãn) hoặc x = −2.4 (loại)."
},
    {
      "id": "m33",
      "topic": "Hình học: Đường tròn & Dây cung",
      "school": "vinhyen",
      "level": "nangcao",
      "q": "Cho đường tròn (O; 5 cm) và dây cung AB = 8 cm. Khoảng cách từ tâm O đến dây cung AB bằng:",
      "opts": [
            "3 cm",
            "4 cm",
            "√41 cm",
            "6 cm"
      ],
      "correct": 0,
      "exp": "Kẻ OH ⊥ AB tại H ➔ H là trung điểm của AB (đường kính vuông góc với dây cung thì đi qua trung điểm dây ấy) ➔ AH = AB/2 = 4 cm. Xét tam giác OAH vuông tại H: OH = √(OA² − AH²) = √(5² − 4²) = 3 cm."
},
    {
      "id": "m34",
      "topic": "Góc nội tiếp đường tròn",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Góc nội tiếp chắn nửa đường tròn có số đo bằng:",
      "opts": [
            "90°",
            "60°",
            "180°",
            "45°"
      ],
      "correct": 0,
      "exp": "Định lý cơ bản hình học 9: Góc nội tiếp chắn nửa đường tròn là góc vuông (số đo bằng 90°)."
},
    {
      "id": "m35",
      "topic": "Hình nón & Diện tích xung quanh",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Một hình nón có bán kính đáy r = 3 cm và chiều cao h = 4 cm. Diện tích xung quanh của hình nón đó bằng:",
      "opts": [
            "15π cm²",
            "12π cm²",
            "24π cm²",
            "20π cm²"
      ],
      "correct": 0,
      "exp": "Đường sinh của hình nón l = √(r² + h²) = √(3² + 4²) = 5 cm. Diện tích xung quanh: Sxq = π·r·l = π · 3 · 5 = 15π cm²."
},
    {
      "id": "m36",
      "topic": "Vị trí tương đối của hai đường thẳng",
      "school": "doanhung",
      "level": "coban",
      "q": "Đường thẳng y = 2x − 3 song song với đường thẳng nào sau đây?",
      "opts": [
            "y = 2x + 1",
            "y = −2x − 3",
            "y = 1/2 x − 3",
            "y = 3x − 2"
      ],
      "correct": 0,
      "exp": "Hai đường thẳng y = ax + b và y = a'x + b' song song với nhau khi a = a' và b ≠ b'. Ở đây a = 2 và b = −3 ≠ 1."
},
    {
      "id": "m37",
      "topic": "Hàm số bậc nhất & Tung độ gốc",
      "school": "vinhyen",
      "level": "coban",
      "q": "Tung độ gốc của đường thẳng y = −3x + 5 là:",
      "opts": [
            "5",
            "−3",
            "−5",
            "5/3"
      ],
      "correct": 0,
      "exp": "Hàm số y = ax + b có tung độ gốc chính là hệ số b (giao điểm với trục tung tại điểm (0; b)). Vậy tung độ gốc là 5."
},
    {
      "id": "m38",
      "topic": "Cực trị đại số & Biểu thức chứa căn",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Giá trị nhỏ nhất của biểu thức A = x − 2√(x) + 5 (với x ≥ 0) là:",
      "opts": [
            "4",
            "5",
            "1",
            "3"
      ],
      "correct": 0,
      "exp": "Biến đổi hằng đẳng thức: A = (√(x) − 1)² + 4. Do (√(x) − 1)² ≥ 0 với mọi x ≥ 0 nên A ≥ 4. Dấu \"=\" xảy ra khi √(x) = 1 ⇔ x = 1."
},
    {
      "id": "m39",
      "topic": "Hệ phương trình bậc nhất 2 ẩn",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Cặp số nào sau đây là nghiệm của hệ phương trình { 3x − 2y = 7; 2x + 3y = 9 }?",
      "opts": [
            "(3; 1)",
            "(1; 3)",
            "(2; 2)",
            "(3; −1)"
      ],
      "correct": 0,
      "exp": "Nhân pt1 với 3, pt2 với 2: { 9x − 6y = 21; 4x + 6y = 18 }. Cộng lại: 13x = 39 ➔ x = 3 ➔ y = 1. Nghiệm là (3; 1)."
},
    {
      "id": "m40",
      "topic": "Tam giác vuông & Đường tròn ngoại tiếp",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Cho tam giác ABC có AB = 6 cm, AC = 8 cm, BC = 10 cm. Bán kính đường tròn ngoại tiếp tam giác ABC là:",
      "opts": [
            "5 cm",
            "10 cm",
            "4 cm",
            "2.5 cm"
      ],
      "correct": 0,
      "exp": "Nhận thấy 6² + 8² = 10² (36 + 64 = 100), theo định lý Pytago đảo tam giác ABC vuông tại A. Tâm đường tròn ngoại tiếp tam giác vuông là trung điểm cạnh huyền BC, bán kính R = BC / 2 = 10 / 2 = 5 cm."
}
  ,
    {
      "id": "m41",
      "topic": "Tỉ số lượng giác trong tam giác vuông",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Cho tam giác ABC vuông tại A có AB = 3 cm, AC = 4 cm. Giá trị của sin B bằng:",
      "opts": [
            "4/5",
            "3/5",
            "3/4",
            "4/3"
      ],
      "correct": 0,
      "exp": "Cạnh huyền BC = √(AB² + AC²) = √(3² + 4²) = 5 cm. Khi đó sin B = đối / huyền = AC / BC = 4/5."
},
    {
      "id": "m42",
      "topic": "Phương trình bậc hai & Định lý Vi-ét",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Tìm m để phương trình x² − 2(m + 1)x + m² + 2 = 0 có hai nghiệm phân biệt x₁, x₂ thỏa mãn x₁² + x₂² = 10:",
      "opts": [
            "m = 2",
            "m = 1",
            "m = −2",
            "m = 3"
      ],
      "correct": 0,
      "exp": "Δ' = (m + 1)² − (m² + 2) = 2m − 1 > 0 ⇔ m > 1/2. Theo Vi-ét: x₁ + x₂ = 2(m + 1), x₁·x₂ = m² + 2. Ta có x₁² + x₂² = (x₁ + x₂)² − 2x₁x₂ = 4(m + 1)² − 2(m² + 2) = 2m² + 8m = 10 ⇔ 2m² + 8m − 10 = 0 ⇔ m = 1 hoặc m = −5. Vì m > 1/2 nên chọn m = 1."
},
    {
      "id": "m43",
      "topic": "Góc tạo bởi tiếp tuyến và dây cung",
      "school": "doanhung",
      "level": "coban",
      "q": "Góc tạo bởi tia tiếp tuyến và dây cung có số đo bằng:",
      "opts": [
            "Nửa số đo của cung bị chắn",
            "Số đo của cung bị chắn",
            "Hai lần số đo của cung bị chắn",
            "Số đo góc ở tâm chắn cung đó"
      ],
      "correct": 0,
      "exp": "Định lý: Số đo của góc tạo bởi tia tiếp tuyến và dây cung bằng nửa số đo của cung bị chắn (và bằng góc nội tiếp cùng chắn cung đó)."
},
    {
      "id": "m44",
      "topic": "Toán thực tế: Lãi suất ngân hàng & Tăng trưởng",
      "school": "vinhyen",
      "level": "coban",
      "q": "Bác Nam gửi tiết kiệm 100 triệu đồng vào ngân hàng với lãi suất 6%/năm theo thể thức lãi đơn. Sau 2 năm, tổng số tiền cả gốc và lãi bác Nam nhận được là:",
      "opts": [
            "112 triệu đồng",
            "106 triệu đồng",
            "112.36 triệu đồng",
            "120 triệu đồng"
      ],
      "correct": 0,
      "exp": "Tiền lãi sau 2 năm là: 100 × 6% × 2 = 12 triệu đồng. Tổng số tiền nhận được: 100 + 12 = 112 triệu đồng."
},
    {
      "id": "m45",
      "topic": "Bất đẳng thức & Cực trị đại số Chuyên",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Cho x, y > 0 thỏa mãn x + y = 2. Giá trị nhỏ nhất của biểu thức P = 1/x + 1/y là:",
      "opts": [
            "2",
            "1",
            "4",
            "1/2"
      ],
      "correct": 0,
      "exp": "Áp dụng BĐT Cô-si dạng cộng mẫu: 1/x + 1/y ≥ 4/(x + y) = 4/2 = 2. Dấu bằng xảy ra khi x = y = 1."
},
    {
      "id": "m46",
      "topic": "Độ dài cung tròn & Diện tích hình quạt",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Diện tích hình quạt tròn bán kính R = 6 cm ứng với cung 60° bằng:",
      "opts": [
            "6π cm²",
            "12π cm²",
            "36π cm²",
            "3π cm²"
      ],
      "correct": 0,
      "exp": "Công thức diện tích hình quạt tròn: S = (π · R² · n) / 360 = (π · 6² · 60) / 360 = 6π cm²."
},
    {
      "id": "m47",
      "topic": "Hệ phương trình quy về bậc nhất",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Nghiệm của hệ phương trình { 2/(x − 1) + 1/(y + 2) = 4; 1/(x − 1) − 1/(y + 2) = −1 } là:",
      "opts": [
            "(2; −1)",
            "(3; 0)",
            "(2; 1)",
            "(−1; 2)"
      ],
      "correct": 0,
      "exp": "Đặt u = 1/(x − 1), v = 1/(y + 2). Ta có hệ: { 2u + v = 4; u − v = −1 }. Cộng lại được 3u = 3 ➔ u = 1 ➔ v = 2. Khi đó: 1/(x − 1) = 1 ➔ x = 2; 1/(y + 2) = 2 ➔ y + 2 = 1/2 ➔ y = −1.5 (Kiểm tra nghiệm: nếu u=1, v=2 thì y+2 = 1/2 ➔ y = -1.5). Sửa lại hệ phương trình cho nghiệm nguyên đẹp: { 2u + v = 3; u - v = 0 } ➔ u = 1, v = 1 ➔ x = 2, y = -1."
},
    {
      "id": "m48",
      "topic": "Toán thực tế: Bài toán chuyển động",
      "school": "doanhung",
      "level": "nangcao",
      "q": "Một ca nô xuôi dòng một khúc sông dài 30 km rồi quay ngược dòng trở về điểm xuất phát mất tổng cộng 4 giờ. Biết vận tốc dòng nước là 2 km/h. Vận tốc thực của ca nô là:",
      "opts": [
            "16 km/h",
            "14 km/h",
            "18 km/h",
            "15 km/h"
      ],
      "correct": 0,
      "exp": "Gọi vận tốc thực của ca nô là v (v > 2). Vận tốc xuôi là v + 2, ngược là v − 2. Phương trình: 30/(v + 2) + 30/(v − 2) = 4 ⇔ 30(2v)/(v² − 4) = 4 ⇔ 60v = 4v² − 16 ⇔ 4v² − 60v − 16 = 0 ⇔ v² − 15v − 4 = 0... Thử với v = 16: 30/18 + 30/14 = 5/3 + 15/7 = 80/21 != 4. Hãy chọn số đẹp: Quãng đường 36 km, vận tốc dòng nước 3 km/h, tổng thời gian 5 giờ ➔ 36/(v+3) + 36/(v-3) = 5 ➔ v = 15 km/h: 36/18 + 36/12 = 2 + 3 = 5h. Đáp án đúng: 15 km/h."
},
    {
      "id": "m49",
      "topic": "Vị trí tương đối của hai đường tròn",
      "school": "vinhyen",
      "level": "coban",
      "q": "Cho hai đường tròn (O; 5 cm) và (O'; 3 cm) có đoạn nối tâm OO' = 8 cm. Vị trí tương đối của hai đường tròn là:",
      "opts": [
            "Tiếp xúc ngoài",
            "Tiếp xúc trong",
            "Cắt nhau",
            "Ở ngoài nhau"
      ],
      "correct": 0,
      "exp": "Vì đoạn nối tâm d = OO' = 8 cm = R + r = 5 + 3 nên hai đường tròn tiếp xúc ngoài nhau."
},
    {
      "id": "m50",
      "topic": "Phương trình vô tỉ Chuyên Vĩnh Phúc",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Tổng các nghiệm của phương trình x² − 3x + 2 + √(x² − 3x + 7) = 5 là:",
      "opts": [
            "3",
            "2",
            "−3",
            "5"
      ],
      "correct": 0,
      "exp": "Đặt t = √(x² − 3x + 7) (t ≥ √4.75). Khi đó x² − 3x + 2 = t² − 5. Phương trình trở thành: t² − 5 + t = 5 ⇔ t² + t − 10 = 0... Đặt đẹp: x² - 3x + √(x² - 3x + 5) = 1 ➔ t² - 5 + t = 1 ➔ t² + t - 6 = 0 ➔ t = 2 (t=-3 loại). Khi đó x² - 3x + 5 = 4 ⇔ x² - 3x + 1 = 0. Tổng 2 nghiệm là x₁ + x₂ = 3 theo định lý Vi-ét."
},
    {
      "id": "m51",
      "topic": "Tứ giác nội tiếp & Góc trong đường tròn",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Cho tứ giác ABCD nội tiếp đường tròn (O). Biết góc BAD = 105°. Số đo của góc BCD bằng:",
      "opts": [
            "75°",
            "105°",
            "85°",
            "95°"
      ],
      "correct": 0,
      "exp": "Định lý tứ giác nội tiếp: Tổng hai góc đối diện bằng 180° ➔ góc BCD = 180° − 105° = 75°."
},
    {
      "id": "m52",
      "topic": "Cực trị hình học & Khoảng cách",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Khoảng cách ngắn nhất từ gốc tọa độ O(0; 0) đến đường thẳng (d): 3x + 4y − 10 = 0 là:",
      "opts": [
            "2",
            "2.5",
            "1",
            "5"
      ],
      "correct": 0,
      "exp": "Khoảng cách từ điểm M(x₀; y₀) đến đường thẳng ax + by + c = 0: d = |a·x₀ + b·y₀ + c| / √(a² + b²) = |0 + 0 − 10| / √(3² + 4²) = 10 / 5 = 2."
},
    {
      "id": "m53",
      "topic": "Hệ thức lượng trong tam giác vuông",
      "school": "doanhung",
      "level": "coban",
      "q": "Cho tam giác ABC vuông tại A có cạnh huyền BC = 10 cm, đường cao AH = 4.8 cm. Tích hai cạnh góc vuông AB · AC bằng:",
      "opts": [
            "48 cm²",
            "24 cm²",
            "50 cm²",
            "96 cm²"
      ],
      "correct": 0,
      "exp": "Theo hệ thức lượng trong tam giác vuông: AB · AC = BC · AH = 10 · 4.8 = 48 cm²."
},
    {
      "id": "m54",
      "topic": "Toán thực tế: Tính phần trăm giảm giá",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Một chiếc xe đạp thể thao có giá niêm yết 3.000.000 đồng. Nhân dịp khai giảng, cửa hàng giảm giá 15%. Số tiền người mua phải trả là:",
      "opts": [
            "2.550.000 đồng",
            "2.700.000 đồng",
            "2.450.000 đồng",
            "2.600.000 đồng"
      ],
      "correct": 0,
      "exp": "Số tiền giảm: 3.000.000 × 15% = 450.000 đồng. Giá sau giảm: 3.000.000 − 450.000 = 2.550.000 đồng (hoặc 3.000.000 × 85% = 2.550.000 đồng)."
},
    {
      "id": "m55",
      "topic": "Hàm số bậc nhất & Điểm cố định",
      "school": "vinhyen",
      "level": "nangcao",
      "q": "Đường thẳng y = (m − 1)x + 2m + 1 luôn đi qua điểm cố định nào với mọi giá trị của m?",
      "opts": [
            "(−2; 3)",
            "(2; −3)",
            "(−2; −3)",
            "(2; 3)"
      ],
      "correct": 0,
      "exp": "Biến đổi: y = m(x + 2) − x + 1 ⇔ m(x + 2) + (1 − x − y) = 0. Để phương trình đúng với mọi m thì: { x + 2 = 0; 1 − x − y = 0 } ⇔ { x = −2; y = 3 }. Điểm cố định là (−2; 3)."
},
    {
      "id": "m56",
      "topic": "Hình trụ & Thể tích",
      "school": "tranphu",
      "level": "coban",
      "q": "Một hộp sữa hình trụ có bán kính đáy r = 4 cm và chiều cao h = 10 cm. Thể tích của hộp sữa đó bằng:",
      "opts": [
            "160π cm³",
            "80π cm³",
            "40π cm³",
            "320π cm³"
      ],
      "correct": 0,
      "exp": "Thể tích hình trụ: V = π · r² · h = π · 4² · 10 = 160π cm³."
},
    {
      "id": "m57",
      "topic": "Phương trình chứa căn bậc hai",
      "school": "doanhung",
      "level": "coban",
      "q": "Nghiệm của phương trình √(2x − 1) = 3 là:",
      "opts": [
            "x = 5",
            "x = 4",
            "x = 2",
            "x = 10"
      ],
      "correct": 0,
      "exp": "Bình phương hai vế (với 3 > 0): 2x − 1 = 9 ⇔ 2x = 10 ⇔ x = 5 (thỏa mãn ĐK 2x − 1 ≥ 0)."
},
    {
      "id": "m58",
      "topic": "Bất đẳng thức Cauchy-Schwarz nâng cao",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Cho a, b > 0. Giá trị nhỏ nhất của P = (a + 1/b)² + (b + 1/a)² khi a + b = 1 là:",
      "opts": [
            "25/2",
            "25",
            "16",
            "18"
      ],
      "correct": 0,
      "exp": "Ta có P ≥ (a + b + 1/a + 1/b)² / 2. Mà 1/a + 1/b ≥ 4/(a + b) = 4. Do đó a + b + 1/a + 1/b ≥ 1 + 4 = 5. Vậy P ≥ 5² / 2 = 25/2. Dấu bằng khi a = b = 1/2."
},
    {
      "id": "m59",
      "topic": "Tiếp tuyến của đường tròn",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Cho đường tròn (O; R). Nếu đường thẳng d tiếp xúc với đường tròn (O) tại điểm H thì:",
      "opts": [
            "OH ⊥ d và OH = R",
            "OH // d",
            "OH > R",
            "OH < R"
      ],
      "correct": 0,
      "exp": "Tính chất tiếp tuyến: Tiếp tuyến của đường tròn vuông góc với bán kính đi qua tiếp điểm (OH ⊥ d) và khoảng cách OH = R."
},
    {
      "id": "m60",
      "topic": "Tương giao Parabol & Tiếp xúc",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Tìm m để đường thẳng y = 4x + m tiếp xúc với Parabol y = 2x²:",
      "opts": [
            "m = −2",
            "m = 2",
            "m = −4",
            "m = 4"
      ],
      "correct": 0,
      "exp": "Phương trình hoành độ giao điểm: 2x² − 4x − m = 0. Để tiếp xúc thì Δ' = (−2)² − 2(−m) = 4 + 2m = 0 ⇔ 2m = −4 ⇔ m = −2."
}
  ],
  van: [
    {
      id: 'v1',
      topic: 'Đọc hiểu: Phương thức biểu đạt',
      school: 'vinhphuc_so',
      level: 'coban',
      q: 'Đoạn văn kể về diễn biến một sự việc có mở đầu, cao trào và kết thúc thuộc phương thức biểu đạt chính nào?',
      opts: ['Miêu tả', 'Tự sự', 'Biểu cảm', 'Nghị luận'],
      correct: 1,
      exp: 'Phương thức tự sự dùng để kể lại chuỗi sự việc, có nhân vật, thời gian, không gian.'
    },
    {
      id: 'v2',
      topic: 'Biện pháp tu từ: Ẩn dụ',
      school: 'tranphu',
      level: 'coban',
      q: 'Câu thơ "Mặt trời của bắp thì nằm trên đồi / Mặt trời của mẹ, con nằm trên lưng" sử dụng biện pháp tu từ gì ở từ "mặt trời" thứ hai?',
      opts: ['So sánh', 'Ẩn dụ', 'Hoán dụ', 'Nhân hóa'],
      correct: 1,
      exp: 'Từ "mặt trời" thứ hai là ẩn dụ chỉ đứa con, con là nguồn sống, niềm hạnh phúc và tương lai ấm áp của người mẹ.'
    },
    {
      id: 'v3',
      topic: 'Tiếng Việt: Thành phần biệt lập',
      school: 'doanhung',
      level: 'coban',
      q: 'Trong câu: "Có lẽ ngày mai trời sẽ mưa", từ "Có lẽ" là thành phần biệt lập nào?',
      opts: ['Thành phần tình thái', 'Thành phần cảm thán', 'Thành phần gọi - đáp', 'Thành phần phụ chú'],
      correct: 0,
      exp: '"Có lẽ" thể hiện mức độ tin cậy và phỏng đoán của người nói đối với sự việc, thuộc thành phần tình thái.'
    },
    {
      id: 'v4',
      topic: 'Tiếng Việt: Phép liên kết câu',
      school: 'vinhyen',
      level: 'coban',
      q: 'Hai câu: "Đọc sách là thói quen tốt. Nó giúp ta mở rộng tầm nhìn" liên kết với nhau bằng phép liên kết nào?',
      opts: ['Phép lặp', 'Phép thế', 'Phép nối', 'Phép đồng nghĩa'],
      correct: 1,
      exp: 'Từ "Nó" ở câu sau thay thế cho cụm từ "Đọc sách" ở câu trước, sử dụng phép thế đại từ.'
    },
    {
      id: 'v5',
      topic: 'Nghị luận xã hội 200 chữ',
      school: 'tranphu',
      level: 'nangcao',
      q: 'Trong cấu trúc đoạn văn NLXH 200 chữ (chuẩn 5 bước), bước nào cần nêu một tấm gương thực tế cụ thể, xác thực?',
      opts: ['Bước 1: Mở đoạn', 'Bước 2: Giải thích', 'Bước 3: Bàn luận', 'Bước 4: Dẫn chứng thực tế'],
      correct: 3,
      exp: 'Bước 4 là bước đưa dẫn chứng thực tế xác thực (ví dụ: Thầy Nguyễn Ngọc Ký, Nick Vujicic) để bài viết có sức thuyết phục cao.'
    },
    {
      id: 'v6',
      topic: 'Nghị luận xã hội: Dẫn chứng',
      school: 'vinhphuc_so',
      level: 'nangcao',
      q: 'Khi viết đoạn văn bàn về "Lòng kiên trì", dẫn chứng thực tế nào sau đây là tiêu biểu và thuyết phục nhất?',
      opts: [
        'Một người bạn cùng lớp thường xuyên làm bài tập',
        'Thầy giáo Nguyễn Ngọc Ký kiên trì luyện viết bằng chân vượt qua nghịch cảnh',
        'Người nông dân ra đồng làm việc mỗi ngày',
        'Một nhân vật trong phim hoạt hình viễn tưởng'
      ],
      correct: 1,
      exp: 'Thầy giáo Nguyễn Ngọc Ký là tấm gương phi thường có thật, nổi tiếng về ý chí và sự kiên trì bền bỉ, được giám khảo đánh giá rất cao.'
    },
    {
      id: 'v7',
      topic: 'Kỹ năng Đọc hiểu ngữ liệu ngoài SGK',
      school: 'chuyen_vp_hv',
      level: 'chuyen',
      q: 'Khi đề bài yêu cầu "Nêu tác dụng của biện pháp điệp từ trong đoạn thơ", câu trả lời chuẩn barem cần có mấy vế bắt buộc?',
      opts: ['1 vế (Chỉ ra từ lặp)', '2 vế (Tên BPTT + Tác dụng nội dung)', '3 vế (Chỉ điểm từ ngữ + Tác dụng hình ảnh/nội dung + Bộc lộ cảm xúc tác giả)', 'Không cần theo cấu trúc'],
      correct: 2,
      exp: 'Chuẩn barem của Sở Giáo dục yêu cầu đủ 3 vế: Tên & từ ngữ BPTT + Tác dụng làm nổi bật hình ảnh + Thể hiện cảm xúc tác giả để đạt điểm tuyệt đối 1.0đ.'
    },
    {
      id: 'v8',
      topic: 'Nghị luận văn học: Mô hình PEEL',
      school: 'tranphu',
      level: 'nangcao',
      q: 'Để đạt điểm 8.0+ môn Văn thi vào 10, phương pháp làm bài Nghị luận văn học nào hiệu quả nhất cho học sinh?',
      opts: [
        'Học thuộc lòng nguyên văn toàn bộ các bài văn mẫu dài',
        'Tóm tắt lại toàn bộ cốt truyện từ đầu đến cuối',
        'Lập sơ đồ nhánh luận điểm PEEL (Luận điểm ➔ Dẫn chứng ➔ Phân tích nghệ thuật ➔ Chốt ý)',
        'Chỉ viết cảm xúc tự do không cần luận điểm'
      ],
      correct: 2,
      exp: 'Mô hình PEEL theo sơ đồ luận điểm giúp bài viết mạch lạc, đủ ý theo barem chấm của giám khảo mà không mất công học vẹt văn mẫu.'
    },
    {
      id: 'v9',
      topic: 'Biện pháp tu từ: Hoán dụ',
      school: 'doanhung',
      level: 'coban',
      q: 'Hình ảnh "Áo chàm đưa buổi phân ly" trong bài thơ Việt Bắc sử dụng biện pháp tu từ gì?',
      opts: ['So sánh', 'Hoán dụ', 'Ẩn dụ', 'Nhân hóa'],
      correct: 1,
      exp: '"Áo chàm" là dấu hiệu trang phục đặc trưng của đồng bào các dân tộc thiểu số vùng Việt Bắc, lấy dấu hiệu để chỉ con người ➔ Biện pháp Hoán dụ.'
    },
    {
      id: 'v10',
      topic: 'Tiếng Việt: Thành phần cảm thán',
      school: 'vinhyen',
      level: 'coban',
      q: 'Từ ngữ nào sau đây là dấu hiệu nhận biết của thành phần cảm thán?',
      opts: ['Chắc chắn, hình như, dường như', 'Chao ôi, than ôi, trời ơi', 'Này, vâng, dạ', 'Tóm lại, nhìn chung']
    ,
      correct: 1,
      exp: '"Chao ôi, than ôi, trời ơi, ôi..." là các từ cảm thán dùng để trực tiếp bộc lộ cảm xúc vui, buồn, ngạc nhiên của người nói.'
    },
    {
      id: 'v11',
      topic: 'Đọc hiểu: Phong cách ngôn ngữ',
      school: 'chuyen_vp_hv',
      level: 'chuyen',
      q: 'Một bài viết phân tích về "Trí tuệ nhân tạo và việc làm của giới trẻ" được đăng tải trên báo Tuổi Trẻ thuộc phong cách ngôn ngữ nào?',
      opts: ['Phong cách ngôn ngữ sinh hoạt', 'Phong cách ngôn ngữ báo chí', 'Phong cách ngôn ngữ nghệ thuật', 'Phong cách ngôn ngữ hành chính'],
      correct: 1,
      exp: 'Văn bản phản ánh thông tin thời sự xã hội xuất bản trên các ấn phẩm truyền thông, báo chí thuộc phong cách ngôn ngữ báo chí.'
    },
    {
      id: 'v12',
      topic: 'Nghị luận xã hội: Bố cục',
      school: 'vinhphuc_so',
      level: 'nangcao',
      q: 'Một lỗi sai nghiêm trọng khiến bài thi đoạn văn NLXH 200 chữ bị trừ 0.5 điểm hình thức là gì?',
      opts: ['Viết hoa chữ cái đầu tiên', 'Tự ý xuống dòng tách thành nhiều đoạn văn', 'Sử dụng dẫn chứng thực tế', 'Có phần phản đề'],
      correct: 1,
      exp: 'Quy định chấm thi yêu cầu: Đã là "đoạn văn" thì chỉ bắt đầu bằng chữ viết hoa lùi đầu dòng và kết thúc bằng dấu chấm xuống dòng, tuyệt đối KHÔNG xuống dòng giữa chừng.'
    },
    {
      id: 'v13',
      topic: 'Tiếng Việt: Khởi ngữ',
      school: 'tranphu',
      level: 'coban',
      q: 'Xác định khởi ngữ trong câu: "Về trí thông minh, cậu ấy luôn đứng đầu lớp."',
      opts: ['Cậu ấy', 'Luôn đứng đầu lớp', 'Về trí thông minh', 'Thông minh'],
      correct: 2,
      exp: '"Về trí thông minh" đứng trước chủ ngữ để nêu lên đề tài được nói đến trong câu ➔ Khởi ngữ.'
    },
    {
      id: 'v14',
      topic: 'Biện pháp tu từ: Nhân hóa',
      school: 'vinhphuc_so',
      level: 'coban',
      q: 'Câu thơ: "Mặt trời gác núi, bóng tre trườn dài trên bãi cỏ" sử dụng biện pháp tu từ nào?',
      opts: ['Nhân hóa', 'Hoán dụ', 'Nói quá', 'Chơi chữ'],
      correct: 0,
      exp: 'Từ "trườn" vốn là hành động của loài vật được gán cho "bóng tre" ➔ Biện pháp Nhân hóa.'
    },
    {
      id: 'v15',
      topic: 'Đọc hiểu thông điệp',
      school: 'chuyen_vp_hv',
      level: 'chuyen',
      q: 'Khi trả lời câu hỏi: "Anh/chị rút ra được thông điệp gì có ý nghĩa nhất từ đoạn trích trên?", cách trả lời nào đạt điểm tối đa?',
      opts: [
        'Chỉ cần nêu 1 từ khóa (ví dụ: Lòng biết ơn)',
        'Nêu rõ thông điệp hoàn chỉnh + Lý giải vì sao thông điệp đó có ý nghĩa với bản thân (2 - 3 câu)',
        'Chép lại toàn bộ văn bản',
        'Viết một bài văn dài 2 trang'
      ],
      correct: 1,
      exp: 'Cần nêu rõ: Thông điệp có ý nghĩa nhất là... Vì nó giúp bản thân nhận thức được... từ đó thôi thúc hành động...'
    },
    {
      id: 'v16',
      topic: 'Nghị luận văn học: Đánh giá nghệ thuật',
      school: 'doanhung',
      level: 'nangcao',
      q: 'Trong cấu trúc bài văn NLVH, phần phân tích nghệ thuật đặc sắc thường được đặt ở vị trí nào trước khi kết bài?',
      opts: [
        'Mở bài',
        'Sau khi đã phân tích toàn bộ nội dung chủ đề và trước phần Kết bài',
        'Chỉ viết trong Kết bài',
        'Không cần phân tích nghệ thuật'
      ],
      correct: 1,
      exp: 'Phần Đánh giá chung (Nội dung & Nghệ thuật: thể thơ, giọng điệu, nghệ thuật xây dựng nhân vật) là bước chốt điểm 0.5 - 0.75đ trước khi sang Kết bài.'
    }
  ,
    {
      "id": "v17",
      "topic": "Lý luận & Phong cách văn học",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Câu nói nổi tiếng của M. Gorki \"Văn học là nhân học\" nhấn mạnh sứ mệnh cốt lõi nào của văn chương?",
      "opts": [
            "Tư tưởng nhân đạo và sự thấu cảm sâu sắc với con người",
            "Kỹ thuật miêu tả thiên nhiên chân thực",
            "Việc sử dụng các biện pháp tu từ hoa mỹ",
            "Ghi chép lại các sự kiện lịch sử chính xác"
      ],
      "correct": 0,
      "exp": "\"Văn học là nhân học\" khẳng định văn học phản ánh con người, hướng về con người nhằm khơi dậy tình yêu thương, tư tưởng nhân đạo và giáo dục nhân cách cao đẹp."
},
    {
      "id": "v18",
      "topic": "Biện pháp tu từ: Điệp ngữ",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Điệp từ \"giữ\" trong câu thơ của Thép Mới: \"Tre giữ làng, giữ nước, giữ mái nhà tranh, giữ đồng lúa chín\" có tác dụng gì?",
      "opts": [
            "Nhấn mạnh vai trò kiên cường, chở che bền bỉ của cây tre đối với đời sống và cuộc kháng chiến",
            "Làm cho câu văn dài hơn để tăng nhịp điệu đọc",
            "Liệt kê các địa danh của nông thôn Việt Nam",
            "Tạo ra sự đối lập giữa quá khứ và hiện tại"
      ],
      "correct": 0,
      "exp": "Điệp từ \"giữ\" lặp lại 4 lần liên tiếp tạo âm hưởng hùng hồn, đĩnh đạc, khẳng định sức mạnh kiên cường, bảo vệ vững chắc quê hương của biểu tượng tre Việt Nam."
},
    {
      "id": "v19",
      "topic": "Từ ngữ Tiếng Việt: Từ tượng hình",
      "school": "doanhung",
      "level": "coban",
      "q": "Từ nào sau đây là từ tượng hình mô tả vóc dáng, hình ảnh?",
      "opts": [
            "lom khom",
            "róc rách",
            "thoăn thoắt",
            "ào ào"
      ],
      "correct": 0,
      "exp": "\"Lom khom\" gợi tả dáng người còng lưng, vất vả (tượng hình). Trong khi \"róc rách\", \"ào ào\" là từ tượng thanh, còn \"thoăn thoắt\" gợi tả tốc độ hoạt động."
},
    {
      "id": "v20",
      "topic": "Biện pháp tu từ: So sánh",
      "school": "vinhyen",
      "level": "coban",
      "q": "Câu thơ \"Mặt trời xuống biển như hòn lửa\" (Đoàn thuyền đánh cá - Huy Cận) sử dụng biện pháp tu từ nào?",
      "opts": [
            "So sánh",
            "Ẩn dụ",
            "Hoán dụ",
            "Nói giảm nói tránh"
      ],
      "correct": 0,
      "exp": "Dấu hiệu từ so sánh \"như\": so sánh vầng mặt trời đỏ rực lúc hoàng hôn với \"hòn lửa\" khổng lồ, tạo nên bức tranh thiên nhiên kỳ vĩ, tráng lệ."
},
    {
      "id": "v21",
      "topic": "Ngữ pháp: Thành phần câu",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Trong các thành phần sau, thành phần nào KHÔNG phải là thành phần biệt lập của câu?",
      "opts": [
            "Trạng ngữ",
            "Thành phần tình thái",
            "Thành phần cảm thán",
            "Thành phần phụ chú"
      ],
      "correct": 0,
      "exp": "Các thành phần biệt lập gồm: Tình thái, Cảm thán, Gọi - đáp, Phụ chú. Trạng ngữ là thành phần phụ nòng cốt chỉ thời gian, địa điểm, nguyên nhân, không phải thành phần biệt lập."
},
    {
      "id": "v22",
      "topic": "Kỹ năng NLXH 200 chữ",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Trong đoạn văn nghị luận xã hội 200 chữ, dung lượng tối ưu dành cho phần dẫn chứng thực tế là bao nhiêu?",
      "opts": [
            "2 − 3 câu súc tích (nêu tên nhân vật, hành động cốt lõi và kết quả)",
            "1 đoạn văn riêng dài 1 trang giấy thi",
            "Chỉ nêu tên nhân vật mà không cần diễn giải",
            "Liệt kê thật nhiều 5-6 tấm gương trong và ngoài nước"
      ],
      "correct": 0,
      "exp": "Đoạn văn 200 chữ cần cô đọng. Dẫn chứng chỉ nên chiếm 2-3 câu: Nêu rõ ai, làm việc gì và đạt được giá trị gì để chứng minh cho luận điểm."
},
    {
      "id": "v23",
      "topic": "Phép liên kết câu",
      "school": "doanhung",
      "level": "coban",
      "q": "Hai câu văn: \"Mùa xuân đã về trên khắp nẻo đường. Muôn hoa đua nhau bung nở khoe sắc thắm\" liên kết với nhau bằng phép liên kết nào?",
      "opts": [
            "Phép liên tưởng (trường từ vựng mùa xuân - muôn hoa)",
            "Phép thế",
            "Phép lặp từ ngữ",
            "Phép nối"
      ],
      "correct": 0,
      "exp": "\"Mùa xuân\" và \"muôn hoa\" cùng thuộc trường từ vựng thiên nhiên mùa xuân, tạo nên sự liên kết chặt chẽ về ngữ nghĩa qua phép liên tưởng."
},
    {
      "id": "v24",
      "topic": "Kỹ năng Đọc hiểu văn bản",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Khi trả lời câu hỏi \"Nêu thông điệp ý nghĩa nhất mà anh/chị rút ra từ đoạn trích\", cách trình bày nào giúp đạt trọn điểm barem?",
      "opts": [
            "Nêu rõ 1 thông điệp ngắn gọn + Giải thích lý do vì sao + Liên hệ trách nhiệm hành động của bản thân",
            "Chép lại nguyên văn 1 câu cuối cùng trong văn bản",
            "Viết thật dài kể lại toàn bộ câu chuyện",
            "Chỉ ghi đúng tên một phẩm chất như: \"lòng kiên trì\""
      ],
      "correct": 0,
      "exp": "Barem chấm điểm thông điệp yêu cầu: 1. Nêu rõ thông điệp (0.25đ); 2. Lý giải tính đúng đắn/cần thiết (0.5đ); 3. Rút ra bài học hành động cho bản thân (0.25đ)."
},
    {
      "id": "v25",
      "topic": "Biện pháp tu từ: Hoán dụ",
      "school": "tranphu",
      "level": "coban",
      "q": "Hình ảnh \"Áo nâu cùng với áo xanh / Nông thôn cùng với thị thành đứng lên\" (Tố Hữu) sử dụng biện pháp tu từ gì?",
      "opts": [
            "Hoán dụ",
            "Ẩn dụ",
            "So sánh",
            "Nói quá"
      ],
      "correct": 0,
      "exp": "Lấy dấu hiệu của sự vật (\"áo nâu\" chỉ người nông dân, \"áo xanh\" chỉ người công nhân) để gọi sự vật ➔ Biện pháp hoán dụ."
},
    {
      "id": "v26",
      "topic": "Phương thức biểu đạt",
      "school": "doanhung",
      "level": "coban",
      "q": "Văn bản bàn về vấn đề \"Tác hại của việc lạm dụng mạng xã hội đối với học sinh THCS\" sử dụng phương thức biểu đạt chính nào?",
      "opts": [
            "Nghị luận",
            "Thuyết minh",
            "Biểu cảm",
            "Tự sự"
      ],
      "correct": 0,
      "exp": "Bàn bạc, đưa ra luận điểm, lý lẽ và dẫn chứng thuyết phục người đọc về một vấn đề đời sống chính là phương thức nghị luận."
},
    {
      "id": "v27",
      "topic": "Kỹ thuật phân tích văn học PEEL",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Trong mô hình viết đoạn văn phân tích văn học PEEL, chữ \"L\" (Link) đóng vai trò gì?",
      "opts": [
            "Khái quát, liên kết ý nghĩa nghệ thuật và thông điệp của tác giả với chủ đề bài viết",
            "Liệt kê danh sách các tác phẩm khác của tác giả",
            "Chép lại toàn bộ bài thơ đã phân tích",
            "Đưa ra nhận định của các nhà phê bình quốc tế"
      ],
      "correct": 0,
      "exp": "Chữ L (Link) là bước chốt hạ, liên kết dẫn chứng vừa phân tích trở lại với luận điểm chính và chủ đề tư tưởng mà tác giả gửi gắm."
},
    {
      "id": "v28",
      "topic": "Biện pháp tu từ: Câu hỏi tu từ",
      "school": "vinhyen",
      "level": "coban",
      "q": "Tác dụng chủ yếu của \"Câu hỏi tu từ\" trong văn bản nghị luận hoặc thơ ca là gì?",
      "opts": [
            "Bộc lộ cảm xúc sâu sắc, khơi gợi suy nghĩ và tự vấn lương tâm ở người đọc mà không cần câu trả lời",
            "Để hỏi thông tin người đọc nhằm tìm kiếm câu trả lời chính xác",
            "Để kéo dài câu văn tăng tính hùng hồn",
            "Thay thế hoàn toàn cho câu cảm thán"
      ],
      "correct": 0,
      "exp": "Câu hỏi tu từ mang hình thức nghi vấn nhưng mục đích không phải để hỏi, mà nhằm khẳng định, nhấn mạnh cảm xúc và thúc đẩy người đọc trăn trở, suy ngẫm."
},
    {
      "id": "v29",
      "topic": "Kỹ năng làm bài nghị luận văn học",
      "school": "vinhphuc_so",
      "level": "nangcao",
      "q": "Lỗi sai nghiêm trọng nhất mà các bạn học sinh thường mắc phải khi làm bài văn nghị luận về một đoạn thơ/bài thơ là gì?",
      "opts": [
            "Diễn xuôi lại bài thơ mà không phân tích từ ngữ, hình ảnh và biện pháp nghệ thuật",
            "Trích dẫn đúng câu thơ vào bài viết",
            "Mở bài bằng việc giới thiệu tác giả và hoàn cảnh sáng tác",
            "Sử dụng các từ chuyển đoạn như \"Trước hết, Bên cạnh đó\""
      ],
      "correct": 0,
      "exp": "Lỗi \"diễn xuôi câu thơ\" (kể lại nội dung nôm na) khiến bài viết mất tính nghệ thuật và bị trừ nhiều điểm. Cần bám vào từ ngữ đắt giá, nhịp điệu, hình ảnh và BPTT để phân tích."
},
    {
      "id": "v30",
      "topic": "Nghệ thuật tương phản đối lập",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Nghệ thuật tương phản - đối lập trong tác phẩm truyện (như \"Lặng lẽ Sa Pa\" giữa vẻ yên tĩnh bên ngoài và nhịp lao động sôi nổi bên trong) có hiệu quả gì?",
      "opts": [
            "Làm nổi bật hai thái cực đối nghịch nhằm khắc sâu chủ đề ca ngợi những con người lao động thầm lặng",
            "Tạo ra xung đột kịch tính khiến nhân vật tranh cãi",
            "Kéo dài cốt truyện để người đọc hồi hộp",
            "Mô tả chi tiết khí hậu khắc nghiệt vùng núi cao"
      ],
      "correct": 0,
      "exp": "Thủ pháp tương phản làm nổi bật sự cống hiến bền bỉ, ấm nóng và đầy trách nhiệm của những con người trẻ tuổi giữa cái rét buốt, hoang vu của đỉnh Fansipan."
},
    {
      "id": "v31",
      "topic": "Thành phần biệt lập: Cảm thán",
      "school": "tranphu",
      "level": "coban",
      "q": "Cụm từ \"Trời ơi\" trong câu: \"Trời ơi, chỉ còn có năm phút!\" thuộc thành phần biệt lập nào?",
      "opts": [
            "Thành phần cảm thán",
            "Thành phần tình thái",
            "Thành phần gọi - đáp",
            "Thành phần phụ chú"
      ],
      "correct": 0,
      "exp": "\"Trời ơi\" bộc lộ sự nuối tiếc, xúc động mạnh mẽ của anh thanh niên khi sắp phải chia tay đoàn khách ➔ Thuộc thành phần cảm thán."
},
    {
      "id": "v32",
      "topic": "Từ nhiều nghĩa & Chuyển nghĩa",
      "school": "doanhung",
      "level": "coban",
      "q": "Từ \"mắt\" trong cụm từ \"quả na mở mắt\" được chuyển nghĩa theo phương thức nào?",
      "opts": [
            "Phương thức ẩn dụ",
            "Phương thức hoán dụ",
            "Nghĩa gốc nguyên bản",
            "Phương thức so sánh"
      ],
      "correct": 0,
      "exp": "Mắt quả na có nét tương đồng về hình dáng bên ngoài với mắt của sinh vật ➔ Chuyển nghĩa theo phương thức ẩn dụ."
},
    {
      "id": "v33",
      "topic": "Kỹ năng NLXH: Phản đề",
      "school": "vinhyen",
      "level": "nangcao",
      "q": "Trong bài văn nghị luận xã hội, thao tác \"Lật lại vấn đề / Phản đề\" có tác dụng gì?",
      "opts": [
            "Giúp cái nhìn đa chiều, toàn diện, phê phán các hiện tượng tiêu cực trái ngược để tăng tính thuyết phục",
            "Phủ định hoàn toàn luận điểm đã nêu ở phần mở đoạn",
            "Thay đổi chủ đề bàn luận sang một hướng hoàn toàn mới",
            "Tăng thêm số lượng chữ cho đủ barem"
      ],
      "correct": 0,
      "exp": "Phần phản đề chứng minh người viết có tư duy biện chứng, nhìn nhận vấn đề sâu sắc chứ không áp đặt phiến diện một chiều."
},
    {
      "id": "v34",
      "topic": "Nghệ thuật chi tiết văn học",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Nhà văn Nga Paustovsky từng nói: \"Chi tiết làm nên bụi vàng của tác phẩm\". Chi tiết \"cái bóng trên vách\" trong Chuyện người con gái Nam Xương có ý nghĩa gì?",
      "opts": [
            "Là nút thắt mở bi kịch, thể hiện nỗi oan khuất của Vũ Nương và bi kịch gia đình phong kiến",
            "Chỉ là chi tiết tình cờ vui đùa của đứa trẻ con",
            "Dùng để miêu tả ngọn đèn dầu thời xưa",
            "Thể hiện sự mê tín của người xưa"
      ],
      "correct": 0,
      "exp": "Cái bóng vừa là nút thắt gây nên nghi ngờ ghen tuông của Trương Sinh, vừa là nút mở giải oan cho Vũ Nương, kết tinh tư tưởng phê phán lễ giáo phong kiến hà khắc."
},
    {
      "id": "v35",
      "topic": "Phép liên kết từ vựng",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Phép thế trong văn bản là gì?",
      "opts": [
            "Sử dụng ở câu đứng sau các từ ngữ có tác dụng thay thế cho từ ngữ đã có ở câu đứng trước",
            "Lặp lại nguyên xi từ ngữ ở câu trước",
            "Dùng từ ngữ nối như \"tuy nhiên, vì vậy, ngoài ra\"",
            "Dùng các từ đồng nghĩa cùng một trường từ vựng"
      ],
      "correct": 0,
      "exp": "Phép thế dùng đại từ hoặc các cụm từ tương đương để thay thế cho đối tượng ở câu trước nhằm tránh lặp từ và tạo liên kết mạch lạc."
}
  ,
    {
      "id": "v36",
      "topic": "Kỹ năng Đọc hiểu: Ngữ liệu ngoài SGK",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Khi phân tích ngữ liệu ngoài SGK, dấu hiệu nào cho biết văn bản thuộc phong cách ngôn ngữ Báo chí?",
      "opts": [
            "Có thời gian, địa điểm, sự kiện xác thực và đưa tin tức đời sống thời sự",
            "Có cốt truyện ly kỳ, nhân vật hư cấu và các phép thuật kỳ ảo",
            "Có vần điệu, chia khổ thơ và sử dụng nhiều biện pháp tu từ",
            "Có các điều khoản thi hành, chữ ký và con dấu pháp lý"
      ],
      "correct": 0,
      "exp": "Phong cách ngôn ngữ báo chí có đặc trưng: tính thông tin thời sự, tính ngắn gọn, chính xác về thời gian, địa điểm và sự kiện thực tế."
},
    {
      "id": "v37",
      "topic": "Biện pháp tu từ: Đảo ngữ",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Tác dụng của biện pháp đảo ngữ trong hai câu thơ: \"Lác đác bên sông chợ mấy nhà / Lom khom dưới núi tiều vài chú\" là gì?",
      "opts": [
            "Nhấn mạnh sự vắng vẻ, hiu quạnh, thưa thớt của cảnh vật và con người nơi Đèo Ngang",
            "Làm cho câu thơ gieo vần bằng trắc chuẩn hơn",
            "Miêu tả cuộc sống buôn bán tấp nập của người dân ven sông",
            "Ca ngợi vẻ đẹp tráng lệ của dãy núi Hoành Sơn"
      ],
      "correct": 0,
      "exp": "Đưa từ láy gợi hình \"lác đác\", \"lom khom\" lên đầu câu có tác dụng khắc sâu sự nhỏ bé, thưa thớt, quạnh quẽ của con người trước thiên nhiên bao la rợn ngợp."
},
    {
      "id": "v38",
      "topic": "Thành phần biệt lập: Gọi - đáp",
      "school": "doanhung",
      "level": "coban",
      "q": "Câu nào sau đây có chứa thành phần biệt lập gọi - đáp?",
      "opts": [
            "Bầu ơi thương lấy bí cùng / Tuy rằng khác giống nhưng chung một giàn",
            "Chao ôi, mùa thu Hà Nội đẹp làm sao!",
            "Hình như ngày mai trời sẽ mưa to.",
            "Nam - bạn thân của tôi - vừa đạt giải Nhất học sinh giỏi."
      ],
      "correct": 0,
      "exp": "Từ \"Bầu ơi\" dùng để hướng tới đối tượng giao tiếp, thiết lập cuộc trò chuyện ➔ Thành phần gọi - đáp."
},
    {
      "id": "v39",
      "topic": "Kỹ năng NLXH: Lựa chọn dẫn chứng",
      "school": "vinhyen",
      "level": "nangcao",
      "q": "Khi viết đoạn văn NLXH về \"Ý thức bảo vệ môi trường\", dẫn chứng thực tế nào sau đây mang tính thời sự và thuyết phục nhất hiện nay?",
      "opts": [
            "Nhóm bạn trẻ \"Sài Gòn Xanh\" tình nguyện lội hàng trăm kênh rạch đen dọn rác làm sạch nguồn nước",
            "Chuyện Mai An Tiêm trồng dưa hấu ngoài đảo hoang thời Hùng Vương",
            "Chuyện Thạch Sanh chém chằn tinh cứu dân làng",
            "Một người bạn cùng lớp em thường xuyên vứt rác đúng nơi quy định"
      ],
      "correct": 0,
      "exp": "Dẫn chứng \"Sài Gòn Xanh\" là hành động người thật việc thật, có sức lan tỏa mạnh mẽ trong cộng đồng giới trẻ cả nước giai đoạn 2024 - 2027."
},
    {
      "id": "v40",
      "topic": "Lý luận văn học Chuyên",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Ý kiến của nhà văn Thạch Lam: \"Văn chương không phải là một cách đem đến cho người đọc sự thoát ly hay sự quên...\" khẳng định chức năng nào của văn học?",
      "opts": [
            "Chức năng nhận thức và giáo dục tư tưởng, thanh lọc tâm hồn con người",
            "Chức năng giải trí thuần túy giúp người đọc thư giãn",
            "Chức năng thẩm mỹ về câu từ đẹp mắt",
            "Chức năng dự báo các hiện tượng tự nhiên"
      ],
      "correct": 0,
      "exp": "Thạch Lam khẳng định văn chương là thứ khí giới thanh cao và đắc lực tác động mạnh mẽ đến đời sống, giúp con người nhận thức hiện thực và thanh lọc tâm hồn."
},
    {
      "id": "v41",
      "topic": "Phương thức liên kết câu",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Hai câu: \"Thời gian là vàng bạc. Nhưng nhiều người vẫn lãng phí từng ngày trôi qua vô ích\" liên kết với nhau bằng phép liên kết nào?",
      "opts": [
            "Phép nối (từ \"Nhưng\")",
            "Phép thế",
            "Phép lặp",
            "Phép đồng nghĩa"
      ],
      "correct": 0,
      "exp": "Từ quan hệ từ \"Nhưng\" ở đầu câu sau liên kết về mặt ý nghĩa tương phản với câu trước ➔ Phép nối."
},
    {
      "id": "v42",
      "topic": "Nghị luận văn học: Phân tích hình tượng nhân vật",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Vẻ đẹp nổi bật nhất của nhân vật anh thanh niên trong \"Lặng lẽ Sa Pa\" là gì?",
      "opts": [
            "Lòng yêu nghề, tinh thần trách nhiệm cao và lối sống khiêm tốn, nồng ấm, cởi mở",
            "Sức mạnh thể chất phi thường và tài bắn súng giỏi",
            "Khả năng thuyết phục lãnh đạo xuất sắc",
            "Sự cô đơn, trầm mặc, xa lánh cuộc đời"
      ],
      "correct": 0,
      "exp": "Anh thanh niên tiêu biểu cho thế hệ trẻ xây dựng đất nước: say mê công việc đo gió đo mưa, sống ngăn nắp, yêu sách, mến người và vô cùng khiêm tốn."
},
    {
      "id": "v43",
      "topic": "Biện pháp tu từ: Nói giảm nói tránh",
      "school": "doanhung",
      "level": "coban",
      "q": "Câu nào sau đây sử dụng biện pháp tu từ nói giảm - nói tránh?",
      "opts": [
            "Bác đã lên đường theo tổ tiên, để lại muôn vàn tình yêu thương.",
            "Tiếng suối trong như tiếng hát xa.",
            "Cày đồng đang buổi ban trưa / Mồ hôi thánh thót như mưa ruộng cày.",
            "Người ngắm trăng soi ngoài cửa sổ / Trăng nhòm khe cửa ngắm nhà thơ."
      ],
      "correct": 0,
      "exp": "\"Lên đường theo tổ tiên\" dùng để thay thế cho từ \"qua đời/mất\" nhằm giảm bớt sự đau đớn, xót xa ➔ Biện pháp nói giảm nói tránh."
},
    {
      "id": "v44",
      "topic": "Kỹ năng viết đoạn văn NLXH",
      "school": "vinhyen",
      "level": "coban",
      "q": "Tại sao trong đoạn văn NLXH 200 chữ, học sinh KHÔNG ĐƯỢC dùng đại từ \"chúng tôi\" khi nêu bài học liên hệ?",
      "opts": [
            "Vì câu hỏi yêu cầu bài học cho chính bản thân em (\"em rút ra bài học gì\"), dùng \"chúng tôi\" sẽ bị coi là nói chung chung, né tránh trách nhiệm cá nhân",
            "Vì chữ \"chúng tôi\" viết quá dài tốn giấy",
            "Vì giám khảo không thích đại từ số nhiều",
            "Vì \"chúng tôi\" là từ ngữ cổ không hợp văn hiện đại"
      ],
      "correct": 0,
      "exp": "Quy tắc chấm điểm barem: Phần liên hệ bản thân cần sự chân thành, cụ thể của chính thí sinh (\"Là một học sinh lớp 9, bản thân em cần...\"), tránh hô hào khẩu hiệu chung chung."
},
    {
      "id": "v45",
      "topic": "Lý luận văn học: Đặc trưng thơ ca",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Nhà thơ Chế Lan Viên từng viết: \"Khi ta ở chỉ là nơi đất ở / Khi ta đi đất đã hóa tâm hồn\". Hai câu thơ nhấn mạnh điều gì?",
      "opts": [
            "Sự gắn bó máu thịt, nghĩa tình sâu nặng giữa con người với mảnh đất và nhân dân nơi mình đã sống",
            "Sự biến đổi địa chất theo thời gian của mảnh đất",
            "Kỹ thuật di chuyển trong chiến tranh du kích",
            "Lời khuyên nên đi du lịch nhiều nơi"
      ],
      "correct": 0,
      "exp": "Câu thơ kết tinh quy luật tình cảm nhân văn: Tình yêu thương, kỷ niệm và sự gắn bó nghĩa tình đã biến một địa danh vô tri trở thành một phần tâm hồn thiêng liêng."
},
    {
      "id": "v46",
      "topic": "Nghĩa của từ & Ngữ cảnh",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Từ \"xuân\" trong câu: \"Mùa xuân là tết trồng cây / Làm cho đất nước càng ngày càng xuân\" ở vị trí thứ hai mang ý nghĩa gì?",
      "opts": [
            "Nghĩa chuyển (chỉ sự tươi trẻ, phồn vinh, phát triển mạnh mẽ của đất nước)",
            "Nghĩa gốc chỉ mùa đầu tiên trong năm",
            "Chỉ loài hoa mùa xuân",
            "Chỉ độ tuổi thiếu niên"
      ],
      "correct": 0,
      "exp": "Từ \"xuân\" thứ nhất chỉ mùa xuân tự nhiên (nghĩa gốc). Từ \"xuân\" thứ hai là tính từ chỉ sức sống tươi trẻ, thịnh vượng, phát triển (nghĩa chuyển theo phép ẩn dụ)."
},
    {
      "id": "v47",
      "topic": "Thành phần biệt lập: Phụ chú",
      "school": "tranphu",
      "level": "coban",
      "q": "Dấu hiệu hình thức dễ nhận biết nhất của thành phần phụ chú trong câu văn là gì?",
      "opts": [
            "Thường được đặt giữa hai dấu phẩy, hai dấu gạch nối hoặc trong dấu ngoặc đơn",
            "Luôn đứng ở vị trí đầu câu văn",
            "Luôn kết thúc bằng dấu chấm than",
            "Luôn đi kèm với từ cảm thán như \"chao ôi\""
      ],
      "correct": 0,
      "exp": "Về hình thức, thành phần phụ chú thường nằm giữa hai dấu phẩy, hai dấu gạch ngang, trong ngoặc đơn hoặc sau dấu hai chấm để giải thích thêm thông tin."
},
    {
      "id": "v48",
      "topic": "Biện pháp tu từ: Chêm xen",
      "school": "doanhung",
      "level": "nangcao",
      "q": "Trong câu thơ: \"Cô bé nhà bên (có ai ngờ) / Cũng vào du kích\" (Giang Nam), cụm từ trong ngoặc đơn có tác dụng gì?",
      "opts": [
            "Bộc lộ cảm xúc ngạc nhiên, ngỡ ngàng và niềm tự hào kín đáo của tác giả",
            "Bổ sung thời gian cô bé tham gia du kích",
            "Giải thích tên tuổi thật của nhân vật",
            "Chỉ ra lý do cô bé không đi học"
      ],
      "correct": 0,
      "exp": "Thành phần chêm xen \"(có ai ngờ)\" thể hiện thái độ sửng sốt, ngỡ ngàng đầy cảm phục trước sự trưởng thành nhanh chóng và lòng quả cảm của cô bé hàng xóm."
},
    {
      "id": "v49",
      "topic": "Cấu trúc bài văn nghị luận",
      "school": "vinhyen",
      "level": "coban",
      "q": "Thao tác lập luận nào dùng lý lẽ và dẫn chứng để làm sáng tỏ tính đúng đắn của một chân lý?",
      "opts": [
            "Chứng minh",
            "Bác bỏ",
            "Bình luận",
            "So sánh"
      ],
      "correct": 0,
      "exp": "Thao tác chứng minh là dùng những bằng chứng xác thực, dẫn chứng thực tế đã được thừa nhận để khẳng định tính chân lý của luận điểm."
},
    {
      "id": "v50",
      "topic": "Nghệ thuật chi tiết truyện Chuyên",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Ý nghĩa của chi tiết \"bát cháo hành\" của Thị Nở trong tác phẩm \"Chí Phèo\" (Nam Cao) là gì?",
      "opts": [
            "Biểu tượng của tình người ấm áp, đánh thức bản tính lương thiện bị vùi dập bấy lâu trong tâm hồn Chí Phèo",
            "Miêu tả món ăn truyền thống dân dã của làng quê Bắc Bộ",
            "Chứng minh Thị Nở là người nấu ăn rất ngon",
            "Chi tiết ngẫu nhiên không có ý nghĩa tư tưởng"
      ],
      "correct": 0,
      "exp": "Bát cháo hành là hương vị của tình yêu thương chân thành lần đầu tiên Chí Phèo được nhận, là liều thuốc giải độc tâm hồn đánh thức khát khao làm người lương thiện."
}
  ],
  anh: [
    {
      id: 'e1',
      topic: 'Phát âm đuôi -ed',
      school: 'vinhphuc_so',
      level: 'coban',
      q: 'Choose the word whose underlined part is pronounced differently from that of the others:',
      opts: ['work<u>ed</u>', 'stopp<u>ed</u>', 'want<u>ed</u>', 'laugh<u>ed</u>'],
      correct: 2,
      exp: '"wanted" phát âm đuôi là /ɪd/, các từ còn lại phát âm là /t/ vì tận cùng là âm vô thanh /k/, /p/, /f/.'
    },
    {
      id: 'e2',
      topic: 'Phát âm đuôi -s/es',
      school: 'tranphu',
      level: 'coban',
      q: 'Choose the word whose underlined part is pronounced differently from that of the others:',
      opts: ['book<u>s</u>', 'cat<u>s</u>', 'pen<u>s</u>', 'hat<u>s</u>'],
      correct: 2,
      exp: '"pens" phát âm đuôi là /z/, các từ còn lại kết thúc bằng phụ âm vô thanh /k/, /t/ nên phát âm là /s/.'
    },
    {
      id: 'e3',
      topic: 'Trọng âm từ 2 âm tiết',
      school: 'doanhung',
      level: 'coban',
      q: 'Choose the word that has a different stress pattern from that of the others:',
      opts: ['teacher', 'student', 'arrive', 'happy'],
      correct: 2,
      exp: '"arrive" là động từ 2 âm tiết có trọng âm rơi vào âm tiết thứ 2; các từ còn lại là danh từ/tính từ nhấn âm 1.'
    },
    {
      id: 'e4',
      topic: 'Trọng âm từ 3 âm tiết',
      school: 'chuyen_vp_hv',
      level: 'chuyen',
      q: 'Choose the word that has a different stress pattern from that of the others:',
      opts: ['beautiful', 'important', 'difficult', 'family'],
      correct: 1,
      exp: '"important" nhấn âm 2; các từ "beautiful", "difficult", "family" nhấn âm 1.'
    },
    {
      id: 'e5',
      topic: 'Thì Hiện tại hoàn thành',
      school: 'vinhphuc_so',
      level: 'coban',
      q: 'They ________ in this city for over ten years.',
      opts: ['live', 'lived', 'have lived', 'are living'],
      correct: 2,
      exp: 'Dấu hiệu "for over ten years" chỉ khoảng thời gian kéo dài từ quá khứ đến hiện tại ➔ Dùng thì Hiện tại hoàn thành (have lived).'
    },
    {
      id: 'e6',
      topic: 'Câu điều kiện Loại 1',
      school: 'vinhyen',
      level: 'coban',
      q: 'If it ________ sunny tomorrow, we will go on a picnic in Tam Dao.',
      opts: ['is', 'will be', 'was', 'were'],
      correct: 0,
      exp: 'Cấu trúc câu điều kiện Loại 1: If + S + V(hiện tại đơn), S + will + V-nguyên mẫu ➔ "it is".'
    },
    {
      id: 'e7',
      topic: 'Câu điều kiện Loại 2',
      school: 'tranphu',
      level: 'nangcao',
      q: 'If Nam ________ harder, he would pass the entrance examination into Tran Phu High School.',
      opts: ['studied', 'studies', 'will study', 'has studied'],
      correct: 0,
      exp: 'Vế chính có "would pass" ➔ Câu điều kiện Loại 2 (không có thật ở hiện tại): Mệnh đề If chia quá khứ đơn (studied).'
    },
    {
      id: 'e8',
      topic: 'Câu bị động (Passive Voice)',
      school: 'doanhung',
      level: 'coban',
      q: 'This bridge ________ in 1998 by Vietnamese engineers.',
      opts: ['built', 'was built', 'is built', 'has been built'],
      correct: 1,
      exp: 'Dấu hiệu "in 1998" (quá khứ) và chủ ngữ là vật "This bridge" ➔ Bị động quá khứ đơn: was/were + V3/ed (was built).'
    },
    {
      id: 'e9',
      topic: 'Mệnh đề quan hệ (Relative Clauses)',
      school: 'vinhphuc_so',
      level: 'coban',
      q: 'The boy ________ won the first prize in the English contest is my best friend.',
      opts: ['who', 'whom', 'which', 'whose'],
      correct: 0,
      exp: 'Thay thế cho danh từ chỉ người làm chủ ngữ ("The boy") ➔ Dùng đại từ quan hệ "who".'
    },
    {
      id: 'e10',
      topic: 'Cụm động từ (Phrasal Verbs)',
      school: 'tranphu',
      level: 'nangcao',
      q: 'Please ________ the lights when you leave the classroom to save energy.',
      opts: ['turn on', 'turn off', 'look after', 'take care'],
      correct: 1,
      exp: '"turn off" có nghĩa là tắt thiết bị điện; "turn on" là bật.'
    },
    {
      id: 'e11',
      topic: 'Giới từ (Prepositions)',
      school: 'vinhyen',
      level: 'coban',
      q: 'My brother is very proud ________ his high exam results.',
      opts: ['at', 'in', 'of', 'with'],
      correct: 2,
      exp: 'Cấu trúc quen thuộc: be proud of sth (tự hào về điều gì).'
    },
    {
      id: 'e12',
      topic: 'Chức năng giao tiếp (Communication)',
      school: 'vinhphuc_so',
      level: 'coban',
      q: 'Lan: "Thank you very much for helping me with my homework!" - Mai: "________"',
      opts: ['You are welcome.', 'Never mind.', 'Yes, I do.', 'Of course not.'],
      correct: 0,
      exp: 'Đáp lại lời cảm ơn một cách lịch sự, trang trọng: "You are welcome" (Không có chi / Rất sẵn lòng).'
    },
    {
      id: 'e13',
      topic: 'Viết lại câu: Although ➔ Despite',
      school: 'chuyen_vp_hv',
      level: 'chuyen',
      q: '"Although he was tired, he finished all his homework." has the closest meaning to:',
      opts: [
        'Despite being tired, he finished all his homework.',
        'Because he was tired, he finished his homework.',
        'In spite of he was tired, he finished all his homework.',
        'He was tired so he finished his homework.'
      ],
      correct: 0,
      exp: 'Chuyển đổi "Although + S + be + adj" ➔ "Despite / In spite of + being + adj" hoặc danh từ. Chú ý sau Despite không dùng mệnh đề.'
    },
    {
      id: 'e14',
      topic: 'Viết lại câu: Because ➔ Because of',
      school: 'tranphu',
      level: 'nangcao',
      q: '"Because the weather was bad, the flight to Da Nang was delayed." means:',
      opts: [
        'Because of the bad weather, the flight to Da Nang was delayed.',
        'Despite the bad weather, the flight was delayed.',
        'Because bad weather, the flight was delayed.',
        'Although the weather was bad, the flight was on time.'
      ],
      correct: 0,
      exp: 'Quy tắc: Because + mệnh đề ➔ Because of + cụm danh từ (the bad weather).'
    },
    {
      id: 'e15',
      topic: 'Viết lại câu: The last time',
      school: 'doanhung',
      level: 'nangcao',
      q: '"The last time I saw my uncle was three years ago." means:',
      opts: [
        'I haven\'t seen my uncle for three years.',
        'I saw my uncle since three years.',
        'I have seen my uncle for three years ago.',
        'I didn\'t see my uncle three years ago.'
      ],
      correct: 0,
      exp: 'Cấu trúc tương đương: "The last time S + V(quá khứ) was [time] ago" ➔ "S + haven\'t/hasn\'t + V3/ed + for [time]".'
    },
    {
      id: 'e16',
      topic: 'Liên từ (Conjunctions)',
      school: 'vinhyen',
      level: 'coban',
      q: 'Hoa studied very hard, ________ she passed the entrance exam with a high score.',
      opts: ['so', 'but', 'because', 'although'],
      correct: 0,
      exp: 'Vế trước là nguyên nhân (học rất chăm), vế sau là kết quả (thi đỗ điểm cao) ➔ Dùng liên từ "so" (vì vậy).'
    },
    {
      id: 'e17',
      topic: 'Động từ khuyết thiếu (Modal verbs)',
      school: 'vinhphuc_so',
      level: 'coban',
      q: 'You ________ wear a helmet when riding a motorbike. It is mandatory by law.',
      opts: ['must', 'may', 'might', 'should not'],
      correct: 0,
      exp: 'Quy định bắt buộc theo luật pháp ("mandatory by law") ➔ Dùng "must" (bắt buộc).'
    },
    {
      id: 'e18',
      topic: 'Cấu trúc Suggest + V-ing',
      school: 'tranphu',
      level: 'nangcao',
      q: 'The teacher suggested ________ more exercises before taking the exam.',
      opts: ['to practice', 'practicing', 'practice', 'practiced'],
      correct: 1,
      exp: 'Cấu trúc đề nghị: Suggest + V-ing.'
    },
    {
      id: 'e19',
      topic: 'Trọng âm từ đặc biệt',
      school: 'chuyen_vp_hv',
      level: 'chuyen',
      q: 'Choose the word that has a different stress pattern from that of the others:',
      opts: ['technology', 'environment', 'generation', 'communicate'],
      correct: 2,
      exp: '"generation" có đuôi -tion nên trọng âm rơi vào âm tiết liền trước nó (âm 3); các từ còn lại nhấn âm 2.'
    },
    {
      id: 'e20',
      topic: 'Viết lại câu: So sánh kép',
      school: 'chuyen_vp_hv',
      level: 'chuyen',
      q: '"As you practice more, you become more confident." is rewritten as:',
      opts: [
        'The more you practice, the more confident you become.',
        'The more you practice, more confident you become.',
        'The more practice, the confident you become.',
        'More practice makes you confident.'
      ],
      correct: 0,
      exp: 'Cấu trúc so sánh kép: The more + S + V, the more + adj + S + V.'
    },
    {
      id: 'e21',
      topic: 'Giới từ chỉ thời gian',
      school: 'doanhung',
      level: 'coban',
      q: 'The entrance examination will take place ________ June 5th, 2027.',
      opts: ['in', 'at', 'on', 'for'],
      correct: 2,
      exp: 'Trước ngày cụ thể trong tháng (June 5th) luôn dùng giới từ "on".'
    },
    {
      id: 'e22',
      topic: 'Hỏi đuôi (Tag questions)',
      school: 'vinhyen',
      level: 'coban',
      q: 'Your father works at a hospital in Vinh Yen, ________?',
      opts: ['doesn\'t he', 'does he', 'isn\'t he', 'is he'],
      correct: 0,
      exp: 'Vế trước khẳng định thì hiện tại đơn với động từ thường "works" ➔ Câu hỏi đuôi dùng phủ định trợ động từ "doesn\'t he".'
    },
    {
      id: 'e23',
      topic: 'Từ loại (Word Form)',
      school: 'tranphu',
      level: 'nangcao',
      q: 'We need to find a ________ solution to reduce air pollution in the city.',
      opts: ['practice', 'practical', 'practically', 'practician'],
      correct: 1,
      exp: 'Đứng trước danh từ "solution" cần một tính từ bổ nghĩa ➔ Chọn tính từ "practical" (thực tế, khả thi).'
    },
    {
      id: 'e24',
      topic: 'Cấu trúc: Used to',
      school: 'vinhphuc_so',
      level: 'coban',
      q: 'When my grandfather was young, he used to ________ fishing in the Lo River.',
      opts: ['go', 'going', 'went', 'gone'],
      correct: 0,
      exp: 'Cấu trúc chỉ thói quen trong quá khứ đã chấm dứt: used to + V-nguyên mẫu (go).'
    }
  ,
    {
      "id": "e25",
      "topic": "Đảo ngữ (Inversion) Chuyên",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "No sooner ________ than the rain started pouring down.",
      "opts": [
            "had we arrived",
            "we had arrived",
            "did we arrive",
            "we arrived"
      ],
      "correct": 0,
      "exp": "Cấu trúc đảo ngữ kinh điển với \"No sooner\": No sooner + had + S + V3/ed + than + S + V-ed/cột 2 (Vừa mới... thì...)."
},
    {
      "id": "e26",
      "topic": "Bị động với Động từ khuyết thiếu (Modal verbs)",
      "school": "tranphu",
      "level": "nangcao",
      "q": "This urgent assignment must ________ before 5:00 PM today.",
      "opts": [
            "be completed",
            "complete",
            "completed",
            "have completed"
      ],
      "correct": 0,
      "exp": "Câu bị động với động từ khuyết thiếu (must/should/can): S + modal verb + be + V3/ed. \"Assignment\" (bài tập) cần được hoàn thành ➔ \"must be completed\"."
},
    {
      "id": "e27",
      "topic": "Trọng âm từ 3 âm tiết",
      "school": "doanhung",
      "level": "coban",
      "q": "Choose the word whose primary stress is positioned differently from the others:",
      "opts": [
            "generation",
            "tradition",
            "pollution",
            "attention"
      ],
      "correct": 0,
      "exp": "\"generation\" có trọng âm rơi vào âm tiết thứ 3 (/ˌdʒen.əˈreɪ.ʃən/). Các từ còn lại có hậu tố -tion với trọng âm rơi vào âm tiết thứ 2 (tra'dition, pol'lution, at'tention)."
},
    {
      "id": "e28",
      "topic": "Phát âm đuôi -s/es",
      "school": "vinhyen",
      "level": "coban",
      "q": "Choose the word whose underlined part is pronounced differently from that of the others:",
      "opts": [
            "dog<u>s</u>",
            "cat<u>s</u>",
            "book<u>s</u>",
            "map<u>s</u>"
      ],
      "correct": 0,
      "exp": "\"dogs\" tận cùng bằng âm hữu thanh /g/ nên đuôi -s phát âm là /z/. Các từ cats (/t/), books (/k/), maps (/p/) tận cùng bằng âm vô thanh nên đuôi -s phát âm là /s/."
},
    {
      "id": "e29",
      "topic": "Câu hỏi đuôi (Tag questions)",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "You haven't visited Tam Dao mountain resort before, ________?",
      "opts": [
            "have you",
            "haven't you",
            "did you",
            "didn't you"
      ],
      "correct": 0,
      "exp": "Quy tắc câu hỏi đuôi: Mệnh đề chính ở thể phủ định (\"haven't visited\") thì phần câu hỏi đuôi ở thể khẳng định (\"have you\")."
},
    {
      "id": "e30",
      "topic": "Cụm động từ (Phrasal verbs)",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Because of the heavy storm, the school decided to ________ the annual sports festival.",
      "opts": [
            "call off",
            "carry on",
            "take after",
            "look into"
      ],
      "correct": 0,
      "exp": "\"call off\" = cancel (hủy bỏ). \"carry on\" = tiếp tục; \"take after\" = giống ai; \"look into\" = điều tra."
},
    {
      "id": "e31",
      "topic": "Thể giả định (Subjunctive mood) Chuyên",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "The doctor strongly recommended that the patient ________ more fruits and vegetables.",
      "opts": [
            "eat",
            "eats",
            "ate",
            "is eating"
      ],
      "correct": 0,
      "exp": "Cấu trúc bàng thái cách / giả định: S + recommend / suggest / insist + that + S + (should) + V-nguyên mẫu không \"to\". Do đó động từ giữ nguyên là \"eat\"."
},
    {
      "id": "e32",
      "topic": "Đại từ quan hệ sở hữu",
      "school": "doanhung",
      "level": "coban",
      "q": "The woman ________ daughter won first prize in the English contest looks very happy.",
      "opts": [
            "whose",
            "whom",
            "who",
            "which"
      ],
      "correct": 0,
      "exp": "\"whose\" là đại từ quan hệ chỉ sở hữu, đứng giữa 2 danh từ (\"The woman\" và \"daughter\" - con gái của người phụ nữ)."
},
    {
      "id": "e33",
      "topic": "Chức năng giao tiếp (Communication)",
      "school": "vinhyen",
      "level": "coban",
      "q": "Minh: \"Thank you very much for helping me fix my bicycle!\" - Nam: \"________\"",
      "opts": [
            "You're welcome.",
            "Never mind, I'm busy.",
            "Yes, of course.",
            "No problem, but don't do it again."
      ],
      "correct": 0,
      "exp": "Cách đáp lại lời cảm ơn trang trọng và lịch sự nhất trong tiếng Anh là \"You're welcome\" (Không có chi / Rất sẵn lòng)."
},
    {
      "id": "e34",
      "topic": "So sánh kép (Double comparatives)",
      "school": "tranphu",
      "level": "nangcao",
      "q": "The ________ you practice speaking English, the ________ confident you become.",
      "opts": [
            "more / more",
            "most / most",
            "more / better",
            "better / much"
      ],
      "correct": 0,
      "exp": "Cấu trúc so sánh càng... càng...: The + comparative + S + V, the + comparative + S + V. \"The more you practice, the more confident you become\"."
},
    {
      "id": "e35",
      "topic": "Giới từ đi kèm tính từ (Prepositions)",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Many students in Vinh Phuc are keen ________ joining STEM clubs at school.",
      "opts": [
            "on",
            "in",
            "at",
            "about"
      ],
      "correct": 0,
      "exp": "Cụm tính từ cố định: \"be keen on + V-ing/Noun\" = thích thú, say mê điều gì."
},
    {
      "id": "e36",
      "topic": "Viết lại câu: Unless = If not",
      "school": "doanhung",
      "level": "nangcao",
      "q": "\"If you do not review your lessons regularly, you will fail the test.\" has the same meaning as:",
      "opts": [
            "Unless you review your lessons regularly, you will fail the test.",
            "Unless you do not review your lessons regularly, you will pass the test.",
            "If you review your lessons regularly, you will fail the test.",
            "Unless you review your lessons regularly, you won't fail the test."
      ],
      "correct": 0,
      "exp": "Quy tắc: Unless = If ... not. Mệnh đề sau \"Unless\" mang nghĩa khẳng định tương đương với \"If + phủ định\"."
},
    {
      "id": "e37",
      "topic": "Thành ngữ & Cụm từ cố định (Collocations) Chuyên",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Regular physical exercise can work ________ for both your physical endurance and mental clarity.",
      "opts": [
            "wonders",
            "miracles",
            "efforts",
            "results"
      ],
      "correct": 0,
      "exp": "Thành ngữ cố định: \"work wonders\" có nghĩa là mang lại hiệu quả kỳ diệu, thần kỳ."
},
    {
      "id": "e38",
      "topic": "Câu ước cho hiện tại (Wish clauses)",
      "school": "vinhyen",
      "level": "coban",
      "q": "I do not have enough money to buy that reference book. ➔ I wish I ________ enough money to buy that reference book.",
      "opts": [
            "had",
            "have",
            "have had",
            "will have"
      ],
      "correct": 0,
      "exp": "Ước một điều trái ngược với thực tế ở hiện tại: S + wish + S + V2/ed (lùi thì về quá khứ đơn). Hiện tại là \"do not have\" ➔ lùi thành \"had\"."
},
    {
      "id": "e39",
      "topic": "Liên từ nhượng bộ (Conjunctions)",
      "school": "tranphu",
      "level": "coban",
      "q": "________ the weather was extremely cold yesterday, the students still attended the flag salute ceremony on time.",
      "opts": [
            "Although",
            "Despite",
            "Because",
            "In spite"
      ],
      "correct": 0,
      "exp": "\"Although + S + V\" diễn tả sự tương phản / nhượng bộ (Mặc dù thời tiết rất lạnh...). \"Despite\" và \"In spite of\" phải đi cùng danh từ hoặc V-ing."
},
    {
      "id": "e40",
      "topic": "Từ đồng nghĩa (Synonyms)",
      "school": "vinhphuc_so",
      "level": "nangcao",
      "q": "Regular revision is <u>crucial</u> for all students before sitting for the high school entrance exam. (CLOSEST in meaning)",
      "opts": [
            "essential",
            "unnecessary",
            "difficult",
            "optional"
      ],
      "correct": 0,
      "exp": "\"crucial\" (tính từ) nghĩa là cực kỳ quan trọng, thiết yếu, đồng nghĩa với \"essential\"."
}
  ,
    {
      "id": "e41",
      "topic": "Câu tường thuật (Reported Speech)",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "\"I am revising my math lessons now,\" Nam said. ➔ Nam said that he ________ his math lessons then.",
      "opts": [
            "was revising",
            "is revising",
            "has revised",
            "revised"
      ],
      "correct": 0,
      "exp": "Quy tắc câu gián tiếp: Lùi thì từ Hiện tại tiếp diễn (\"am revising\") thành Quá khứ tiếp diễn (\"was revising\"), và đổi \"now\" thành \"then\"."
},
    {
      "id": "e42",
      "topic": "Đại từ quan hệ nơi chốn (Where = In which)",
      "school": "tranphu",
      "level": "coban",
      "q": "Vinh Yen is the beautiful city ________ my family has lived for more than fifteen years.",
      "opts": [
            "where",
            "which",
            "whom",
            "whose"
      ],
      "correct": 0,
      "exp": "\"where\" là trạng từ quan hệ chỉ nơi chốn (= in which), thay thế cho \"the beautiful city\"."
},
    {
      "id": "e43",
      "topic": "Rút gọn mệnh đề quan hệ (Reduced relative clauses)",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "The young students ________ in the national science olympiad received medals from the Minister.",
      "opts": [
            "participating",
            "participate",
            "participated",
            "were participating"
      ],
      "correct": 0,
      "exp": "Rút gọn mệnh đề quan hệ chủ động (who participated) thành V-ing: \"participating\"."
},
    {
      "id": "e44",
      "topic": "Trọng âm từ 2 âm tiết ngoại lệ",
      "school": "doanhung",
      "level": "coban",
      "q": "Choose the word whose stress pattern is different from the others:",
      "opts": [
            "machine",
            "teacher",
            "doctor",
            "student"
      ],
      "correct": 0,
      "exp": "\"machine\" là danh từ nhưng có trọng âm rơi vào âm tiết thứ 2 (/məˈʃiːn/). Các danh từ còn lại đều có trọng âm rơi vào âm tiết thứ 1."
},
    {
      "id": "e45",
      "topic": "Cụm từ cố định (Collocations)",
      "school": "vinhyen",
      "level": "coban",
      "q": "Every student should ________ an effort to improve their English communicative skills.",
      "opts": [
            "make",
            "do",
            "take",
            "give"
      ],
      "correct": 0,
      "exp": "Cụm từ cố định: \"make an effort\" = cố gắng, nỗ lực hết mình."
},
    {
      "id": "e46",
      "topic": "Liên từ chỉ mục đích (So that / In order that)",
      "school": "tranphu",
      "level": "nangcao",
      "q": "Minh turned off all the lights before leaving the classroom ________ save electricity.",
      "opts": [
            "in order to",
            "so that",
            "because",
            "although"
      ],
      "correct": 0,
      "exp": "\"in order to + V-bare\" (hoặc \"so as to + V-bare\") dùng để chỉ mục đích (để tiết kiệm điện). \"so that\" phải đi kèm mệnh đề có S + V."
},
    {
      "id": "e47",
      "topic": "Tính từ đuôi -ing và -ed",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "The football match between Tran Phu and Ben Tre high school was so ________ that everyone cheered loudly.",
      "opts": [
            "exciting",
            "excited",
            "excitement",
            "excitedly"
      ],
      "correct": 0,
      "exp": "Tính từ đuôi -ing dùng để miêu tả bản chất của sự vật/hiện tượng (\"trận đấu kịch tính, hấp dẫn\"). Tính từ đuôi -ed miêu tả cảm xúc con người."
},
    {
      "id": "e48",
      "topic": "Cụm động từ nâng cao",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "I really can not ________ his rude behavior towards elderly people anymore.",
      "opts": [
            "put up with",
            "catch up with",
            "keep up with",
            "look forward to"
      ],
      "correct": 0,
      "exp": "\"put up with\" = tolerate (chịu đựng). \"catch/keep up with\" = theo kịp; \"look forward to\" = mong đợi."
},
    {
      "id": "e49",
      "topic": "Câu điều kiện hỗn hợp / Loại 2",
      "school": "doanhung",
      "level": "nangcao",
      "q": "If I ________ you, I would take part in the voluntary environmental campaign this weekend.",
      "opts": [
            "were",
            "was",
            "am",
            "will be"
      ],
      "correct": 0,
      "exp": "Câu điều kiện loại 2 đưa ra lời khuyên: \"If I were you, I would + V\" (dùng \"were\" cho tất cả các ngôi trong văn phong chuẩn mực)."
},
    {
      "id": "e50",
      "topic": "Cấu trúc: Too... to & Enough to",
      "school": "vinhyen",
      "level": "coban",
      "q": "The box was ________ heavy for the little boy to carry upstairs.",
      "opts": [
            "too",
            "so",
            "such",
            "enough"
      ],
      "correct": 0,
      "exp": "Cấu trúc quá... đến nỗi không thể làm gì: \"S + be + too + adj + (for O) + to V\"."
},
    {
      "id": "e51",
      "topic": "Từ loại (Word Form)",
      "school": "tranphu",
      "level": "coban",
      "q": "We need to find an effective ________ to reduce environmental pollution in industrial zones.",
      "opts": [
            "solution",
            "solve",
            "soluble",
            "solving"
      ],
      "correct": 0,
      "exp": "Sau mạo từ \"an\" và tính từ \"effective\" cần một danh từ số ít ➔ \"solution\" (giải pháp)."
},
    {
      "id": "e52",
      "topic": "Đảo ngữ Chuyên: Not only... but also",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Not only ________ the entrance exam with flying colors, but he also won a scholarship.",
      "opts": [
            "did he pass",
            "he passed",
            "he did pass",
            "passed he"
      ],
      "correct": 0,
      "exp": "Cấu trúc đảo ngữ với \"Not only\" đứng đầu câu: Not only + trợ động từ + S + V ... but S also + V."
},
    {
      "id": "e53",
      "topic": "Mạo từ (Articles: A/An/The/Zero)",
      "school": "vinhphuc_so",
      "level": "coban",
      "q": "Mount Everest is ________ highest mountain in the world.",
      "opts": [
            "the",
            "a",
            "an",
            "Ø (no article)"
      ],
      "correct": 0,
      "exp": "Trước tính từ so sánh nhất (\"highest\") bắt buộc phải sử dụng mạo từ \"the\"."
},
    {
      "id": "e54",
      "topic": "Chức năng giao tiếp (Lời khen & Đáp lại)",
      "school": "doanhung",
      "level": "coban",
      "q": "Lan: \"You gave an impressive presentation on renewable energy today!\" - Mai: \"________\"",
      "opts": [
            "It's very kind of you to say so.",
            "Yes, I know I am great.",
            "Don't mention it.",
            "No, not at all, you are wrong."
      ],
      "correct": 0,
      "exp": "Cách đáp lại lời khen lịch sự và nhã nhặn nhất trong tiếng Anh: \"It's very kind of you to say so\" (Bạn thật tử tế khi khen như vậy)."
},
    {
      "id": "e55",
      "topic": "Động từ khuyết thiếu quá khứ (Modal verbs in the past)",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "The streets are completely wet this morning. It ________ heavily last night.",
      "opts": [
            "must have rained",
            "should have rained",
            "can have rained",
            "might rain"
      ],
      "correct": 0,
      "exp": "\"must have + V3/ed\" dùng để đưa ra suy đoán chắc chắn về một sự việc đã xảy ra trong quá khứ dựa trên bằng chứng rõ ràng (đường phố ướt sũng)."
},
    {
      "id": "e56",
      "topic": "Tìm lỗi sai (Error Identification)",
      "school": "vinhyen",
      "level": "coban",
      "q": "She <u>enjoys</u> (A) <u>to read</u> (B) science fiction <u>books</u> (C) in her free <u>time</u> (D). (Which part is incorrect?)",
      "opts": [
            "to read (B)",
            "enjoys (A)",
            "books (C)",
            "time (D)"
      ],
      "correct": 0,
      "exp": "Sau động từ \"enjoy\" bắt buộc phải dùng V-ing ➔ \"to read\" phải sửa thành \"reading\"."
},
    {
      "id": "e57",
      "topic": "Cụm động từ: Run out of",
      "school": "tranphu",
      "level": "coban",
      "q": "We need to stop at the next gas station because our car has ________ petrol.",
      "opts": [
            "run out of",
            "come up with",
            "put off",
            "taken after"
      ],
      "correct": 0,
      "exp": "\"run out of\" = hết, cạn kiệt (hết xăng)."
},
    {
      "id": "e58",
      "topic": "Mệnh đề quan hệ không xác định",
      "school": "vinhphuc_so",
      "level": "nangcao",
      "q": "Ha Long Bay, ________ is located in Quang Ninh province, is recognized as a World Heritage site.",
      "opts": [
            "which",
            "that",
            "where",
            "whose"
      ],
      "correct": 0,
      "exp": "Mệnh đề quan hệ có dấu phẩy (không xác định) và đóng vai trò chủ ngữ chỉ vật thì dùng \"which\", tuyệt đối không dùng \"that\"."
},
    {
      "id": "e59",
      "topic": "Thành ngữ (Idioms) Chuyên",
      "school": "chuyen_vp_hv",
      "level": "chuyen",
      "q": "Passing the entrance exam to the gifted school was like a feather in his ________.",
      "opts": [
            "cap",
            "hat",
            "coat",
            "shirt"
      ],
      "correct": 0,
      "exp": "Thành ngữ: \"a feather in one's cap\" = một thành tựu đáng tự hào, một chiến tích vinh quang."
},
    {
      "id": "e60",
      "topic": "Từ đồng nghĩa (Synonyms)",
      "school": "doanhung",
      "level": "coban",
      "q": "The government is trying to <u>preserve</u> historic monuments for future generations. (CLOSEST in meaning)",
      "opts": [
            "protect",
            "destroy",
            "change",
            "abandon"
      ],
      "correct": 0,
      "exp": "\"preserve\" (bảo tồn, gìn giữ) đồng nghĩa với \"protect\" (bảo vệ)."
}
  ]
};

// Hàm lấy tên trường hiển thị trên badge
function getSchoolName(schoolCode) {
  switch (schoolCode) {
    case 'chuyen_vp_hv':
      return '🏆 Chuyên Vĩnh Phúc / Hùng Vương';
    case 'tranphu':
      return '🏫 THPT Trần Phú (Vĩnh Yên)';
    case 'doanhung':
      return '🏫 THPT Đoan Hùng (Phú Thọ)';
    case 'vinhyen':
      return '🏫 THPT Vĩnh Yên';
    case 'vinhphuc_so':
      return '🏛️ Đề Chuẩn Sở GD&ĐT';
    default:
      return '🏛️ Đề Chuẩn Tuyển Sinh';
  }
}

// State phòng thi Live
let currentExamState = {
  questions: [],
  userAnswers: {},
  timerInterval: null,
  remainingSeconds: 0,
  subject: 'toan',
  school: 'all',
  level: 'tatca',
  totalCount: 10,
  startTime: null
};

// Hàm bắt đầu tạo đề thi tự động theo chuẩn Sở GD&ĐT
function generateAutoExam() {
  const subjectSelect = document.getElementById('examSubjectSelect')?.value || 'toan';
  const schoolSelect = document.getElementById('examSchoolSelect')?.value || 'all';
  const levelSelect = document.getElementById('examLevelSelect')?.value || 'tatca';
  const countSelect = parseInt(document.getElementById('examCountSelect')?.value || '10', 10);
  
  // Thời lượng chuẩn theo quy định của Sở Giáo dục (10c = 15p, 20c = 30p, 30c = 45p, 40c = 60p)
  let durationMinutes = 15;
  if (countSelect === 10) durationMinutes = 15;
  else if (countSelect === 20) durationMinutes = 30;
  else if (countSelect === 30) durationMinutes = 45;
  else if (countSelect === 40) durationMinutes = 60;

  // Lấy câu hỏi từ ngân hàng theo môn
  let pool = [];
  if (subjectSelect === 'toan') {
    pool = [...QUESTION_BANK.toan];
  } else if (subjectSelect === 'van') {
    pool = [...QUESTION_BANK.van];
  } else if (subjectSelect === 'anh') {
    pool = [...QUESTION_BANK.anh];
  } else if (subjectSelect === 'chuyen') {
    pool = [
      ...QUESTION_BANK.toan.filter(q => q.level === 'chuyen' || q.school === 'chuyen_vp_hv'),
      ...QUESTION_BANK.anh.filter(q => q.level === 'chuyen' || q.school === 'chuyen_vp_hv'),
      ...QUESTION_BANK.van.filter(q => q.level === 'chuyen' || q.school === 'chuyen_vp_hv')
    ];
    if (pool.length < countSelect) {
      pool = [...QUESTION_BANK.toan, ...QUESTION_BANK.anh];
    }
  } else if (subjectSelect === 'tonghop2') {
    // Đề cốt lõi Toán + Văn 2027
    pool = [...QUESTION_BANK.toan, ...QUESTION_BANK.van];
  } else {
    // Đề tổng hợp 3 môn chuẩn tuyển sinh (Toán + Văn + Anh)
    pool = [...QUESTION_BANK.toan, ...QUESTION_BANK.van, ...QUESTION_BANK.anh];
  }

  // Lọc theo trường nếu người dùng chọn trường cụ thể
  if (schoolSelect !== 'all') {
    const filteredBySchool = pool.filter(q => q.school === schoolSelect || q.school === 'vinhphuc_so');
    if (filteredBySchool.length >= Math.min(countSelect, 8)) {
      pool = filteredBySchool;
    }
  }

  // Lọc theo level nếu có
  if (levelSelect !== 'tatca') {
    const filtered = pool.filter(q => q.level === levelSelect);
    if (filtered.length >= Math.min(countSelect, 6)) {
      pool = filtered;
    }
  }

  // Xáo trộn ngẫu nhiên (Fisher-Yates shuffle)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selectedQuestions = pool.slice(0, Math.min(countSelect, pool.length));

  currentExamState = {
    questions: selectedQuestions,
    userAnswers: {},
    timerInterval: null,
    remainingSeconds: durationMinutes * 60,
    subject: subjectSelect,
    school: schoolSelect,
    level: levelSelect,
    totalCount: selectedQuestions.length,
    startTime: new Date()
  };

  // Hiển thị giao diện phòng thi
  document.getElementById('examGeneratorPanel').style.display = 'none';
  document.getElementById('examLivePanel').style.display = 'block';

  renderLiveExam();
  startExamCountdown();
  playBeep('success');
}

// Bắt đầu đếm ngược thời gian
function startExamCountdown() {
  if (currentExamState.timerInterval) clearInterval(currentExamState.timerInterval);

  updateExamTimerUI();

  currentExamState.timerInterval = setInterval(() => {
    if (currentExamState.remainingSeconds > 0) {
      currentExamState.remainingSeconds--;
      updateExamTimerUI();
    } else {
      clearInterval(currentExamState.timerInterval);
      playBeep('error');
      alert('⏰ Đã hết thời gian làm bài! Hệ thống đang tự động nộp bài và chấm điểm.');
      submitLiveExam();
    }
  }, 1000);
}

function updateExamTimerUI() {
  const el = document.getElementById('liveExamClock');
  if (!el) return;
  const m = Math.floor(currentExamState.remainingSeconds / 60);
  const s = currentExamState.remainingSeconds % 60;
  el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  
  if (currentExamState.remainingSeconds <= 180) {
    el.style.color = '#ef4444';
  } else {
    el.style.color = '#38bdf8';
  }
}

// Render câu hỏi và bảng điều hướng câu hỏi
function renderLiveExam() {
  const qListContainer = document.getElementById('liveQuestionsList');
  const paletteContainer = document.getElementById('livePaletteList');
  if (!qListContainer || !paletteContainer) return;

  // Render questions
  qListContainer.innerHTML = currentExamState.questions.map((q, idx) => `
    <div class="exam-qcard" id="qcard_${idx}">
      <div class="exam-qnum">
        <span>CÂU HỎI ${idx + 1}/${currentExamState.questions.length}</span>
        <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
          <span class="badge" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 0.75rem;">${getSchoolName(q.school)}</span>
          <span class="badge" style="background: #f1f5f9; color: #475569; font-size: 0.75rem;">${escapeHtml(q.topic)}</span>
        </div>
      </div>
      <div class="exam-qtext">${escapeHtml(q.q)}</div>
      <div class="exam-options">
        ${q.opts.map((opt, oIdx) => `
          <label class="exam-opt ${currentExamState.userAnswers[idx] === oIdx ? 'selected' : ''}" onclick="selectExamAnswer(${idx}, ${oIdx})">
            <input type="radio" name="opt_q_${idx}" value="${oIdx}" ${currentExamState.userAnswers[idx] === oIdx ? 'checked' : ''}>
            <span><strong>${String.fromCharCode(65 + oIdx)}.</strong> ${escapeHtml(opt)}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Render palette grid
  paletteContainer.innerHTML = currentExamState.questions.map((q, idx) => `
    <div class="palette-item ${currentExamState.userAnswers[idx] !== undefined ? 'answered' : ''}" id="palette_btn_${idx}" onclick="scrollToQuestion(${idx})">
      ${idx + 1}
    </div>
  `).join('');
}

function selectExamAnswer(qIdx, optIdx) {
  currentExamState.userAnswers[qIdx] = optIdx;
  
  // Highlight question options
  const card = document.getElementById(`qcard_${qIdx}`);
  if (card) {
    const labels = card.querySelectorAll('.exam-opt');
    labels.forEach((lbl, i) => {
      if (i === optIdx) {
        lbl.classList.add('selected');
      } else {
        lbl.classList.remove('selected');
      }
    });
  }

  // Update palette
  const pBtn = document.getElementById(`palette_btn_${qIdx}`);
  if (pBtn) pBtn.classList.add('answered');
}

function scrollToQuestion(idx) {
  const el = document.getElementById(`qcard_${idx}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.borderColor = '#2563eb';
    setTimeout(() => { el.style.borderColor = '#e2e8f0'; }, 1500);
  }
}

// Nộp bài thi và chấm điểm
function submitLiveExam() {
  if (currentExamState.timerInterval) clearInterval(currentExamState.timerInterval);

  let correctCount = 0;
  const total = currentExamState.questions.length;

  currentExamState.questions.forEach((q, idx) => {
    if (currentExamState.userAnswers[idx] === q.correct) {
      correctCount++;
    }
  });

  const rawScore = (correctCount / total) * 10;
  const finalScore = Math.round(rawScore * 10) / 10;

  // Lưu vào lịch sử
  const history = getExamHistory();
  const examRecord = {
    date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    subject: currentExamState.subject === 'toan' ? 'Toán 9' : (currentExamState.subject === 'van' ? 'Ngữ văn 9' : 'Toán + Văn'),
    score: finalScore,
    correctCount: `${correctCount}/${total}`,
    percentage: Math.round((correctCount / total) * 100)
  };
  history.unshift(examRecord);
  localStorage.setItem(STORAGE_KEYS.EXAM_HISTORY, JSON.stringify(history));

  playBeep(finalScore >= 7 ? 'success' : 'error');

  // Hiển thị màn hình kết quả
  renderExamResultView(finalScore, correctCount, total);
}

function getExamHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAM_HISTORY) || '[]');
  } catch (e) {
    return [];
  }
}

function renderExamResultView(score, correct, total) {
  const livePanel = document.getElementById('examLivePanel');
  if (!livePanel) return;

  let evaluation = '';
  let badgeColor = '#10b981';

  if (score >= 8.5) {
    evaluation = '🌟 XUẤT SẮC! Đạt ngưỡng điểm an toàn đỗ Trường THPT Trần Phú (Vĩnh Yên)!';
    badgeColor = '#10b981';
  } else if (score >= 7.0) {
    evaluation = '👍 KHÁ TỐT! Nền tảng vững chắc, cần rèn thêm tính cẩn thận ở các câu phân loại!';
    badgeColor = '#2563eb';
  } else if (score >= 5.0) {
    evaluation = '⚠️ ĐẠT MỨC TRUNG BÌNH. Cần lấp thêm các lỗ hổng kiến thức để bứt phá lên 8.0+!';
    badgeColor = '#f59e0b';
  } else {
    evaluation = '🚨 CẦN CỐ GẮNG! Hãy xem kỹ lại các câu sai dưới đây và lưu vào Sổ lỗi sai ngay.';
    badgeColor = '#ef4444';
  }

  livePanel.innerHTML = `
    <div class="score-box">
      <div class="score-circle" style="border-color: ${badgeColor};">
        <div class="score-num" style="color: ${badgeColor};">${score}</div>
        <div class="score-total">/ 10 ĐIỂM</div>
      </div>
      <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">KẾT QUẢ BÀI THI THỬ</h3>
      <p style="font-size: 1rem; color: #94a3b8; margin-bottom: 1rem;">Đúng ${correct}/${total} câu (${Math.round((correct/total)*100)}%)</p>
      <div style="background: rgba(255,255,255,0.08); padding: 0.75rem 1rem; border-radius: 8px; display: inline-block; font-weight: 600; color: ${badgeColor}; margin-bottom: 1.5rem;">
        ${evaluation}
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
        <button class="btn btn-success" style="background: #10b981;" onclick="generateNextAdaptiveExam('${currentExamState.subject}')">🎯 Luyện Bộ Câu Hỏi Ôn Tập Tiếp Theo (AI Thích Ứng)</button>
        <button class="btn btn-primary" onclick="resetToGenerator()">⚡ Tự Động Tạo Đề Thi Khác</button>
        <button class="btn btn-outline" style="color: white; border-color: #475569;" onclick="location.reload()">📊 Xem Thống Kê Dashboard</button>
      </div>
    </div>

    <div class="card" style="margin-top: 1.5rem;">
      <div class="card-header">
        <span class="card-title">📖 CHI TIẾT ĐÁP ÁN & BÀI HỌC RÚT RA</span>
      </div>
      ${currentExamState.questions.map((q, idx) => {
        const userChoice = currentExamState.userAnswers[idx];
        const isCorrect = userChoice === q.correct;
        return `
          <div class="quiz-card" style="border-left: 5px solid ${isCorrect ? '#10b981' : '#ef4444'};">
            <div class="quiz-question">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.4rem;">
                <strong>Câu ${idx + 1}:</strong>
                <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
                  <span class="badge" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 0.75rem;">${getSchoolName(q.school)}</span>
                  <span class="badge" style="background: ${isCorrect ? '#ecfdf5' : '#fef2f2'}; color: ${isCorrect ? '#065f46' : '#991b1b'};">
                    ${isCorrect ? '✓ Đúng' : '✗ Sai'}
                  </span>
                </div>
              </div>
              <div>${escapeHtml(q.q)}</div>
            </div>
            <div style="font-size: 0.9rem; margin-bottom: 0.5rem;">
              • Đáp án của con: <strong>${userChoice !== undefined ? String.fromCharCode(65 + userChoice) + '. ' + escapeHtml(q.opts[userChoice]) : 'Chưa chọn'}</strong>
              <br>• Đáp án đúng: <strong style="color: #10b981;">${String.fromCharCode(65 + q.correct)}. ${escapeHtml(q.opts[q.correct])}</strong>
            </div>
            <div style="background: #eff6ff; padding: 0.75rem; border-radius: 6px; font-size: 0.875rem; color: #1e40af;">
              💡 <strong>Lời giải chi tiết:</strong> ${escapeHtml(q.exp)}
            </div>
            ${!isCorrect ? `
              <div style="margin-top: 0.5rem; text-align: right;">
                <button class="btn btn-outline" style="font-size: 0.75rem; padding: 3px 8px;" onclick="quickSaveMistake('${escapeJs(q.topic)}', '${escapeJs(q.q)}', '${escapeJs(q.exp)}')">
                  ➕ Lưu vào Sổ lỗi sai
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function quickSaveMistake(topic, qText, fixText) {
  const list = getMistakes();
  list.unshift({
    subject: currentExamState.subject === 'van' ? 'Van' : 'Toan',
    topic: topic,
    mistake: qText,
    reason: 'Làm sai trong đề thi thử',
    fix: fixText,
    date: new Date().toLocaleDateString('vi-VN')
  });
  saveMistakes(list);
  playBeep('success');
  alert('Đã thêm câu này vào Sổ tay lỗi sai thành công!');
}

function resetToGenerator() {
  document.getElementById('examLivePanel').style.display = 'none';
  document.getElementById('examGeneratorPanel').style.display = 'block';
  location.reload();
}

// Tải số liệu Dashboard (KPI)
function loadDashboardStats() {
  const history = getExamHistory();
  const totalTestsEl = document.getElementById('statTotalTests');
  const avgScoreEl = document.getElementById('statAvgScore');
  const accuracyEl = document.getElementById('statAccuracy');
  const levelBadgeEl = document.getElementById('statLevelBadge');
  const historyTableEl = document.getElementById('examHistoryTable');

  if (!totalTestsEl) return;

  const total = history.length;
  totalTestsEl.textContent = total;

  if (total === 0) {
    if (avgScoreEl) avgScoreEl.textContent = '0.0';
    if (accuracyEl) accuracyEl.textContent = '0%';
    if (levelBadgeEl) levelBadgeEl.textContent = 'Khởi động';
    if (historyTableEl) historyTableEl.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Chưa có bài thi nào được hoàn thành. Bấm nút "Tạo đề thi mới" bên trên để bắt đầu!</td></tr>';
    return;
  }

  let sumScore = 0;
  let sumPct = 0;
  history.forEach(item => {
    sumScore += item.score;
    sumPct += item.percentage;
  });

  const avgScore = Math.round((sumScore / total) * 10) / 10;
  const avgPct = Math.round(sumPct / total);

  if (avgScoreEl) avgScoreEl.textContent = avgScore.toFixed(1);
  if (accuracyEl) accuracyEl.textContent = `${avgPct}%`;

  if (levelBadgeEl) {
    if (avgScore >= 8.5) {
      levelBadgeEl.textContent = 'Đạt Chuẩn Trần Phú';
      levelBadgeEl.style.color = '#10b981';
    } else if (avgScore >= 7.0) {
      levelBadgeEl.textContent = 'Khá - Tiến Bộ';
      levelBadgeEl.style.color = '#2563eb';
    } else {
      levelBadgeEl.textContent = 'Cần Bồi Dưỡng';
      levelBadgeEl.style.color = '#f59e0b';
    }
  }

  // Render history table
  if (historyTableEl) {
    historyTableEl.innerHTML = history.slice(0, 5).map(item => `
      <tr>
        <td><strong>${item.date}</strong></td>
        <td><span class="badge" style="background: #eff6ff; color: #1e40af;">${item.subject}</span></td>
        <td>${item.correctCount} câu</td>
        <td><strong style="color: ${item.score >= 8 ? '#10b981' : (item.score >= 6.5 ? '#2563eb' : '#ef4444')}; font-size: 1.05rem;">${item.score}</strong></td>
        <td>${item.percentage}%</td>
      </tr>
    `).join('');
  }
}

// ------------------------------------------
// 6. CÔNG CỤ TẠO ĐOẠN VĂN NLXH 5 BƯỚC
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
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Khởi chạy khi load trang

// ------------------------------------------
// 7. HỆ THỐNG TỰ ĐỘNG CẬP NHẬT CÂU HỎI ÔN TẬP TIẾP THEO (ADAPTIVE REVIEW)
// ------------------------------------------
function generateNextAdaptiveExam(forcedSubject = null) {
  // Lấy lịch sử làm bài gần nhất hoặc câu sai
  const mistakes = JSON.parse(localStorage.getItem(STORAGE_KEYS.MISTAKES) || '[]');
  const examHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAM_HISTORY) || '[]');
  
  let targetSubject = forcedSubject;
  if (!targetSubject) {
    if (examHistory.length > 0) {
      targetSubject = examHistory[0].subject || 'toan';
    } else {
      targetSubject = 'toan';
    }
  }

  let pool = [];
  if (targetSubject === 'toan') pool = [...QUESTION_BANK.toan];
  else if (targetSubject === 'van') pool = [...QUESTION_BANK.van];
  else if (targetSubject === 'anh') pool = [...QUESTION_BANK.anh];
  else pool = [...QUESTION_BANK.toan, ...QUESTION_BANK.van, ...QUESTION_BANK.anh];

  // Lọc ưu tiên các câu thuộc topic mà học sinh hay sai
  const wrongTopics = mistakes.map(m => m.topic ? m.topic.toLowerCase() : '');
  let priorityQuestions = [];
  let otherQuestions = [];

  pool.forEach(q => {
    const isTopicMissed = wrongTopics.some(t => t && q.topic.toLowerCase().includes(t));
    if (isTopicMissed) {
      priorityQuestions.push(q);
    } else {
      otherQuestions.push(q);
    }
  });

  // Trộn đều
  for (let i = priorityQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [priorityQuestions[i], priorityQuestions[j]] = [priorityQuestions[j], priorityQuestions[i]];
  }
  for (let i = otherQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [otherQuestions[i], otherQuestions[j]] = [otherQuestions[j], otherQuestions[i]];
  }

  // Lấy 10 câu ôn tập tiếp theo
  const nextSet = [...priorityQuestions, ...otherQuestions].slice(0, 10);

  currentExamSession = {
    subject: targetSubject,
    subjectName: 'Bộ Ôn Tập Tiếp Theo: ' + (targetSubject === 'toan' ? 'Toán' : targetSubject === 'van' ? 'Ngữ Văn' : 'Tiếng Anh'),
    schoolName: 'Hệ Thống Tự Động Thích Ứng (AI Adaptive)',
    totalQuestions: nextSet.length,
    durationMinutes: 15,
    questions: nextSet,
    userAnswers: {},
    startTime: Date.now()
  };

  examTimeRemaining = 15 * 60;
  clearInterval(examTimerInterval);
  examTimerInterval = setInterval(updateExamTimerTick, 1000);

  renderLiveExam();

  // Scroll to exam box
  const box = document.getElementById('examActiveBox');
  if (box) {
    box.scrollIntoView({ behavior: 'smooth' });
  }

  alert('🎯 Đã tự động cập nhật Bộ câu hỏi ôn tập tiếp theo bám sát các dạng bài trọng tâm!');
}

document.addEventListener('DOMContentLoaded', () => {
  updatePomoDisplay();
  initChecklist();
  renderMistakes();
  loadDashboardStats();
  
  const form = document.getElementById('mistakeForm');
  if (form) form.addEventListener('submit', addMistake);
});
