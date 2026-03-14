const translation = {
  title: '智能课程顾问',
  titleShort: '课程顾问',
  welcome: '欢迎',
  welcome_questionnaire: '欢迎使用智能课程顾问',
  welcome_card: {
    title: '这个顾问可以帮您什么',
    subtitle: '本助手面向香港理工大学电机及电子工程学系的课程咨询。填写您的背景与目标后，可获得更贴合的建议。',
    scope_title: '常见咨询主题',
    scope_items: [
      '课程结构、专业方向与学习规划',
      '职业发展路径与专业资质',
      '入学途径与录取要求',
      '奖学金、费用与交换机会',
    ],
    disclaimer: '回答基于现有课程资料整理，仅供参考。涉及重要决定时，请以理大最新官方公布为准。',
  },
  welcome_popup: {
    title: '欢迎',
    continue: '继续',
    dont_show_again: '不再显示',
  },
  user_input_form: {
    admission_route: {
      label: '您的学术背景是什么？',
      options: [
        'JUPAS（HKDSE）',
        'Non-JUPAS（非联招）',
        '副学士/高级文凭入学',
        '国际课程（IB / GCE A-Level）',
        '内地高考',
      ],
    },
    interest_stream: {
      label: '您最感兴趣的课程是什么？',
      options: [
        '电机工程',
        '资讯及人工智能工程',
        '尚未决定／正在比较',
      ],
    },
    project_style: {
      label: '什么类型的项目最能激发您的兴趣？',
      options: [
        '硬件与制作（搭建机器人、电路）',
        '软件与逻辑（编程应用、算法）',
        '创新与设计（头脑风暴、用户体验）',
        '理论与研究（理解事物运作原理）',
      ],
    },
    career_goal: {
      label: '您的主要职业目标是什么？',
      options: [
        '专业工程师（HKIE 注册资格）',
        '人工智能与科技专家（创业、研发）',
        '学术研究员（博士路径）',
        '创业者／管理人员（商业方向）',
        '尚未确定（希望探索）',
      ],
    },
    fav_subjects: {
      label: '您最擅长或喜欢的科目是什么？（可选）',
      placeholder: '例如：物理、数学...',
    },
  },
  actions: {
    start_chat: '开始对话',
    form_incomplete_hint: '请填写所有必填项',
  },
}

export default translation
