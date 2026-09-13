# Fiziksel iPhone Safari test akışı

1. Repoyu GitHub Codespaces içinde açın.
2. Terminalde `npm install` çalıştırın.
3. `npx vite --host 0.0.0.0 --port 4173` çalıştırın.
4. Codespaces Ports görünümünde 4173 portunu açın ve iPhone Safari'de `/examples/physical-ios-validation/` yoluna gidin.
5. Sırasıyla Audio Unlock / Resume, Piano C4, Piano C4 Retrigger, Piano C–E–G Akor, REST Sessizlik, Gitar E3, Gitar E–G–B Akor ve Piano → Guitar → Piano Switch kontrollerini çalıştırın.
6. Her düğmede ekranın üstündeki durum satırını ve duyulan gerçek sesi kontrol edin. REST kontrolünde 1 saniye sessizlik olmalıdır.
7. Safari'yi kısa süre arka plana alın, geri dönün, Audio Unlock / Resume'a tekrar dokunun ve Piano C4 ile tekrar doğrulayın.
8. Sonucu GitHub Issue #2 altında cihaz modeli, iOS/Safari sürümü ve görülen PASS/FAIL satırlarıyla kaydedin.

Not: Bu sayfa gerçek runtime sample manifestlerini kullanır. Editor Core NOTE/REST/history entegrasyonu ayrı ikinci fiziksel doğrulama aşamasıdır.
