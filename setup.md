# 🎵 리코더 성장 일지 - 구글 스프레드시트 & Apps Script 연동 가이드 (setup.md)

이 문서는 코딩 초보 선생님도 **3분 안에** 무료로 구글 스프레드시트를 데이터베이스로 연결할 수 있도록 작성된 단계별 안내서입니다.

---

## 📌 1단계: 구글 스프레드시트 만들기

1. [Google 스프레드시트](https://sheets.google.com)로 이동하여 **[새 스프레드시트 만들기]**를 클릭합니다.
2. 스프레드시트 제목을 **`리코더 성장 일지 데이터`**로 입력합니다.
3. 하단의 시트 탭 이름을 변경하고, 시트 2개를 추가하여 **총 3개의 탭**을 아래와 같이 만듭니다.

### 탭별 시트 이름 및 첫 행(헤더) 설정:

#### 1) 첫 번째 시트 이름: `학생명단`
1행(A1~F1)에 아래 항목을 순서대로 적어주세요.
| A열 | B열 | C열 | D열 | E열 | F열 |
|---|---|---|---|---|---|
| 학생ID | 학급 | 번호 | 이름 | 확인코드 | 등록일 |

#### 2) 두 번째 시트 이름: `연습곡목록`
1행(A1~D1)에 아래 항목을 순서대로 적어주세요.
| A열 | B열 | C열 | D열 |
|---|---|---|---|
| 곡ID | 곡명 | 연습단계 | 정렬순서 |

#### 3) 세 번째 시트 이름: `연습기록`
1행(A1~J1)에 아래 항목을 순서대로 적어주세요.
| A열 | B열 | C열 | D열 | E열 | F열 | G열 | H열 | I열 | J열 |
|---|---|---|---|---|---|---|---|---|---|
| 기록ID | 일시 | 학생ID | 곡명 | 연습목표 | 연습횟수 | 자기평가 | 소감 | 교사피드백 | 학생확인여부 |

---

## 📌 2단계: Google Apps Script 코드 붙여넣기

1. 스프레드시트 상단 메뉴에서 **[확장 프로그램]** > **[Apps Script]**를 클릭합니다.
2. 기존에 적혀있는 `function myFunction() { ... }` 코드를 모두 지웁니다.
3. 아래의 **`Code.gs` 전체 코드**를 복사하여 붙여넣고, 상단의 **디스크 모양 아이콘(저장)**을 누릅니다.

```javascript
/**
 * 🎵 리코더 성장 일지 - Google Apps Script (Code.gs)
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
  
  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Recorder Journal API Connected!' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'ready' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var action = data.action;
    var payload = data.payload;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1) 단일 연습 기록 저장
    if (action === 'saveRecord') {
      var recordSheet = ss.getSheetByName('연습기록');
      if (!recordSheet) recordSheet = ss.insertSheet('연습기록');

      recordSheet.appendRow([
        payload.id || '',
        payload.createdAt || '',
        payload.studentId || '',
        payload.songTitle || '',
        payload.focusArea || '',
        payload.count || 0,
        payload.selfEval || '',
        payload.comment || '',
        payload.teacherFeedback || '',
        payload.feedbackConfirmed ? '확인완료' : '미확인'
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', id: payload.id }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2) 교사 피드백 저장
    if (action === 'saveFeedback') {
      var sheet = ss.getSheetByName('연습기록');
      if (sheet) {
        var values = sheet.getDataRange().getValues();
        for (var i = 1; i < values.length; i++) {
          if (values[i][0] == payload.recordId) {
            sheet.getRange(i + 1, 9).setValue(payload.feedback); // I열: 교사피드백
            sheet.getRange(i + 1, 10).setValue('미확인'); // J열: 학생확인여부
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3) 학생 피드백 확인 완료 상태 업데이트
    if (action === 'confirmFeedback') {
      var sheet = ss.getSheetByName('연습기록');
      if (sheet) {
        var values = sheet.getDataRange().getValues();
        for (var i = 1; i < values.length; i++) {
          if (values[i][0] == payload.recordId) {
            sheet.getRange(i + 1, 10).setValue('확인완료');
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4) 연습곡 추가
    if (action === 'addSong') {
      var songSheet = ss.getSheetByName('연습곡목록');
      if (!songSheet) songSheet = ss.insertSheet('연습곡목록');
      songSheet.appendRow([
        payload.id,
        payload.title,
        payload.stage,
        payload.order
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5) 학생 추가
    if (action === 'addStudent') {
      var stdSheet = ss.getSheetByName('학생명단');
      if (!stdSheet) stdSheet = ss.insertSheet('학생명단');
      stdSheet.appendRow([
        payload.id,
        payload.className,
        payload.number,
        payload.name,
        payload.pin || '0000',
        payload.createdAt || ''
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 6) 기록 삭제
    if (action === 'deleteRecord') {
      var recSheet = ss.getSheetByName('연습기록');
      if (recSheet) {
        var dataRows = recSheet.getDataRange().getValues();
        for (var k = 1; k < dataRows.length; k++) {
          if (dataRows[k][0] == payload.recordId) {
            recSheet.deleteRow(k + 1);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 7) 전체 데이터 일괄 동기화 (syncAll)
    if (action === 'syncAll') {
      // 연습기록 백업
      if (payload.records && payload.records.length > 0) {
        var rSheet = ss.getSheetByName('연습기록');
        if (!rSheet) rSheet = ss.insertSheet('연습기록');
        
        // 기존 기록과 중복되지 않도록 새 행 추가
        var existing = rSheet.getDataRange().getValues();
        var existingIds = new Set();
        for (var j = 1; j < existing.length; j++) {
          existingIds.add(String(existing[j][0]));
        }

        payload.records.forEach(function(rec) {
          if (!existingIds.has(String(rec.id))) {
            rSheet.appendRow([
              rec.id,
              rec.createdAt,
              rec.studentId,
              rec.songTitle,
              rec.focusArea,
              rec.count,
              rec.selfEval,
              rec.comment || '',
              rec.teacherFeedback || '',
              rec.feedbackConfirmed ? '확인완료' : '미확인'
            ]);
          }
        });
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', synced: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ignored' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 📌 3단계: 웹 앱으로 배포하기 (가장 중요!)

1. Apps Script 화면 우측 상단의 파란색 **[배포]** 버튼을 누르고 **[새 배포]**를 선택합니다.
2. 좌측 톱니바퀴 아이콘(종류 선택)을 누르고 **[웹 앱]**을 선택합니다.
3. 배포 설정 입력:
   - **설명**: `리코더 일지 연동 1.0`
   - **다음 사용자 계정으로 실행**: **`나 (선생님 구글 이메일)`**
   - **액세스 권한이 있는 사용자**: **`모든 사용자`** *(매우 중요: 초등학생들이 구글 로그인 없이 학급 태블릿에서 자유롭게 연습 기록을 전송하기 위해 필수입니다)*
4. **[배포]** 버튼을 클릭합니다.
5. "액세스 승인" 창이 뜨면 선생님의 구글 계정을 선택하고, "고급" > "...(안전하지 않음)으로 이동" > "허용"을 클릭합니다. (구글 공식 자체 스크립트 실행 절차입니다)
6. 배포가 완료되면 화면에 나타나는 **[웹 앱 URL]** (예: `https://script.google.com/macros/s/.../exec`)을 **복사**합니다.

---

## 📌 4단계: 리코더 성장 일지 웹앱에 URL 등록하기

1. 제작된 '리코더 성장 일지' 웹앱을 엽니다.
2. 메인 화면에서 **[선생님 모드]**로 입장합니다. (기본 비밀번호: `1234`)
3. 우측 상단의 **[⚙️ 곡·학생·시트 관리]** 버튼을 누릅니다.
4. 첫 번째 탭인 **[구글 시트 연동 설정]** 화면에서 방금 복사한 웹 앱 URL을 붙여넣고 **[설정 저장 및 연결 테스트]** 버튼을 누릅니다.
5. 연동 상태가 **"구글 스프레드시트 연동 활성화됨"**으로 바뀌면 모든 준비가 끝납니다! 🎉

---

## 💡 유용한 팁 & 자주 묻는 질문

- **연동 전이나 인터넷이 안 될 때는 어떻게 되나요?**
  - 웹앱 자체에 안전한 브라우저 로컬 저장소(localStorage)가 탑재되어 있어, 시트를 아직 연결하지 않았거나 일시적으로 인터넷이 끊겨도 학생들의 기록이 안전하게 보관됩니다.
  - 시트 URL 등록 후 [🔄 로컬 데이터 즉시 시트로 동기화]를 누르면 언제든지 이전 기록을 구글 시트로 한 번에 모을 수 있습니다.
- **학생 명단을 한꺼번에 입력하고 싶어요.**
  - 웹앱의 [교사 관리 > 학생 명단 관리]에서 하나씩 등록하거나, 구글 시트의 `학생명단` 탭에 직접 학생 정보를 입력해 두시면 됩니다.
- **선생님 비밀번호를 바꾸고 싶어요.**
  - `script.js` 파일 상단의 `teacherPin` 또는 설정값을 원하는 숫자로 변경하시면 됩니다.
