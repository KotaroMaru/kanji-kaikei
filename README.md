# 送別会会計管理アプリ

職場の送別会を管理するWebアプリです。参加者名簿・費用登録・会計確認をシンプルなUIで管理できます。
URLを知っている全員が操作可能（認証なし）で、Supabase Realtimeにより複数人が同時操作しても即座に画面へ反映されます。

---

## 機能一覧

| 画面 | できること |
|------|-----------|
| 名簿 | 参加者の追加・編集・削除、出欠トグル、支払いトグル、グループ別表示 |
| 費用 | 費用（立替含む）の追加・編集・削除、合計表示 |
| 会計確認 | 総費用・回収予定額・差額・支払い進捗・立替者別精算 |
| 設定 | グループの追加・編集・削除（一人あたり金額を設定） |

---

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **バックエンド/DB**: Supabase (PostgreSQL + Realtime)
- **デプロイ**: Vercel

---

## セットアップ手順

### ステップ 1 — Supabaseプロジェクトを作成する

1. [https://supabase.com](https://supabase.com) にアクセスし、アカウントを作成 or ログイン
2. **「New project」** をクリック
3. プロジェクト名（例: `kanji-app`）、データベースパスワード、リージョン（`Northeast Asia (Tokyo)` 推奨）を入力して作成
4. プロジェクトの準備が完了するまで1〜2分待つ

---

### ステップ 2 — データベースのテーブルを作成する

1. Supabaseダッシュボードの左メニューから **「SQL Editor」** を開く
2. **「New query」** をクリックし、以下のSQLをすべてコピーして貼り付ける

```sql
-- groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  custom_amount integer DEFAULT NULL,
  is_attending boolean DEFAULT true,
  is_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  amount integer NOT NULL,
  paid_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Row Level Security（公開アクセスを許可）
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on groups" ON groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- Realtime 有効化
ALTER PUBLICATION supabase_realtime ADD TABLE members;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
```

3. **「Run」** ボタンをクリックして実行する（エラーが出なければOK）

> 同じSQLは `lib/supabase-schema.sql` にも保存されています。

---

### ステップ 3 — APIキーを取得する

1. Supabaseダッシュボードの左メニューから **「Project Settings」**（歯車アイコン）→ **「Data API」** を開く
2. 以下の2つの値をコピーしておく

| 項目 | 場所 |
|------|------|
| **Project URL** | `https://xxxxxxxxxxxx.supabase.co` |
| **anon / public** キー | `eyJhbGciOiJIUzI1NiIs...` で始まる長い文字列 |

---

### ステップ 4 — 環境変数を設定する

プロジェクトのルートにある `.env.local` ファイルを開き、取得した値を貼り付ける：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

> `.env.local` はGit管理から除外されています。誤ってコミットしないよう注意してください。

---

### ステップ 5 — ローカルで起動する

```bash
# 依存パッケージのインストール（初回のみ）
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くとアプリが表示されます。

最初に **「設定」タブ** でグループを追加してから、名簿・費用を登録してください。

---

## Vercelへのデプロイ手順

### 方法A — Vercel CLIを使う（コマンドラインから）

```bash
# Vercel CLIをインストール（初回のみ）
npm install -g vercel

# デプロイ
vercel

# 本番環境へデプロイ
vercel --prod
```

デプロイ時に環境変数の入力を求められたら、ステップ3で取得した値を入力してください。

---

### 方法B — Vercel Webダッシュボードを使う（GitHubと連携）

1. [https://vercel.com](https://vercel.com) にログイン
2. **「Add New Project」** → GitHubリポジトリを選択してインポート
3. **「Environment Variables」** セクションで以下の2つを追加：

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` |

4. **「Deploy」** をクリック

デプロイが完了すると `https://your-app.vercel.app` のようなURLが発行されます。
このURLをチームメンバーと共有すれば全員がアクセスできます。

---

## ディレクトリ構成

```
kanji-app/
├── app/
│   ├── layout.tsx          # 共通レイアウト（ナビゲーション）
│   ├── page.tsx            # トップ → /members にリダイレクト
│   ├── members/page.tsx    # 名簿ページ
│   ├── expenses/page.tsx   # 費用ページ
│   ├── summary/page.tsx    # 会計確認ページ
│   └── settings/page.tsx   # 設定ページ
├── components/
│   ├── Navigation.tsx      # ヘッダー＋タブナビ
│   ├── ClientOnly.tsx      # クライアントのみでレンダリングするラッパー
│   ├── MembersContent.tsx  # 名簿ロジック（Realtime対応）
│   ├── ExpensesContent.tsx # 費用ロジック（Realtime対応）
│   ├── SummaryContent.tsx  # 会計サマリー（Realtime対応）
│   ├── SettingsContent.tsx # グループ管理
│   ├── Modal.tsx           # 汎用モーダル
│   ├── MemberModal.tsx     # 参加者追加/編集
│   ├── ExpenseModal.tsx    # 費用追加/編集
│   └── GroupModal.tsx      # グループ追加/編集
└── lib/
    ├── supabase.ts          # Supabaseクライアント初期化
    ├── types.ts             # 型定義
    └── supabase-schema.sql  # DB作成SQL（Supabaseで実行する）
```

---

## よくある質問

**Q. 複数人で同時に操作しても大丈夫？**
A. はい。Supabase Realtimeにより、誰かがデータを変更すると全員の画面が即座に更新されます。

**Q. データはどこに保存されますか？**
A. Supabaseのクラウドデータベース（PostgreSQL）に保存されます。

**Q. パスワードやログインは必要ですか？**
A. 不要です。アプリのURLを知っている全員が操作できます。URLの共有範囲でアクセスを管理してください。

**Q. グループを削除しようとするとエラーになります**
A. そのグループに参加者がいる場合は削除できません。先に参加者を別グループに移動するか、参加者を削除してください。
