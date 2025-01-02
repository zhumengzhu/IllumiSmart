let camera = document.getElementById('camera');
let colorBoard = document.getElementById('color-board');
let saturationSlider = document.getElementById('saturation');
let brightnessSlider = document.getElementById('brightness');
let presetButtons = document.querySelectorAll('.color-preset');
let switchCameraBtn = document.getElementById('switch-camera');
let takePhotoBtn = document.getElementById('take-photo');
let photoPreview = document.getElementById('photo-preview');
let downloadPhotoBtn = document.getElementById('download-photo');
let retakePhotoBtn = document.getElementById('retake-photo');

// 当前颜色状态
let currentState = {
  color: '#FFE4E1',
  saturation: 100,
  brightness: 100
};

// 摄像头状态
let cameraState = {
  stream: null,
  facingMode: 'user', // 'user' for front camera, 'environment' for back camera
  hasPhoto: false
};

// 初始化色轮
const pickr = Pickr.create({
  el: '#color-picker',
  theme: 'classic',
  default: currentState.color,
  
  components: {
    preview: true,
    opacity: false,
    hue: true,
    
    interaction: {
      hex: true,
      rgba: true,
      hsla: true,
      input: true,
      save: true
    }
  }
});

// 色轮变化事件
pickr.on('change', (color) => {
  currentState.color = color.toHEXA().toString();
  updateColorDisplay();
});

// 初始化相机
async function initCamera() {
  try {
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        width: 320,
        height: 240,
        facingMode: cameraState.facingMode
      }
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    camera.srcObject = stream;
    cameraState.stream = stream;
    await camera.play();
    
    // 隐藏相机提示
    document.querySelector('.camera-hint').style.display = 'none';
    
    // 启用拍照按钮
    takePhotoBtn.disabled = false;
  } catch (error) {
    console.error('相机初始化失败:', error);
    camera.style.display = 'none';
    const errorMsg = document.createElement('div');
    errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i><br>相机未能初始化，请检查相机权限设置';
    errorMsg.style.padding = '20px';
    errorMsg.style.color = '#fff';
    errorMsg.style.textAlign = 'center';
    camera.parentNode.appendChild(errorMsg);
    
    // 禁用相机相关按钮
    takePhotoBtn.disabled = true;
    switchCameraBtn.disabled = true;
  }
}

// 切换摄像头
async function switchCamera() {
  cameraState.facingMode = cameraState.facingMode === 'user' ? 'environment' : 'user';
  await initCamera();
}

// 拍照
function takePhoto() {
  const context = photoPreview.getContext('2d');
  
  // 绘制视频帧
  context.drawImage(camera, 0, 0, photoPreview.width, photoPreview.height);
  
  // 应用滤镜效果
  const imageData = context.getImageData(0, 0, photoPreview.width, photoPreview.height);
  const pixels = imageData.data;
  
  // 将当前的颜色、饱和度和亮度效果应用到照片上
  const color = pickr.getColor();
  const rgb = color.toRGBA();
  
  for (let i = 0; i < pixels.length; i += 4) {
    // 应用颜色混合
    pixels[i] = Math.min(255, pixels[i] * (rgb[0] / 255));
    pixels[i + 1] = Math.min(255, pixels[i + 1] * (rgb[1] / 255));
    pixels[i + 2] = Math.min(255, pixels[i + 2] * (rgb[2] / 255));
  }
  
  context.putImageData(imageData, 0, 0);
  
  // 启用下载和重拍按钮
  downloadPhotoBtn.disabled = false;
  retakePhotoBtn.disabled = false;
  cameraState.hasPhoto = true;
}

// 下载照片
function downloadPhoto() {
  if (!cameraState.hasPhoto) return;
  
  const link = document.createElement('a');
  link.download = `photo-${new Date().toISOString()}.png`;
  link.href = photoPreview.toDataURL('image/png');
  link.click();
}

// 重新拍照
function retakePhoto() {
  const context = photoPreview.getContext('2d');
  context.clearRect(0, 0, photoPreview.width, photoPreview.height);
  
  downloadPhotoBtn.disabled = true;
  retakePhotoBtn.disabled = true;
  cameraState.hasPhoto = false;
}

// 更新颜色显示
function updateColorDisplay() {
  colorBoard.style.backgroundColor = currentState.color;
  colorBoard.style.filter = `saturate(${currentState.saturation}%) brightness(${currentState.brightness}%)`;
  
  // 更新数值显示
  document.querySelector('#saturation + .value').textContent = `${currentState.saturation}%`;
  document.querySelector('#brightness + .value').textContent = `${currentState.brightness}%`;
}

// 初始化预设颜色按钮
presetButtons.forEach(button => {
  const color = button.dataset.color;
  
  button.addEventListener('click', () => {
    currentState.color = color;
    pickr.setColor(color);
    updateColorDisplay();
    
    // 添加点击动画效果
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = 'translateY(-2px)';
    }, 100);
  });
});

// 饱和度滑块事件
saturationSlider.addEventListener('input', (e) => {
  currentState.saturation = parseInt(e.target.value);
  updateColorDisplay();
});

// 亮度滑块事件
brightnessSlider.addEventListener('input', (e) => {
  currentState.brightness = parseInt(e.target.value);
  updateColorDisplay();
});

// 绑定按钮事件
switchCameraBtn.addEventListener('click', switchCamera);
takePhotoBtn.addEventListener('click', takePhoto);
downloadPhotoBtn.addEventListener('click', downloadPhoto);
retakePhotoBtn.addEventListener('click', retakePhoto);

// 初始化页面
window.addEventListener('load', () => {
  initCamera();
  updateColorDisplay();
});