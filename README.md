# 台灣設計產業 AI 資安自評檢核表

將 [台灣設計產業 AI 資安自評檢核表](./台灣設計產業%20AI%20資安自評檢核表_0629.pdf) 製作成互動式問卷網站，協助設計業自我檢視運用 AI 工具時的資通安全與法令遵循風險。

## 功能

- **檢核表說明**：資料分級、計分規則、得分率與建議
- **前導分流**：六題是／否問答，自動決定需填寫的題組（題組 A/B/C 必填，題組 D–H 依情境觸發）
- **完整問卷**：50 題五選一（已做到／部分做到／尚未做到／不知道／不適用），含風險等級標示與風險說明
- **自動計分**：100 分加分制，選項變更即時顯示得分，高風險題「尚未做到」時標示「需優先處理」
- **進度保存**：填答進度自動存入瀏覽器 localStorage
- **列印結果**：可列印評估摘要

## 開始使用

```bash
npm install
npm run dev
```

開啟終端機顯示的網址（預設 `http://localhost:5173`）即可填寫問卷。

## 建置部署

```bash
npm run build
npm run preview   # 本地預覽建置結果
```

建置產物位於 `dist/`。

### GitHub Pages

本專案已設定 GitHub Actions 自動部署，推送到 `main` 分支後會自動建置並發布。

**網址：** https://zeroflare.github.io/tdri-ai-survey/

**首次啟用步驟：**

1. 將程式 push 到 GitHub（含 `.github/workflows/deploy.yml`）
2. 到 repo **Settings → Pages**
3. **Build and deployment → Source** 選 **GitHub Actions**
4. 等待 Actions 跑完後即可開啟上述網址

本地模擬 GitHub Pages 建置：

```bash
VITE_BASE_PATH=/tdri-ai-survey/ npm run build
npm run preview
# 開啟 http://localhost:4173/tdri-ai-survey/
```

## 技術棧

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- 純前端，無需後端伺服器

## 計分邏輯

| 回答 | 高風險題 | 中風險題 | 低風險題 |
| - | - | - | - |
| 已做到 | 3 | 2 | 1 | 
| 部分做到 | 1.5  | 1  | 0.5 | 
| 尚未做到 | 0 | 0 | 0 |
| 不知道 | 0 | 0 | 0 |
| 不適用 | 3 | 2 | 1 |

- 滿分 **100 分**（高風險 3 分 × 10 題 + 中風險 2 分 × 30 題 + 低風險 1 分 × 10 題）
- 選完選項後即時顯示該題得分與目前總分
- 前導分流選「否」的題組不顯示於問卷，也不計入本次滿分
- 任一高風險題「尚未做到」→ 整體標示「需優先處理」
