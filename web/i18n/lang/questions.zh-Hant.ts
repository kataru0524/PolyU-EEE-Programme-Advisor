const translation = {
  title: '智能課程顧問',
  titleShort: '課程顧問',
  welcome: '歡迎',
  welcome_questionnaire: '歡迎使用智能課程顧問',
  welcome_card: {
    title: '這個顧問可以幫你甚麼',
    subtitle: '本助手聚焦於香港理工大學電機及電子工程學系的課程諮詢。填寫你的背景與目標後，可獲得更貼合的建議。',
    scope_title: '常見諮詢主題',
    scope_items: [
      '課程結構、專業方向與修讀規劃',
      '職涯發展路徑與專業資歷',
      '入學途徑與錄取要求',
      '獎學金、費用與交換機會',
    ],
    disclaimer: '回答基於現有課程資料整理，僅供參考。涉及重要決定時，請以理大最新官方公布為準。',
  },
  welcome_popup: {
    title: '歡迎',
    continue: '繼續',
    dont_show_again: '不再顯示',
  },
  user_input_form: {
    admission_route: {
      label: '你的學術背景是甚麼？',
      options: [
        'JUPAS (HKDSE)',
        'Non-JUPAS（非聯招）',
        '副學士/高級文憑入學',
        '國際課程（IB / GCE A-Level）',
        '內地高考',
      ],
    },
    interest_stream: {
      label: '你最感興趣的課程是哪一個？',
      options: [
        '電機工程',
        '資訊及人工智能工程',
        '還未確定／正在比較',
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
