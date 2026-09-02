// Lightweight i18n: flat dictionaries + a translate() helper.
// vi is the source of truth for the key set; en must provide the same keys.

export type Lang = "vi" | "en";
export const LANGS: Lang[] = ["vi", "en"];
export const DEFAULT_LANG: Lang = "vi";
export const LANG_COOKIE = "lang";

export const vi = {
  // Nav
  "nav.decks": "Bộ từ",
  "nav.review": "Ôn tập",
  "nav.quiz": "Quiz",
  "nav.read": "Đọc",
  "nav.chat": "Luyện AI",
  "nav.language": "Ngôn ngữ",

  // Common
  "common.loading": "Đang tải…",
  "common.cards": "thẻ",
  "common.open": "Mở →",
  "common.speak": "Phát âm",

  // Dashboard
  "dash.welcome": "Chào mừng trở lại 👋",
  "dash.subtitle": "Học từ vựng thông minh với lặp lại ngắt quãng.",
  "dash.dbOk": "DB OK",
  "dash.dbError": "DB lỗi",
  "dash.claudeOn": "Claude: bật",
  "dash.aiFallback": "AI: fallback",
  "dash.dbErrTitle": "Chưa kết nối được database.",
  "dash.dbErrBody": "Chạy pnpm db:up rồi pnpm db:migrate. Chi tiết: {detail}",
  "dash.stat.due": "Thẻ cần ôn hôm nay",
  "dash.stat.total": "Tổng số thẻ",
  "dash.stat.mastered": "Đã thuộc",
  "dash.stat.decks": "Bộ từ",
  "dash.reviewNow": "Ôn tập ngay ({count})",
  "dash.manageDecks": "Quản lý bộ từ",
  "dash.doQuiz": "Làm quiz",
  "dash.quickStart": "Bắt đầu nhanh",
  "dash.qs1": "Tạo một bộ từ ở trang Bộ từ.",
  "dash.qs2": "Nhập 1 từ → bấm ✨ để AI tự điền nghĩa, IPA, ví dụ.",
  "dash.qs3": "Vào Ôn tập và tự chấm Again/Hard/Good/Easy mỗi ngày.",
  "dash.qs4": "Kiểm tra bằng Quiz, luyện nói-viết ở Luyện AI.",
  "dash.recentQuiz": "Quiz gần đây",
  "dash.noQuiz": "Chưa có lần làm quiz nào.",

  // Decks list
  "decks.title": "Bộ từ của tôi",
  "decks.createTitle": "Tạo bộ từ mới",
  "decks.namePlaceholder": "Tên bộ từ (VD: IELTS Writing)",
  "decks.descPlaceholder": "Mô tả (tuỳ chọn)",
  "decks.createBtn": "+ Tạo bộ từ",
  "decks.empty": "Chưa có bộ từ nào. Tạo một bộ ở trên để bắt đầu.",
  "decks.confirmDelete": "Xoá bộ từ này và toàn bộ thẻ bên trong?",
  "decks.importDeck": "Nhập bộ từ",
  "decks.importDeckHint": "Nhập file JSON/CSV để tạo bộ từ mới.",

  // Deck detail
  "deck.back": "← Bộ từ",
  "deck.reviewThis": "Ôn bộ này",
  "deck.addTitle": "Thêm thẻ mới",
  "deck.termPlaceholder": "Từ / cụm từ tiếng Anh",
  "deck.aiFill": "✨ AI điền",
  "deck.aiFilling": "Đang tạo…",
  "deck.aiNoteClaude": "Đã điền bằng Claude ✨",
  "deck.aiNoteFallback":
    "Đã điền bằng bản mẫu (thêm ANTHROPIC_API_KEY để dùng Claude thật).",
  "deck.ipaPlaceholder": "IPA (VD: /ˈæpəl/)",
  "deck.posPlaceholder": "Loại từ (noun, verb…)",
  "deck.meaningEnPlaceholder": "Nghĩa tiếng Anh",
  "deck.meaningViPlaceholder": "Nghĩa tiếng Việt",
  "deck.examplesPlaceholder": "Ví dụ (mỗi dòng 1 câu)",
  "deck.saveCard": "+ Lưu thẻ",
  "deck.saving": "Đang lưu…",
  "deck.cardsTitle": "Thẻ ({count})",
  "deck.noCards": "Chưa có thẻ nào.",
  "deck.confirmDeleteCard": "Xoá thẻ này?",

  // Card states
  "state.new": "Mới",
  "state.learning": "Đang học",
  "state.review": "Ôn tập",
  "state.mastered": "Đã thuộc",

  // Sentence practice
  "practice.button": "Đặt câu",
  "practice.editButton": "Sửa câu",
  "practice.hide": "Ẩn",
  "practice.placeholder": "Viết câu của bạn dùng từ này…",
  "practice.check": "Chấm câu",
  "practice.checking": "Đang chấm…",
  "practice.corrected": "Câu đã sửa",
  "practice.explanation": "Giải thích",
  "practice.usage": "Cách dùng từ",
  "practice.natural": "Tự nhiên hơn",
  "practice.score": "Điểm",
  "practice.cefr": "Trình độ",
  "practice.mySentence": "Câu của bạn",
  "practice.empty": "Câu không được trống.",

  // Import / Export
  "io.export": "Xuất",
  "io.exportJson": "Xuất JSON",
  "io.exportCsv": "Xuất CSV",
  "io.import": "Nhập file",
  "io.importing": "Đang nhập…",
  "io.importDone": "Đã nhập {count} thẻ.",
  "io.importError": "File không hợp lệ hoặc rỗng.",
  "io.exportEmpty": "Bộ từ chưa có thẻ để xuất.",
  "io.importHint": "Chấp nhận file .json hoặc .csv (cột: term, ipa, pos, meaningEn, meaningVi, examples).",

  // Review
  "review.remaining": "Còn lại: {left} · Đã ôn: {done}",
  "review.tapToSee": "Bấm để xem nghĩa",
  "review.showAnswer": "Hiện đáp án",
  "review.doneTitle": "Hết thẻ cần ôn!",
  "review.doneBody": "Bạn đã ôn {done} thẻ. Quay lại sau khi có thẻ đến hạn.",
  "review.home": "Về trang chủ",
  "review.addCards": "Thêm thẻ mới",

  // Quiz
  "quiz.title": "Quiz",
  "quiz.pickDeck": "Chọn bộ từ",
  "quiz.selectPlaceholder": "— chọn —",
  "quiz.start": "Bắt đầu quiz",
  "quiz.generating": "Đang tạo…",
  "quiz.result": "Kết quả: {score}/{total}",
  "quiz.wrong": "Câu sai:",
  "quiz.wrongLine": "{prompt} → đúng: {correct} (bạn chọn: {chosen})",
  "quiz.allCorrect": "Tuyệt vời, đúng hết! 🎉",
  "quiz.retry": "Làm lại",
  "quiz.question": "{n}. Từ nào có nghĩa: {prompt}?",
  "quiz.submit": "Nộp bài ({answered}/{total})",
  "quiz.hint":
    "Chọn một bộ từ (cần ≥ 4 thẻ có nghĩa) rồi bấm “Bắt đầu quiz”. Chưa có bộ từ? ",
  "quiz.createNow": "Tạo ngay",

  // Read
  "read.title": "Đọc & tra từ",
  "read.topicLabel": "Chủ đề (AI sinh bài)",
  "read.topicPlaceholder": "VD: healthy food, technology…",
  "read.levelLabel": "Trình độ",
  "read.generate": "Sinh bài đọc",
  "read.generating": "Đang sinh…",
  "read.pastePlaceholder": "Dán văn bản tiếng Anh của bạn vào đây…",
  "read.lookupTitle": "Tra từ",
  "read.lookingUp": "Đang tra…",
  "read.clickWord": "Bấm vào một từ trong bài để xem nghĩa.",
  "read.noDeck": "(chưa có bộ từ)",
  "read.addToDeck": "+ Thêm vào bộ từ",
  "read.added": "Đã thêm vào bộ từ ✓",
  "read.editText": "Sửa văn bản",
  "read.doneEditing": "Xong",
  "read.close": "Đóng",
  "read.readingHint": "Bấm vào bất kỳ từ nào để tra nghĩa & phát âm.",

  // Chat
  "chat.title": "Luyện tập với AI",
  "chat.topic": "Chủ đề:",
  "chat.newChat": "+ Cuộc mới",
  "chat.intro":
    "Bắt đầu trò chuyện tiếng Anh theo chủ đề. AI sẽ hỏi lại và sửa lỗi nhẹ nhàng.",
  "chat.inputPlaceholder": "Nhập câu tiếng Anh của bạn…",
  "chat.send": "Gửi",
  "chat.connError": "Lỗi kết nối. Thử lại nhé.",
  "chat.grammarTitle": "Kiểm tra ngữ pháp",
  "chat.grammarPlaceholder": "Viết một câu tiếng Anh để AI sửa…",
  "chat.check": "Kiểm tra",
  "chat.checking": "Đang kiểm tra…",
  "chat.corrected": "Sửa lại: ",
  "chat.fallback": "fallback",
} as const;

