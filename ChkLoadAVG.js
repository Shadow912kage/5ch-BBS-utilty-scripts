//  ChkLoadAVG.js - Check Load average of 5ch server ver.0.1
//    Usage: ChkLoadAVG.js <server name>
//
//  On the JaneXeno
//    Commnad name: <command name>
//      Show load averages text for specified server
//        Command: wscript "$BASEPATHScript/ChkLoadAVG.js" $HOST
//      SUZUME modoki, Show load averages text and graph for all servers
//        Command: wscript "$BASEPATHScript/ChkLoadAVG.js"

//  Version history
//    0.1: Initial release

//  5ch bbsmenu(.json)
//    https://menu.5ch.net/bbsmenu.json
//      "url":"https://<server name>/<board name>/"
//  5ch Load Average files
//    https://<server name>/_service/graph_load.png
//    https://<server name>/_service/la.txt
//view-source:https://web.archive.org/web/20230713114335/https://stat.5ch.net/graphs.html

var ChkLoadAVG = {
  Version: "0.1",

  // Configuration variables and their values.
  ResultGraphsFile: "suzume\\graphs.html",
  TemplateGraphsFile: "suzume\\graphsTemplate.html",

  BbsMenuJsonUrl: "https://menu.5ch.net/bbsmenu.json",

  // Variables in the program and their values.
  preMarker: "<!-- DO NOT DELETE AND EDIT THIS COMMENT LINE\r?\n     ",
  markerTbl: ["HEADER", "DOMAIN", "CONTENTS", "HORIZONTAL RULE", "FOOTER"],
  postMarker: " -->\r?\n",
  blockStr: "((?:.+\r?\n)+?)",
  endOfFile: "(.+)?$",
  gVarStrTbl: ["%SCRNAME%", "%VERSION%", "%DATETIME%", "%LDATETIME%"],
  dVarStrTbl: ["%DOMAIN%"],
  cVarStrTbl: ["%HOST%", "%FQDN%", "%LATEXT%"],
  replaceTbl: [[this.gVarStrTbl],                  // HEADER
               [this.gVarStrTbl, this.dVarStrTbl], // DOMAIN
               [this.gVarStrTbl, this.cVarStrTbl], // CONTENTS
               [this.gVarStrTbl],                  // HORIZONTAL RULE
               [this.gVarStrTbl]],                 // FOOTER
      
  // Global function.
  CheckLA: function() {
    this.init();
    if (this.chkSeverName()) {
      this.getLoadAVG(this.ServerName);
      if (!(this.laText && this.dispLoadAVG()))
        return;
    }
    this.getBBSMenuJson();
    this.showGraphsHtml();
  },

  // Private functions.
  init: function() {
    this.WinTitle = "Load Averages (" + WScript.ScriptName + " ver." +
      this.Version + ")";
    this.getWindowsVersion();
    this.UserAgent = "Monazilla/1.00 ChkLoadAVG.Js/" + this.Version +
      " Windows/" + this.winVersion;
    this.Shell = new ActiveXObject("WScript.Shell");
    this.scrFolder = WScript.ScriptFullName.substring(0,
      WScript.ScriptFullName.lastIndexOf("\\") + 1);
    this.ResultGraphsFile = this.scrFolder + this.ResultGraphsFile;
    this.TemplateGraphsFile = this.scrFolder + this.TemplateGraphsFile;
    this.errMsg = "";
    this.setupHttpReq();

    this.serverList5ch = [];
    this.serverListPnk = [];
    this.graphArray = [{domain: "5ch.net", serverList: this.serverList5ch},
                       {domain: "bbspink.com", serverList: this.serverListPnk}];
  },
  // ref. windows - Find OS Name/Version using JScript - Stack Overflow
  //      https://stackoverflow.com/questions/351282/find-os-name-version-using-jscript
  getWindowsVersion: function() {
    var objWMISrvc = GetObject("winmgmts:\\\\.\\root\\CIMV2");
    var enumItems = new Enumerator(
      objWMISrvc.ExecQuery("Select * From Win32_OperatingSystem"));
    var sys = enumItems.item();
    this.winVersion = sys.Version;
  },
  setupHttpReq: function() {
    // ref. XMLHttpRequest を作成する (mixi 日記アーカイブ)
    //      https://loafer.jp/mixi/diary/class.xsp?2006-07-20-22-26
    var httpProgIdWinHttpTbl = [
    {ProgID: "WinHttp.WinHttpRequest.5.1", WinHttp: true}, // XP, 2K Pro SP3, Server 2003, 2K server SP3 or later
    {ProgID: "Msxml2.ServerXMLHTTP.6.0", WinHttp: true},   // unknown
    {ProgID: "Msxml2.ServerXMLHTTP.3.0",WinHttp: true},    // unknown
    {ProgID: "Msxml2.XMLHTTP.6.0", WinHttp: false},        // unknown
    {ProgID: "Msxml2.XMLHTTP.3.0", WinHttp: false}         // unknown
    ];
    for (i = 0; i < httpProgIdWinHttpTbl.length; i++) {
      try {
        this.httpReq = new ActiveXObject(httpProgIdWinHttpTbl[i].ProgID);
        this.useWinHttp = httpProgIdWinHttpTbl[i].WinHttp;
        break;
      } catch (e) {
        if (httpProgIdWinHttpTbl.length == i + 1)
          throw e;
      }
    }
    var TIME_OUT = 3000; // 3000 msec
    if (this.useWinHttp) {
      this.httpReq.setTimeouts(TIME_OUT, TIME_OUT, TIME_OUT, TIME_OUT);
    } else {
      this.httpReq.timeout = TIME_OUT;
      this.httpReq.ontimeout = function() {
        this.errMsg = "サーバーからの応答がありません";
        this.dispErr();
      }
    }
  },
  httpReqOnError: function(e, msg) {
    // ref. スクリプトを使用したデータの取得 - Win32 apps | Microsoft Learn
    // https://learn.microsoft.com/ja-jp/windows/win32/winhttp/retrieving-data-using-script
    // エラー メッセージ (Winhttp.h) - Win32 apps | Microsoft Learn
    // https://learn.microsoft.com/ja-jp/windows/win32/winhttp/error-messages
    // COM エラー コードの構造 - Win32 apps | Microsoft Learn
    // https://learn.microsoft.com/ja-jp/windows/win32/com/structure-of-com-error-codes
    this.errMsg = msg + "\n";
    this.errMsg += e + "\n";
    this.errMsg +=
      "WinHTTP returned error: " + (e.number & 0xffff).toString() + "\n\n";
    this.errMsg += e.description;
    this.dispErr();
  },
  httpReqWaitForResponse: function() {
    if (this.useWinHttp) {
      if (!this.httpReq.WaitForResponse()) {
        this.errMsg = "サーバーからの応答がありません";
        this.dispErr();
      }
    } else {
      while (this.httpReq.readyState < 4) {}
    }
  },
  // Check whether the server is 5ch.net or bbspink.com
  chkSeverName: function () {
    if (!this.ServerName)
      return false;
    var urls =
      this.ServerName.match(/[-0-9A-Za-z]+\.(?:5ch\.net|bbspink\.com)/);
    if (!urls) {
      this.errMsg = "5ちゃんねる/BBSPINK の掲示板ではありません";
      this.dispErr();
    }
    return true;
  },
  // Get Load average text file(la.txt)
  getLoadAVG: function(serverName) {
    var LAtextRslt = "";
    try {
      var LAtextUrl = "https://" + serverName + "/_service/la.txt";
      this.httpReq.open("GET", LAtextUrl, true);
      this.httpReq.setRequestHeader("User-Agent", this.UserAgent);
      // 128 + 64 = 192 bytes
      this.httpReq.setRequestHeader("Range", "bytes=0-191");
      this.httpReq.send();
    } catch (e) {
       this.httpReqOnError(e, this.LAtextUrl + "を取得できませんでした");
    }
    this.httpReqWaitForResponse();

    var laLatest = this.httpReq.responseText.match(/^(.+)\r?\n/);
    if (laLatest[0]) {
      this.laText = laLatest[1].replace(/\s+/g, " ");
      var lamatch = this.laText.match(/^(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\s+(\d{10})\s+(\d{1,2}:\d{2}(?:AM|PM))\s+(up\s+\d+\s+days?,\s+\d+(?::\d{2}|\s+(?:hrs?|mins?)),\s+\d+\s+users?,)\s+(load averages:\s+\d+\.\d{2},\s+\d+\.\d{2},\s+\d+\.\d{2})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+)\s+(\d+)\s+(\d+)/);
      if (lamatch) {
        this.latestLaTxt = lamatch[0];
        this.graphLaTxt = lamatch[1] + " " + lamatch[3] + " " + lamatch[4] +
          " " + lamatch[5];
        this.bStatTxt = "Call: " + lamatch[6] + "\nPost: " + lamatch[7] +
          "\nTotal: " + lamatch[8];
        this.prcsTxt = "httpd: " + lamatch[10] + "\nnginx: " + lamatch[11];
        this.unixTimeTxt = lamatch[2];
        this.unknwnPrmsTxt = lamatch[9];
      }
    }
  },
  // Display Load averages text
  dispLoadAVG: function() {
    var sLine = "-----------------------------------------------------------------------------------------\n"
    var dLine = "=============================================\n";
    if (this.latestLaTxt) {
      var laResults = "Server Name： " + this.ServerName + "\n";
      laResults += dLine;
      laResults += "Latest line of la.txt:\n" + this.latestLaTxt + "\n";
      laResults += sLine;
      laResults += "Time stamp, uptime, load averages\n" +
        this.graphLaTxt + "\n\n";
      laResults += "BBSstat\n" + this.bStatTxt + "\n\n";
      laResults += "Processes\n" + this.prcsTxt + "\n";
      laResults += sLine;
      laResults += "Time stamp (unix time): " + this.unixTimeTxt + "\n";
      laResults += "Unknow params: " + this.unknwnPrmsTxt + "\n";
      laResults += dLine + "\n";
      laResults +=
        "                                                            ";
      laResults += "雀のお宿 (graphs.html) を表示しますか？";
      if (this.Shell.Popup(laResults, 0, this.WinTitle, 4) == 6)
        return true;
      else
        return false;
    }
    else {
      var msg = "***** ERROR: la.txt was unmatched with the regex! *****\n\n";
      this.Shell.Popup(msg + this.laText, 0, this.WinTitle);
      return false;
    }
/* ===============================================
   la.txt/graph_load.png contents and descriptions
   -----------------------------------------------
la.txt:
2025/08/24 16:44:00	1756021440	 4:44PM  up 8 days, 15:19, 1 user, load averages: 0.24, 0.36, 0.31	0	0	1056	2185	0	0	1015573	1425	0	4765632	0	4	17			
 2025/08/24 16:44:00	1756021440	 4:44PM  up 8 days, 15:19, 1 user,
  current time of server YYYY/MM/DD HH:MM:SS unixtime HH:MM(AM/PM)
  uptime days and Time
  number of login user(s)
 load averages: 0.24, 0.36, 0.31
  1 min, 5 min, 15 min
 BBS stat Call, Post, Total:	0	0	1056
 (Uknown.. )	2185	0	0	1015573	1425	0	4765632	0
 Processes httpd, nginx:	4	17			

graph_load.png:
 mount size used avil capacity
 / 238G 36G 183G 16%
 /md 2.5G 58G 6.8G 1%
 netstat
 incoming: 0.135 MBPS
 outgoing: 0.635 MBPS
 ============================================== */
  },
  // Get bbsmenu.json
  getBBSMenuJson: function() {
    try {
      this.httpReq.open("GET", this.BbsMenuJsonUrl, true);
      this.httpReq.setRequestHeader("User-Agent", this.UserAgent);
      this.httpReq.send();
    } catch (e) {
      this.httpReqOnError(e, this.BbsMenuJsonUrl + "を取得できませんでした");
    }
    this.httpReqWaitForResponse();

    // Convert encoding with ADODB.Stream w/o file I/O
    var strm = new ActiveXObject("ADODB.Stream");
    strm.Type = 1; // adTypeBinary
    strm.Open();
    strm.Write(this.httpReq.ResponseBody);
    strm.Position = 0; // Reset position
    strm.Type = 2; // adTypeText
    strm.Charset = "UTF-8"; // UTF-8 BOM
    this.BbsMenuJson = strm.ReadText();
    strm.Close();
  },
  // Create ’graphs.html' and show it in the web browser.
  showGraphsHtml: function() {
    // Create an array of domains and servers from the bbsmenu.json.
    var regex5ch =
      /"url"\s*:\s*"https:\/\/([-A-Za-z0-9]+)\.5ch\.net\/[-A-Za-z0-9]+\/"/g;
    var excpt5ch = /(headline|info)/;
    var regexPnk =
      /"url"\s*:\s*"https:\/\/([-A-Za-z0-9]+)\.bbspink\.com\/[-A-Za-z0-9]+\/"/g;
    var matched;
    var srv5ch = [];
    var srvPnk = [];
    while (matched = regex5ch.exec(this.BbsMenuJson)) {
      if (matched[1].match(excpt5ch))
        continue;
      srv5ch[matched[1]] = true;
    }
    while (matched = regexPnk.exec(this.BbsMenuJson))
      srvPnk[matched[1]] = true;

    var i = 0;
    for (var prop in srv5ch)
      this.serverList5ch[i++] = prop;
    this.serverList5ch.sort();
    i = 0;
    for (var prop in srvPnk)
      this.serverListPnk[i++] = prop;
    this.serverListPnk.sort();

    // Load the template file and process it.
    var tmpltHtmlStr = this.loadFile(this.TemplateGraphsFile, "UTF-8");
    var tmpltStr = "";
    for (i = 0; i < this.markerTbl.length; i++)
      tmpltStr += this.preMarker + this.markerTbl[i] + this.postMarker +
                  this.blockStr;
    tmpltStr += this.endOfFile;
    var tmpltBlks = new RegExp(tmpltStr);
    var matchBlk = tmpltHtmlStr.match(tmpltBlks);
    if (!matchBlk)
      return;

    // The last line w/o a carriage return is joined to the previous line.
    if (this.markerTbl.length + 2 == matchBlk.length) {
      matchBlk[this.markerTbl.length] += matchBlk[matchBlk.length - 1];
      matchBlk.length--;
    }
    var tmpltStrTbl = [];
    for (i = 0; i < matchBlk.length - 1; i++) {
      tmpltStrTbl[i] = {Name: this.markerTbl[i],
        RepalceTbl: this.replaceTbl[i], Str: matchBlk[i + 1]};
    }

    // Replace global variables in template blocks, '%SCRNAME%', '%VERSION%',
    // '%DATETIME%', and '%LDATETIME%'.
    var dVarRegex = [];
    for (i = 0; i < this.dVarStrTbl.length; i++)
      dVarRegex[i] = new RegExp(this.dVarStrTbl[i], "g");
    var cVarRegex = [];
    for (i = 0; i < this.cVarStrTbl.length; i++)
      cVarRegex[i] = new RegExp(this.cVarStrTbl[i], "g");

    var rplcStr = [];
    var date = new Date();
    for (i = 0; i < this.gVarStrTbl.length; i++) {
      switch (this.gVarStrTbl[i]) {
        case "%SCRNAME%":
          rplcStr[i] = WScript.ScriptName;
          break;
        case "%VERSION%":
          rplcStr[i] = this.Version;
          break;
        case "%DATETIME%":
          rplcStr[i] = date.toString();
          break;
        case "%LDATETIME%":
          rplcStr[i] = date.toLocaleString();
          break;
        default:
          rplcStr[i] = "**** REPLACE ERROR *****"
      }
      this.gVarStrTbl[i] = new RegExp(this.gVarStrTbl[i], "g");
    }
    for (i = 0; i < tmpltStrTbl.length; i++)
      for (var j = 0; j < this.gVarStrTbl.length; j++)
        tmpltStrTbl[i].Str =
          tmpltStrTbl[i].Str.replace(this.gVarStrTbl[j], rplcStr[j]);

    // Replace domain and content variables in template blocks,
    // '%DOMAIN%', '%HOST%', '%FQDN%', and '%LATEXT%'.
    for (i = 0; i < tmpltStrTbl.length; i++) {
      switch (tmpltStrTbl[i].Name) {
        case "HEADER":
          var hdBlkStr = tmpltStrTbl[i].Str;
          break;
        case "HORIZONTAL RULE":
          var hrBlkStr = tmpltStrTbl[i].Str;
          break;
        case "FOOTER":
          var ftBlkStr = tmpltStrTbl[i].Str;
      }
    }
    var mainBlkStr = "";
    for (i = 0; i < this.graphArray.length; i++) {
    // replace dVarStrTbl
      for (k = 0; k < tmpltStrTbl.length; k++) { // WASTE maybe...
        switch (tmpltStrTbl[k].Name) {
          case "DOMAIN":
            var dmBlkStr = tmpltStrTbl[k].Str;
            break;
        }
      }
      for (j = 0; j < this.dVarStrTbl.length; j++) { // WASTE maybe...
        switch (this.dVarStrTbl[j]) {
          case "%DOMAIN%":
            dmBlkStr = dmBlkStr.replace(dVarRegex[j],
                                                this.graphArray[i].domain);
        }
      }
      mainBlkStr += dmBlkStr;
      for (j = 0; j < this.graphArray[i].serverList.length; j++) {
        for (k = 0; k < tmpltStrTbl.length; k++) { // WASTE maybe...
          switch (tmpltStrTbl[k].Name) {
            case "CONTENTS":
              var ctBlkStr = tmpltStrTbl[k].Str;
          }
        }
        // replace cVarStrTbl
        for (var k = 0; k < this.cVarStrTbl.length; k++) { // WASTE maybe...
          switch (this.cVarStrTbl[k]) {
            case "%HOST%":
              ctBlkStr =
              ctBlkStr.replace(cVarRegex[k], this.graphArray[i].serverList[j]);
              break;
            case "%FQDN%":
              ctBlkStr =
              ctBlkStr.replace(cVarRegex[k], this.graphArray[i].serverList[j]
                              + "." + this.graphArray[i].domain);
              break;
            case "%LATEXT%":
              this.getLoadAVG(this.graphArray[i].serverList[j] + "." +
                this.graphArray[i].domain);
              ctBlkStr = ctBlkStr.replace(cVarRegex[k], this.graphLaTxt);
          }
        }
        mainBlkStr += ctBlkStr;
      }
      mainBlkStr += hrBlkStr;
    }
    var rsltHtmlStr = hdBlkStr + mainBlkStr + ftBlkStr;
    this.saveFile(this.ResultGraphsFile, "UTF-8", rsltHtmlStr);
    this.Shell.Run(this.ResultGraphsFile);
  },
  loadFile: function(fileName, encoding) {
    var retStr = "";
    var fs = WScript.CreateObject("Scripting.FileSystemObject");
    if (fs.FileExists(fileName)) {
      var strm = new ActiveXObject("ADODB.Stream");
      strm.Type = 2; // adTypeText
      strm.Charset = encoding;
      strm.Open();
      strm.LoadFromFile(fileName);
      retStr = strm.ReadText();
      strm.Close();
    }
    return retStr;
  },
  saveFile: function(fileName, encoding, strBuf) {
    var strm = new ActiveXObject("ADODB.Stream");
    strm.Type = 2; // adTypeText
    strm.Charset = encoding;
    strm.Open();
    strm.WriteText(strBuf);
    // ref.: VBAでBOM無しのUTF-8ファイルを作成する #Excel - Qiita 
    //     : https://qiita.com/sozaiya/items/70fe510ec2a82f2d77af
    if (encoding.match(/UTF-8/i)) {
      var strm2 = new ActiveXObject("ADODB.Stream");
      strm2.Type = 1; // adTypeBinary
      strm2.Open();
      strm.Position = 3; // skip UTF-8's BOM (0xEF 0xBB 0xBF)
      strm.CopyTo(strm2);
      strm2.SaveToFile(fileName, 2); // over write
      strm2.Close();
    } else {
      strm.SaveToFile(fileName, 2); // over write
    }
    strm.Close();
  },
/* ===============================================
// Those functions DO NOT work as expected... orz
  // Shell.Popup window width is 61 characters in ASCII
  // and 33 characters in multi-bytes (character width retio: 1.84...).
  popupWidth: 61,
  getStrWidth: function(str) {
    var width = 0;
    for (var i = 0; i  < str.length; i++) {
      if (str.charCodeAt(i) < 0x7f)
        width++;
      else
        width += 1.85; // 61/33 = 1.848484...
    }
    return width;
  },
  getMarginWidth: function(str) {
    var strWidth = this.getStrWidth(srt);
    if (strWidth > this.popupWidth)
      return 0;
    else
      return (this.popupWidth - strWidth);
  },
  getHrString: function(str) {
    var width = this.getStrWidth(str);
    var hr = "";
    for (var hrWidth = 0; hrWidth < this.popupWidth; hrWidth += width)
      hr += str;
    return hr;
  },
  getMrgnString: function(str, mrgnStr) {
    var width = this.getMarginWidth(str);
    var mrgnStrWidth = this.getStrWidth(mrgnStr);
    for (var mrgn = ""; width > 0; width -= mrgnStrWidth)
      mrgn += mrgnStr;
    return mrgn;
  },
=============================================== */  
  // Display error message & quit process
  dispErr: function() {
    this.Shell.Popup(this.errMsg, 0, this.WinTitle);
    WScript.Quit();
  }
};
/*
// Popup nType arguments and return value
// Button
CONST vbOKOnly =           0; // [OK]
CONST vbOKCancel =         1; // [OK], [Cancel]
CONST vbAbortRetryIgnore = 2; // [Abort], [Retry], [Ignore]
CONST vbYesNoCancel =      3; // [Yes], [No], [Cancel]
CONST vbYesNo =            4; // [Yes], [No]
CONST vbRetryCancel =      5;	// [Retry], [Cancel]
// Icon
CONST vbCritical =    16;	// Warnning
CONST vbQuestion =  	32;	// Question
CONST vbExclamation = 48; // Exclamation
CONST vbInfomation =  64; // Information
// Default button
CONST vbDefaultButton1 =   0; // 1st button from the left
CONST vbDefaultButton2 = 256; // 2nd button from the left
CONST vbDefaultButton3 = 512; // 3rd button from the left
CONST vbDefaultButton4 = 768; // 4th button from the left
// Return value
CONST vbOK =       1;	// [OK]
CONST vbCancel =   2;	// [Cancel]
CONST vbAbort =    3;	// [Abort]
CONST vbRetry =    4;	// [Retry]
CONST vbIgnore =   5;	// [Ignore]
CONST vbYes =      6;	// [Yes]
CONST vbNo =       7;	// [No]
CONST vbTimeOut = -1; // Time out
*/

var args = WScript.Arguments;
/*
if (args.length < 1) { // Arguments check
  var thisname = WScript.ScriptName;
  var message = "引数の数が足りません！\n\n使用法：\n " + thisname +
    " サーバー名\n\nJaneXeno のコマンド設定例：\n" +
    "　(コマンド名の任意の文字列)\n wscript \"$BASEPATHScript/" + thisname + "\" $HOST";
  WScript.Echo(message);
  WScript.Quit();
}
*/
if (args.length > 0)
  ChkLoadAVG.ServerName = args(0);
ChkLoadAVG.CheckLA();