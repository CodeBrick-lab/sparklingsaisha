const AUTH_KEY = 'static_shop_auth_v1';
const OTP_KEY = 'static_shop_otp_v1';

function getAuthUser(){ try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch(e){ return null; } }
function saveAuthUser(user){ localStorage.setItem(AUTH_KEY, JSON.stringify(user)); }
function generateOTP(){ return Math.floor(100000 + Math.random() * 900000).toString(); }

async function requestOTPViaWhatsApp(mobile){
  const otp = generateOTP();
  localStorage.setItem(OTP_KEY, JSON.stringify({otp, mobile, timestamp: Date.now(), attempts: 0}));
  
  // For production, use actual WhatsApp API (Twilio, MessageBird, etc.)
  // Example with Twilio:
  // const response = await fetch('https://your-backend.com/api/send-whatsapp-otp', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({mobile, otp})
  // });
  
  // For testing/demo, show OTP in console and alert
  console.log('WhatsApp OTP for', mobile, ':', otp);
  alert(`WhatsApp OTP sent to ${mobile}\n\nTest OTP: ${otp}\n\n(In production, check your WhatsApp)`);
  return true;
}

function verifyOTP(mobile, otp){
  const stored = localStorage.getItem(OTP_KEY);
  if(!stored) return false;
  
  const data = JSON.parse(stored);
  if(data.mobile !== mobile) return false;
  if(Date.now() - data.timestamp > 10*60*1000) return false; // 10 min expiry
  if(data.otp !== otp) {
    data.attempts++;
    if(data.attempts > 3) {
      localStorage.removeItem(OTP_KEY);
      return false;
    }
    localStorage.setItem(OTP_KEY, JSON.stringify(data));
    return false;
  }
  
  localStorage.removeItem(OTP_KEY);
  return true;
}

function saveUserProfile(profile){
  saveAuthUser(profile);
}

function logout(){
  localStorage.removeItem(AUTH_KEY);
}
