export const arStrings = {
  pageTitle: 'MiniBot Studio - مختبر الروبوت',
  heading: 'مختبر الروبوت',
  levelIndicator: 'المستوى 1/3',
  primaryActions: {
    start: 'ابدأ',
    continue: 'واصل اللعب',
    parents: 'للأهل'
  },
  world: {
    heading: 'عالم الروبوت',
    description: 'شبكة التجربة'
  },
  parentArea: {
    heading: 'منطقة الأهل',
    description: 'يمكنك هنا مسح التقدم المحفوظ على هذا الجهاز.',
    soundEffectsLabel: 'تشغيل المؤثرات الصوتية',
    clearProgressConfirm: 'هل تريد مسح التقدم المحفوظ نهائياً؟',
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
      repeat: 'كرر'
    },
    iconsByType: {
      start: '🏁',
      moveForward: '⬆️',
      turnRight: '↱',
      turnLeft: '↰',
      repeat: '🔁'
    },
    repeatCountTemplate: 'كرر {count} مرات',
    repeatBodyEmpty: 'اسحب أوامر هنا.'
  },
  levelMeta: {
    levelIndicatorTemplate: 'المستوى {current}/{total}',
    hintPrefix: 'تلميح:',
    successPrefix: 'الهدف:',
    collectionPrefix: 'النجوم المجموعة:',
    defaultHint: 'اتبع المسار حتى النجمة.',
    defaultSuccess: 'صل إلى النجمة لتنجح.',
    reachGoalSuccess: 'وصل إلى الهدف المحدد.',
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
    clearProgress: 'امسح التقدم',
    closeParentArea: 'إغلاق'
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
    progressCleared: 'الحالة: تم مسح التقدم المحفوظ على هذا الجهاز.',
    progressClearCancelled: 'الحالة: لم يتم مسح التقدم.',
    progressClearFailed: 'الحالة: تعذّر مسح التقدم. حاول مرة أخرى.',
    soundEffectsEnabled: 'الحالة: تم تشغيل المؤثرات الصوتية.',
    soundEffectsDisabled: 'الحالة: تم إيقاف المؤثرات الصوتية.',
    soundEffectsSaveFailed: 'الحالة: تعذّر حفظ إعدادات الصوت. حاول مرة أخرى.',
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
    programRestored: 'الحالة: تم استعادة البرنامج المحفوظ.',
    programLoadFailed: 'الحالة: تعذّر استعادة البرنامج المحفوظ، ويمكنك البدء من جديد.',
    invalidRepeatCount: 'الحالة: عدد التكرار يجب أن يكون بين 1 و10.'
  }
};
