/*:
 * @plugindesc 汎用UI作成プラグイン
 * @author liply
 * @help
 * ユーザーインターフェイスをプラグインコマンドで作り出すプラグインです。
 * Licensed under MIT
 *
 * 基本：
 * 最初にstageが作成されます。特に親がいない場合は、stageを指定してください。
 * パラメータ名は以下の指定が可能です。
 * x
 * y
 * scaleX
 * scaleY
 * rotation
 * anchorX
 * anchorY
 * width
 * height
 * opacity
 * picture (ピクチャーのみ）
 * text（ラベルのみ）
 * background（ウインドウのみ）
 *
 * 単位は以下の指定が可能です。
 * column
 * ゲーム画面の幅をプラグインパラメータcolumnで割ったものです。
 * row
 * ゲーム画面の高さをプラグインパラメータrowで割ったものです。
 * vw
 * ゲーム画面の幅を基準にした値です。１００で１００％です。
 * vh
 * ゲーム画面の高さを基準にした値です。１００で１００％です。
 * bw
 * ボックスの幅を基準にした値です。１００で１００％です。
 * bh
 * ボックスの高さを基準にした値です。１００で１００％です。
 *
 *
 * 以下のプラグインコマンドが導入されます。
 *
 * window ID 親ID パラメータ名 パラメータ値 ...
 * label ID 親ID パラメータ名 パラメータ値 ...
 * picture ID 親ID パラメータ名 パラメータ値 ...
 * container ID 親ID パラメータ名 パラメータ値 ...
 *
 * 各種UIコンポーネントを作成します。
 * window: ツクールのステータス画面等で表示されるウインドウです
 * label: 文字を表示します
 * picture: 画像を表示します
 * container: 他の親になる機能のみをもった、軽量のUIコンポーネントです。
 *
 *
 * draw picture/text ID ピクチャ名/テキスト パラメータ名 パラメータ値 ...
 * windowの内部にピクチャかテキストを描画します。
 *
 * clear ID
 * draw命令をすべて消します。
 *
 * emulate キー名 ID
 * 指定IDのUIコンポーネントを、キー名のボタンにします。
 *
 * removeEmulation キー名
 * ボタン化を解除します。
 *
 * close ID
 * UIコンポーネントを閉じます。
 *
 * animate ID パラメータ名 パラメータ値 ...
 * 指定IDのパラメータを、動かします。
 * ばねで引っ張ったような挙動になります。
 *
 * spring 強さ 固さ
 * animate命令で利用するばねの強さと固さを指定します。
 *
 * springDefault
 * ばねの強さ、固さを初期状態に戻します。
 *
 * uiMode on/off
 * UIモードを切り替えます。UIモードに入ると、マップ操作を受け付けなくなります。
 *
 * setTrigger/LongPress/Press/Release ID イベント名
 * UIコンポーネントに対して各種イベントが起きると、イベント名を含むイベントを起動します。
 * まずマップ内を検索して、無ければコモンイベントを検索します。
 *
 * @param Grid Column
 * @default 12
 *
 * @param Grid Row
 * @default 8
 *
 *
 */
