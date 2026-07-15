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
動作にはスクリプト本体 (ChkLoadAVG.js) と雀のお宿 (graphs.html) 生成・表示に suzumeフォルダー下のテンプレートファイル (graphsTemplate.html)、スタイルシート (suzume.css)、ファビコン (suzume.ico) が必要です。<br>
suzumeフォルダーはスクリプト本体と同じフォルダーに置いてください。graphs.html は suzumeフォルダーに生成されます。<br>
ver.0.2 で作業漏れがあった雀のお宿 (graphs.html) におけるサーバーのステータス表示を追加しました。ただしロードアベレージが高い場合 (現状では5以上) のみの対応です。外部からはサーバーや bbs.cgi の生死状況はわからないため対応しません。<br>
ver.0.2.2 で la.txt を正規表現に漏れがあったので追加。また正規表現でパースしそなった場合にエラーレポートファイルを出力するように変更。<br>
ver.0.2.9 でスクリプト本体およびテンプレートhtmlファイルから固有のドメイン名・URLを排除しました。これらは新たに設けた設定用ファイル 'ChkLoadAVGConfig.txt' から読み込まれます。<br>
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
## 二文字国コード国旗絵文字変換 ReplaceStrCountryFlags.txt
ReplaceStr.txt に追加することで二文字の国コードを国旗の絵文字に置き換えます (※現状では JP, US, FR, DE, IT, GB, ES, RU, CU, and KR の10カ国のみ)。<br>
Noto Color Emojiにはすべての国旗絵文字があるはずなのですが、JP以下10カ国 (1041637 ～ 1041646) 以外のものがどこに割り当てられているかが不明です。

## その他
「JaneXeno 用の」と銘打っていますが、Jane系の専用ブラウザなら一応使えるようです。ただし当方では JaneXeno 以外での動作確認はいたしませんし、今後する予定もありませんのであしからず。「こう変更すれば～でも動作します」といったパッチは大歓迎です。

## References:
