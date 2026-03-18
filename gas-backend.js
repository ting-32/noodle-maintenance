const FOLDER_NAME = "MaintenanceApp_Photos";

/**
 * 初始化試算表：建立所需的工作表與標題列
 * 第一次使用前請手動執行此函式一次
 */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 建立 Logs 表格
  var logsSheet = ss.getSheetByName('Logs');
  if (!logsSheet) {
    logsSheet = ss.insertSheet('Logs');
    logsSheet.appendRow(['ID', '設備名稱', '類別', '廠商', '電話', '維修項目', '金額', '耗時(分)', '備註', '維修前照片URL', '維修後照片URL', '日期']);
  }

  // 建立 Equipments 表格
  var eqSheet = ss.getSheetByName('Equipments');
  if (!eqSheet) {
    eqSheet = ss.insertSheet('Equipments');
    eqSheet.appendRow(['ID', '名稱', '關聯項目']);
  }

  // 建立 ServiceItems 表格
  var itemsSheet = ss.getSheetByName('ServiceItems');
  if (!itemsSheet) {
    itemsSheet = ss.insertSheet('ServiceItems');
    itemsSheet.appendRow(['ID', '名稱', '類別']);
  }

  // 建立 類別 表格
  var catSheet = ss.getSheetByName('類別');
  if (!catSheet) {
    catSheet = ss.insertSheet('類別');
    catSheet.appendRow(['ID', '名稱', '顏色']);
    // 預設寫入三個基本類別
    catSheet.appendRow([Utilities.getUuid(), '定期維護', '']);
    catSheet.appendRow([Utilities.getUuid(), '設備維修', '']);
    catSheet.appendRow([Utilities.getUuid(), '更新配件', '']);
  }
}

/**
 * 處理 GET 請求
 * 參數範例: ?action=getEquipments
 */
function doGet(e) {
  var action = e.parameter.action;
  
  if (action === 'getInitialData') {
    var result = {
      equipment: getData('Equipments'),
      items: getData('ServiceItems'),
      history: getData('Logs'),
      categories: getData('類別')
    };
    // 必須長這樣，前端的 res.json() 才看得懂
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'getEquipments') {
    return jsonResponse(getData('Equipments'));
  } else if (action === 'getItems') {
    return jsonResponse(getData('ServiceItems'));
  } else if (action === 'getLogs') {
    return jsonResponse(getData('Logs'));
  } else if (action === 'getCategories') {
    return jsonResponse(getData('類別'));
  }
  
  return jsonResponse({ error: 'Invalid action parameter' });
}

/**
 * 處理 POST 請求
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    // 功能 A: 儲存維修紀錄與照片
    if (action === 'addLog') {
      return jsonResponse(addLog(data.payload));
    }
    if (action === 'updateLogPhoto') {
      return jsonResponse(updateLogPhoto(data.payload));
    }
    
    // 功能 B: CRUD 管理 (設備)
    if (action === 'addEquipment') {
      var itemIdsStr = (data.payload.itemIds || []).join(',');
      return jsonResponse(addRow('Equipments', data.payload.name, itemIdsStr));
    }
    if (action === 'editEquipment') {
      var itemIdsStr = (data.payload.itemIds || []).join(',');
      return jsonResponse(editRow('Equipments', data.payload.id, data.payload.name, itemIdsStr));
    }
    if (action === 'deleteEquipment') return jsonResponse(deleteRow('Equipments', data.payload.id));

    // 功能 B: CRUD 管理 (項目)
    if (action === 'addItem') return jsonResponse(addRow('ServiceItems', data.payload.name, data.payload.category));
    if (action === 'editItem') return jsonResponse(editRow('ServiceItems', data.payload.id, data.payload.name, data.payload.category));
    if (action === 'deleteItem') return jsonResponse(deleteRow('ServiceItems', data.payload.id));

    // 功能 B: CRUD 管理 (類別)
    if (action === 'addCategory') return jsonResponse(addRow('類別', data.payload.name, data.payload.color));
    if (action === 'editCategory') return jsonResponse(editRow('類別', data.payload.id, data.payload.name, data.payload.color));
    if (action === 'deleteCategory') return jsonResponse(deleteRow('類別', data.payload.id));

    return jsonResponse({ error: 'Invalid action' });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

/**
 * 新增維修紀錄
 */
