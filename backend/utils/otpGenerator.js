const generateOTP = () => {
    return Math.floor(100 + Math.random() * 900); // 3-digit OTP
  };
  
  module.exports = generateOTP;
  