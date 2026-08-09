// manualCutout.js — freehand "lasso" cutout. The person traces around the
// garment with a finger or mouse; everything outside that traced shape
// becomes transparent. Works for any shape, unlike the automatic
// plain-background cutout in bgRemoval.js — useful when the background
// isn't plain enough for that to work well.

export function initLassoEditor(canvas, imgEl, onApply) {
  const ctx = canvas.getContext('2d');
  canvas.width = imgEl.naturalWidth || imgEl.width;
  canvas.height = imgEl.naturalHeight || imgEl.height;

  let points = [];
  let drawing = false;

  function getPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = evt.touches && evt.touches.length ? evt.touches[0] : evt;
    return {
      x: (point.clientX - rect.left) * scaleX,
      y: (point.clientY - rect.top) * scaleY
    };
  }

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
    if (points.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
      if (points.length > 2) ctx.closePath();
      ctx.lineWidth = Math.max(2, canvas.width / 140);
      ctx.setLineDash([canvas.width / 60, canvas.width / 90]);
      ctx.strokeStyle = '#7A2E3B';
      ctx.stroke();
      ctx.fillStyle = 'rgba(122, 46, 59, 0.12)';
      if (points.length > 2) ctx.fill();
      ctx.restore();
    }
  }

  function start(evt) {
    evt.preventDefault();
    drawing = true;
    points = [getPos(evt)];
  }
  function move(evt) {
    if (!drawing) return;
    evt.preventDefault();
    points.push(getPos(evt));
    redraw();
  }
  function end(evt) {
    if (!drawing) return;
    evt.preventDefault?.();
    drawing = false;
    redraw();
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end, { passive: false });

  redraw();

  return {
    reset() {
      points = [];
      redraw();
    },
    hasShape() {
      return points.length >= 3;
    },
    apply() {
      if (points.length < 3) return null;
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const mctx = maskCanvas.getContext('2d');
      mctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
      // Keep only the pixels inside the traced shape; everything else becomes transparent.
      mctx.globalCompositeOperation = 'destination-in';
      mctx.beginPath();
      mctx.moveTo(points[0].x, points[0].y);
      for (const p of points.slice(1)) mctx.lineTo(p.x, p.y);
      mctx.closePath();
      mctx.fillStyle = '#000';
      mctx.fill();
      const dataUrl = maskCanvas.toDataURL('image/png');
      onApply?.(dataUrl);
      return dataUrl;
    },
    destroy() {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', end);
    }
  };
}