function addLog(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Logs');
  
  var id = Utilities.getUuid();
  var date = new Date().toISOString();
  
  var beforeUrl = "";
  var afterUrl = "";

  // 處理維修前照片
  if (payload.beforePhotoBase64) {
    beforeUrl = saveImageToDrive(payload.beforePhotoBase64, "before_" + id);
  }
  
  // 處理維修後照片
  if (payload.afterPhotoBase64) {
    afterUrl = saveImageToDrive(payload.afterPhotoBase64, "after_" + id);
  }

  // 欄位：ID, 設備名稱, 類別, 廠商, 電話, 維修項目, 金額, 耗時(分), 備註, 維修前照片URL, 維修後照片URL, 日期
  var rowData = [
    id,
    payload.equipmentName || '',
    payload.category || '',
    payload.vendorName || '',
    payload.vendorPhone || '',
    payload.itemName || '',
    payload.cost || 0,
    payload.timeSpent || 0,
    payload.notes || '',
    beforeUrl,
    afterUrl,
    date
  ];
  
  sheet.appendRow(rowData);
  return { success: true, id: id, beforeUrl: beforeUrl, afterUrl: afterUrl };
}

/**
 * 儲存 Base64 圖片至 Google Drive
 */
function saveImageToDrive(base64String, filename) {
  // 取得或建立資料夾
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  var folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(FOLDER_NAME);
  }

  // 解析 Base64 字串 (移除 data:image/jpeg;base64, 前綴)
  var splitBase64 = base64String.split(',');
  var contentType = 'image/jpeg';
  var base64Data = base64String;
  
  if (splitBase64.length > 1) {
    var match = splitBase64[0].match(/:(.*?);/);
    if (match) contentType = match[1];
    base64Data = splitBase64[1];
  }

  var decodedData = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decodedData, contentType, filename + (contentType === 'image/png' ? '.png' : '.jpg'));
  
  var file = folder.createFile(blob);
  
  // 設定權限為『知道連結的人可查看』
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // 回傳可直接顯示的 URL
  return "https://drive.google.com/uc?export=view&id=" + file.getId();
}

/**
 * 取得指定表格的所有資料 (回傳 JSON Array)
 */
function getData(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  
  return result;
}

/**
 * 新增基礎資料 (設備/項目)
 */
function addRow(sheetName, name, category) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var id = Utilities.getUuid();
  sheet.appendRow([id, name, category || '']);
  return { success: true, id: id, name: name };
}

/**
 * 編輯基礎資料 (設備/項目)
 */
function editRow(sheetName, id, newName, categoryOrItemIds) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 2).setValue(newName);
      if (categoryOrItemIds !== undefined) sheet.getRange(i + 1, 3).setValue(categoryOrItemIds);
      return { success: true };
    }
  }
  return { success: false, error: 'ID not found' };
}

/**
 * 刪除基礎資料 (設備/項目)
 */
function deleteRow(sheetName, id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'ID not found' };
}

/**
 * 封裝 JSON 回應
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 更新單筆紀錄照片
 */
function updateLogPhoto(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Logs');
  var data = sheet.getDataRange().getValues();
  
  var id = payload.id;
  var photoType = payload.photoType; // 'before' or 'after'
  var base64String = payload.base64String;
  
  var url = saveImageToDrive(base64String, photoType + "_" + id + "_" + new Date().getTime());
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (photoType === 'before') {
        sheet.getRange(i + 1, 10).setValue(url); // J欄
      } else if (photoType === 'after') {
        sheet.getRange(i + 1, 11).setValue(url); // K欄
      }
      return { success: true, url: url };
    }
  }
  return { success: false, error: 'ID not found' };
}
