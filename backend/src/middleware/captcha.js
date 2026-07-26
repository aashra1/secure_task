const verifyWithGoogle = async (token, remoteip) => {
  const body = new URLSearchParams({
    secret: process.env.CAPTCHA_SECRET_KEY,
    response: token,
    remoteip: remoteip || ''
  });
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!response.ok) throw new Error('CAPTCHA provider unavailable');
  return response.json();
};

const captcha = (action) => async (req, res, next) => {
  try {
    if (!process.env.CAPTCHA_SECRET_KEY) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ message: 'CAPTCHA is not configured' });
      }
      return next();
    }
    const token = req.body.captchaToken;
    if (!token) return res.status(400).json({ message: 'CAPTCHA token required', code: 'CAPTCHA_REQUIRED' });
    const result = await verifyWithGoogle(token, req.ip);
    if (!result.success) return res.status(400).json({ message: 'CAPTCHA verification failed', code: 'CAPTCHA_INVALID' });
    const isV2 = req.body.captchaVersion === 'v2';
    const threshold = Number(process.env.CAPTCHA_MIN_SCORE || 0.5);
    if (!isV2 && (result.action !== action || Number(result.score || 0) < threshold)) {
      return res.status(403).json({ message: 'Additional CAPTCHA verification required', code: 'CAPTCHA_V2_REQUIRED' });
    }
    req.captcha = result;
    return next();
  } catch (error) {
    error.status = 503;
    return next(error);
  }
};

module.exports = { captcha, verifyWithGoogle };
