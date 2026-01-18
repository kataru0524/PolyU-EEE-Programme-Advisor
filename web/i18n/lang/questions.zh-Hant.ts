const translation = {
  title: '智能課程顧問聊天機械人',
  titleShort: '課程顧問',
  welcome: '歡迎使用智能課程顧問聊天機械人',
  user_input_form: {
    student_type: {
      label: '你的學術背景是甚麼？',
      options: [
        'JUPAS (香港中學文憑考試)',
        '國際課程 (IB / GCE A-Level)',
        '內地高考',
        '高年級入學（副學士/高級文憑）',
      ],
    },
    interest_stream: {
      label: '你最感興趣的課程是哪一個？',
      options: [
        '電機工程',
        '資訊及人工智能工程',
        '尚未決定／正在比較',
      ],
    },
    project_style: {
      label: '甚麼類型的專案最能激發你的興趣？',
      options: [
        '硬體與製作（搭建機器人、電路）',
        '軟體與邏輯（編寫應用程式、演算法）',
        '創新與設計（腦力激盪、用戶體驗）',
        '理論與研究（理解事物運作原理）',
      ],
    },
    career_goal: {
      label: '你的主要事業目標是甚麼？',
      options: [
        '專業工程師（HKIE 註冊資格）',
        '人工智能與科技專家（初創、研發）',
        '學術研究員（博士路徑）',
        '創業者／管理層（商業方向）',
        '還未確定（希望探索）',
      ],
    },
    fav_subjects: {
      label: '你最擅長或喜歡的科目是甚麼？（選填）',
      placeholder: '例如：物理、數學...',
    },
  },
  actions: {
    start_chat: '開始對話',
    form_incomplete_hint: '請填寫所有必填項',
  },
}

export default translation
