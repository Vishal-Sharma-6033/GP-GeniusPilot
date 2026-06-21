# Interview Questions Feature

## Overview

The **Interview Questions** feature provides a curated, categorized bank of technical interview questions for GeniusPilot users. It includes:

- 📋 **Question cards** with expand/collapse for detailed model answers
- ✅ **Checkbox system** to mark questions as reviewed (persisted in `localStorage`)
- 🔍 **Search bar** for filtering questions by keyword
- 🎯 **Difficulty filter pills** — Easy / Medium / Hard / All
- 📊 **Progress ring** showing how many questions you've reviewed
- 🗂️ **Sidebar categories** for switching between topic areas (JavaScript, React, Node.js, DSA — coming soon)

---

## How to Add New Questions

1. Open `data/jsQuestions.js`
2. Append a new object to the `JS_QUESTIONS` array:

```js
{
    id: 'js-7',                  // must be unique
    question: 'Your question text here?',
    difficulty: 'Easy',          // 'Easy' | 'Medium' | 'Hard'
    intention: 'Why interviewers ask this question.',
    answer: `Detailed model answer with examples...`,
}
```

3. Save the file — the question will appear immediately in the Questions page.

---

## How to Add a New Category

1. Create a new data file, e.g. `data/reactQuestions.js`
2. Export a `REACT_QUESTIONS` array (same shape as `JS_QUESTIONS`)
3. In `data/jsQuestions.js`, import and add to `QUESTION_CATEGORIES`:

```js
import { REACT_QUESTIONS } from './reactQuestions'

export const QUESTION_CATEGORIES = [
    { id: 'javascript', label: 'JavaScript', questions: JS_QUESTIONS, icon: 'JS', color: '#f7df1e' },
    { id: 'react',      label: 'React',      questions: REACT_QUESTIONS, icon: '⚛', color: '#61dafb' },
]
```

---

## File Structure

```
features/interview/
├── data/
│   └── jsQuestions.js       ← Question bank data
├── pages/
│   └── InterviewQuestions.jsx ← Main page component
├── style/
│   └── questions.scss        ← SCSS styles for the page
└── README.md                 ← This file
```

---

## Technologies Used

- **React** (functional components, hooks: useState, useEffect, useMemo)
- **SCSS** (BEM-ish class naming with `qb-` prefix for "question bank")
- **localStorage** for persisting reviewed-question state across sessions