export type TKey = keyof typeof vi;

export const en: Record<TKey, string> = {
  // Nav
  "nav.decks": "Decks",
  "nav.review": "Review",
  "nav.quiz": "Quiz",
  "nav.read": "Read",
  "nav.chat": "AI Practice",
  "nav.language": "Language",

  // Common
  "common.loading": "Loading…",
  "common.cards": "cards",
  "common.open": "Open →",
  "common.speak": "Pronounce",

  // Dashboard
  "dash.welcome": "Welcome back 👋",
  "dash.subtitle": "Learn vocabulary smartly with spaced repetition.",
  "dash.dbOk": "DB OK",
  "dash.dbError": "DB error",
  "dash.claudeOn": "Claude: on",
  "dash.aiFallback": "AI: fallback",
  "dash.dbErrTitle": "Cannot connect to the database.",
  "dash.dbErrBody": "Run pnpm db:up then pnpm db:migrate. Details: {detail}",
  "dash.stat.due": "Cards due today",
  "dash.stat.total": "Total cards",
  "dash.stat.mastered": "Mastered",
  "dash.stat.decks": "Decks",
  "dash.reviewNow": "Review now ({count})",
  "dash.manageDecks": "Manage decks",
  "dash.doQuiz": "Take a quiz",
  "dash.quickStart": "Quick start",
  "dash.qs1": "Create a deck on the Decks page.",
  "dash.qs2": "Type a word → click ✨ to let AI fill meaning, IPA, examples.",
  "dash.qs3": "Go to Review and self-grade Again/Hard/Good/Easy every day.",
  "dash.qs4": "Test yourself with Quiz, practice speaking-writing in AI Practice.",
  "dash.recentQuiz": "Recent quizzes",
  "dash.noQuiz": "No quiz attempts yet.",

  // Decks list
  "decks.title": "My decks",
  "decks.createTitle": "Create a new deck",
  "decks.namePlaceholder": "Deck name (e.g. IELTS Writing)",
  "decks.descPlaceholder": "Description (optional)",
  "decks.createBtn": "+ Create deck",
  "decks.empty": "No decks yet. Create one above to get started.",
  "decks.confirmDelete": "Delete this deck and all its cards?",
  "decks.importDeck": "Import deck",
  "decks.importDeckHint": "Import a JSON/CSV file to create a new deck.",

  // Deck detail
  "deck.back": "← Decks",
  "deck.reviewThis": "Review this deck",
  "deck.addTitle": "Add a new card",
  "deck.termPlaceholder": "English word / phrase",
  "deck.aiFill": "✨ AI fill",
  "deck.aiFilling": "Generating…",
  "deck.aiNoteClaude": "Filled by Claude ✨",
  "deck.aiNoteFallback":
    "Filled with a template (add ANTHROPIC_API_KEY to use real Claude).",
  "deck.ipaPlaceholder": "IPA (e.g. /ˈæpəl/)",
  "deck.posPlaceholder": "Part of speech (noun, verb…)",
  "deck.meaningEnPlaceholder": "English meaning",
  "deck.meaningViPlaceholder": "Vietnamese meaning",
  "deck.examplesPlaceholder": "Examples (one per line)",
  "deck.saveCard": "+ Save card",
  "deck.saving": "Saving…",
  "deck.cardsTitle": "Cards ({count})",
  "deck.noCards": "No cards yet.",
  "deck.confirmDeleteCard": "Delete this card?",

  // Card states
  "state.new": "New",
  "state.learning": "Learning",
  "state.review": "Review",
  "state.mastered": "Mastered",

  // Sentence practice
  "practice.button": "Write a sentence",
  "practice.editButton": "Edit sentence",
  "practice.hide": "Hide",
  "practice.placeholder": "Write your own sentence using this word…",
  "practice.check": "Check sentence",
  "practice.checking": "Reviewing…",
  "practice.corrected": "Corrected",
  "practice.explanation": "Explanation",
  "practice.usage": "Word usage",
  "practice.natural": "More natural",
  "practice.score": "Score",
  "practice.cefr": "Level",
  "practice.mySentence": "Your sentence",
  "practice.empty": "The sentence cannot be empty.",

  // Import / Export
  "io.export": "Export",
  "io.exportJson": "Export JSON",
  "io.exportCsv": "Export CSV",
  "io.import": "Import file",
  "io.importing": "Importing…",
  "io.importDone": "Imported {count} cards.",
  "io.importError": "Invalid or empty file.",
  "io.exportEmpty": "This deck has no cards to export.",
  "io.importHint": "Accepts .json or .csv (columns: term, ipa, pos, meaningEn, meaningVi, examples).",

  // Review
  "review.remaining": "Remaining: {left} · Reviewed: {done}",
  "review.tapToSee": "Tap to reveal the meaning",
  "review.showAnswer": "Show answer",
  "review.doneTitle": "All caught up!",
  "review.doneBody": "You reviewed {done} cards. Come back when cards are due.",
  "review.home": "Home",
  "review.addCards": "Add cards",

  // Quiz
  "quiz.title": "Quiz",
  "quiz.pickDeck": "Choose a deck",
  "quiz.selectPlaceholder": "— select —",
  "quiz.start": "Start quiz",
  "quiz.generating": "Generating…",
  "quiz.result": "Result: {score}/{total}",
  "quiz.wrong": "Wrong answers:",
  "quiz.wrongLine": "{prompt} → correct: {correct} (you chose: {chosen})",
  "quiz.allCorrect": "Perfect score! 🎉",
  "quiz.retry": "Retry",
  "quiz.question": "{n}. Which word means: {prompt}?",
  "quiz.submit": "Submit ({answered}/{total})",
  "quiz.hint":
    "Choose a deck (needs ≥ 4 cards with meanings) then click “Start quiz”. No decks yet? ",
  "quiz.createNow": "Create one",

  // Read
  "read.title": "Read & look up",
  "read.topicLabel": "Topic (AI generates)",
  "read.topicPlaceholder": "e.g. healthy food, technology…",
  "read.levelLabel": "Level",
  "read.generate": "Generate passage",
  "read.generating": "Generating…",
  "read.pastePlaceholder": "Paste your English text here…",
  "read.lookupTitle": "Look up",
  "read.lookingUp": "Looking up…",
  "read.clickWord": "Click a word in the passage to see its meaning.",
  "read.noDeck": "(no decks)",
  "read.addToDeck": "+ Add to deck",
  "read.added": "Added to deck ✓",
  "read.editText": "Edit text",
  "read.doneEditing": "Done",
  "read.close": "Close",
  "read.readingHint": "Click any word to see its meaning & pronunciation.",

  // Chat
  "chat.title": "Practice with AI",
  "chat.topic": "Topic:",
  "chat.newChat": "+ New chat",
  "chat.intro":
    "Start an English conversation on a topic. The AI will ask follow-ups and gently correct mistakes.",
  "chat.inputPlaceholder": "Type your English sentence…",
  "chat.send": "Send",
  "chat.connError": "Connection error. Please try again.",
  "chat.grammarTitle": "Grammar check",
  "chat.grammarPlaceholder": "Write an English sentence for the AI to fix…",
  "chat.check": "Check",
  "chat.checking": "Checking…",
  "chat.corrected": "Corrected: ",
  "chat.fallback": "fallback",
};

export const dictionaries: Record<Lang, Record<TKey, string>> = { vi, en };

export type TParams = Record<string, string | number>;

/** Look up a key for a language and interpolate {placeholders}. */
export function translate(lang: Lang, key: TKey, params?: TParams): string {
  let s: string = dictionaries[lang][key] ?? dictionaries[DEFAULT_LANG][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

export function isLang(v: unknown): v is Lang {
  return v === "vi" || v === "en";
}
