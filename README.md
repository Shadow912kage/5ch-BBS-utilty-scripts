# 5ちゃんねる掲示板用ユーティリティスクリプト
JaneXeno、5ちゃんねる掲示板用の便利な(？)スクリプトです。

## 必死チェッカーもどき(http://hissi.org/) 呼び出しスクリプト hissiChecker.js
JaneXeno のレス番メニューから ID もしくはトリップでの検索を必死チェッカーもどきで行います。結果はWebブラウザにて表示されます。
```
JaneXeno の ツール(O) > 設定(O)... > 機能 > コマンド で以下のように設定
　コマンド名： +必死チェッカー(ID)
　　(先頭に「+」を付けた任意の文字列、レス番メニューのみに表示)
　実行するコマンド： wscript "$BASEPATHScript/hissiChecker.js" "$URL" "$LOCALDAT" $NUMBER ID
　コマンド名： +必死チェッカー(Trip)
　実行するコマンド： wscript "$BASEPATHScript/hissiChecker.js" "$URL" "$LOCALDAT" $NUMBER Trip
　　(2つ目のパラーメータは、JaneXeno をインストールしたフォルダ下の
　　 Script というフォルダに hissiChecker.js というファイル名で置いた場合)
```

## ロードアベレージチェック ChkLoadAVG.js
※実装中。handleEvent()等が JScript では実装されていないようなので苦戦中……<br>
5ちゃんねるのサーバー負荷を取得、表示するスクリプトです。

## その他
「JaneXeno 用の」と銘打っていますが、Jane系の専用ブラウザなら一応使えるようです。ただし当方では JaneXeno 以外での動作確認はいたしませんし、今後する予定もありませんのであしからず。「こう変更すれば～でも動作します」といったパッチは大歓迎です。

## References:
