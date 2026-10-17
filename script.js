/**
 * 🎵 리코더 성장 일지 (Recorder Growth Journal) - script.js
 * 초등학교 담임교사와 학생을 위한 웹앱 로직
 * 순수 자바스크립트 (Vanilla JS) & GitHub Pages 호환
 */

// ==========================================
// 1. 초기 기본 데이터 (초기 로딩 시 사용)
// ==========================================
const DEFAULT_STUDENTS = [
  { id: 'std-3-1-01', className: '3학년 1반', number: 1, name: '강다은', pin: '0000', createdAt: '2026-03-02' },
  { id: 'std-3-1-02', className: '3학년 1반', number: 2, name: '김민준', pin: '0000', createdAt: '2026-03-02' },
  { id: 'std-3-1-03', className: '3학년 1반', number: 3, name: '박서윤', pin: '0000', createdAt: '2026-03-02' },
  { id: 'std-3-1-04', className: '3학년 1반', number: 4, name: '이도현', pin: '0000', createdAt: '2026-03-02' },
  { id: 'std-3-1-05', className: '3학년 1반', number: 5, name: '정지우', pin: '0000', createdAt: '2026-03-02' },
  { id: 'std-3-2-01', className: '3학년 2반', number: 1, name: '최하은', pin: '0000', createdAt: '2026-03-02' },
  { id: 'std-3-2-02', className: '3학년 2반', number: 2, name: '한시우', pin: '0000', createdAt: '2026-03-02' }
];

const DEFAULT_SONGS = [
  { id: 'song-01', title: '비행기', stage: '악보와 운지 익히기', order: 1 },
  { id: 'song-02', title: '나비야', stage: '악보와 운지 익히기', order: 2 },
  { id: 'song-03', title: '환희의 송가', stage: '부분 연습', order: 3 },
  { id: 'song-04', title: '에델바이스', stage: '전체 연주', order: 4 },
  { id: 'song-05', title: '할아버지의 낡은 시계', stage: '표현하며 연주하기', order: 5 }
];

