# TOP 物料站

浅紫色静态物料入口站。无需构建、无第三方前端依赖。Cloudflare Pages 继续使用仓库根目录。

## 本地预览

运行 `python -m http.server 4173 --bind 127.0.0.1`，打开 http://127.0.0.1:4173 。不要通过 file:// 打开，浏览器需要通过 HTTP 读取 JSON。

## 维护账号

编辑 `data/accounts.json`。每个账号有稳定的 `id`、`name`、`type`（official/member）及 `links` 平台映射。只填已确认链接，缺失平台直接省略。成员头像未提供时使用姓名首字，不使用示例人物照片或认证标识。现有官方 B站 UID 3546657239075200 保留。

## 手动补充真实动态

编辑 `data/updates.json` 中的 `items` 数组，每条记录包含：

| 字段 | 要求 |
| --- | --- |
| id | 建议填写平台及作品 ID 组成的稳定标识 |
| accountId | 必填，对应账号配置中的 id |
| platform | 必填，weibo / douyin / kuaishou / bilibili |
| url | 必填，已核实的具体作品永久链接；不能填写账号主页 |
| publishedAt | 可省略；确认后填写带时区的 ISO 8601 原帖发布时间，不使用收录时间代替 |
| text | 可省略；真实标题或文案，纯文本显示 |

支持微博 /数字UID/帖子ID 或 /detail/数字ID、抖音 /video/ID 或 /note/ID、快手 /short-video/ID、B站 /video/BV号（或 av号）及 t.bilibili.com/数字ID。分享短链应先人工展开核实作品归属，再存永久链接。链接格式校验只能拒绝常见错误，不能代替真实性和作者归属审核。

页面按原帖发布时间降序排列，未知时间置后；按平台及规范化作品路径去重；支持平台与账号交叉筛选、每次展示 10 条及加载更多。文案使用 textContent 渲染，不解释 HTML。不保存媒体，不在本站播放视频。

`checks` 按平台分别保存 `lastSuccessAt` 和 `lastFailureAt`，初始为 null。只有完整验证了指定账号的检查结果才更新成功时间；失败保留历史成功时间及旧动态。手动添加一条动态不代表完成自动检查，不应顺便填入成功时间。

动态文件和账号文件相互独立。未来同步器只需写动态文件，不必修改页面。当前未开启任何自动抓取或定时任务，空数组表示本站尚未收录，不表示账号没有更新。

## 验证

运行 `node --check app.js` 和 `node scripts/verify.mjs`。浏览器分别检查桌面双栏与移动端单栏导航；发布时保留根目录原有验证 TXT 文件。

自动同步测试和后续计划见 [同步可行性报告](docs/sync-feasibility.md)。
