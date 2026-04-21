const translation = {
  title: 'Intelligent Programme Advisor Chatbot',
  titleShort: 'Programme Advisor',
  welcome: 'Welcome',
  welcome_questionnaire: 'Welcome to the Intelligent Programme Advisor Chatbot',
  onboarding_hint: 'Your answers help us tailor advice to your background and goals.',
  welcome_card: {
    title: 'What this advisor can help with',
    subtitle: 'This chatbot is designed for PolyU EEE programme advising. Share your background and goals to get more personalized guidance.',
    scope_title: 'Common topics',
    scope_items: [
      'Programme structure, streams, and study planning',
      'Career pathways and professional recognition',
      'Admission routes and entry requirements',
      'Scholarships, fees, and exchange opportunities',
    ],
    disclaimer: 'Advice is based on available programme information. Please verify critical decisions with the latest official PolyU announcements.',
  },
  welcome_popup: {
    title: 'Welcome',
    continue: 'Continue',
    dont_show_again: "Don't show again",
  },
  opener: {
    introduction: 'Hi! I\'m your PolyU EEE Programme Advisor.\nI can help you explore study focus, learning path, project style fit, and career direction.',
    try_asking: 'Try asking:',
    branches: {
      selected: [
        'Is this programme a good fit for my background and goals?',
        'What learning experience and curriculum focus can I expect in this programme?',
        'What are the main reasons to choose this programme over alternatives?',
      ],
      unselected: [
        'Which programme fits my interests and strengths best?',
        'What are the key differences between these programmes?',
        'Based on my profile, which programme should I prioritize applying for?',
      ],
    },
  },
  user_input_form: {
    fav_subjects: {
      placeholder: 'e.g. Physics, Mathematics...',
    },
    interest_stream: {
      options: [
        'Electrical Engineering',
        'Info & AI Engineering',
        'Undecided / Comparing Both',
      ],
    },
  },
  actions: {
    start_chat: 'Start Chat',
    form_incomplete_hint: 'Please complete all required fields',
  },
}

export default translation
