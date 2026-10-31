export const arStrings = {
  pageTitle: 'MiniBot Studio - مختبر الروبوت',
  heading: 'مختبر الروبوت',
  levelIndicator: 'المستوى 1/3',
  primaryActions: {
    start: 'ابدأ',
    continue: 'واصل اللعب',
    parents: 'للأهل',
    tutorial: 'دليل البداية',
    lab: 'المختبر الحر'
  },
  world: {
    heading: 'عالم الروبوت',
    description: 'شبكة التجربة'
  },
  parentArea: {
    heading: 'منطقة الأهل',
    description: 'يمكنك هنا إدارة البيانات المحلية ومسحها من هذا الجهاز.',
    soundEffectsLabel: 'تشغيل المؤثرات الصوتية',
    clearProgressConfirm: 'هل تريد مسح كل البيانات المحلية للتطبيق من هذا الجهاز؟',
    completedLevelsTemplate: 'المستويات المكتملة: {count}',
    conceptCountTemplate: '{concept}: جُرّب في {count} مستوى.',
    learningConceptLabels: {
      sequencing: 'التسلسل',
      directions: 'الاتجاهات',
      repetition: 'التكرار'
    }
  },
  blockArea: {
    heading: 'منطقة الأوامر',
    programHeading: 'مساحة البرنامج',
    emptyProgram: 'اسحب الأوامر إلى هنا.',
    firstLevelDemo: 'مثال: أضف كتلة ابدأ ثم كتلة تقدّم خطوة إلى مساحة البرنامج.',
    labelsByType: {
      start: 'ابدأ',
      moveForward: 'تقدّم خطوة',
      turnRight: 'انعطف يميناً',
      turnLeft: 'انعطف يساراً',
      repeat: 'كرر',
      if: 'إذا كان الطريق مغلقاً',
      lightOn: 'شغّل الضوء',
      playSound: 'شغّل الصوت'
    },
    iconsByType: {
      start: '🏁',
      moveForward: '⬆️',
      turnRight: '↱',
      turnLeft: '↰',
      repeat: '🔁',
      if: '🚧',
      lightOn: '💡',
      playSound: '🔊'
    },
    repeatCountTemplate: 'كرر {count} مرات',
    repeatBodyEmpty: 'اسحب أوامر هنا.',
    addToBody: 'أضف إلى داخل الكتلة'
  },
  levelMeta: {
    levelIndicatorTemplate: 'المستوى {current}/{total}',
    hintPrefix: 'تلميح:',
    successPrefix: 'الهدف:',
    collectionPrefix: 'النجوم المجموعة:',
    sensorPrefix: 'المستشعر:',
    sensorBlocked: 'يوجد عائق أمام الروبوت.',
    sensorClear: 'الطريق أمام الروبوت واضح.',
    defaultHint: 'اتبع المسار حتى النجمة.',
    defaultSuccess: 'صل إلى النجمة لتنجح.',
    reachGoalSuccess: 'وصل إلى الهدف المحدد.',
    freePlaySuccess: 'جرّب بحرية بدون هدف ثابت.',
    fallbackLevelTitle: 'مستوى آمن'
  },
  movementGuideHeading: 'تعليمات الحركة',
  movement: {
    forward: 'تقدّم خطوة',
    right: 'انعطف يميناً',
    left: 'انعطف يساراً'
  },
  controls: {
    play: 'تشغيل',
    stop: 'إيقاف',
    reset: 'إعادة',
    hint: 'تلميح',
    playInstructionAudio: 'استمع للتعليمات',
    nextLevel: 'المستوى التالي',
    deleteStep: 'احذف',
    retryLevel: 'حاول مرة أخرى',
    returnHome: 'العودة للرئيسية',
    saveProgram: 'احفظ البرنامج',
    clearProgress: 'امسح البيانات المحلية',
    closeParentArea: 'إغلاق'
  },
  tutorial: {
    heading: 'خطوات البداية',
    stepTemplate: 'الخطوة {current} من {total}',
    next: 'التالي',
    finish: 'أنهِ الشرح',
    skip: 'تخطَّ الشرح',
    close: 'إخفاء',
    replay: 'أعد الشرح',
    playAudio: 'استمع لهذه الخطوة',
    steps: [
      {
        title: 'اختر الأمر من منطقة الأوامر',
        description: 'ابدأ بلمس كتلة من منطقة الأوامر لإضافتها إلى البرنامج.',
        focusTarget: 'toolbox'
      },
      {
        title: 'رتّب الأوامر داخل مساحة البرنامج',
        description: 'ضع الأوامر بالترتيب داخل مساحة البرنامج حتى يعرف الروبوت ماذا يفعل.',
        focusTarget: 'workspace'
      },
      {
        title: 'اضغط تشغيل لتجربة البرنامج',
        description: 'بعد تجهيز البرنامج، اضغط تشغيل لمشاهدة حركة الروبوت خطوةً خطوة.',
        focusTarget: 'play'
      }
    ]
  },
  freePlayLab: {
    heading: 'المختبر الحر',
    modeRobot: 'حرّك الروبوت',
    modeObstacle: 'بدّل العوائق'
  },
  levelCompletion: {
    message: 'أحسنت! أنهيت هذا المستوى.',
    finalLevelMessage: 'أحسنت! أكملت كل المستويات المتاحة.'
  },
  levelError: {
    fallbackMessage: 'تعذّر فتح هذا المستوى. تم فتح مستوى آمن.',
    retryHint: 'يمكنك المحاولة مرة أخرى أو العودة إلى الشاشة الرئيسية.'
  },
  status: {
    idle: 'الحالة: جاهز',
    running: 'الحالة: الروبوت يتحرك',
    stopped: 'الحالة: تم الإيقاف',
    complete: 'الحالة: اكتمل التشغيل',
    reset: 'الحالة: تمت الإعادة',
    blockSelectedPrefix: 'الحالة: تم اختيار',
    fallback: 'الحالة: بيانات المستوى غير صالحة، تم تحميل مستوى آمن.',
    blocked: 'الحالة: هناك عائق أمام الروبوت. جرّب مساراً آخر.',
    noBlockSelected: 'الحالة: اختر أمراً أولاً.',
    unsupported: 'الحالة: هذا الأمر سيُفعّل في خطوة لاحقة.',
    collected: 'الحالة: أحسنت! تم جمع النجمة.',
    levelComplete: 'الحالة: رائع! أنهيت التحدي.',
    hintShown: 'الحالة: تم عرض التلميح التالي.',
    hintSpoken: 'الحالة: تم عرض التلميح وقراءته بصوت مرتفع.',
    instructionSpoken: 'الحالة: تمت قراءة تعليمات المستوى.',
    instructionSpeechUnavailable: 'الحالة: لا تتوفر ميزة القراءة الصوتية على هذا المتصفح.',
    instructionAudioMuted: 'الحالة: الصوت مكتوم من إعدادات الأهل.',
    stepLimitExceeded: 'الحالة: تم إيقاف البرنامج لأنه تجاوز الحد الآمن للخطوات.',
    continueUnavailable: 'الحالة: لا يوجد تقدّم محفوظ بعد.',
    parentsAreaOpen: 'الحالة: يمكنك إدارة التقدم من منطقة الأهل.',
    progressCleared: 'الحالة: تم مسح البيانات المحلية للتطبيق من هذا الجهاز.',
    progressClearCancelled: 'الحالة: لم يتم مسح البيانات المحلية.',
    progressClearFailed: 'الحالة: تعذّر مسح البيانات المحلية. حاول مرة أخرى.',
    progressSaveFailed: 'الحالة: تعذّر حفظ التقدم المحلي. حاول مرة أخرى.',
    soundEffectsEnabled: 'الحالة: تم تشغيل المؤثرات الصوتية.',
    soundEffectsDisabled: 'الحالة: تم إيقاف المؤثرات الصوتية.',
    soundEffectsSaveFailed: 'الحالة: تعذّر حفظ إعدادات الصوت. حاول مرة أخرى.',
    lightOn: 'الحالة: تم تشغيل ضوء الروبوت.',
    soundPlayed: 'الحالة: تم تشغيل صوت الروبوت.',
    soundMuted: 'الحالة: الصوت مكتوم لكن البرنامج مستمر.',
    programUpdated: 'الحالة: تمت إضافة الأمر إلى البرنامج.',
    invalidDrop: 'الحالة: لا يمكن إضافة هذا الأمر هنا.',
    programReordered: 'الحالة: تم ترتيب الأوامر من جديد.',
    programRemoved: 'الحالة: تم حذف الأمر من البرنامج.',
    programEmpty: 'الحالة: أضف أوامر إلى البرنامج قبل التشغيل.',
    startRequired: 'الحالة: ابدأ بكتلة ابدأ أولاً.',
    requiredBlockMissing: 'الحالة: البرنامج يحتاج أمراً مطلوباً لهذا التحدي.',
    validationInternalError: 'الحالة: تعذّر التحقق من البرنامج. حاول مرة أخرى.',
    unexpectedError: 'الحالة: حدث خطأ غير متوقع. أعد المحاولة.',
    programSaved: 'الحالة: تم حفظ البرنامج على هذا الجهاز.',
    programSaveFailed: 'الحالة: تعذّر حفظ البرنامج على هذا الجهاز. حاول مرة أخرى.',
    programRestored: 'الحالة: تم استعادة البرنامج المحفوظ.',
    programLoadFailed: 'الحالة: تعذّر استعادة البرنامج المحفوظ، ويمكنك البدء من جديد.',
    invalidRepeatCount: 'الحالة: عدد التكرار يجب أن يكون بين 1 و10.',
    tutorialOpened: 'الحالة: تم فتح دليل البداية.',
    tutorialStepChanged: 'الحالة: انتقلنا إلى الخطوة التالية في الدليل.',
    tutorialCompleted: 'الحالة: أكملت دليل البداية.',
    tutorialSkipped: 'الحالة: تم تخطي دليل البداية.',
    tutorialHidden: 'الحالة: تم إخفاء دليل البداية.',
    tutorialSpoken: 'الحالة: تمت قراءة خطوة الدليل بصوت مرتفع.',
    labOpened: 'الحالة: تم فتح المختبر الحر.',
    labModeRobot: 'الحالة: وضع المختبر الحر لتحديد موقع الروبوت.',
    labModeObstacle: 'الحالة: وضع المختبر الحر لتبديل العوائق.',
    labEditApplied: 'الحالة: تم تحديث إعداد المختبر الحر.',
    labEditInvalid: 'الحالة: لا يمكن تطبيق هذا التعديل في المختبر الحر.'
  }
};