// 최근 날짜 포맷 함수 (YYYY-MM-DD)
function getDaysAgoString(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const DEFAULT_RECORDS = [
  {
    id: 'rec-init-01',
    createdAt: getDaysAgoString(3) + ' 15:20',
    dateOnly: getDaysAgoString(3),
    studentId: 'std-3-1-01',
    songTitle: '비행기',
    focusArea: '운지법',
    count: 4,
    selfEval: '잘했어요',
    comment: '시-라-솔 손가락 구멍을 꽉 막았더니 맑은 소리가 났어요!',
    teacherFeedback: '손 모양이 아주 예뻐졌어요. 호흡도 일정해서 듣기 좋네요!',
    feedbackConfirmed: true
  },
  {
    id: 'rec-init-02',
    createdAt: getDaysAgoString(1) + ' 16:10',
    dateOnly: getDaysAgoString(1),
    studentId: 'std-3-1-01',
    songTitle: '환희의 송가',
    focusArea: '호흡',
    count: 3,
    selfEval: '조금씩 나아지고 있어요',
    comment: '높은 음 불 때 바람을 살살 부는 걸 연습했어요.',
    teacherFeedback: '좋은 연습 방법이에요! 높은 도, 레도 무리 없이 연주할 수 있을 거예요.',
    feedbackConfirmed: false
  },
  {
    id: 'rec-init-03',
    createdAt: getDaysAgoString(2) + ' 14:05',
    dateOnly: getDaysAgoString(2),
    studentId: 'std-3-1-02',
    songTitle: '나비야',
    focusArea: '박자',
    count: 5,
    selfEval: '잘했어요',
    comment: '메트로놈 소리에 맞춰서 끝까지 틀리지 않고 불렀어요.',
    teacherFeedback: '',
    feedbackConfirmed: false
  }
];

// ==========================================
// 2. 앱 전역 상태 관리
// ==========================================
class RecorderApp {
  constructor() {
    this.students = this.loadStorage('recorder_students', DEFAULT_STUDENTS);
    this.songs = this.loadStorage('recorder_songs', DEFAULT_SONGS);
    this.records = this.loadStorage('recorder_records', DEFAULT_RECORDS);
    this.appsScriptUrl = localStorage.getItem('recorder_apps_script_url') || '';
    this.teacherPin = localStorage.getItem('recorder_teacher_pin') || '1234';

    this.currentStudent = null;
    this.isTeacher = false;
    this.practiceCount = 1;
    this.lastSavedRecord = null;
    this.selectedStudentForModal = null;

    this.initElements();
    this.bindEvents();
    this.initApp();
  }

  // 로컬 스토리지 안전 읽기
  loadStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn('Storage read failed:', key, e);
      return fallback;
    }
  }

  // 로컬 스토리지 안전 쓰기
  saveStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Storage write failed:', key, e);
    }
  }

  // DOM 엘리먼트 캐싱
  initElements() {
    // 뷰 섹션들
    this.views = {
      start: document.getElementById('view-start'),
      studentHome: document.getElementById('view-student-home'),
      practiceForm: document.getElementById('view-practice-form'),
      complete: document.getElementById('view-complete'),
      studentGrowth: document.getElementById('view-student-growth'),
      teacherDashboard: document.getElementById('view-teacher-dashboard'),
      teacherManage: document.getElementById('view-teacher-manage')
    };

    // 헤더 엘리먼트
    this.headerLogoBtn = document.getElementById('headerLogoBtn');
    this.currentUserBadge = document.getElementById('currentUserBadge');
    this.badgeRoleText = document.getElementById('badgeRoleText');
    this.badgeNameText = document.getElementById('badgeNameText');
    this.logoutBtn = document.getElementById('logoutBtn');

    // 시작 화면
    this.selectClass = document.getElementById('selectClass');
    this.selectStudentNumber = document.getElementById('selectStudentNumber');
    this.studentPreviewBox = document.getElementById('studentPreviewBox');
    this.studentPreviewName = document.getElementById('studentPreviewName');
    this.studentPinGroup = document.getElementById('studentPinGroup');
    this.studentPinInput = document.getElementById('studentPinInput');
    this.rememberTabletGroup = document.getElementById('rememberTabletGroup');
    this.rememberTabletCheck = document.getElementById('rememberTabletCheck');
    this.btnStudentStart = document.getElementById('btnStudentStart');
    this.studentLoginForm = document.getElementById('studentLoginForm');
    this.teacherLoginForm = document.getElementById('teacherLoginForm');
    this.teacherPinInput = document.getElementById('teacherPinInput');

    // 학생 홈 화면
    this.homeClassNumberChip = document.getElementById('homeClassNumberChip');
    this.homeStudentName = document.getElementById('homeStudentName');
    this.statWeeklyDays = document.getElementById('statWeeklyDays');
    this.statTotalSongs = document.getElementById('statTotalSongs');
    this.statTotalCount = document.getElementById('statTotalCount');
    this.challengeStageBadge = document.getElementById('challengeStageBadge');
    this.challengeSongTitle = document.getElementById('challengeSongTitle');
    this.challengeTip = document.getElementById('challengeTip');
    this.btnGoPractice = document.getElementById('btnGoPractice');
    this.btnGoGrowth = document.getElementById('btnGoGrowth');
    this.homeRecentRecordsList = document.getElementById('homeRecentRecordsList');

    // 연습 기록 화면
    this.btnPracticeBack = document.getElementById('btnPracticeBack');
    this.practiceRecordForm = document.getElementById('practiceRecordForm');
    this.practiceSongSelect = document.getElementById('practiceSongSelect');
    this.selectedSongStageBox = document.getElementById('selectedSongStageBox');
    this.selectedSongStageText = document.getElementById('selectedSongStageText');
    this.practiceCountDisplay = document.getElementById('practiceCountDisplay');
    this.btnCountAddMain = document.getElementById('btnCountAddMain');
    this.btnCountCancelLast = document.getElementById('btnCountCancelLast');
    this.btnCountMinus = document.getElementById('btnCountMinus');
    this.btnCountPlus = document.getElementById('btnCountPlus');
    this.practiceCommentInput = document.getElementById('practiceCommentInput');
    this.commentCharCount = document.getElementById('commentCharCount');
    this.btnSavePractice = document.getElementById('btnSavePractice');

    // 완료 화면
    this.compSongTitle = document.getElementById('compSongTitle');
    this.compCount = document.getElementById('compCount');
    this.compFocus = document.getElementById('compFocus');
    this.compEval = document.getElementById('compEval');
    this.btnCompGoGrowth = document.getElementById('btnCompGoGrowth');
    this.btnCompGoHome = document.getElementById('btnCompGoHome');

    // 성장 화면
    this.btnGrowthBack = document.getElementById('btnGrowthBack');
    this.gStatDays = document.getElementById('gStatDays');
    this.gStatCounts = document.getElementById('gStatCounts');
    this.gStatSongs = document.getElementById('gStatSongs');
    this.teacherFeedbackBanner = document.getElementById('teacherFeedbackBanner');
    this.teacherFeedbackText = document.getElementById('teacherFeedbackText');
    this.teacherFeedbackDate = document.getElementById('teacherFeedbackDate');
    this.btnConfirmFeedback = document.getElementById('btnConfirmFeedback');
    this.weeklyChartContainer = document.getElementById('weeklyChartContainer');
    this.growthSongStagesList = document.getElementById('growthSongStagesList');
    this.growthSongFilter = document.getElementById('growthSongFilter');
    this.growthRecordsTimeline = document.getElementById('growthRecordsTimeline');

    // 교사 대시보드
    this.btnGoTeacherManage = document.getElementById('btnGoTeacherManage');
    this.btnTeacherExit = document.getElementById('btnTeacherExit');
    this.tStatTotalStudents = document.getElementById('tStatTotalStudents');
    this.tStatActiveStudents = document.getElementById('tStatActiveStudents');
    this.tStatParticipationRate = document.getElementById('tStatParticipationRate');
    this.tStatTopSong = document.getElementById('tStatTopSong');
    this.tStatDifficultFocus = document.getElementById('tStatDifficultFocus');
    this.teacherStudentSearch = document.getElementById('teacherStudentSearch');
    this.teacherStudentTableBody = document.getElementById('teacherStudentTableBody');

    // 교사 관리 화면
    this.btnBackToDashboard = document.getElementById('btnBackToDashboard');
    this.manageTabs = document.querySelectorAll('.manage-tabs .tab-btn');
    this.tabPanes = document.querySelectorAll('.tab-pane');
    this.sheetStatusIndicator = document.getElementById('sheetStatusIndicator');
    this.sheetStatusText = document.getElementById('sheetStatusText');
    this.appsScriptUrlInput = document.getElementById('appsScriptUrlInput');
    this.sheetConfigForm = document.getElementById('sheetConfigForm');
    this.btnManualSync = document.getElementById('btnManualSync');
    this.manageSongTableBody = document.getElementById('manageSongTableBody');
    this.btnOpenAddSongModal = document.getElementById('btnOpenAddSongModal');
    this.manageStudentTableBody = document.getElementById('manageStudentTableBody');
    this.btnOpenAddStudentModal = document.getElementById('btnOpenAddStudentModal');
    this.manageRecordsTableBody = document.getElementById('manageRecordsTableBody');

    // 모달창들
    this.studentDetailModal = document.getElementById('studentDetailModal');
    this.btnCloseModal = document.getElementById('btnCloseModal');
    this.modalStudentTitle = document.getElementById('modalStudentTitle');
    this.modalStudentDays = document.getElementById('modalStudentDays');
    this.modalStudentCounts = document.getElementById('modalStudentCounts');
    this.modalStudentSongs = document.getElementById('modalStudentSongs');
    this.modalFeedbackInput = document.getElementById('modalFeedbackInput');
    this.btnSaveFeedback = document.getElementById('btnSaveFeedback');
    this.modalRecordsList = document.getElementById('modalRecordsList');

    this.addSongModal = document.getElementById('addSongModal');
    this.btnCloseSongModal = document.getElementById('btnCloseSongModal');
    this.addSongForm = document.getElementById('addSongForm');
    this.newSongTitle = document.getElementById('newSongTitle');
    this.newSongStage = document.getElementById('newSongStage');

    this.addStudentModal = document.getElementById('addStudentModal');
    this.btnCloseStudentModal = document.getElementById('btnCloseStudentModal');
    this.addStudentForm = document.getElementById('addStudentForm');
    this.newStudentClass = document.getElementById('newStudentClass');
    this.newStudentNum = document.getElementById('newStudentNum');
    this.newStudentName = document.getElementById('newStudentName');
    this.newStudentPin = document.getElementById('newStudentPin');

    // 토스트
    this.toastContainer = document.getElementById('toastContainer');
  }

  // 이벤트 바인딩
  bindEvents() {
    // 헤더 로고 클릭 시 홈 또는 시작화면
    this.headerLogoBtn.addEventListener('click', () => {
      if (this.currentStudent) {
        this.showView('studentHome');
      } else if (this.isTeacher) {
        this.showView('teacherDashboard');
      } else {
        this.showView('start');
      }
    });

    // 로그아웃 버튼
    this.logoutBtn.addEventListener('click', () => this.handleLogout());

    // 학급 선택 드롭다운 변경
    this.selectClass.addEventListener('change', () => this.handleClassChange());

    // 번호 선택 변경
    this.selectStudentNumber.addEventListener('change', () => this.handleNumberChange());

    // 학생 로그인 폼 제출
    this.studentLoginForm.addEventListener('submit', (e) => this.handleStudentLogin(e));

    // 교사 로그인 폼 제출
    this.teacherLoginForm.addEventListener('submit', (e) => this.handleTeacherLogin(e));

    // 학생 홈 액션 버튼
    this.btnGoPractice.addEventListener('click', () => this.openPracticeForm());
    this.btnGoGrowth.addEventListener('click', () => this.openGrowthView());

    // 연습 기록 화면 제어
    this.btnPracticeBack.addEventListener('click', () => this.showView('studentHome'));
    this.practiceSongSelect.addEventListener('change', () => this.handlePracticeSongChange());

    // 카운터 버튼들
    this.btnCountAddMain.addEventListener('click', () => this.adjustPracticeCount(1));
    this.btnCountCancelLast.addEventListener('click', () => this.adjustPracticeCount(-1));
    this.btnCountPlus.addEventListener('click', () => this.adjustPracticeCount(1));
    this.btnCountMinus.addEventListener('click', () => this.adjustPracticeCount(-1));

    // 연습 소감 글자수 세기
    this.practiceCommentInput.addEventListener('input', () => {
      this.commentCharCount.textContent = this.practiceCommentInput.value.length;
    });

    // 연습 기록 저장
    this.practiceRecordForm.addEventListener('submit', (e) => this.handleSavePractice(e));

    // 완료 화면 버튼
    this.btnCompGoGrowth.addEventListener('click', () => this.openGrowthView());
    this.btnCompGoHome.addEventListener('click', () => this.showView('studentHome'));

    // 성장 화면 제어
    this.btnGrowthBack.addEventListener('click', () => this.showView('studentHome'));
    this.btnConfirmFeedback.addEventListener('click', () => this.handleConfirmFeedback());
    this.growthSongFilter.addEventListener('change', () => this.renderGrowthTimeline());

    // 교사 대시보드 제어
    this.btnGoTeacherManage.addEventListener('click', () => this.openTeacherManage());
    this.btnTeacherExit.addEventListener('click', () => this.handleLogout());
    this.teacherStudentSearch.addEventListener('input', () => this.renderTeacherStudentTable());

    // 교사 관리 화면 제어
    this.btnBackToDashboard.addEventListener('click', () => this.showView('teacherDashboard'));
    this.manageTabs.forEach(btn => {
      btn.addEventListener('click', () => this.switchManageTab(btn.dataset.tab));
    });

    // 시트 연동 설정 폼
    this.sheetConfigForm.addEventListener('submit', (e) => this.handleSaveSheetUrl(e));
    this.btnManualSync.addEventListener('click', () => this.syncAllDataWithSheet());

    // 모달 제어
    this.btnCloseModal.addEventListener('click', () => this.closeStudentModal());
    this.studentDetailModal.addEventListener('click', (e) => {
      if (e.target === this.studentDetailModal) this.closeStudentModal();
    });
    this.btnSaveFeedback.addEventListener('click', () => this.handleSaveTeacherFeedback());

    // 연습곡 추가 모달
    this.btnOpenAddSongModal.addEventListener('click', () => {
      this.addSongForm.reset();
      this.addSongModal.style.display = 'flex';
    });
    this.btnCloseSongModal.addEventListener('click', () => {
      this.addSongModal.style.display = 'none';
    });
    this.addSongForm.addEventListener('submit', (e) => this.handleAddSong(e));

    // 학생 추가 모달
    this.btnOpenAddStudentModal.addEventListener('click', () => {
      this.addStudentForm.reset();
      this.newStudentPin.value = '0000';
      this.addStudentModal.style.display = 'flex';
    });
    this.btnCloseStudentModal.addEventListener('click', () => {
      this.addStudentModal.style.display = 'none';
    });
    this.addStudentForm.addEventListener('submit', (e) => this.handleAddStudent(e));
  }

  // 앱 시작 초기화
  initApp() {
    this.populateClassDropdown();
    this.updateSheetStatusBadge();

    // 개인 태블릿에 저장된 학생 ID 확인 (자동 입장)
    const rememberedId = localStorage.getItem('recorder_remembered_student_id');
    if (rememberedId) {
      const student = this.students.find(s => s.id === rememberedId);
      if (student) {
        this.loginAsStudent(student, false);
        this.showToast(`반가워요, ${student.name} 학생! 태블릿 정보를 확인했어요.`, 'success');
        return;
      }
    }

    this.showView('start');
  }

  // 뷰 전환
  showView(viewName) {
    Object.keys(this.views).forEach(key => {
      if (this.views[key]) {
        this.views[key].classList.toggle('active', key === viewName);
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================
  // 3. 학생 인증 및 로그인 처리
  // ==========================================
  populateClassDropdown() {
    const classes = [...new Set(this.students.map(s => s.className))].sort();
    this.selectClass.innerHTML = '<option value="">학급을 고르세요</option>';
    classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      this.selectClass.appendChild(opt);
    });
  }

  handleClassChange() {
    const selectedClass = this.selectClass.value;
    this.selectStudentNumber.innerHTML = '<option value="">번호를 고르세요</option>';
    this.studentPreviewBox.style.display = 'none';
    this.studentPinGroup.style.display = 'none';
    this.rememberTabletGroup.style.display = 'none';
    this.btnStudentStart.disabled = true;

    if (!selectedClass) {
      this.selectStudentNumber.disabled = true;
      return;
    }

    const studentsInClass = this.students
      .filter(s => s.className === selectedClass)
      .sort((a, b) => a.number - b.number);

    studentsInClass.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.number}번`;
      this.selectStudentNumber.appendChild(opt);
    });

    this.selectStudentNumber.disabled = false;
  }

  handleNumberChange() {
    const studentId = this.selectStudentNumber.value;
    if (!studentId) {
      this.studentPreviewBox.style.display = 'none';
      this.studentPinGroup.style.display = 'none';
      this.rememberTabletGroup.style.display = 'none';
      this.btnStudentStart.disabled = true;
      return;
    }

    const student = this.students.find(s => s.id === studentId);
    if (student) {
      this.studentPreviewName.textContent = student.name;
      this.studentPreviewBox.style.display = 'flex';
      this.studentPinGroup.style.display = 'block';
      this.rememberTabletGroup.style.display = 'flex';
      this.studentPinInput.value = '';
      this.btnStudentStart.disabled = false;
    }
  }

  handleStudentLogin(e) {
    e.preventDefault();
    const studentId = this.selectStudentNumber.value;
    if (!studentId) {
      this.showToast('학급과 번호를 선택해주세요.', 'error');
      return;
    }

    const student = this.students.find(s => s.id === studentId);
    if (!student) {
      this.showToast('학생 정보를 찾을 수 없습니다.', 'error');
      return;
    }

    // 4자리 확인 핀번호 검증
    const enteredPin = this.studentPinInput.value.trim();
    const expectedPin = student.pin || '0000';

    if (enteredPin && enteredPin !== expectedPin) {
      this.showToast('확인 번호가 일치하지 않습니다. (기본값: 0000)', 'error');
      this.studentPinInput.focus();
      return;
    }

    // 개인 태블릿 기억하기 체크 여부
    if (this.rememberTabletCheck.checked) {
      localStorage.setItem('recorder_remembered_student_id', student.id);
    } else {
      localStorage.removeItem('recorder_remembered_student_id');
    }

    this.loginAsStudent(student, true);
  }

  loginAsStudent(student, showWelcomeToast = true) {
    this.currentStudent = student;
    this.isTeacher = false;

    // 헤더 상태 갱신
    this.currentUserBadge.style.display = 'flex';
    this.badgeRoleText.textContent = '학생';
    this.badgeNameText.textContent = student.name;
    this.logoutBtn.style.display = 'inline-flex';

    this.renderStudentHome();
    this.showView('studentHome');

    if (showWelcomeToast) {
      this.showToast(`환영해요, ${student.name} 학생! 🎵`, 'success');
    }
  }

  handleTeacherLogin(e) {
    e.preventDefault();
    const enteredPin = this.teacherPinInput.value.trim();
    if (enteredPin === this.teacherPin) {
      this.currentStudent = null;
      this.isTeacher = true;

      this.currentUserBadge.style.display = 'flex';
      this.badgeRoleText.textContent = '선생님';
      this.badgeNameText.textContent = '담임교사';
      this.logoutBtn.style.display = 'inline-flex';

      this.teacherPinInput.value = '';
      this.renderTeacherDashboard();
      this.showView('teacherDashboard');
      this.showToast('선생님 모드로 접속하였습니다.', 'success');
    } else {
      this.showToast('선생님 비밀번호가 일치하지 않습니다. (기본: 1234)', 'error');
    }
  }

  handleLogout() {
    this.currentStudent = null;
    this.isTeacher = false;
    this.currentUserBadge.style.display = 'none';
    this.logoutBtn.style.display = 'none';
    localStorage.removeItem('recorder_remembered_student_id');

    // 폼 초기화
    this.studentLoginForm.reset();
    this.handleClassChange();
    this.showView('start');
    this.showToast('로그아웃되었습니다.', 'success');
  }

  // ==========================================
  // 4. 학생 홈 및 통계 렌더링
  // ==========================================
  renderStudentHome() {
    if (!this.currentStudent) return;

    this.homeClassNumberChip.textContent = `${this.currentStudent.className} ${this.currentStudent.number}번`;
    this.homeStudentName.textContent = this.currentStudent.name;

    // 해당 학생의 모든 기록 필터링
    const myRecords = this.records
      .filter(r => r.studentId === this.currentStudent.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 1) 이번 주 연습 일수 (중복 날짜 제거 계산)
    const weeklyDays = this.calculateWeeklyDays(myRecords);
    this.statWeeklyDays.textContent = weeklyDays;

    // 2) 연습한 고유 곡 수
    const uniqueSongs = new Set(myRecords.map(r => r.songTitle));
    this.statTotalSongs.textContent = uniqueSongs.size;

    // 3) 총 연습 횟수
    const totalCount = myRecords.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
    this.statTotalCount.textContent = totalCount;

    // 4) 현재 도전 곡 선정 (가장 최근 기록 곡 또는 기본 곡)
    if (myRecords.length > 0) {
      const latest = myRecords[0];
      const songInfo = this.songs.find(s => s.title === latest.songTitle) || { stage: '부분 연습' };
      this.challengeSongTitle.textContent = latest.songTitle;
      this.challengeStageBadge.textContent = songInfo.stage;
      this.challengeTip.textContent = `${latest.focusArea}에 신경 쓰며 즐겁게 한 걸음씩 완성해봐요!`;
    } else {
      const firstSong = this.songs[0] || { title: '비행기', stage: '악보와 운지 익히기' };
      this.challengeSongTitle.textContent = firstSong.title;
      this.challengeStageBadge.textContent = firstSong.stage;
      this.challengeTip.textContent = '호흡을 고르게 하고 시-라-솔 손가락 구멍을 꼼꼼히 막아보세요!';
    }

    // 5) 최근 연습 기록 3개 렌더링
    this.homeRecentRecordsList.innerHTML = '';
    const recent3 = myRecords.slice(0, 3);
    if (recent3.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state-text';
      emptyDiv.textContent = '아직 기록이 없어요. 첫 번째 리코더 연습을 기록해보세요! 🎶';
      this.homeRecentRecordsList.appendChild(emptyDiv);
    } else {
      recent3.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'record-item-card';

        let emoji = '🙂';
        if (rec.selfEval === '잘했어요') emoji = '😄';
        if (rec.selfEval === '연습이 더 필요해요') emoji = '😐';

        item.innerHTML = `
          <div class="record-main-info">
            <span class="record-emoji">${emoji}</span>
            <div class="record-titles">
              <strong>${this.escapeHtml(rec.songTitle)}</strong>
              <span class="record-meta">${rec.createdAt.slice(5, 16)} · 집중: ${this.escapeHtml(rec.focusArea)}</span>
            </div>
          </div>
          <span class="record-badge-count">${rec.count}회</span>
        `;
        this.homeRecentRecordsList.appendChild(item);
      });
    }
  }

  // 이번 주 고유 연습 일수 계산
  calculateWeeklyDays(recordsList) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0(일) ~ 6(토)
    // 월요일 기준으로 이번 주 시작일 구하기
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const thisWeekDates = new Set();
    recordsList.forEach(r => {
      const recDate = new Date(r.createdAt.replace(' ', 'T'));
      if (recDate >= monday && recDate <= now) {
        thisWeekDates.add(r.dateOnly || r.createdAt.slice(0, 10));
      }
    });
    return thisWeekDates.size;
  }

  // ==========================================
  // 5. 오늘의 연습 기록 작성 로직
  // ==========================================
  openPracticeForm() {
    if (!this.currentStudent) return;

    // 연습곡 셀렉트 팝업 채우기
    this.practiceSongSelect.innerHTML = '<option value="">연습한 곡을 선택하세요</option>';
    this.songs.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.title;
      opt.textContent = `${s.title} (${s.stage})`;
      opt.dataset.stage = s.stage;
      this.practiceSongSelect.appendChild(opt);
    });

    // 폼 초기화
    this.practiceRecordForm.reset();
    this.selectedSongStageBox.style.display = 'none';
    this.practiceCount = 1;
    this.practiceCountDisplay.textContent = '1';
    this.commentCharCount.textContent = '0';
    this.btnSavePractice.disabled = false;

    // 만약 학생의 이전 연습 곡이 있다면 기본 선택
    const myRecords = this.records.filter(r => r.studentId === this.currentStudent.id);
    if (myRecords.length > 0) {
      const lastSong = myRecords[myRecords.length - 1].songTitle;
      this.practiceSongSelect.value = lastSong;
      this.handlePracticeSongChange();
    }

    this.showView('practiceForm');
  }

  handlePracticeSongChange() {
    const selectedTitle = this.practiceSongSelect.value;
    if (!selectedTitle) {
      this.selectedSongStageBox.style.display = 'none';
      return;
    }
    const song = this.songs.find(s => s.title === selectedTitle);
    if (song) {
      this.selectedSongStageText.textContent = song.stage;
      this.selectedSongStageBox.style.display = 'flex';
    }
  }

  adjustPracticeCount(delta) {
    const nextVal = this.practiceCount + delta;
    if (nextVal < 0) return; // 0회 미만 음수 방지
    this.practiceCount = nextVal;
    this.practiceCountDisplay.textContent = String(this.practiceCount);

    // 가벼운 애니메이션
    this.practiceCountDisplay.style.transform = 'scale(1.2)';
    setTimeout(() => {
      this.practiceCountDisplay.style.transform = 'scale(1)';
    }, 150);
  }

  async handleSavePractice(e) {
    e.preventDefault();

    // 1. 필수 입력 검증
    const songTitle = this.practiceSongSelect.value;
    if (!songTitle) {
      this.showToast('연습한 곡을 선택해주세요!', 'error');
      this.practiceSongSelect.focus();
      return;
    }

    const focusAreaChecked = document.querySelector('input[name="focusArea"]:checked');
    if (!focusAreaChecked) {
      this.showToast('오늘 집중해서 연습한 부분을 선택해주세요!', 'error');
      return;
    }

    if (this.practiceCount <= 0) {
      this.showToast('연습 횟수는 최소 1회 이상이어야 합니다.', 'error');
      return;
    }

    const selfEvalChecked = document.querySelector('input[name="selfEval"]:checked');
    if (!selfEvalChecked) {
      this.showToast('오늘의 자기평가를 선택해주세요!', 'error');
      return;
    }

    const comment = this.practiceCommentInput.value.trim();
    const now = new Date();
    const dateOnly = now.toISOString().split('T')[0];
    const timeOnly = now.toTimeString().slice(0, 5);
    const createdAt = `${dateOnly} ${timeOnly}`;
    const recordId = 'rec-' + Date.now();

    const newRecord = {
      id: recordId,
      createdAt: createdAt,
      dateOnly: dateOnly,
      studentId: this.currentStudent.id,
      songTitle: songTitle,
      focusArea: focusAreaChecked.value,
      count: Number(this.practiceCount),
      selfEval: selfEvalChecked.value,
      comment: comment,
      teacherFeedback: '',
      feedbackConfirmed: false
    };

    // 2. 중복 저장 방지: 버튼 비활성화
    this.btnSavePractice.disabled = true;
    this.btnSavePractice.textContent = '기록 저장 중... 🎶';

    // 3. 로컬 저장소에 우선 확실히 보관
    this.records.unshift(newRecord);
    this.saveStorage('recorder_records', this.records);
    this.lastSavedRecord = newRecord;

    // 4. 구글 스프레드시트 연동이 설정되어 있다면 비동기 전송
    if (this.appsScriptUrl) {
      this.sendRecordToSheet(newRecord);
    }

    // 5. 완료 화면으로 이동
    setTimeout(() => {
      this.renderCompleteView(newRecord);
      this.showView('complete');
      this.showToast('연습 기록이 안전하게 저장되었어요! 🎉', 'success');
    }, 400);
  }

  // 완료 화면 렌더링
  renderCompleteView(record) {
    this.compSongTitle.textContent = record.songTitle;
    this.compCount.textContent = `${record.count}회`;
    this.compFocus.textContent = record.focusArea;

    let evalEmoji = '🙂';
    if (record.selfEval === '잘했어요') evalEmoji = '😄';
    if (record.selfEval === '연습이 더 필요해요') evalEmoji = '😐';
    this.compEval.textContent = `${evalEmoji} ${record.selfEval}`;
  }

  // ==========================================
  // 6. 나의 성장 기록 화면
  // ==========================================
  openGrowthView() {
    if (!this.currentStudent) return;
    this.renderStudentGrowth();
    this.showView('studentGrowth');
  }

  renderStudentGrowth() {
    const myRecords = this.records
      .filter(r => r.studentId === this.currentStudent.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 누적 일수 (중복 날짜 제거 계산)
    const uniqueDates = new Set(myRecords.map(r => r.dateOnly || r.createdAt.slice(0, 10)));
    this.gStatDays.textContent = uniqueDates.size;

    // 누적 횟수
    const totalCounts = myRecords.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
    this.gStatCounts.textContent = totalCounts;

    // 도전한 곡 수
    const uniqueSongs = new Set(myRecords.map(r => r.songTitle));
    this.gStatSongs.textContent = uniqueSongs.size;

    // 선생님 피드백 확인
    const recordWithFeedback = myRecords.find(r => r.teacherFeedback && r.teacherFeedback.trim() !== '');
    if (recordWithFeedback) {
      this.teacherFeedbackBanner.style.display = 'block';
      this.teacherFeedbackText.textContent = `"${recordWithFeedback.teacherFeedback}"`;
      this.teacherFeedbackDate.textContent = `(${recordWithFeedback.songTitle} 연습에 남겨주신 말씀)`;
      
      if (recordWithFeedback.feedbackConfirmed) {
        this.btnConfirmFeedback.textContent = '확인 완료 👍';
        this.btnConfirmFeedback.disabled = true;
      } else {
        this.btnConfirmFeedback.textContent = '선생님 말씀 확인했어요 👍';
        this.btnConfirmFeedback.disabled = false;
        this.btnConfirmFeedback.dataset.recordId = recordWithFeedback.id;
      }
    } else {
      this.teacherFeedbackBanner.style.display = 'none';
    }

    // 주간 7일 막대그래프 렌더링
    this.renderWeeklyChart(myRecords);

    // 곡별 연습 단계 렌더링
    this.renderSongStagesProgress(myRecords);

    // 필터 드롭다운 갱신
    this.growthSongFilter.innerHTML = '<option value="ALL">모든 곡 보기</option>';
    this.songs.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.title;
      opt.textContent = s.title;
      this.growthSongFilter.appendChild(opt);
    });

    // 타임라인 렌더링
    this.renderGrowthTimeline();
  }

  handleConfirmFeedback() {
    const recordId = this.btnConfirmFeedback.dataset.recordId;
    if (!recordId) return;

    const record = this.records.find(r => r.id === recordId);
    if (record) {
      record.feedbackConfirmed = true;
      this.saveStorage('recorder_records', this.records);
      this.btnConfirmFeedback.textContent = '확인 완료 👍';
      this.btnConfirmFeedback.disabled = true;
      this.showToast('선생님께 확인 소식을 보냈어요! ❤️', 'success');

      if (this.appsScriptUrl) {
        this.sendActionToSheet('confirmFeedback', { recordId });
      }
    }
  }

  renderWeeklyChart(myRecords) {
    this.weeklyChartContainer.innerHTML = '';
    const days = [];
    const countsPerDay = {};

    // 최근 7일 날짜 생성
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      days.push(str);
      countsPerDay[str] = 0;
    }

    myRecords.forEach(r => {
      const d = r.dateOnly || r.createdAt.slice(0, 10);
      if (countsPerDay[d] !== undefined) {
        countsPerDay[d] += Number(r.count) || 0;
      }
    });

    const maxCount = Math.max(...Object.values(countsPerDay), 5); // 최소 기준 5

    days.forEach(dayStr => {
      const count = countsPerDay[dayStr];
      const heightPercent = Math.min(100, Math.round((count / maxCount) * 100));

      const col = document.createElement('div');
      col.className = 'chart-bar-col';

      const shortLabel = dayStr.slice(5).replace('-', '/');

      col.innerHTML = `
        <div class="chart-bar-wrapper">
          <div class="chart-bar" style="height: ${Math.max(count > 0 ? heightPercent : 4, 4)}%;">
            ${count > 0 ? `<span class="chart-val">${count}</span>` : ''}
          </div>
        </div>
        <span class="chart-date-label">${shortLabel}</span>
      `;
      this.weeklyChartContainer.appendChild(col);
    });
  }

  renderSongStagesProgress(myRecords) {
    this.growthSongStagesList.innerHTML = '';
    const stageNames = ['1. 악보와 운지', '2. 부분 연습', '3. 전체 연주', '4. 표현하기'];

    this.songs.forEach(song => {
      const songRecords = myRecords.filter(r => r.songTitle === song.title);
      const songTotalCount = songRecords.reduce((sum, r) => sum + (Number(r.count) || 0), 0);

      // 단계 계산 (연습 횟수에 따라 친절하게 진척도 표시)
      let currentStageIdx = 0;
      if (songTotalCount >= 10) currentStageIdx = 3;
      else if (songTotalCount >= 5) currentStageIdx = 2;
      else if (songTotalCount >= 2) currentStageIdx = 1;
      else if (songTotalCount > 0) currentStageIdx = 0;

      const item = document.createElement('div');
      item.className = 'song-stage-item';

      let pillsHtml = '';
      for (let i = 0; i < 4; i++) {
        let cls = 'stage-step-pill';
        if (i < currentStageIdx) cls += ' completed';
        else if (i === currentStageIdx && songTotalCount > 0) cls += ' active';
        pillsHtml += `<div class="${cls}" title="${stageNames[i]}"></div>`;
      }

      item.innerHTML = `
        <div class="song-stage-header">
          <span class="song-stage-title">${this.escapeHtml(song.title)}</span>
          <span class="song-stage-count">${songTotalCount}회 연습 (${stageNames[currentStageIdx]})</span>
        </div>
        <div class="stage-step-bar">
          ${pillsHtml}
        </div>
      `;
      this.growthSongStagesList.appendChild(item);
    });
  }

  renderGrowthTimeline() {
    this.growthRecordsTimeline.innerHTML = '';
    const filter = this.growthSongFilter.value;
    let list = this.records.filter(r => r.studentId === this.currentStudent.id);

    if (filter !== 'ALL') {
      list = list.filter(r => r.songTitle === filter);
    }

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state-text';
      empty.textContent = '해당 곡의 연습 일지가 아직 없습니다.';
      this.growthRecordsTimeline.appendChild(empty);
      return;
    }

    list.forEach(rec => {
      const item = document.createElement('div');
      item.className = 'timeline-item';

      let evalEmoji = '🙂';
      if (rec.selfEval === '잘했어요') evalEmoji = '😄';
      if (rec.selfEval === '연습이 더 필요해요') evalEmoji = '😐';

      item.innerHTML = `
        <span class="timeline-date">${rec.createdAt}</span>
        <div class="timeline-content-card">
          <div class="t-card-row">
            <strong>${this.escapeHtml(rec.songTitle)} (${rec.count}회)</strong>
            <span>${evalEmoji} ${this.escapeHtml(rec.selfEval)}</span>
          </div>
          <div class="record-meta mt-2">집중 영역: ${this.escapeHtml(rec.focusArea)}</div>
          ${rec.comment ? `<div class="t-card-comment">💭 ${this.escapeHtml(rec.comment)}</div>` : ''}
          ${rec.teacherFeedback ? `<div class="t-card-comment" style="color:#6B46C1;font-weight:600;">👩‍🏫 선생님: ${this.escapeHtml(rec.teacherFeedback)}</div>` : ''}
        </div>
      `;
      this.growthRecordsTimeline.appendChild(item);
    });
  }

  // ==========================================
  // 7. 교사 대시보드 및 관리 로직
  // ==========================================
  renderTeacherDashboard() {
    // 1) 전체 학생 수
    const totalStudents = this.students.length;
    this.tStatTotalStudents.textContent = `${totalStudents}명`;

    // 2) 이번 주 참여 학생 수
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const activeStudentIds = new Set();
    this.records.forEach(r => {
      const d = new Date(r.createdAt.replace(' ', 'T'));
      if (d >= monday && d <= now) {
        activeStudentIds.add(r.studentId);
      }
    });

    const activeCount = activeStudentIds.size;
    this.tStatActiveStudents.textContent = `${activeCount}명`;
    const rate = totalStudents > 0 ? Math.round((activeCount / totalStudents) * 100) : 0;
    this.tStatParticipationRate.textContent = `참여율 ${rate}%`;

    // 3) 가장 많이 연습한 곡
    const songCountMap = {};
    const focusCountMap = {};

    this.records.forEach(r => {
      songCountMap[r.songTitle] = (songCountMap[r.songTitle] || 0) + (Number(r.count) || 0);
      if (r.focusArea) {
        focusCountMap[r.focusArea] = (focusCountMap[r.focusArea] || 0) + 1;
      }
    });

    let topSong = '-';
    let maxSongCount = 0;
    Object.keys(songCountMap).forEach(s => {
      if (songCountMap[s] > maxSongCount) {
        maxSongCount = songCountMap[s];
        topSong = s;
      }
    });
    this.tStatTopSong.textContent = topSong !== '-' ? `${topSong} (${maxSongCount}회)` : '-';

    // 4) 어려워하는 연습 요소 (자기평가가 '연습이 더 필요해요'인 항목 중 가장 많은 focusArea)
    const difficultFocusMap = {};
    this.records
      .filter(r => r.selfEval === '연습이 더 필요해요')
      .forEach(r => {
        difficultFocusMap[r.focusArea] = (difficultFocusMap[r.focusArea] || 0) + 1;
      });

    let topDifficult = '-';
    let maxDiffCount = 0;
    Object.keys(difficultFocusMap).forEach(f => {
      if (difficultFocusMap[f] > maxDiffCount) {
        maxDiffCount = difficultFocusMap[f];
        topDifficult = f;
      }
    });

    // 만약 부족 평가가 없으면 가장 연습 비중이 많은 포커스 노출
    if (topDifficult === '-') {
      Object.keys(focusCountMap).forEach(f => {
        if (focusCountMap[f] > maxDiffCount) {
          maxDiffCount = focusCountMap[f];
          topDifficult = f;
        }
      });
    }
    this.tStatDifficultFocus.textContent = topDifficult;

    // 학생별 테이블 렌더링
    this.renderTeacherStudentTable();
  }

  renderTeacherStudentTable() {
    this.teacherStudentTableBody.innerHTML = '';
    const query = this.teacherStudentSearch.value.trim().toLowerCase();

    let list = this.students.filter(s => {
      if (!query) return true;
      return s.name.toLowerCase().includes(query) || s.className.toLowerCase().includes(query);
    });

    if (list.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9" class="text-center text-muted" style="padding:24px;">등록된 학생이 없거나 검색 결과가 없습니다.</td>`;
      this.teacherStudentTableBody.appendChild(tr);
      return;
    }

    list.forEach(student => {
      const stdRecords = this.records.filter(r => r.studentId === student.id);
      const uniqueDays = new Set(stdRecords.map(r => r.dateOnly || r.createdAt.slice(0, 10))).size;
      const totalCount = stdRecords.reduce((sum, r) => sum + (Number(r.count) || 0), 0);

      const latestRecord = stdRecords.length > 0 ? stdRecords[0] : null;
      const latestSong = latestRecord ? latestRecord.songTitle : '-';
      const latestEval = latestRecord ? latestRecord.selfEval : '-';
      const hasFeedback = stdRecords.some(r => r.teacherFeedback && r.teacherFeedback.trim() !== '');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${this.escapeHtml(student.className)}</td>
        <td>${student.number}번</td>
        <td><strong>${this.escapeHtml(student.name)}</strong></td>
        <td>${uniqueDays}일</td>
        <td>${totalCount}회</td>
        <td>${this.escapeHtml(latestSong)}</td>
        <td>${this.escapeHtml(latestEval)}</td>
        <td>
          <span class="badge ${hasFeedback ? 'badge-primary' : 'text-muted'}">
            ${hasFeedback ? '작성됨' : '미작성'}
          </span>
        </td>
        <td>
          <button type="button" class="btn btn-xs btn-outline btn-view-std" data-id="${student.id}">
            일지 보기 / 피드백
          </button>
        </td>
      `;
      this.teacherStudentTableBody.appendChild(tr);
    });

    // 학생 일지 상세 모달 열기 버튼 이벤트
    this.teacherStudentTableBody.querySelectorAll('.btn-view-std').forEach(btn => {
      btn.addEventListener('click', () => {
        const studentId = btn.dataset.id;
        this.openStudentModal(studentId);
      });
    });
  }

  openStudentModal(studentId) {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return;

    this.selectedStudentForModal = student;
    this.modalStudentTitle.textContent = `${student.className} ${student.number}번 ${student.name} 학생의 리코더 일지`;

    const stdRecords = this.records.filter(r => r.studentId === student.id);
    const uniqueDays = new Set(stdRecords.map(r => r.dateOnly || r.createdAt.slice(0, 10))).size;
    const totalCount = stdRecords.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
    const uniqueSongs = new Set(stdRecords.map(r => r.songTitle)).size;

    this.modalStudentDays.textContent = `${uniqueDays}일`;
    this.modalStudentCounts.textContent = `${totalCount}회`;
    this.modalStudentSongs.textContent = `${uniqueSongs}곡`;

    // 최신 피드백 불러오기
    const recordWithFeedback = stdRecords.find(r => r.teacherFeedback && r.teacherFeedback.trim() !== '');
    this.modalFeedbackInput.value = recordWithFeedback ? recordWithFeedback.teacherFeedback : '';

    // 학생 기록 목록 렌더링
    this.modalRecordsList.innerHTML = '';
    if (stdRecords.length === 0) {
      this.modalRecordsList.innerHTML = '<div class="empty-state-text">아직 작성된 연습 기록이 없습니다.</div>';
    } else {
      stdRecords.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'record-item-card';
        item.innerHTML = `
          <div>
            <strong>${this.escapeHtml(rec.songTitle)} (${rec.count}회)</strong>
            <div class="record-meta">${rec.createdAt} · 평가: ${this.escapeHtml(rec.selfEval)}</div>
            ${rec.comment ? `<div class="record-meta mt-2">소감: "${this.escapeHtml(rec.comment)}"</div>` : ''}
          </div>
        `;
        this.modalRecordsList.appendChild(item);
      });
    }

    this.studentDetailModal.style.display = 'flex';
  }

  closeStudentModal() {
    this.studentDetailModal.style.display = 'none';
    this.selectedStudentForModal = null;
  }

  handleSaveTeacherFeedback() {
    if (!this.selectedStudentForModal) return;

    const feedbackText = this.modalFeedbackInput.value.trim();
    const stdRecords = this.records.filter(r => r.studentId === this.selectedStudentForModal.id);

    if (stdRecords.length === 0) {
      this.showToast('연습 기록이 아직 없어 피드백을 연결할 수 없습니다.', 'error');
      return;
    }

    // 가장 최신 연습 기록에 피드백 저장
    const targetRecord = stdRecords[0];
    targetRecord.teacherFeedback = feedbackText;
    targetRecord.feedbackConfirmed = false;

    this.saveStorage('recorder_records', this.records);
    this.showToast(`${this.selectedStudentForModal.name} 학생에게 피드백을 저장했습니다!`, 'success');
    this.renderTeacherStudentTable();

    // 스프레드시트 비동기 동기화
    if (this.appsScriptUrl) {
      this.sendActionToSheet('saveFeedback', {
        recordId: targetRecord.id,
        feedback: feedbackText
      });
    }

    this.closeStudentModal();
  }

  // ==========================================
  // 8. 교사 관리 센터 (명단/곡/기록/시트설정)
  // ==========================================
  openTeacherManage() {
    this.renderManageSongs();
    this.renderManageStudents();
    this.renderManageRecords();
    this.appsScriptUrlInput.value = this.appsScriptUrl;
    this.showView('teacherManage');
  }

  switchManageTab(targetTabId) {
    this.manageTabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === targetTabId);
    });
    this.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === targetTabId);
    });
  }

  // 연습곡 관리 렌더링
  renderManageSongs() {
    this.manageSongTableBody.innerHTML = '';
    this.songs.forEach((s, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.id}</td>
        <td><strong>${this.escapeHtml(s.title)}</strong></td>
        <td>${this.escapeHtml(s.stage)}</td>
        <td>${idx + 1}</td>
        <td>
          <button type="button" class="btn btn-xs btn-outline text-accent btn-del-song" data-id="${s.id}">
            삭제
          </button>
        </td>
      `;
      this.manageSongTableBody.appendChild(tr);
    });

    this.manageSongTableBody.querySelectorAll('.btn-del-song').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('이 연습곡을 목록에서 삭제하시겠습니까?')) {
          this.songs = this.songs.filter(s => s.id !== btn.dataset.id);
          this.saveStorage('recorder_songs', this.songs);
          this.renderManageSongs();
          this.showToast('연습곡이 삭제되었습니다.', 'success');
        }
      });
    });
  }

  handleAddSong(e) {
    e.preventDefault();
    const title = this.newSongTitle.value.trim();
    const stage = this.newSongStage.value;
    if (!title) return;

    const newSong = {
      id: 'song-' + Date.now().toString().slice(-4),
      title: title,
      stage: stage,
      order: this.songs.length + 1
    };

    this.songs.push(newSong);
    this.saveStorage('recorder_songs', this.songs);
    this.renderManageSongs();
    this.addSongModal.style.display = 'none';
    this.showToast(`'${title}' 곡이 추가되었습니다!`, 'success');

    if (this.appsScriptUrl) {
      this.sendActionToSheet('addSong', newSong);
    }
  }

  // 학생 명단 관리 렌더링
  renderManageStudents() {
    this.manageStudentTableBody.innerHTML = '';
    this.students.forEach(std => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${std.id}</td>
        <td>${this.escapeHtml(std.className)}</td>
        <td>${std.number}번</td>
        <td><strong>${this.escapeHtml(std.name)}</strong></td>
        <td>${std.pin || '0000'}</td>
        <td>${std.createdAt || '-'}</td>
        <td>
          <button type="button" class="btn btn-xs btn-outline text-accent btn-del-std" data-id="${std.id}">
            삭제
          </button>
        </td>
      `;
      this.manageStudentTableBody.appendChild(tr);
    });

    this.manageStudentTableBody.querySelectorAll('.btn-del-std').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('이 학생을 명단에서 삭제하시겠습니까?')) {
          this.students = this.students.filter(s => s.id !== btn.dataset.id);
          this.saveStorage('recorder_students', this.students);
          this.populateClassDropdown();
          this.renderManageStudents();
          this.showToast('학생이 명단에서 삭제되었습니다.', 'success');
        }
      });
    });
  }

  handleAddStudent(e) {
    e.preventDefault();
    const className = this.newStudentClass.value.trim();
    const number = Number(this.newStudentNum.value);
    const name = this.newStudentName.value.trim();
    const pin = this.newStudentPin.value.trim() || '0000';

    if (!className || !name || !number) return;

    const newStudent = {
      id: 'std-' + Date.now().toString().slice(-4),
      className: className,
      number: number,
      name: name,
      pin: pin,
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.students.push(newStudent);
    this.saveStorage('recorder_students', this.students);
    this.populateClassDropdown();
    this.renderManageStudents();
    this.addStudentModal.style.display = 'none';
    this.showToast(`${name} 학생이 등록되었습니다!`, 'success');

    if (this.appsScriptUrl) {
      this.sendActionToSheet('addStudent', newStudent);
    }
  }

  // 잘못 등록된 기록 정정 및 삭제
  renderManageRecords() {
    this.manageRecordsTableBody.innerHTML = '';
    if (this.records.length === 0) {
      this.manageRecordsTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding:20px;">등록된 기록이 없습니다.</td></tr>`;
      return;
    }

    this.records.slice(0, 50).forEach(rec => {
      const student = this.students.find(s => s.id === rec.studentId) || { name: '알 수 없음' };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${rec.createdAt}</td>
        <td><strong>${this.escapeHtml(student.name)}</strong></td>
        <td>${this.escapeHtml(rec.songTitle)}</td>
        <td>${this.escapeHtml(rec.focusArea)}</td>
        <td>${rec.count}회</td>
        <td>${this.escapeHtml(rec.selfEval)}</td>
        <td>${this.escapeHtml(rec.comment || '-')}</td>
        <td>
          <button type="button" class="btn btn-xs btn-outline text-accent btn-del-rec" data-id="${rec.id}">
            삭제
          </button>
        </td>
      `;
      this.manageRecordsTableBody.appendChild(tr);
    });

    this.manageRecordsTableBody.querySelectorAll('.btn-del-rec').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('이 기록을 삭제하시겠습니까? (삭제된 기록은 통계에서 제외됩니다)')) {
          this.records = this.records.filter(r => r.id !== btn.dataset.id);
          this.saveStorage('recorder_records', this.records);
          this.renderManageRecords();
          this.showToast('연습 기록이 삭제되었습니다.', 'success');

          if (this.appsScriptUrl) {
            this.sendActionToSheet('deleteRecord', { recordId: btn.dataset.id });
          }
        }
      });
    });
  }

  // ==========================================
  // 9. 구글 스프레드시트 연동 및 통신 (Apps Script)
  // ==========================================
  updateSheetStatusBadge() {
    if (this.appsScriptUrl) {
      this.sheetStatusIndicator.className = 'status-indicator status-connected';
      this.sheetStatusText.textContent = '구글 스프레드시트 연동 활성화됨';
    } else {
      this.sheetStatusIndicator.className = 'status-indicator status-local';
      this.sheetStatusText.textContent = '로컬 브라우저 저장소 모드로 작동 중입니다. (시트 미연동)';
    }
  }

  async handleSaveSheetUrl(e) {
    e.preventDefault();
    const url = this.appsScriptUrlInput.value.trim();

    if (!url) {
      this.appsScriptUrl = '';
      localStorage.removeItem('recorder_apps_script_url');
      this.updateSheetStatusBadge();
      this.showToast('시트 연동이 해제되어 로컬 저장소 모드로 전환되었습니다.', 'success');
      return;
    }

    if (!url.startsWith('https://script.google.com/macros/s/')) {
      this.showToast('올바른 Google Apps Script 웹 앱 배포 URL 형식이 아닙니다.', 'error');
      return;
    }

    this.showToast('구글 스프레드시트 연결 테스트 중...', 'info');

    try {
      // GET 핑 테스트
      const resp = await fetch(`${url}?action=ping`, { mode: 'no-cors' });
      // no-cors 특성상 상태 코드는 불투명(opaque)하지만 도메인 연결 시 예외가 발생하지 않음
      this.appsScriptUrl = url;
      localStorage.setItem('recorder_apps_script_url', url);
      this.updateSheetStatusBadge();
      this.showToast('구글 시트 연동 설정이 성공적으로 저장되었습니다! 🎉', 'success');
    } catch (err) {
      console.warn('Sheet ping warning:', err);
      // fallback으로 저장
      this.appsScriptUrl = url;
      localStorage.setItem('recorder_apps_script_url', url);
      this.updateSheetStatusBadge();
      this.showToast('URL이 저장되었습니다. 첫 기록 저장 시 데이터가 전달됩니다.', 'success');
    }
  }

  // 단일 연습 기록 시트 전송
  async sendRecordToSheet(record) {
    if (!this.appsScriptUrl) return;
    try {
      await fetch(this.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveRecord',
          payload: record
        })
      });
    } catch (e) {
      console.warn('Apps Script post failed, stored locally:', e);
    }
  }

  // 액션별 시트 전송
  async sendActionToSheet(action, payload) {
    if (!this.appsScriptUrl) return;
    try {
      await fetch(this.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload })
      });
    } catch (e) {
      console.warn('Apps Script action failed:', action, e);
    }
  }

  // 전체 데이터 수동 동기화
  async syncAllDataWithSheet() {
    if (!this.appsScriptUrl) {
      this.showToast('먼저 Google Apps Script URL을 입력해주세요.', 'error');
      return;
    }

    this.showToast('전체 데이터를 구글 시트로 동기화하는 중...', 'info');
    try {
      await fetch(this.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncAll',
          payload: {
            students: this.students,
            songs: this.songs,
            records: this.records
          }
        })
      });
      this.showToast('동기화가 완료되었습니다! 구글 시트를 확인해보세요.', 'success');
    } catch (e) {
      console.error('Sync failed:', e);
      this.showToast('동기화 중 오류가 발생했습니다. Apps Script 권한을 확인해주세요.', 'error');
    }
  }

  // ==========================================
  // 10. 유틸리티 함수
  // ==========================================
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${this.escapeHtml(message)}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(16px)';
      toast.style.transition = '0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// ==========================================
// 11. DOMContentLoaded 시점 인스턴스 실행
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  window.recorderApp = new RecorderApp();
});
