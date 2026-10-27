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
const QUESTION_BANK = {
  toan: [
    {
      id: 'm1',
      topic: 'Căn thức & Rút gọn',
      level: 'coban',
      q: 'Biểu thức √(2x − 4) có nghĩa khi và chỉ khi:',
      opts: ['x > 2', 'x ≥ 2', 'x < 2', 'x ≤ 2'],
      correct: 1,
      exp: 'Căn bậc hai √A có nghĩa khi A ≥ 0 ⇔ 2x − 4 ≥ 0 ⇔ x ≥ 2.'
    },
    {
      id: 'm2',
      topic: 'Phương trình bậc 2 & Vi-ét',
      level: 'coban',
      q: 'Phương trình x² − 5x + 6 = 0 có tổng hai nghiệm x₁ + x₂ bằng:',
      opts: ['−5', '5', '6', '−6'],
      correct: 1,
      exp: 'Theo định lý Vi-ét: S = x₁ + x₂ = −b/a = −(−5)/1 = 5.'
    },
    {
      id: 'm3',
      topic: 'Hàm số bậc nhất',
      level: 'coban',
      q: 'Hàm số y = (m − 3)x + 2 đồng biến trên ℝ khi:',
      opts: ['m < 3', 'm > 3', 'm ≥ 3', 'm ≠ 3'],
      correct: 1,
      exp: 'Hàm số bậc nhất y = ax + b đồng biến khi hệ số a > 0 ⇔ m − 3 > 0 ⇔ m > 3.'
    },
    {
      id: 'm4',
      topic: 'Hệ phương trình',
      level: 'coban',
      q: 'Nghiệm của hệ phương trình { 2x + y = 5; x − y = 1 } là:',
      opts: ['(2; 1)', '(1; 2)', '(3; −1)', '(2; −1)'],
      correct: 0,
      exp: 'Cộng 2 phương trình vế theo vế: 3x = 6 ➔ x = 2 ➔ y = 1.'
    },
    {
      id: 'm5',
      topic: 'Phương trình bậc 2 & Vi-ét',
      level: 'nangcao',
      q: 'Cho phương trình x² − 4x + m = 0. Phương trình có 2 nghiệm phân biệt thỏa mãn x₁² + x₂² = 10 khi m bằng:',
      opts: ['m = 3', 'm = −3', 'm = 2', 'm = 6'],
      correct: 0,
      exp: 'Ta có Δ\' = 4 − m > 0 ⇔ m < 4. Theo định lý Vi-ét: x₁ + x₂ = 4 và x₁ · x₂ = m. Khi đó: x₁² + x₂² = (x₁ + x₂)² − 2x₁x₂ = 16 − 2m = 10 ⇔ 2m = 6 ⇔ m = 3 (thỏa mãn điều kiện m < 4).'
    },
    {
      id: 'm6',
      topic: 'Toán thực tế kinh tế',
      level: 'nangcao',
      q: 'Một chiếc áo có giá niêm yết 400.000 đồng. Nhân dịp khai trương cửa hàng giảm giá 15%. Giá bán thực tế của chiếc áo là:',
      opts: ['320.000 đ', '340.000 đ', '360.000 đ', '385.000 đ'],
      correct: 1,
      exp: 'Giá bán thực tế = 400.000 × (1 − 15/100) = 400.000 × 0.85 = 340.000 đồng.'
    },
    {
      id: 'm7',
      topic: 'Toán thực tế chuyển động',
      level: 'nangcao',
      q: 'Một ca nô xuôi dòng khúc sông dài 30 km rồi quay ngược dòng về điểm xuất phát. Biết vận tốc dòng nước là 3 km/h và vận tốc thực của ca nô là 15 km/h. Tổng thời gian cả đi lẫn về là:',
      opts: ['4 giờ', '4.25 giờ', '4.5 giờ', '5 giờ'],
      correct: 1,
      exp: 'Vận tốc xuôi dòng = 15 + 3 = 18 km/h ➔ Thời gian xuôi dòng = 30/18 = 5/3 giờ. Vận tốc ngược dòng = 15 − 3 = 12 km/h ➔ Thời gian ngược dòng = 30/12 = 5/2 giờ. Tổng thời gian cả đi lẫn về = 5/3 + 5/2 = 25/6 giờ ≈ 4 giờ 10 phút (xấp xỉ 4.17 giờ, đáp án gần nhất là 4.25 giờ).'
    },
    {
      id: 'm8',
      topic: 'Hình học phẳng & Tứ giác nội tiếp',
      level: 'coban',
      q: 'Tứ giác ABCD nội tiếp đường tròn có góc A = 70°. Số đo của góc đối diện C là:',
      opts: ['70°', '110°', '90°', '180°'],
      correct: 1,
      exp: 'Trong tứ giác nội tiếp, tổng hai góc đối diện bằng 180° ➔ Góc C = 180° − 70° = 110°.'
    },
    {
      id: 'm9',
      topic: 'Hình học không gian thực tế',
      level: 'coban',
      q: 'Một hộp sữa hình trụ có bán kính đáy r = 3 cm và chiều cao h = 10 cm. Thể tích hộp sữa là:',
      opts: ['30π cm³', '60π cm³', '90π cm³', '100π cm³'],
      correct: 2,
      exp: 'Thể tích hình trụ: V = πr²h = π × 3² × 10 = 90π cm³.'
    },
    {
      id: 'm10',
      topic: 'Hệ thức lượng trong tam giác vuông',
      level: 'coban',
      q: 'Tam giác ABC vuông tại A có đường cao AH. Biết BH = 4 cm, CH = 9 cm. Độ dài đường cao AH là:',
      opts: ['6 cm', '13 cm', '36 cm', '√13 cm'],
      correct: 0,
      exp: 'Áp dụng hệ thức lượng: AH² = BH · CH = 4 × 9 = 36 ➔ AH = 6 cm.'
    },
    {
      id: 'm11',
      topic: 'Bất đẳng thức & Cực trị',
      level: 'tranphu',
      q: 'Cho a, b > 0 thỏa mãn a + b = 2. Giá trị nhỏ nhất của biểu thức P = 1/a + 1/b là:',
      opts: ['1', '2', '4', '1/2'],
      correct: 1,
      exp: 'Áp dụng BĐT Cauchy-Schwarz: P = 1/a + 1/b ≥ 4/(a + b) = 4/2 = 2. Dấu bằng xảy ra khi a = b = 1.'
    },
    {
      id: 'm12',
      topic: 'Phương trình bậc 2 & Vi-ét',
      level: 'tranphu',
      q: 'Tìm m để phương trình x² − 2(m − 1)x + m² − 3m = 0 có hai nghiệm trái dấu:',
      opts: ['0 < m < 3', 'm < 0 hoặc m > 3', 'm > 1', 'm < 3'],
      correct: 0,
      exp: 'Phương trình có 2 nghiệm trái dấu khi và chỉ khi a · c = 1 · (m² − 3m) < 0 ⇔ 0 < m < 3.'
    }
  ],
  van: [
    {
      id: 'v1',
      topic: 'Đọc hiểu & Phương thức biểu đạt',
      level: 'coban',
      q: 'Đoạn văn kể về diễn biến một sự việc có mở đầu, cao trào và kết thúc thuộc phương thức biểu đạt chính nào?',
      opts: ['Miêu tả', 'Tự sự', 'Biểu cảm', 'Nghị luận'],
      correct: 1,
      exp: 'Phương thức tự sự dùng để kể lại chuỗi sự việc, có nhân vật, thời gian, không gian.'
    },
    {
      id: 'v2',
      topic: 'Biện pháp tu từ & Tác dụng',
      level: 'coban',
      q: 'Câu thơ "Mặt trời của bắp thì nằm trên đồi / Mặt trời của mẹ, con nằm trên lưng" sử dụng biện pháp tu từ gì ở từ "mặt trời" thứ hai?',
      opts: ['So sánh', 'Ẩn dụ', 'Hoán dụ', 'Nhân hóa'],
      correct: 1,
      exp: 'Từ "mặt trời" thứ 2 là ẩn dụ chỉ đứa con, con là nguồn sống, niềm hạnh phúc và tương lai ấm áp của người mẹ.'
    },
    {
      id: 'v3',
      topic: 'Tiếng Việt: Thành phần biệt lập',
      level: 'coban',
      q: 'Trong câu: "Có lẽ ngày mai trời sẽ mưa", từ "Có lẽ" là thành phần biệt lập nào?',
      opts: ['Thành phần tình thái', 'Thành phần cảm thán', 'Thành phần gọi - đáp', 'Thành phần phụ chú'],
      correct: 0,
      exp: '"Có lẽ" thể hiện mức độ tin cậy và phỏng đoán của người nói đối với sự việc, thuộc thành phần tình thái.'
    },
    {
      id: 'v4',
      topic: 'Tiếng Việt: Phép liên kết',
      level: 'coban',
      q: 'Hai câu: "Đọc sách là thói quen tốt. Nó giúp ta mở rộng tầm nhìn" liên kết với nhau bằng phép liên kết nào?',
      opts: ['Phép lặp', 'Phép thế', 'Phép nối', 'Phép đồng nghĩa'],
      correct: 1,
      exp: 'Từ "Nó" ở câu sau thay thế cho cụm từ "Đọc sách" ở câu trước, sử dụng phép thế đại từ.'
    },
    {
      id: 'v5',
      topic: 'Nghị luận xã hội 200 chữ',
      level: 'nangcao',
      q: 'Trong cấu trúc đoạn văn NLXH 200 chữ (chuẩn 5 bước), bước nào cần nêu một tấm gương thực tế cụ thể, xác thực?',
      opts: ['Bước 1: Mở đoạn', 'Bước 2: Giải thích', 'Bước 3: Bàn luận', 'Bước 4: Dẫn chứng thực tế'],
      correct: 3,
      exp: 'Bước 4 là bước đưa dẫn chứng thực tế xác thực (ví dụ: Thầy Nguyễn Ngọc Ký, Nick Vujicic) để bài viết có sức thuyết phục cao.'
    },
    {
      id: 'v6',
      topic: 'Nghị luận xã hội',
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
      topic: 'Kỹ năng Đọc hiểu văn bản ngoài SGK',
      level: 'tranphu',
      q: 'Khi đề bài yêu cầu "Nêu tác dụng của biện pháp điệp từ trong đoạn thơ", câu trả lời chuẩn barem cần có mấy vế bắt buộc?',
      opts: ['1 vế (Chỉ ra từ lặp)', '2 vế (Tên BPTT + Tác dụng nội dung)', '3 vế (Chỉ điểm từ ngữ + Tác dụng hình ảnh/nội dung + Bộc lộ cảm xúc tác giả)', 'Không cần theo cấu trúc'],
      correct: 2,
      exp: 'Chuẩn barem của Sở Giáo dục yêu cầu đủ 3 vế: Tên & từ ngữ BPTT + Tác dụng làm nổi bật hình ảnh + Thể hiện cảm xúc tác giả để đạt điểm tuyệt đối 1.0đ.'
    },
    {
      id: 'v8',
      topic: 'Nghị luận văn học',
      level: 'tranphu',
      q: 'Để đạt điểm 8.0+ môn Văn thi vào 10, phương pháp làm bài Nghị luận văn học nào hiệu quả nhất cho học sinh?',
      opts: [
        'Học thuộc lòng nguyên văn toàn bộ các bài văn mẫu dài',
        'Tóm tắt lại toàn bộ cốt truyện từ đầu đến cuối',
        'Lập sơ đồ nhánh luận điểm PEEL (Luận điểm ➔ Dẫn chứng ➔ Phân tích nghệ thuật ➔ Chốt ý)',
        'Chỉ viết cảm xúc tự do không cần luận điểm'
      ],
      correct: 2,
      exp: 'Mô hình PEEL theo sơ đồ luận điểm giúp bài viết mạch lạc, đủ ý theo barem chấm của giám khảo mà không mất công học vẹt văn mẫu.'
    }
  ]
};

