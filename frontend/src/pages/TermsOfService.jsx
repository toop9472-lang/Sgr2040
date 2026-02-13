import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen bg-gray-950 text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          data-testid="terms-back-btn"
        >
          <ArrowLeft size={20} />
          <span>{isRTL ? 'رجوع' : 'Back'}</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {isRTL ? 'شروط الاستخدام' : 'Terms of Service'}
          </h1>
          <p className="text-gray-400">
            {isRTL ? 'آخر تحديث: فبراير 2025' : 'Last Updated: February 2025'}
          </p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          {/* Acceptance */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '1. قبول الشروط' : '1. Acceptance of Terms'}
            </h2>
            <p>
              {isRTL 
                ? 'باستخدامك لتطبيق صقر للمكافآت، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام التطبيق.'
                : 'By using the Saqr Rewards App, you agree to be bound by these terms and conditions. If you do not agree to any part of these terms, please do not use the application.'}
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '2. الأهلية' : '2. Eligibility'}
            </h2>
            <p>
              {isRTL 
                ? 'يجب أن يكون عمرك 18 عاماً أو أكثر لاستخدام هذا التطبيق. باستخدامك للتطبيق، تؤكد أنك تستوفي هذا المتطلب العمري.'
                : 'You must be 18 years or older to use this application. By using the app, you confirm that you meet this age requirement.'}
            </p>
          </section>

          {/* User Account */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '3. حساب المستخدم' : '3. User Account'}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'أنت مسؤول عن الحفاظ على سرية معلومات حسابك' : 'You are responsible for maintaining the confidentiality of your account information'}</li>
              <li>{isRTL ? 'يجب تقديم معلومات دقيقة وحديثة عند التسجيل' : 'You must provide accurate and current information when registering'}</li>
              <li>{isRTL ? 'لا يجوز مشاركة حسابك مع الآخرين' : 'You may not share your account with others'}</li>
              <li>{isRTL ? 'أنت مسؤول عن جميع الأنشطة التي تتم من خلال حسابك' : 'You are responsible for all activities that occur through your account'}</li>
            </ul>
          </section>

          {/* Rewards System */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '4. نظام المكافآت' : '4. Rewards System'}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'يتم منح النقاط مقابل مشاهدة الإعلانات والتفاعل مع المحتوى' : 'Points are awarded for watching ads and engaging with content'}</li>
              <li>{isRTL ? 'يمكن استبدال النقاط بمكافآت وفقاً للخيارات المتاحة' : 'Points can be redeemed for rewards according to available options'}</li>
              <li>{isRTL ? 'نحتفظ بالحق في تعديل قيمة النقاط أو المكافآت في أي وقت' : 'We reserve the right to modify point values or rewards at any time'}</li>
              <li>{isRTL ? 'لا يمكن نقل النقاط أو بيعها لمستخدمين آخرين' : 'Points cannot be transferred or sold to other users'}</li>
            </ul>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '5. الأنشطة المحظورة' : '5. Prohibited Activities'}
            </h2>
            <p className="mb-4">
              {isRTL ? 'يُحظر عليك القيام بالتالي:' : 'You are prohibited from:'}
            </p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{isRTL ? 'استخدام برامج آلية أو روبوتات للتفاعل مع التطبيق' : 'Using automated programs or bots to interact with the app'}</li>
              <li>{isRTL ? 'محاولة التلاعب بنظام النقاط أو المكافآت' : 'Attempting to manipulate the points or rewards system'}</li>
              <li>{isRTL ? 'إنشاء حسابات متعددة للحصول على مكافآت إضافية' : 'Creating multiple accounts to gain additional rewards'}</li>
              <li>{isRTL ? 'انتهاك حقوق الملكية الفكرية' : 'Violating intellectual property rights'}</li>
              <li>{isRTL ? 'نشر محتوى مسيء أو غير قانوني' : 'Posting offensive or illegal content'}</li>
            </ul>
          </section>

          {/* Advertisers */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '6. المعلنون' : '6. Advertisers'}
            </h2>
            <p>
              {isRTL 
                ? 'إذا كنت معلناً، فإنك توافق على أن إعلاناتك يجب أن تكون دقيقة وغير مضللة ومتوافقة مع جميع القوانين المعمول بها. نحتفظ بالحق في رفض أو إزالة أي إعلان لا يستوفي معاييرنا.'
                : 'If you are an advertiser, you agree that your advertisements must be accurate, non-misleading, and compliant with all applicable laws. We reserve the right to reject or remove any advertisement that does not meet our standards.'}
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '7. الملكية الفكرية' : '7. Intellectual Property'}
            </h2>
            <p>
              {isRTL 
                ? 'جميع المحتويات والعلامات التجارية والشعارات المعروضة في التطبيق هي ملك لنا أو لمرخصينا. لا يجوز استخدام أي من هذه المواد دون إذن كتابي مسبق.'
                : 'All content, trademarks, and logos displayed in the app are owned by us or our licensors. None of these materials may be used without prior written permission.'}
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '8. تحديد المسؤولية' : '8. Limitation of Liability'}
            </h2>
            <p>
              {isRTL 
                ? 'لن نكون مسؤولين عن أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدامك للتطبيق. استخدامك للتطبيق يكون على مسؤوليتك الخاصة.'
                : 'We will not be liable for any indirect, incidental, or consequential damages arising from your use of the app. Your use of the app is at your own risk.'}
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '9. إنهاء الحساب' : '9. Termination'}
            </h2>
            <p>
              {isRTL 
                ? 'نحتفظ بالحق في تعليق أو إنهاء حسابك في أي وقت إذا انتهكت هذه الشروط أو قمت بأي نشاط احتيالي. عند الإنهاء، ستفقد جميع النقاط والمكافآت غير المستخدمة.'
                : 'We reserve the right to suspend or terminate your account at any time if you violate these terms or engage in fraudulent activity. Upon termination, you will forfeit all unused points and rewards.'}
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '10. تعديل الشروط' : '10. Changes to Terms'}
            </h2>
            <p>
              {isRTL 
                ? 'نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني. استمرارك في استخدام التطبيق بعد التعديلات يعني موافقتك على الشروط الجديدة.'
                : 'We reserve the right to modify these terms at any time. You will be notified of any material changes via the app or email. Your continued use of the app after modifications constitutes acceptance of the new terms.'}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '11. اتصل بنا' : '11. Contact Us'}
            </h2>
            <p>
              {isRTL 
                ? 'إذا كانت لديك أي أسئلة حول هذه الشروط، يرجى التواصل معنا عبر:'
                : 'If you have any questions about these terms, please contact us at:'}
            </p>
            <p className="mt-2 text-blue-400">support@saqr.app</p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isRTL ? '12. القانون الحاكم' : '12. Governing Law'}
            </h2>
            <p>
              {isRTL 
                ? 'تخضع هذه الشروط وتفسر وفقاً لقوانين المملكة العربية السعودية، دون اعتبار لتعارض أحكام القوانين.'
                : 'These terms shall be governed by and construed in accordance with the laws of Saudi Arabia, without regard to its conflict of law provisions.'}
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>{isRTL ? '© 2025 صقر للمكافآت. جميع الحقوق محفوظة.' : '© 2025 Saqr Rewards. All rights reserved.'}</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
