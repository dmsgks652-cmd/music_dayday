/**
 * 🎵 리코더 성장 일지 - Google Apps Script (Code.gs)
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
  
  if (action === 'bridge') return HtmlService.createHtmlOutput(recorderBridgeHtml_()).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Recorder Journal API Connected!' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getRecords') {
    var callback = String(e.parameter.callback || '');
    if (!/^recorderCallback_[A-Za-z0-9_]+$/.test(callback)) {
      return ContentService.createTextOutput(JSON.stringify({status:'error',message:'Invalid callback'})).setMimeType(ContentService.MimeType.JSON);
    }
    var result;
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var teacher = e.parameter.teacher === '1';
      var pin = String(e.parameter.pin || '');
      var studentId = String(e.parameter.studentId || '');
      var allowed = false;
      if (teacher) {
        var teacherPin = PropertiesService.getScriptProperties().getProperty('TEACHER_READ_PIN');
        allowed = !!teacherPin && teacherPin.length >= 8 && pin === teacherPin;
      } else if (studentId && pin) {
        var students = ss.getSheetByName('학생명단');
        if (students && students.getLastRow() > 1) {
          var studentRows = students.getRange(2, 1, students.getLastRow()-1, 5).getDisplayValues();
          allowed = studentRows.some(function(row) { return String(row[0]).trim() === studentId && String(row[4]).trim() === pin && pin !== '0000'; });
        }
      }
      if (!allowed) throw new Error('조회 권한이 없습니다. 학생 확인코드 또는 교사 조회 비밀번호를 확인하세요.');
      var sheet = ss.getSheetByName('연습기록');
      var records = [];
      if (sheet && sheet.getLastRow() > 1) {
        var rows = sheet.getRange(2, 1, sheet.getLastRow()-1, 10).getDisplayValues();
        var studentSheet = ss.getSheetByName('학생명단');
        var names = {};
        if (studentSheet && studentSheet.getLastRow() > 1) {
          studentSheet.getRange(2, 1, studentSheet.getLastRow()-1, 5).getDisplayValues().forEach(function(s) {
            if (s[3] && !names[s[3]]) names[s[3]] = s[0];
            else if (s[3]) names[s[3]] = null; // 같은 이름이 여러 명이면 연결하지 않음
          });
        }
        rows.forEach(function(r, index) {
          var modern = /^rec-/.test(r[0]);
          var sid = modern ? r[2] : names[r[1]];
          if (!sid || (!teacher && sid !== studentId)) return;
          var createdAt = modern ? r[1] : r[0];
          var title = modern ? r[3] : r[2];
          var focus = modern ? r[4] : r[3];
          var count = modern ? r[5] : r[4];
          var evaluation = modern ? r[6] : r[5];
          var comment = modern ? r[7] : r[6];
          records.push({id:modern?r[0]:'legacy-row-'+(index+2),createdAt:createdAt,dateOnly:String(createdAt).slice(0,10),studentId:sid,songTitle:title,focusArea:focus,count:Number(String(count).replace(/[^0-9]/g,''))||0,selfEval:evaluation,comment:comment,teacherFeedback:modern?r[8]:'',feedbackConfirmed:modern?r[9]==='확인완료':false});
        });
      }
      result = {status:'success',records:records};
    } catch (error) { result = {status:'error',message:String(error.message || error)}; }
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(result).replace(/</g,'\\u003c') + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
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
function recorderBridgeHtml_(){
  var html = '<!doctype html><html><body><script>' +
    '(function(){var origin="https://dmsgks652-cmd.github.io";' +
    'window.addEventListener("message",function(e){if(e.origin!==origin||!e.data||e.data.kind!=="recorder-request")return;' +
    'var d=e.data;var ok=function(r){e.source.postMessage({kind:"recorder-result",id:d.id,ok:true,result:r},e.origin)};' +
    'var fail=function(x){e.source.postMessage({kind:"recorder-result",id:d.id,ok:false,error:String(x.message||x)},e.origin)};' +
    'if(d.action==="directory")google.script.run.withSuccessHandler(ok).withFailureHandler(fail).recorderDirectory();' +
    'else if(d.action==="login")google.script.run.withSuccessHandler(ok).withFailureHandler(fail).recorderStudentLogin(d.payload.studentId,d.payload.pin);' +
    'else fail({message:"Unsupported action"});});' +
    'window.parent.postMessage({kind:"recorder-ready"},origin);})();' +
    '</scr'+'ipt></body></html>';
  return html;
}
function recorderDirectory(){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var a=ss.getSheetByName('학생명단'),b=ss.getSheetByName('연습곡목록');
  if(!a||!b)throw Error('학생명단 또는 연습곡목록 시트가 없습니다.');
  var students=a.getLastRow()<2?[]:a.getRange(2,1,a.getLastRow()-1,5).getDisplayValues().filter(function(r){return r[0]&&r[3];}).map(function(r){return {id:r[0],className:r[1],number:Number(String(r[2]).replace(/[^0-9]/g,'')),name:r[3]};});
  var songs=b.getLastRow()<2?[]:b.getRange(2,1,b.getLastRow()-1,7).getDisplayValues().filter(function(r){return r[0]&&r[1]&&!/^(미사용|아니오|false|n|0)$/i.test(String(r[6]).trim());}).map(function(r,i){return {id:r[0],title:r[1],stage:r[2]||'연습하기',stages:[r[2],r[3],r[4],r[5]],order:i+1};});
  return {students:students,songs:songs};
}
function recorderStudentLogin(studentId,pin){
  if(!studentId||!pin||String(pin)==='0000')throw Error('올바른 개인 확인번호를 입력해주세요.');
  var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('학생명단');
  if(!sheet||sheet.getLastRow()<2)throw Error('학생명단이 없습니다.');
  var rows=sheet.getRange(2,1,sheet.getLastRow()-1,5).getDisplayValues();
  var match=rows.find(function(r){return String(r[0]).trim()===String(studentId).trim()&&String(r[4]).trim()===String(pin).trim();});
  if(!match)throw Error('학생 정보 또는 확인 PIN이 일치하지 않습니다.');
  var records=[],rs=ss.getSheetByName('연습기록');
  if(rs&&rs.getLastRow()>1){
    var all=rs.getRange(2,1,rs.getLastRow()-1,10).getDisplayValues();
    var sameNameCount=rows.filter(function(r){return r[3]===match[3];}).length;
    all.forEach(function(r,i){
      var modern=/^rec-/.test(r[0]);
      if(modern?String(r[2])!==String(studentId):!(sameNameCount===1&&r[1]===match[3]))return;
      var date=modern?r[1]:r[0];
      records.push({id:modern?r[0]:'legacy-row-'+(i+2),createdAt:date,dateOnly:String(date).slice(0,10),studentId:studentId,songTitle:modern?r[3]:r[2],focusArea:modern?r[4]:r[3],count:Number(String(modern?r[5]:r[4]).replace(/[^0-9]/g,''))||0,selfEval:modern?r[6]:r[5],comment:modern?r[7]:r[6],teacherFeedback:modern?r[8]:'',feedbackConfirmed:modern?r[9]==='확인완료':false});
    });
  }
  return {student:{id:match[0],className:match[1],number:Number(String(match[2]).replace(/[^0-9]/g,'')),name:match[3]},records:records};
}
