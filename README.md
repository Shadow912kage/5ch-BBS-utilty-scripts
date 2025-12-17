# 5ちゃんねる掲示板用ユーティリティスクリプト
JaneXeno、5ちゃんねる掲示板用の便利な(？)スクリプトです。

## 必死チェッカーもどき(http://hissi.org/) 呼び出しスクリプト hissiChecker.js
JaneXeno のレス番メニューから ID もしくはトリップでの検索を必死チェッカーもどきで行います。結果はWebブラウザにて表示されます。
```
JaneXeno の ツール(O) > 設定(O)... > 機能 > コマンド で以下のように設定
　コマンド名： +必死チェッカー(ID)
　　(先頭に「+」を付けた任意の文字列、レス番メニューのみに表示)
　実行するコマンド： wscript "$BASEPATHScript/hissiChecker.js" "$URL" "$LOCALDAT" $NUMBER ID
　　(2つ目のパラーメータは、JaneXeno をインストールしたフォルダ下の
　　 Script というフォルダに hissiChecker.js というファイル名で置いた場合)
　コマンド名： +必死チェッカー(Trip)
　実行するコマンド： wscript "$BASEPATHScript/hissiChecker.js" "$URL" "$LOCALDAT" $NUMBER Trip
```

## ロードアベレージチェック ChkLoadAVG.js
何とか動作するものができましたが、コードがグダグダなのでブラッシュアップ中です。<br>
サンプルとして出力ダイアログ Sample-ChkAloadAVG.png と雀のお宿 Sample-graphs.html を置いておきます。<hr>
動作にはスクリプト本体 (ChkLoadAVG.js) と雀のお宿 (graphs.html) 生成・表示に suzumeフォルダー下のテンプレートファイル (graphsTemplate.html)、スタイルシート (suzume.css)、ファビコン (suzume.ico) が必要です。<br>
suzumeフォルダーはスクリプト本体と同じフォルダーに置いてください。graphs.html は suzumeフォルダーに生成されます。<br>
※ChkLoadAVG.js ver. 0.1 は雀のお宿表示までに bbsmenu.json のパースと graphs.html の生成にチト時間がかかります(Core i5-7200U 2.5GHz 8 Gbytesで約5秒w)
```
JaneXeno の ツール(O) > 設定(O)... > 機能 > コマンド で以下のように設定
　コマンド名： ロードアベレージ
　　(任意の文字列)
　実行するコマンド： wscript "$BASEPATHScript/ChkLoadAVG.js" $HOST
　　(2つ目のパラーメータは、JaneXeno をインストールしたフォルダ下の
　　 Script というフォルダに ChkLoadAVG.js というファイル名で置いた場合)
　コマンド名： 雀のお宿(graphs.html)
　実行するコマンド： wscript "$BASEPATHScript/ChkLoadAVG.js"
```

## その他
「JaneXeno 用の」と銘打っていますが、Jane系の専用ブラウザなら一応使えるようです。ただし当方では JaneXeno 以外での動作確認はいたしませんし、今後する予定もありませんのであしからず。「こう変更すれば～でも動作します」といったパッチは大歓迎です。

## References:
