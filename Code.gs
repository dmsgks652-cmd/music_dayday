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
      if (!recordSheet) throw new Error('연습기록 시트가 없습니다.');
      if (!payload || !payload.id || !payload.studentId) throw new Error('기록 ID 또는 학생 ID 누락');
      var lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        var lastRow = recordSheet.getLastRow();
        if (lastRow > 1) {
          var ids = recordSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(String);
          if (ids.includes(String(payload.id))) return ContentService.createTextOutput(JSON.stringify({status:'success', duplicate:true, id:payload.id})).setMimeType(ContentService.MimeType.JSON);
        }

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
      SpreadsheetApp.flush();
      } finally { lock.releaseLock(); }

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