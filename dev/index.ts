class NatureRemoApi {
  private BASE_URL = 'https://api.nature.global';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  getNewestEvents(deviceId: string): NatureRemoGlobal.NewestEvents {
    const url = this.BASE_URL + '/1/devices';
    const options = {
      headers: {Authorization: 'Bearer ' + this.accessToken},
      followRedirects: false,
    };
    const response = UrlFetchApp.fetch(url, options);
    const text = response.getContentText('utf-8');
    const devices = JSON.parse(text) as [NatureRemoGlobal.Device];
    for (let device of devices) {
      if (device.id === deviceId) {
        return device.newest_events;
      }
    }
  }
}

class NatureRemoEventsSpreadsheet {
  private spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

  constructor() {
    this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  appendUniqueEvents(events: NatureRemoGlobal.NewestEvents) {
    this.appendUniqueEvent('te', events.te);
    this.appendUniqueEvent('hu', events.hu);
    this.appendUniqueEvent('il', events.il);
  }

  getDataAsJson(sheetName: string): string {
    const sheet = this.spreadsheet.getSheetByName(sheetName);
    const values = sheet.getDataRange().getValues() as [[string, number]];
    const cleanValues = values.map(row => [new Date(row[0]).getTime(), row[1]]);
    return JSON.stringify(cleanValues);
  }

  private appendUniqueEvent(sheetName: string, event: NatureRemoGlobal.Event) {
    const sheet = this.spreadsheet.getSheetByName(sheetName);
    const lastRow = sheet.getLastRow();
    if (lastRow > 0) {
      const lastEventCreatedAt = sheet.getRange(lastRow, 1).getValue() as string;
      const lastEventValue = sheet.getRange(lastRow, 2).getValue() as number;
      if (event.created_at == lastEventCreatedAt && event.val == lastEventValue) {
        return;
      }
    }
    sheet.appendRow([event.created_at, event.val]);
  }
}
global.NatureRemoEventsSpreadsheet = NatureRemoEventsSpreadsheet;

class LogSpreadsheet {
  private spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

  constructor() {
    this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  debug(obj: any) {
    const sheet = this.spreadsheet.getSheetByName('log');
    sheet.appendRow([new Date().toISOString(), JSON.stringify(obj)]);
  }

  error(obj: any) {
    const sheet = this.spreadsheet.getSheetByName('error');
    sheet.appendRow([new Date().toISOString(), JSON.stringify(obj)]);
  }
}

class Slack {
  private webhookUrl: string

  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  send(text: string) {
    const options = {
      method: 'post' as 'post',
      contentType: 'application/json',
      payload: JSON.stringify({text: text})
    };
    const response = UrlFetchApp.fetch(this.webhookUrl, options);
  }
}

function sendErrorToSlack(e: any, tag: string) {
  let text = `An error occurred on [${tag}]: `;
  if (typeof e === 'string' || e instanceof String) {
    text += e;
  } else if (e instanceof Error) {
    text += e.message;
  } else {
    text += JSON.stringify(e);
  }
  const slack = new Slack(process.env.SLACK_WEBHOOK_URL);
  slack.send(text);
}

function doGet(event: any): GoogleAppsScript.HTML.HtmlOutput | GoogleAppsScript.Content.TextOutput {
  const log = new LogSpreadsheet();
  log.debug(event);
  try {
    if (event.parameter.token != process.env.TOKEN) {
      throw new Error('invalid token');
    }
    const template = HtmlService.createTemplateFromFile('charts.html');
    return template.evaluate()
      .setTitle('NatureRemoEvents')
      .setFaviconUrl('https://drive.google.com/uc?id=11XzAOuFnIxeoGJ7Z6vmOB3oLciyySawv&.ico')
      .addMetaTag('viewport', 'width=device-width,initial-scale=1');
  } catch (e) {
    log.error(e);
    sendErrorToSlack(e, 'doGet');
    const responseText = JSON.stringify({success: false, error: e.message});
    return ContentService.createTextOutput(responseText).setMimeType(ContentService.MimeType.JSON);
  }
}
global.doGet = doGet;

function doPost(event: any): GoogleAppsScript.Content.TextOutput {
  const log = new LogSpreadsheet();
  log.debug(event);
  try {
    if (event.parameter.token != process.env.TOKEN) {
      throw new Error('invalid token');
    }
    const api = new NatureRemoApi(process.env.REMO_ACCESS_TOKEN);
    const newestEvents = api.getNewestEvents(process.env.DEVICE_ID);
    const remoSpreadsheet = new NatureRemoEventsSpreadsheet();
    remoSpreadsheet.appendUniqueEvents(newestEvents);
    const responseText = JSON.stringify({success: true});
    return ContentService.createTextOutput(responseText).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    log.error(e);
    sendErrorToSlack(e, 'doPost');
    const responseText = JSON.stringify({success: false, error: e.message});
    return ContentService.createTextOutput(responseText).setMimeType(ContentService.MimeType.JSON);
  }
}
global.doPost = doPost;
