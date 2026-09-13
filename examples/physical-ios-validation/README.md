# Physical iOS validation

Bu klasör ST Score Audio Engine'in gerçek iPhone Safari hoparlör doğrulaması için ayrılmıştır.

Bu doğrulama otomatik WebKit CI sonucunun yerine geçmez ve production deployment değildir. Fiziksel testte gerçek Salamander Grand Piano ve FreePats Classical Guitar runtime manifestleri kullanılmalıdır. Sonuçlar GitHub Issue #2 altında cihaz/iOS/Safari bilgisiyle kaydedilmelidir.

Test kapsamı: user-gesture AudioContext unlock/resume, Grand Piano tek nota/retrigger/akor, REST için host tarafından audition isteği gönderilmemesi, Classical Guitar tek nota/akor, Piano -> Guitar -> Piano geçişi, stopAll ve background/resume davranışı.
