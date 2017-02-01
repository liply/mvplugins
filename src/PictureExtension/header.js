/*:
 * @plugindesc ピクチャに対して便利な機能を追加します。
 * @author liply
 *
 * @help
 * 以下のプラグインコマンドを追加します。
 *   tween add [ピクチャ番号] [パラメータ]
 *   tween new [ピクチャ番号] [パラメータ]
 * Tween（なめらか移動）の追加/新規作成を行います。
 *
 * パラメータの書式は以下です。
 * [パラメータ名] [値] [時間] [補間関数]
 * パラメータ名は、以下が有効です。
 *   x, y, scaleX, scaleY, rotation
 * 補間関数は、以下が有効です。
 *   linear, ease[In/Out/InOut][Quad/Cubic/Quart/Quint]
 * 時間の単位はフレーム数です。
 *
 * また、特殊なパラメータとしてdelayが用意されています。
 * delayは時間を取り、その時間Tweenの実行を停止します。
 *
 *   tween finish
 * Tweenの実行を早送りし、終了します。
 *
 *   gridMode [on/off] [ピクチャ番号]
 * 指定のピクチャの座標がPX指定ではなく、グリッド配置に変更されます。
 *
 *   standMode [on/off] [ピクチャ番号]
 * 指定のピクチャが立ち絵モードになります。立ち絵モードになると、原点が足元になります。
 *
 * @param Grid Column
 * @default 12
 * @param Grid Row
 * @default 8
 */

