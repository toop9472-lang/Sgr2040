/**
 * Translations for Saqr App
 * Supports Arabic (ar), English (en), French (fr), Turkish (tr)
 */

export const translations = {
  ar: {
    // App
    appName: 'صقر',
    loading: 'جاري التحميل...',
    
    // Auth
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    loginWithGoogle: 'تسجيل الدخول بواسطة Google',
    loginWithApple: 'تسجيل الدخول بواسطة Apple',
    loginWithEmail: 'تسجيل بالبريد الإلكتروني',
    guestMode: 'تجربة التطبيق بدون حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    name: 'الاسم',
    or: 'أو',
    haveAccount: 'لديك حساب؟ سجّل الدخول',
    noAccount: 'ليس لديك حساب؟ سجّل الآن',
    termsText: 'بتسجيل الدخول، أنت توافق على',
    termsLink: 'الشروط والأحكام',
    and: 'و',
    privacyLink: 'سياسة الخصوصية',
    watchAdsEarnPoints: 'شاهد الإعلانات واكسب النقاط',
    
    // Navigation
    home: 'الرئيسية',
    profile: 'حسابي',
    advertiser: 'أضف إعلانك',
    advertiseNow: 'أعلن',
    notifications: 'الإشعارات',
    withdraw: 'سحب الرصيد',
    watch: 'شاهد',
    
    // Home/Ads
    yourPoints: 'نقاطك',
    earnedPoint: 'حصلت على نقطة!',
    loginToEarnPoints: 'سجّل الدخول لكسب النقاط',
    noAds: 'لا توجد إعلانات حالياً',
    refresh: 'تحديث',
    loadingAds: 'جاري تحميل الإعلانات...',
    startWatching: 'ابدأ المشاهدة الآن',
    earnPerAd: 'اكسب 5 نقاط لكل إعلان',
    
    // Profile
    currentPoints: 'نقاطك الحالية',
    dollarValue: 'القيمة بالدولار',
    pointsForWithdraw: 'نقطة للسحب',
    withdrawBalance: 'سحب الرصيد',
    yourStats: 'إحصائياتك',
    totalEarned: 'إجمالي النقاط المكتسبة',
    watchedAds: 'الإعلانات المشاهدة',
    withdrawHistory: 'سجل السحوبات',
    settings: 'الإعدادات',
    helpSupport: 'المساعدة والدعم',
    termsConditions: 'الشروط والأحكام',
    guestModeLabel: 'وضع الزائر',
    backToLogin: 'العودة لتسجيل الدخول',
    version: 'الإصدار',
    changePassword: 'تغيير كلمة المرور',
    transactionHistory: 'سجل المعاملات',
    shareApp: 'شارك التطبيق',
    privacyPolicy: 'سياسة الخصوصية',
    referralCode: 'كود الإحالة',
    copyCode: 'انسخ الكود',
    codeCopied: 'تم نسخ الكود',
    
    // 2FA
    twoFactorAuth: 'التحقق بخطوتين',
    enable2FA: 'تفعيل التحقق بخطوتين',
    disable2FA: 'إلغاء التحقق بخطوتين',
    verificationCode: 'رمز التحقق',
    enterCode: 'أدخل الرمز المرسل',
    codeExpires: 'ينتهي الرمز خلال',
    backupCodes: 'رموز الاسترداد',
    saveBackupCodes: 'احفظ هذه الرموز في مكان آمن',
    
    // Support Tickets
    supportTickets: 'تذاكر الدعم',
    createTicket: 'إنشاء تذكرة',
    myTickets: 'تذاكري',
    ticketSubject: 'موضوع التذكرة',
    ticketMessage: 'رسالتك',
    ticketCategory: 'التصنيف',
    categoryGeneral: 'استفسار عام',
    categoryTechnical: 'مشكلة تقنية',
    categoryPayment: 'الدفع والسحب',
    categoryAccount: 'حسابي',
    ticketStatus: 'حالة التذكرة',
    statusOpen: 'مفتوحة',
    statusInProgress: 'قيد المعالجة',
    statusResolved: 'تم الحل',
    statusClosed: 'مغلقة',
    replyToTicket: 'الرد على التذكرة',
    closeTicket: 'إغلاق التذكرة',
    
    // Comments
    comments: 'التعليقات',
    addComment: 'أضف تعليق',
    writeComment: 'اكتب تعليقك...',
    reply: 'رد',
    like: 'إعجاب',
    noComments: 'لا توجد تعليقات بعد',
    deleteComment: 'حذف التعليق',
    
    // Dark Mode
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    systemMode: 'حسب النظام',
    appearance: 'المظهر',
    
    // Language
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    french: 'Français',
    turkish: 'Türkçe',
    
    // Withdraw
    withdrawTitle: 'سحب الرصيد',
    availablePoints: 'النقاط المتاحة',
    selectMethod: 'اختر طريقة السحب',
    accountDetails: 'تفاصيل الحساب',
    bankTransfer: 'تحويل بنكي',
    bankName: 'اسم البنك',
    accountNumber: 'رقم الحساب',
    ibanNumber: 'رقم IBAN',
    phoneNumber: 'رقم الجوال',
    submitRequest: 'إرسال طلب السحب',
    withdrawNotice: 'يتم مراجعة طلبات السحب خلال 24-48 ساعة',
    insufficientPoints: 'نقاط غير كافية',
    needMinPoints: 'تحتاج 500 نقطة على الأقل للسحب',
    
    // Advertiser
    addYourAd: 'أضف إعلانك',
    reachUsers: 'وصّل إعلانك لآلاف المستخدمين',
    selectPackage: 'اختر باقتك',
    adDetails: 'تفاصيل الإعلان',
    advertiserName: 'اسم المعلن',
    adTitle: 'عنوان الإعلان',
    adDescription: 'وصف الإعلان',
    videoUrl: 'رابط الفيديو',
    thumbnailUrl: 'رابط الصورة المصغرة',
    totalAmount: 'المبلغ الإجمالي',
    continueToPayment: 'متابعة للدفع',
    selectPaymentMethod: 'اختر طريقة الدفع',
    amountRequired: 'المبلغ المطلوب',
    payNow: 'ادفع الآن',
    
    // Payment
    paymentSuccess: 'تم الدفع بنجاح!',
    paymentSuccessMsg: 'سيتم مراجعة إعلانك وتفعيله قريباً',
    paymentCancelled: 'تم إلغاء الدفع',
    paymentCancelledMsg: 'تم إلغاء عملية الدفع',
    retry: 'إعادة المحاولة',
    backToHome: 'العودة للرئيسية',
    
    // Success/Error messages
    success: 'تم بنجاح!',
    error: 'خطأ',
    fillAllFields: 'أكمل جميع الحقول المطلوبة',
    
    // Misc
    back: 'رجوع',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    send: 'إرسال',
    close: 'إغلاق',
    points: 'النقاط',
    today: 'اليوم',
    available: 'المتاح',
    remaining: 'المتبقي',
    earnRate: 'معدل الكسب',
    totalPoints: 'إجمالي النقاط',
    currentBalance: 'الرصيد الحالي',
  },
  
  en: {
    // App
    appName: 'Saqr',
    loading: 'Loading...',
    
    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    loginWithGoogle: 'Login with Google',
    loginWithApple: 'Login with Apple',
    loginWithEmail: 'Login with Email',
    guestMode: 'Try app without account',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    or: 'or',
    haveAccount: 'Have an account? Login',
    noAccount: "Don't have an account? Register",
    termsText: 'By logging in, you agree to',
    termsLink: 'Terms & Conditions',
    and: 'and',
    privacyLink: 'Privacy Policy',
    watchAdsEarnPoints: 'Watch ads and earn points',
    
    // Navigation
    home: 'Home',
    profile: 'Profile',
    advertiser: 'Add Your Ad',
    advertiseNow: 'Advertise',
    notifications: 'Notifications',
    withdraw: 'Withdraw',
    watch: 'Watch',
    
    // Home/Ads
    yourPoints: 'Your Points',
    earnedPoint: 'Earned a point!',
    loginToEarnPoints: 'Login to earn points',
    noAds: 'No ads available',
    refresh: 'Refresh',
    loadingAds: 'Loading ads...',
    startWatching: 'Start Watching Now',
    earnPerAd: 'Earn 5 points per ad',
    
    // Profile
    currentPoints: 'Current Points',
    dollarValue: 'Dollar Value',
    pointsForWithdraw: 'points to withdraw',
    withdrawBalance: 'Withdraw Balance',
    yourStats: 'Your Stats',
    totalEarned: 'Total Points Earned',
    watchedAds: 'Watched Ads',
    withdrawHistory: 'Withdrawal History',
    settings: 'Settings',
    helpSupport: 'Help & Support',
    termsConditions: 'Terms & Conditions',
    guestModeLabel: 'Guest Mode',
    backToLogin: 'Back to Login',
    version: 'Version',
    changePassword: 'Change Password',
    transactionHistory: 'Transaction History',
    shareApp: 'Share App',
    privacyPolicy: 'Privacy Policy',
    referralCode: 'Referral Code',
    copyCode: 'Copy Code',
    codeCopied: 'Code Copied',
    
    // 2FA
    twoFactorAuth: 'Two-Factor Authentication',
    enable2FA: 'Enable 2FA',
    disable2FA: 'Disable 2FA',
    verificationCode: 'Verification Code',
    enterCode: 'Enter the code sent',
    codeExpires: 'Code expires in',
    backupCodes: 'Backup Codes',
    saveBackupCodes: 'Save these codes in a safe place',
    
    // Support Tickets
    supportTickets: 'Support Tickets',
    createTicket: 'Create Ticket',
    myTickets: 'My Tickets',
    ticketSubject: 'Subject',
    ticketMessage: 'Your Message',
    ticketCategory: 'Category',
    categoryGeneral: 'General Inquiry',
    categoryTechnical: 'Technical Issue',
    categoryPayment: 'Payment & Withdrawal',
    categoryAccount: 'My Account',
    ticketStatus: 'Status',
    statusOpen: 'Open',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    statusClosed: 'Closed',
    replyToTicket: 'Reply',
    closeTicket: 'Close Ticket',
    
    // Comments
    comments: 'Comments',
    addComment: 'Add Comment',
    writeComment: 'Write your comment...',
    reply: 'Reply',
    like: 'Like',
    noComments: 'No comments yet',
    deleteComment: 'Delete Comment',
    
    // Dark Mode
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    systemMode: 'System Default',
    appearance: 'Appearance',
    
    // Language
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    french: 'Français',
    turkish: 'Türkçe',
    
    // Withdraw
    withdrawTitle: 'Withdraw Balance',
    availablePoints: 'Available Points',
    selectMethod: 'Select Withdrawal Method',
    accountDetails: 'Account Details',
    bankTransfer: 'Bank Transfer',
    bankName: 'Bank Name',
    accountNumber: 'Account Number',
    ibanNumber: 'IBAN Number',
    phoneNumber: 'Phone Number',
    submitRequest: 'Submit Withdrawal Request',
    withdrawNotice: 'Withdrawal requests are reviewed within 24-48 hours',
    insufficientPoints: 'Insufficient Points',
    needMinPoints: 'You need at least 500 points to withdraw',
    
    // Advertiser
    addYourAd: 'Add Your Ad',
    reachUsers: 'Reach thousands of users',
    selectPackage: 'Select Package',
    adDetails: 'Ad Details',
    advertiserName: 'Advertiser Name',
    adTitle: 'Ad Title',
    adDescription: 'Ad Description',
    videoUrl: 'Video URL',
    thumbnailUrl: 'Thumbnail URL',
    totalAmount: 'Total Amount',
    continueToPayment: 'Continue to Payment',
    selectPaymentMethod: 'Select Payment Method',
    amountRequired: 'Amount Required',
    payNow: 'Pay Now',
    
    // Payment
    paymentSuccess: 'Payment Successful!',
    paymentSuccessMsg: 'Your ad will be reviewed and activated soon',
    paymentCancelled: 'Payment Cancelled',
    paymentCancelledMsg: 'Payment was cancelled',
    retry: 'Retry',
    backToHome: 'Back to Home',
    
    // Success/Error messages
    success: 'Success!',
    error: 'Error',
    fillAllFields: 'Please fill all required fields',
    
    // Misc
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    send: 'Send',
    close: 'Close',
    points: 'Points',
    today: 'Today',
    available: 'Available',
    remaining: 'Remaining',
    earnRate: 'Earn Rate',
    totalPoints: 'Total Points',
    currentBalance: 'Current Balance',
  },
  
  fr: {
    // App
    appName: 'Saqr',
    loading: 'Chargement...',
    
    // Auth
    login: 'Connexion',
    register: "S'inscrire",
    logout: 'Déconnexion',
    loginWithGoogle: 'Connexion avec Google',
    loginWithApple: 'Connexion avec Apple',
    loginWithEmail: 'Connexion par email',
    guestMode: 'Essayer sans compte',
    email: 'Email',
    password: 'Mot de passe',
    name: 'Nom',
    or: 'ou',
    
    // Navigation
    home: 'Accueil',
    profile: 'Profil',
    advertiseNow: 'Publicité',
    watch: 'Regarder',
    
    // Profile
    changePassword: 'Changer le mot de passe',
    transactionHistory: 'Historique',
    shareApp: "Partager l'app",
    privacyPolicy: 'Confidentialité',
    referralCode: 'Code de parrainage',
    
    // 2FA
    twoFactorAuth: 'Authentification à deux facteurs',
    enable2FA: 'Activer 2FA',
    verificationCode: 'Code de vérification',
    
    // Support
    supportTickets: 'Tickets de support',
    createTicket: 'Créer un ticket',
    
    // Comments
    comments: 'Commentaires',
    addComment: 'Ajouter un commentaire',
    
    // Dark Mode
    darkMode: 'Mode sombre',
    lightMode: 'Mode clair',
    appearance: 'Apparence',
    
    // Language
    language: 'Langue',
    
    // Misc
    back: 'Retour',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Enregistrer',
    send: 'Envoyer',
    close: 'Fermer',
    points: 'Points',
    today: "Aujourd'hui",
  },
  
  tr: {
    // App
    appName: 'Saqr',
    loading: 'Yükleniyor...',
    
    // Auth
    login: 'Giriş Yap',
    register: 'Kayıt Ol',
    logout: 'Çıkış Yap',
    loginWithGoogle: 'Google ile Giriş',
    loginWithApple: 'Apple ile Giriş',
    loginWithEmail: 'Email ile Giriş',
    guestMode: 'Hesapsız deneyin',
    email: 'E-posta',
    password: 'Şifre',
    name: 'İsim',
    or: 'veya',
    
    // Navigation
    home: 'Ana Sayfa',
    profile: 'Profil',
    advertiseNow: 'Reklam Ver',
    watch: 'İzle',
    
    // Profile
    changePassword: 'Şifre Değiştir',
    transactionHistory: 'İşlem Geçmişi',
    shareApp: 'Uygulamayı Paylaş',
    privacyPolicy: 'Gizlilik Politikası',
    referralCode: 'Referans Kodu',
    
    // 2FA
    twoFactorAuth: 'İki Faktörlü Doğrulama',
    enable2FA: '2FA Etkinleştir',
    verificationCode: 'Doğrulama Kodu',
    
    // Support
    supportTickets: 'Destek Talepleri',
    createTicket: 'Talep Oluştur',
    
    // Comments
    comments: 'Yorumlar',
    addComment: 'Yorum Ekle',
    
    // Dark Mode
    darkMode: 'Karanlık Mod',
    lightMode: 'Aydınlık Mod',
    appearance: 'Görünüm',
    
    // Language
    language: 'Dil',
    
    // Misc
    back: 'Geri',
    cancel: 'İptal',
    confirm: 'Onayla',
    save: 'Kaydet',
    send: 'Gönder',
    close: 'Kapat',
    points: 'Puan',
    today: 'Bugün',
  }
};

export default translations;
