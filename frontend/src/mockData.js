// Mock data for Saqr App

export const mockAds = [
  {
    id: '1',
    title: 'إعلان سامسونج الجديد',
    description: 'اكتشف هاتف سامسونج الجديد مع تقنية الذكاء الاصطناعي',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    advertiser: 'Samsung',
    duration: 60,
    points: 1
  },
  {
    id: '2',
    title: 'عرض خاص من أمازون',
    description: 'تخفيضات تصل إلى 50% على جميع المنتجات',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400',
    advertiser: 'Amazon',
    duration: 60,
    points: 1
  },
  {
    id: '3',
    title: 'مطعم الذواقة',
    description: 'وجبات شهية وعروض حصرية لفترة محدودة',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    advertiser: 'Gourmet Restaurant',
    duration: 60,
    points: 1
  }
];

export const mockUser = {
  id: 'user123',
  name: 'مستخدم تجريبي',
  email: 'user@example.com',
  avatar: 'https://ui-avatars.com/api/?name=User&background=4F46E5&color=fff',
  points: 0,
  totalEarned: 0,
  watchedAds: [],
  joinedDate: new Date().toISOString()
};

export const withdrawMethods = [
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '💳',
    minAmount: 1,
    fields: [
      { name: 'email', label: 'البريد الإلكتروني لـ PayPal', type: 'email', required: true }
    ]
  },
  {
    id: 'stcpay',
    name: 'STC Pay',
    icon: '📱',
    minAmount: 1,
    fields: [
      { name: 'phone', label: 'رقم الجوال', type: 'tel', required: true }
    ]
  },
  {
    id: 'bank',
    name: 'تحويل بنكي',
    icon: '🏦',
    minAmount: 1,
    fields: [
      { name: 'bankName', label: 'اسم البنك', type: 'text', required: true },
      { name: 'accountName', label: 'اسم صاحب الحساب', type: 'text', required: true },
      { name: 'iban', label: 'رقم الآيبان', type: 'text', required: true }
    ]
  }
];