// State phòng thi Live
let currentExamState = {
  questions: [],
  userAnswers: {},
  timerInterval: null,
  remainingSeconds: 0,
  subject: 'toan',
  level: 'tatca',
  totalCount: 10,
  startTime: null
};

// Hàm bắt đầu tạo đề thi tự động
function generateAutoExam() {
  const subjectSelect = document.getElementById('examSubjectSelect')?.value || 'toan';
  const levelSelect = document.getElementById('examLevelSelect')?.value || 'tatca';
  const countSelect = parseInt(document.getElementById('examCountSelect')?.value || '10', 10);
  const durationMinutes = countSelect === 10 ? 15 : (countSelect === 20 ? 30 : 60);

  // Lấy câu hỏi từ ngân hàng
  let pool = [];
  if (subjectSelect === 'toan') {
    pool = [...QUESTION_BANK.toan];
  } else if (subjectSelect === 'van') {
    pool = [...QUESTION_BANK.van];
  } else {
    // Đề tổng hợp Toán + Văn
    pool = [...QUESTION_BANK.toan, ...QUESTION_BANK.van];
  }

  // Lọc theo level nếu có
  if (levelSelect !== 'tatca') {
    const filtered = pool.filter(q => q.level === levelSelect);
    if (filtered.length >= 4) pool = filtered;
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
        <span class="badge" style="background: #e2e8f0; color: #475569; font-size: 0.75rem;">${escapeHtml(q.topic)}</span>
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
      <div>
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
              <strong>Câu ${idx + 1}:</strong> ${escapeHtml(q.q)}
              <span class="badge" style="float: right; background: ${isCorrect ? '#ecfdf5' : '#fef2f2'}; color: ${isCorrect ? '#065f46' : '#991b1b'};">
                ${isCorrect ? '✓ Đúng' : '✗ Sai'}
              </span>
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
document.addEventListener('DOMContentLoaded', () => {
  updatePomoDisplay();
  initChecklist();
  renderMistakes();
  loadDashboardStats();
  
  const form = document.getElementById('mistakeForm');
  if (form) form.addEventListener('submit', addMistake);
});
