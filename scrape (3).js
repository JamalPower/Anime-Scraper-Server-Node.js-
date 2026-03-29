// لا حاجة لـ import fetch من مكتبة خارجية
// سنستخدم fetch المدمجة في Node.js مباشرة

fetch('https://api.scraperapi.com/?api_key=970aafa3e2ddef045e491bf40d12e96d&url=https%3A%2F%2Fristoanime.co%2F')
  .then(async (response) => {
    // التحقق من حالة الاستجابة
    if (response.ok) {
      const data = await response.text(); // استخدم .text() للحصول على الـ HTML
      console.log("--- تم جلب البيانات بنجاح ---");
      console.log(data.substring(0, 500)); // عرض أول 500 حرف فقط للتأكد
    } else {
      console.log("خطأ في الاستجابة:", response.status);
    }
  })
  .catch(error => {
    console.error("حدث خطأ أثناء الاتصال بـ ScraperAPI:", error.message);
  });