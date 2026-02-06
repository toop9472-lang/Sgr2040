import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const PrivacyPolicy = () => {
  const { isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-gray-950 text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          <p className="text-gray-400">
            {isRTL ? 'آخر تحديث: فبراير 2025' : 'Last Updated: February 2025'}
          </p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '1. مقدمة' : '1. Introduction'}
            </h2>
            <p>
              {isRTL 
                ? 'مرحباً بك في تطبيق صقر للمكافآت. نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك عند استخدام تطبيقنا.'
                : 'Welcome to Saqr Rewards App. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your information when you use our application.'}
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '2. البيانات التي نجمعها' : '2. Data We Collect'}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'معلومات الحساب: البريد الإلكتروني واسم المستخدم' : 'Account Information: Email and username'}</li>
              <li>{isRTL ? 'بيانات الاستخدام: الإعلانات المشاهدة والنقاط المكتسبة' : 'Usage Data: Watched ads and earned points'}</li>
              <li>{isRTL ? 'معلومات الجهاز: نوع الجهاز ونظام التشغيل' : 'Device Information: Device type and operating system'}</li>
            </ul>
          </section>

          {/* How We Use Data */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '3. كيف نستخدم بياناتك' : '3. How We Use Your Data'}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'تقديم خدمات التطبيق وإدارة حسابك' : 'Provide app services and manage your account'}</li>
              <li>{isRTL ? 'احتساب النقاط والمكافآت' : 'Calculate points and rewards'}</li>
              <li>{isRTL ? 'تحسين تجربة المستخدم' : 'Improve user experience'}</li>
              <li>{isRTL ? 'إرسال إشعارات مهمة' : 'Send important notifications'}</li>
              <li>{isRTL ? 'منع الغش والاحتيال' : 'Prevent fraud and cheating'}</li>
            </ul>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '4. حماية البيانات' : '4. Data Protection'}
            </h2>
            <p>
              {isRTL 
                ? 'نستخدم تقنيات أمان متقدمة لحماية بياناتك، بما في ذلك التشفير وجدران الحماية. لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا بموافقتك أو عند الضرورة القانونية.'
                : 'We use advanced security technologies to protect your data, including encryption and firewalls. We do not share your personal information with third parties without your consent or legal necessity.'}
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '5. حقوقك' : '5. Your Rights'}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'الوصول إلى بياناتك الشخصية' : 'Access your personal data'}</li>
              <li>{isRTL ? 'تصحيح البيانات غير الدقيقة' : 'Correct inaccurate data'}</li>
              <li>{isRTL ? 'طلب حذف حسابك' : 'Request account deletion'}</li>
              <li>{isRTL ? 'إلغاء الاشتراك في الإشعارات' : 'Opt-out of notifications'}</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '6. ملفات تعريف الارتباط' : '6. Cookies'}
            </h2>
            <p>
              {isRTL 
                ? 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتذكر تفضيلاتك. يمكنك إدارة إعدادات ملفات تعريف الارتباط من خلال متصفحك.'
                : 'We use cookies to improve your experience and remember your preferences. You can manage cookie settings through your browser.'}
            </p>
          </section>

          {/* Third Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '7. خدمات الطرف الثالث' : '7. Third-Party Services'}
            </h2>
            <p>
              {isRTL 
                ? 'قد يتضمن تطبيقنا روابط لمواقع خارجية أو خدمات طرف ثالث. لسنا مسؤولين عن ممارسات الخصوصية لهذه المواقع.'
                : 'Our app may include links to external websites or third-party services. We are not responsible for the privacy practices of these websites.'}
            </p>
          </section>

          {/* Children Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '8. خصوصية الأطفال' : '8. Children\'s Privacy'}
            </h2>
            <p>
              {isRTL 
                ? 'تطبيقنا غير موجه للأطفال دون سن 13 عاماً. لا نجمع عن قصد معلومات من الأطفال دون هذا السن.'
                : 'Our app is not directed to children under 13. We do not knowingly collect information from children under this age.'}
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '9. التغييرات على السياسة' : '9. Changes to Policy'}
            </h2>
            <p>
              {isRTL 
                ? 'قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني.'
                : 'We may update this privacy policy from time to time. We will notify you of any significant changes through the app or email.'}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '10. اتصل بنا' : '10. Contact Us'}
            </h2>
            <p>
              {isRTL 
                ? 'إذا كانت لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا عبر:'
                : 'If you have any questions about this privacy policy, please contact us at:'}
            </p>
            <div className="mt-4 p-4 bg-gray-800/50 rounded-xl">
              <p className="text-blue-400">support@saqr-rewards.com</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>© 2025 Saqr Rewards. {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
