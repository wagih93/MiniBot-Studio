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
  blockArea: {
    heading: 'منطقة الأوامر',
    programHeading: 'مساحة البرنامج',
    emptyProgram: 'اسحب الأوامر إلى هنا.',
    firstLevelDemo: 'مثال: أضف كتلة ابدأ ثم كتلة تقدّم خطوة إلى مساحة البرنامج.',
    labelsByType: {
      start: 'ابدأ',
      moveForward: 'تقدّم خطوة',
      turnRight: 'انعطف يميناً',
      turnLeft: 'انعطف يساراً'
    },
    iconsByType: {
      start: '🏁',
      moveForward: '⬆️',
      turnRight: '↱',
      turnLeft: '↰'
    }
  },
  levelMeta: {
    hintPrefix: 'تلميح:',
    successPrefix: 'الهدف:',
    collectionPrefix: 'النجوم المجموعة:',
    defaultHint: 'اتبع المسار حتى النجمة.',
    defaultSuccess: 'صل إلى النجمة لتنجح.'
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
    deleteStep: 'احذف',
    retryLevel: 'حاول مرة أخرى',
    returnHome: 'العودة للرئيسية'
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
    stepLimitExceeded: 'الحالة: تم إيقاف البرنامج لأنه تجاوز الحد الآمن للخطوات.',
    continueUnavailable: 'الحالة: لا يوجد تقدّم محفوظ بعد.',
    parentsAreaPending: 'الحالة: إعدادات الأهل ستظهر في خطوة قادمة.',
    programUpdated: 'الحالة: تمت إضافة الأمر إلى البرنامج.',
    invalidDrop: 'الحالة: لا يمكن إضافة هذا الأمر هنا.',
    programReordered: 'الحالة: تم ترتيب الأوامر من جديد.',
    programRemoved: 'الحالة: تم حذف الأمر من البرنامج.',
    programEmpty: 'الحالة: أضف أوامر إلى البرنامج قبل التشغيل.',
    startRequired: 'الحالة: ابدأ بكتلة ابدأ أولاً.',
    requiredBlockMissing: 'الحالة: البرنامج يحتاج أمراً مطلوباً لهذا التحدي.',
    validationInternalError: 'الحالة: تعذّر التحقق من البرنامج. حاول مرة أخرى.'
  }
};
