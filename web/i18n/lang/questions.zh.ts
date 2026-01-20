const translation = {
  title: '智能课程顾问',
  titleShort: '课程顾问',
  welcome: '欢迎使用智能课程顾问',
  user_input_form: {
    student_type: {
      label: '您的学术背景是什么？',
      options: [
        'JUPAS (香港中学文凭考试)',
        '国际课程 (IB / GCE A-Level)',
        '内地高考',
        '高年级入学（副学士/高级文凭）',
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
        '创业者/管理人员（商业方向）',
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
