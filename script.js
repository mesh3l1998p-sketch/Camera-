document.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("start-screen");
  const cameraScreen = document.getElementById("camera-screen");
  const openCamBtn = document.getElementById("open-cam-btn");
  const webcam = document.getElementById("webcam");
  const captureCanvas = document.getElementById("capture-canvas");
  const photoPreview = document.getElementById("photo-preview");
  
  const shutterBtn = document.getElementById("shutter-btn");
  const controlsOverlay = document.getElementById("controls-overlay");
  const actionOverlay = document.getElementById("action-overlay");
  const retakeBtn = document.getElementById("retake-btn");
  const saveBtn = document.getElementById("save-btn");

  let capturedBlob = null;

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 3840, max: 3840 },
          height: { ideal: 2160, max: 2160 }
        }
      });

      webcam.srcObject = stream;
      await webcam.play();

      startScreen.classList.add("hidden");
      cameraScreen.classList.remove("hidden");
    } catch (err) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        webcam.srcObject = fallbackStream;
        await webcam.play();
        startScreen.classList.add("hidden");
        cameraScreen.classList.remove("hidden");
      } catch (e) {
        alert("يرجى إعطاء صلاحية استخدام الكاميرا.");
      }
    }
  }

  // التقاط الصورة وحرق الفلتر بكسل ببكسل لضمان عمله على جميع الأجهزة
  shutterBtn.addEventListener("click", () => {
    const width = webcam.videoWidth || 1920;
    const height = webcam.videoHeight || 1080;

    captureCanvas.width = width;
    captureCanvas.height = height;
    const ctx = captureCanvas.getContext("2d", { willReadFrequently: true });

    // 1. رسم الصورة الأصلية من الكاميرا
    ctx.drawImage(webcam, 0, 0, width, height);

    // 2. معالجة البكسلات رياضياً (Invert Pixel Array)
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i]     = 255 - data[i];     // Red
      data[i + 1] = 255 - data[i + 1]; // Green
      data[i + 2] = 255 - data[i + 2]; // Blue
    }
    // 3. إعادة كتابة البكسلات المعكوسة
    ctx.putImageData(imgData, 0, 0);

    // 4. استخراج الصورة المعكوسة تماماً
    captureCanvas.toBlob((blob) => {
      capturedBlob = blob;
      const imageUrl = URL.createObjectURL(blob);
      
      photoPreview.src = imageUrl;
      photoPreview.classList.remove("hidden");
      webcam.classList.add("hidden");

      controlsOverlay.classList.add("hidden");
      actionOverlay.classList.remove("hidden");
    }, "image/jpeg", 0.95);
  });

  // إعادة التصوير
  retakeBtn.addEventListener("click", () => {
    photoPreview.classList.add("hidden");
    webcam.classList.remove("hidden");
    
    actionOverlay.classList.add("hidden");
    controlsOverlay.classList.remove("hidden");
  });

  // حفظ الصورة
  saveBtn.addEventListener("click", async () => {
    if (!capturedBlob) return;

    const file = new File([capturedBlob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Save Photo",
        });
      } catch (e) {}
    } else {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(capturedBlob);
      link.download = `photo_${Date.now()}.jpg`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  });

  openCamBtn.addEventListener("click", startCamera);
});
