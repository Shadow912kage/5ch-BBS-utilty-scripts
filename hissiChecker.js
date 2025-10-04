//  hissi Checker via hissi.org ver.0.1.1
//    Usage: hissiChecker.js <bbs name> <local dat path> <res number> <ID or else>
//
//  On the JaneXeno
//    Commnad name: +<command name>, need "+" on the top of command name
//     Command: wscript "$BASEPATHScript/hissiChecker.js" "$URL" "$LOCALDAT" $NUMBER ID/else

//  Version history
//    0.1.1: Added 'g' flag for regex replacing the URI in the 'Trip' searching
//    0.1: Initial release

/* References
  必死チェッカーもどき
  http://hissi.org/
  Command.dat - JaneXeno @ ウィキ - atwiki（アットウィキ）
  https://w.atwiki.jp/janexeno/pages/79.html
*/

var hissiChecker = {
  Version: "0.1.1",

  // hissi checker's site parameters
  hissiUrlBase: "http://hissi.org/",
  hissiIdSearch1: "read.php/",
  hissiIdSearch2: "/search/",
  hissiTripSearch: "trip_search.php", 

  IdCheck: function() {
    this.initialize();
    this.chkTargetUrl();
    this.getTargetResDate();
    this.createFormAndPost();
    this.sendResult();
  },
  initialize: function() {
    this.WinTitle = "必死チェッカーもどきScript (" + WScript.ScriptName + " ver." + this.Version + ")";
    this.getWindowsVersion();
    this.UserAgent = "Monazilla/1.00 hissiChecker.Js/" + this.Version +
    " Windows/" + this.WinVersion;
    this.setupHttpReq();
    var scrFolder = WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf("\\"));
    this.resultHTML = scrFolder + "//hissiResult.html";
    this.ErrMsg = "";
    this.Shell = WScript.CreateObject("WScript.Shell");
    if (this.IdOrTrip == "ID")
      this.IdOrTrip = true;
    else
      this.IdOrTrip = false;
  },
  // ref. windows - Find OS Name/Version using JScript - Stack Overflow
  //      https://stackoverflow.com/questions/351282/find-os-name-version-using-jscript
  getWindowsVersion: function() {
    var objWMISrvc = GetObject("winmgmts:\\\\.\\root\\CIMV2");
    var enumItems = new Enumerator(objWMISrvc.ExecQuery("Select * From Win32_OperatingSystem"));
    var sys = enumItems.item();
    this.WinVersion = sys.Version;
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
      this.httpReq.SetTimeouts(TIME_OUT, TIME_OUT, TIME_OUT, TIME_OUT);
    } else {
      this.httpReq.timeout = TIME_OUT;
      this.httpReq.ontimeout = function() {
        this.ErrMsg = "サーバーからの応答がありません";
        this.DispErr();
      }
    }
  },
  httpReqOnError: function(e, msg) {
    this.ErrMsg = msg + "\n";
    // ref. スクリプトを使用したデータの取得 - Win32 apps | Microsoft Learn
    // https://learn.microsoft.com/ja-jp/windows/win32/winhttp/retrieving-data-using-script
    this.ErrMsg += e + "\n";
    this.ErrMsg += "WinHTTP returned error: " + (e.number & 0xffff).toString() + "\n\n";
    this.ErrMsg += e.description;
    this.DispErr();
  },
  httpReqWaitForResponse: function() {
    if (this.useWinHttp) {
      if (!this.httpReq.WaitForResponse()) {
        this.ErrMsg = "サーバーからの応答がありません";
        this.DispErr();
      }
    } else {
      while (this.httpReq.ReadyState < 4) {}
    }
  },
  chkTargetUrl: function () {
    var urls = this.ThreadUrl.match(/https:\/\/(([-0-9A-Za-z]+)\.(?:5ch\.net|bbspink\.com))\/test\/read\.cgi\/([-0-9A-Za-z]+)/);
    if (urls) {
      this.folderName = urls[3];
    } else {
      this.ErrMsg = "5ちゃんねる/BBSPINK の掲示板ではありません";
      this.DispErr();
    }
  },
  getTargetResDate: function () {
    var fs = WScript.CreateObject("Scripting.FileSystemObject");
    var dat = fs.OpenTextFile(this.DatPath, 1, 0);
    for (var i = 0; i < this.ResNum; i++)
      var res = dat.ReadLine();
    dat.Close();
    if (this.IdOrTrip) { // ID check
      var dateid = res.match(/<>(?:(\d{4})\/(\d{2})\/(\d{2})\([日月火水木金土]\) \d{2}:\d{2}:\d{2}\.\d{2})(?: (?:(?:ID:([-+/0-9A-Za-z]+))●?)?)?(?: .)?( BE:[^<>]+)?<>/);
      if (dateid) {
        this.targetDate = dateid[1] + dateid[2] + dateid[3];
        this.targetID = dateid[4];
      } else {
        this.ErrMsg = "ID のない板・スレッド・書き込みです";
        this.DispErr();
      }
    } else { // TRIP check
      var tripdate = res.match(/^[^<]*<\/b>◆([^\s]{10,12})\s<b>.*<>[^<]*<>(\d{4})\/(\d{2})\/(\d{2})/);
      if (tripdate) {
        this.targetTrip = tripdate[1];
        this.targetDate = tripdate[2] + tripdate[3] + tripdate[4];
      } else {
        this.ErrMsg = "トリップが付いていない名前です";
        this.DispErr();
      }
    }
  },
  DispErr: function() {
    this.Shell.Popup(this.ErrMsg, 0, this.WinTitle);
    WScript.Quit();
  },
  createFormAndPost: function() { // Create hissi.org form data and POST it.
    var url = "";
    var dat = "";
    if (this.IdOrTrip) {
      url = this.hissiUrlBase + this.hissiIdSearch1 + this.folderName + this.hissiIdSearch2;
      dat = "date=" + this.targetDate + "&ID=" + this.targetID;
    } else {
      url = this.hissiUrlBase + this.hissiTripSearch;
      dat = "date=" + this.targetDate + "&Board=" + this.folderName + "&Trip=" + this.targetTrip;
    }
    try {
      this.httpReq.open("POST", url, true);
      this.httpReq.setRequestHeader("User-Agent", this.UserAgent);
      this.httpReq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      this.httpReq.send(dat);
    } catch (e) {
      this.httpReqOnError(e, url + " からのレスポンスを取得できませんでした");
    }
    this.httpReqWaitForResponse();
/*=============================================================================
 The WinHttp treat strings as Latin-1 for ResponseText in the Content-Type
header w/o charset parameter.
 The ResponseBody is in some mysterious state.
Shift_JIS (the original encoding) encoded with UTF-16LE BOM encoding.
Probably because the HTTP communication is without a "content-type" header,
the sending site sends it in Shift_JIS,
and the receiving local side processes it as is with UTF-16LE BOM.
=============================================================================*/
    // Ref. www2.wbs.ne.jp/~kanegon/doc/code.txt
    // http://www2.wbs.ne.jp/~kanegon/doc/code.txt
    var strm = new ActiveXObject("ADODB.Stream");
    strm.Type = 1; // adTypeBinary
    strm.Open();
    strm.Write(this.httpReq.ResponseBody);
    strm.Position = 2; // Skip BOM(FF FE), top of the ResponseBody(encoded with UTF-16)
    strm.SaveToFile(this.resultHTML, 2); // over write, raw HTTP response
    strm.Type = 2; // adTypeText
    strm.Charset = "shift_jis";
    strm.LoadFromFile(this.resultHTML);
    var tmp = strm.ReadText();
    var resultData = "";
    if (this.IdOrTrip) // Replace hissi Checker's URI string
      resultData = tmp.replace(/\.\.(\/\d{8}\/\w+\.html)/, this.hissiUrlBase + this.hissiIdSearch1 + this.folderName + "$1");
    else
      resultData = tmp.replace(/\.\/(read\.php\/\w+\/\d{8}\/\w+\.html)/g, this.hissiUrlBase + "$1");
    strm.Position = 0; // Reset writing position
    strm.WriteText(resultData);
    strm.SaveToFile(this.resultHTML, 2); // over write, result HTML
    strm.Close();
  },
  sendResult: function() {
    this.Shell.Run(this.resultHTML);
  }
}

var args = WScript.Arguments;
if (args.length < 4) { // Arguments check
  var thisname = WScript.ScriptName;
  var message = "引数の数が足りません！\n\n使用法：\n " + thisname + " 5chのスレッドのURL DATファイル名 レス番号 ID/else\n\nJaneXeno のコマンド設定例：\n" + "　+(コマンド名の任意の文字列)\n wscript \"$BASEPATHScript/" + thisname + "\" \"$URL\" \"$LOCALDAT\" $NUMBER ID/else";
  WScript.Echo(message);
  WScript.Quit();
}
hissiChecker.ThreadUrl = args(0);
hissiChecker.DatPath = args(1);
hissiChecker.ResNum = args(2);
hissiChecker.IdOrTrip = args(3);
hissiChecker.IdCheck();