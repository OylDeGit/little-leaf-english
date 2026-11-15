# 图片、语音与教学内容来源

- 部分保留的单词插图来自 Twemoji v15.1.0，Copyright Twitter, Inc. and other contributors；由 jdecked/twemoji 维护，采用 CC BY 4.0。来源：https://github.com/jdecked/twemoji/tree/v15.1.0/assets/svg 。许可：https://creativecommons.org/licenses/by/4.0/ 。原图未修改，仅在界面中缩放和旋转；发布时文件名按内容哈希重命名。
- rectangle、oval、pink、gray、gold、pentagon、hexagon、cube、crescent、eleven、twelve 的 SVG 及网站图标为本项目原创。
- 340 个词条的中文释义和英文例句由本项目编写，不代表官方考试词表，未经过外部教师逐条审校。
- 预置单词音频由 macOS Samantha 系统语音合成，不是真人录音；例句朗读使用访问者设备的浏览器语音。

- 新增的数字图卡，以及 plum、pomegranate、papaya、lime、apricot、radish、peas、eraser、glue、stapler、head、neck、knee、shoulder 的 SVG 为本项目原创。

- 8 组购物和点餐短对话、中文释义及回应选择题为项目原创；48 段预置对话音频使用 macOS Samantha 合成。对话中的价格为教学示例。

## v2.7 场景内容与新增资源

13 个生活场景的主题、可辨认物品名称和 A–Z 示例词参考用户在本次任务中提供的书页照片，逐条映射见 `reference-vocabulary.json`。未将照片、书页版式或书中角色直接打包进网站。英文名称经规范化，学习例句为本项目编写。

107 个新增物品 SVG 为本项目以基础矢量图形绘制，源定义见 `scene-illustrations.js`；其他新增插图使用 Twemoji，继续遵循上文所列授权。新增单词及 26 个字母名音频由 macOS Samantha 系统语音生成。

## v2.7.1 词卡素材更新

- 322 张词卡图片替换为 Microsoft Fluent Emoji 的 Flat SVG，Copyright Microsoft Corporation，采用 MIT License。固定上游版本为 1ffb34c752ecf5d402f04cfb4b392c77f57c54bc。资源路径与 SHA-256 见 illustration-sources.json；图片保留原始字节，发布时仅按内容哈希重命名。
- 官方仓库：https://github.com/microsoft/fluentui-emoji 。完整 MIT 许可随项目及离线内容附带，见 [fluent-emoji-LICENSE.txt](licenses/fluent-emoji-LICENSE.txt)。
- 本次未使用 Mulberry、OpenMoji 或 ARASAAC 的图片。
- 当前 526 张词卡图片包括：322 张 Fluent Emoji Flat、56 张保留的 Twemoji、148 张本项目原创 SVG。旧版来源记录保留供追溯。
- illustration-review.json 记录全部 526 个词条的替换或保留决定、原因、字节数和前后哈希。词条 ID、教学文字、发音文件和进度键保持原有定义。
