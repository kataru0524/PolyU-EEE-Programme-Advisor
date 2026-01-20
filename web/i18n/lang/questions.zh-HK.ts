const translation = {
  title: '智能課程顧問',
  titleShort: '課程顧問',
  welcome: '歡迎使用智能課程顧問',
  user_input_form: {
    student_type: {
      label: '你嘅學術背景係咩？',
      options: [
        'JUPAS (香港中學文憑考試)',
        '國際課程 (IB / GCE A-Level)',
        '內地高考',
        '高年級入學（副學士/高級文憑）',
      ],
    },
    interest_stream: {
      label: '你最有興趣嘅課程係邊個？',
      options: [
        '電機工程',
        '資訊及人工智能工程',
        '未決定／比較緊',
      ],
    },
    project_style: {
      label: '咩類型嘅專案最能夠激發你嘅興趣？',
      options: [
        '硬件同製作（整機械人、電路）',
        '軟件同邏輯（寫應用程式、演算法）',
        '創新同設計（腦力激盪、用戶體驗）',
        '理論同研究（明白事物運作原理）',
      ],
    },
    career_goal: {
      label: '你嘅主要事業目標係咩？',
      options: [
        '專業工程師（HKIE 註冊資格）',
        '人工智能同科技專家（初創、研發）',
        '學術研究員（博士路徑）',
        '創業者／管理層（商業方向）',
        '未確定（想探索下）',
      ],
    },
    fav_subjects: {
      label: '你最擅長或者鍾意嘅科目係咩？（選填）',
      placeholder: '例如：物理、數學...',
    },
  },
  actions: {
    start_chat: '開始對話',
    form_incomplete_hint: '請填寫所有必填項',
  },
}

export default translation
